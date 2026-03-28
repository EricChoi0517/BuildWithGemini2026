import { useState, useRef, useCallback } from 'react';
import { initAudioRecorder } from '@/lib/audio';
import { connectLiveAPI, extractInsights } from '@/lib/gemini';
import { saveEntry } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const MAX_DURATION = 30; // seconds

export function useRecorder() {
  const { user } = useAuth();
  const [state, setState] = useState('idle'); // idle | recording | processing | done | error
  const [elapsed, setElapsed] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const liveApiRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptRef = useRef('');

  const startRecording = useCallback(async () => {
    try {
      setState('recording');
      setElapsed(0);
      setTranscript('');
      setResult(null);
      setError(null);
      transcriptRef.current = '';

      // Connect to Gemini Live API
      liveApiRef.current = connectLiveAPI({
        onTranscript: (text) => {
          transcriptRef.current += text;
          setTranscript(transcriptRef.current);
        },
        onError: (err) => {
          console.error('Live API error:', err);
          setError('Connection to Gemini failed. Your recording was saved locally.');
        },
        onClose: () => {
          console.log('Live API disconnected');
        },
      });

      // Initialize audio recorder
      recorderRef.current = await initAudioRecorder({
        onWaveformData: setWaveformData,
        onAudioChunk: (base64) => {
          liveApiRef.current?.sendAudio(base64);
        },
      });

      recorderRef.current.start();

      // Timer with auto-stop
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
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
  }, []);

  const stopRecording = useCallback(async () => {
    if (state !== 'recording') return;

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState('processing');

    // Stop audio recorder and get acoustic features
    const acousticFeatures = recorderRef.current?.stop();

    // Signal end of audio to Live API
    liveApiRef.current?.endAudio();

    // Wait a beat for final transcription
    await new Promise((r) => setTimeout(r, 1500));

    const finalTranscript = transcriptRef.current;
    liveApiRef.current?.disconnect();

    if (!finalTranscript.trim()) {
      setState('error');
      setError('No speech detected. Try again.');
      return;
    }

    try {
      // Run Gemini extraction
      const insights = await extractInsights(finalTranscript, acousticFeatures);

      // Save to Supabase
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
    } catch (err) {
      console.error('Save failed:', err);
      setState('error');
      setError('Failed to save entry. Please try again.');
    }
  }, [state, elapsed, user]);

  const reset = useCallback(() => {
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
    startRecording,
    stopRecording,
    reset,
  };
}
