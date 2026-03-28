import { useState, useRef, useCallback, useEffect } from 'react';
import { initAudioRecorder } from '@/lib/audio';
import { connectLiveAPI, extractInsights } from '@/lib/gemini';
import { saveEntry, getEntries } from '@/lib/supabase';
import { runPostEntryHeuristics } from '@/lib/insights';
import { useAuth } from '@/context/AuthContext';
import { createFaceSampler } from '@/lib/webcam';

const MAX_DURATION = 30; // seconds

/**
 * @param {object} [options]
 * @param {boolean} [options.useWebcam] - Sample webcam stills for multimodal mood analysis (optional)
 */
export function useRecorder({ useWebcam = false } = {}) {
  const { user } = useAuth();
  const [state, setState] = useState('idle'); // idle | recording | processing | done | error
  const [elapsed, setElapsed] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  /** @type {[MediaStream | null, import('react').Dispatch<import('react').SetStateAction<MediaStream | null>>]} */
  const [cameraStream, setCameraStream] = useState(null);

  const recorderRef = useRef(null);
  const liveApiRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptRef = useRef('');
  const faceSamplerRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const useWebcamRef = useRef(useWebcam);
  const stopRecordingRef = useRef(async () => {});

  useEffect(() => {
    useWebcamRef.current = useWebcam;
  }, [useWebcam]);

  const startRecording = useCallback(async () => {
    if (!user?.id) {
      setError('Sign in to save entries.');
      setState('error');
      return;
    }
    try {
      setState('recording');
      setElapsed(0);
      setTranscript('');
      setResult(null);
      setError(null);
      transcriptRef.current = '';
      setCameraStream(null);
      recordingStreamRef.current = null;

      liveApiRef.current = connectLiveAPI({
        onTranscript: (text) => {
          transcriptRef.current += text;
          setTranscript(transcriptRef.current);
        },
        onError: (err) => {
          console.error('Live API error:', err);
          setError('Live transcription failed. Check API key and console.');
        },
        onClose: () => {
          console.log('Live API disconnected');
        },
      });

      try {
        await liveApiRef.current.whenReady();
      } catch (err) {
        console.error('Live API setup failed:', err);
        liveApiRef.current?.disconnect();
        setState('error');
        setError(err?.message || 'Could not start live transcription.');
        return;
      }

      let avStream = null;
      if (useWebcamRef.current) {
        try {
          avStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
            },
            video: {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          });
          recordingStreamRef.current = avStream;
          setCameraStream(avStream);
          faceSamplerRef.current = createFaceSampler(avStream, {
            intervalMs: 7500,
            maxFrames: 4,
          });
        } catch (camErr) {
          console.error('Webcam / mic failed:', camErr);
          liveApiRef.current?.disconnect();
          setState('error');
          setError(
            'Camera or microphone access was denied. Turn off “Include camera” or allow permissions and try again.'
          );
          return;
        }
      }

      try {
        recorderRef.current = await initAudioRecorder({
          mediaStream: avStream || undefined,
          onWaveformData: setWaveformData,
          onAudioChunk: (base64) => {
            liveApiRef.current?.sendAudio(base64);
          },
        });
      } catch (audioErr) {
        console.error('Audio init failed:', audioErr);
        faceSamplerRef.current?.dispose();
        faceSamplerRef.current = null;
        recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
        setCameraStream(null);
        liveApiRef.current?.disconnect();
        setState('error');
        setError(audioErr.message || 'Microphone access denied');
        return;
      }

      recorderRef.current.start();

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= MAX_DURATION - 1) {
            queueMicrotask(() => stopRecordingRef.current?.());
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Recording start failed:', err);
      setState('error');
      setError(err.message || 'Microphone access denied');
    }
  }, [user?.id]);

  const stopRecording = useCallback(async () => {
    if (state !== 'recording') return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState('processing');

    faceSamplerRef.current?.flush();
    const faceSnapshots = faceSamplerRef.current?.getSnapshots() ?? [];
    faceSamplerRef.current?.dispose();
    faceSamplerRef.current = null;

    const acousticFeatures = recorderRef.current?.stop();
    recorderRef.current = null;

    recordingStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
    recordingStreamRef.current = null;
    setCameraStream(null);

    liveApiRef.current?.endAudio();

    await new Promise((r) => setTimeout(r, 2800));

    const finalTranscript = transcriptRef.current;
    liveApiRef.current?.disconnect();

    if (!finalTranscript.trim()) {
      setState('error');
      setError('No speech detected. Try again.');
      return;
    }

    if (!user?.id) {
      setState('error');
      setError('Sign in to save entries.');
      return;
    }

    try {
      let recentEntries = [];
      try {
        recentEntries = (await getEntries(user.id, { limit: 10 })) || [];
      } catch (e) {
        console.warn('Could not load recent entries for mood context:', e);
      }

      const insights = await extractInsights(finalTranscript, acousticFeatures, {
        faceImageBase64s: faceSnapshots,
        recentEntries,
      });

      const entry = await saveEntry({
        user_id: user.id,
        transcript: finalTranscript,
        duration_seconds: elapsed,
        energy_level: acousticFeatures?.energy,
        speaking_rate: acousticFeatures?.speakingRate,
        pause_ratio: acousticFeatures?.pauseRatio,
        pitch_variance: acousticFeatures?.pitchVariance,
        ...insights,
      });

      setResult(entry);
      setState('done');
      runPostEntryHeuristics(user.id).catch((e) =>
        console.warn('Post-entry heuristics skipped:', e)
      );
    } catch (err) {
      console.error('Save failed:', err);
      setState('error');
      setError('Failed to save entry. Please try again.');
    }
  }, [state, elapsed, user]);

  stopRecordingRef.current = stopRecording;

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    faceSamplerRef.current?.dispose();
    faceSamplerRef.current = null;
    recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordingStreamRef.current = null;
    liveApiRef.current?.disconnect();
    try {
      recorderRef.current?.stop();
    } catch (_) {
      /* already torn down */
    }
    recorderRef.current = null;
    setCameraStream(null);
    setState('idle');
    setElapsed(0);
    setWaveformData([]);
    setTranscript('');
    setResult(null);
    setError(null);
  }, []);

  return {
    state,
    elapsed,
    maxDuration: MAX_DURATION,
    waveformData,
    transcript,
    result,
    error,
    cameraStream,
    startRecording,
    stopRecording,
    reset,
  };
}
