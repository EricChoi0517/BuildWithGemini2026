import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Check, RotateCcw, Video } from 'lucide-react';
import { useRecorder } from '@/hooks/useRecorder';
import { useAuth } from '@/context/AuthContext';
import { saveJournalFromText } from '@/lib/saveJournalFromText';
import Waveform from '@/components/Waveform';
import MoodDot, { formatMoodLabel } from '@/components/MoodDot';

const PROMPTS = [
  'Tell me about the best part of your day so far.',
  'Describe the last thing that made you laugh.',
  'What\'s been on your mind lately?',
  'Talk about someone you spoke to recently.',
  'What does the rest of your week look like?',
  'Describe a place you\'d like to be right now.',
  'What\'s something small that happened today?',
  'Talk about what you had or want for your next meal.',
  'What\'s something you\'re looking forward to?',
  'Describe how your morning went.',
  'If you could call anyone right now, who would it be?',
  'Talk about something you noticed on your way here.',
  'What\'s a decision you\'ve been thinking about?',
  'Describe the weather and how it makes you feel.',
  'Talk about something you did for the first time recently.',
  'What\'s a song that\'s been stuck in your head?',
  'Describe a conversation you had this week.',
  'What\'s something you wish you had more time for?',
  'Talk about a memory that came to mind today.',
  'What would make tomorrow a good day?',
];

export default function RecordPage() {
  const [includeCamera, setIncludeCamera] = useState(false);
  const {
    state,
    elapsed,
    maxDuration,
    waveformData,
    transcript,
    result,
    error,
    cameraStream,
    startRecording,
    stopRecording,
    reset,
  } = useRecorder({ useWebcam: includeCamera });

  const [prompt, setPrompt] = useState('');
  const videoPreviewRef = useRef(null);

  useEffect(() => {
    const el = videoPreviewRef.current;
    if (!el) return;
    if (cameraStream) {
      el.srcObject = cameraStream;
      el.play().catch(() => { });
    } else {
      el.srcObject = null;
    }
  }, [cameraStream]);

  const progress = elapsed / maxDuration;

  function handleStart() {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    startRecording();
  }

  return (
    <div className="pt-8 pb-4 flex flex-col items-center min-h-[calc(100vh-120px)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-2xl text-echo-text text-center">
          {state === 'idle' && 'Ready to record'}
          {state === 'recording' && 'Listening...'}
          {state === 'processing' && 'Processing...'}
          {state === 'done' && 'Entry saved'}
          {state === 'error' && 'Something went wrong'}
        </h1>
        {state === 'idle' && (
          <div className="mt-3 space-y-2 max-w-sm mx-auto">
            <p className="text-echo-text-muted text-sm">
              Tap the mic to start. 30 seconds max.
            </p>
            <label className="flex items-start gap-3 cursor-pointer text-left px-1">
              <input
                type="checkbox"
                checked={includeCamera}
                onChange={(e) => setIncludeCamera(e.target.checked)}
                className="mt-1 rounded border-echo-border text-echo-accent focus:ring-echo-accent"
              />
              <span className="text-sm text-echo-text-muted leading-snug">
                <span className="inline-flex items-center gap-1.5 text-echo-text font-medium">
                  <Video size={16} className="text-echo-accent shrink-0" />
                  Include camera
                </span>
                <span className="block text-xs text-echo-text-dim mt-1">
                  A few still frames during your clip are sent to Gemini with your transcript to read facial
                  expression alongside how you sound. No video file is stored—only text analysis in your entry.
                </span>
              </span>
            </label>
          </div>
        )}
        {state === 'recording' && prompt && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-echo-accent text-lg mt-3 italic max-w-xs mx-auto"
          >
            "{prompt}"
          </motion.p>
        )}
      </motion.div>

      {/* Webcam preview (optional) */}
      {state === 'recording' && cameraStream && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[280px] mx-auto mb-6 rounded-xl overflow-hidden border border-echo-border bg-black shadow-lg"
        >
          <video
            ref={videoPreviewRef}
            className="w-full aspect-video object-cover scale-x-[-1]"
            playsInline
            muted
            autoPlay
          />
        </motion.div>
      )}

      {/* Waveform */}
      <div className="w-full mb-8">
        <Waveform
          data={waveformData}
          isRecording={state === 'recording'}
        />
      </div>

      {/* Timer Ring */}
      <div className="relative mb-8">
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
          {/* Background ring */}
          <circle
            cx="80" cy="80" r="72"
            fill="none"
            stroke="#DDD8F0"
            strokeWidth="4"
          />
          {/* Progress ring */}
          <circle
            cx="80" cy="80" r="72"
            fill="none"
            stroke={state === 'recording' ? '#7C6CFF' : '#DDD8F0'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 72}`}
            strokeDashoffset={`${2 * Math.PI * 72 * (1 - progress)}`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Center button / state */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.button
                key="start"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={handleStart}
                className="w-20 h-20 rounded-full bg-echo-accent flex items-center justify-center shadow-lg shadow-echo-accent/30 hover:bg-echo-accent/90 transition-colors active:scale-95"
              >
                <Mic size={28} className="text-white" />
              </motion.button>
            )}

            {state === 'recording' && (
              <motion.button
                key="stop"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-echo-red recording-pulse flex items-center justify-center active:scale-95"
              >
                <Square size={22} className="text-white" fill="white" />
              </motion.button>
            )}

            {state === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-12 h-12 border-2 border-echo-accent border-t-transparent rounded-full animate-spin" />
              </motion.div>
            )}

            {state === 'done' && (
              <motion.div
                key="done"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-full bg-echo-green/20 flex items-center justify-center"
              >
                <Check size={28} className="text-echo-green" />
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div
                key="error"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-full bg-echo-red/20 flex items-center justify-center"
              >
                <span className="text-echo-red text-2xl">!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Timer text */}
      {(state === 'recording' || state === 'idle') && (
        <p className="text-echo-text-dim text-sm font-mono tabular-nums">
          {formatTime(elapsed)} / {formatTime(maxDuration)}
        </p>
      )}

      {/* Live transcript */}
      {transcript && state !== 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mt-6 p-4 bg-echo-surface border border-echo-border rounded-xl"
        >
          <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-2">
            Live transcript
          </p>
          <p className="text-echo-text text-sm leading-relaxed">{transcript}</p>
        </motion.div>
      )}

      {/* Result card */}
      {state === 'done' && result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full mt-6 space-y-4"
        >
          {/* Transcript */}
          <div className="p-4 bg-echo-surface border border-echo-border rounded-xl">
            <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-2">
              What you said
            </p>
            <p className="text-echo-text text-sm leading-relaxed">
              {result.transcript}
            </p>
          </div>

          {/* Analysis */}
          <div className="p-4 bg-echo-surface border border-echo-border rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <MoodDot score={result.sentiment_score} size={14} />
              <span className="text-echo-text text-sm font-medium">
                {formatMoodLabel(result.sentiment_label)} mood
              </span>
            </div>
            {result.summary && (
              <p className="text-echo-text-muted text-sm">{result.summary}</p>
            )}
            {result.speaking_tone && (
              <p className="text-echo-text-dim text-xs mt-3 leading-relaxed border-l-2 border-echo-accent/40 pl-3">
                <span className="text-echo-text-muted uppercase tracking-wider text-[10px] block mb-1">
                  Tone
                </span>
                {result.speaking_tone}
              </p>
            )}
            {result.facial_affect_summary && (
              <p className="text-echo-text-dim text-xs mt-3 leading-relaxed border-l-2 border-echo-border pl-3">
                <span className="text-echo-text-muted uppercase tracking-wider text-[10px] block mb-1">
                  From camera
                </span>
                {result.facial_affect_summary}
              </p>
            )}
            {result.emotion_context_notes && (
              <p className="text-echo-text-dim text-xs mt-3 leading-relaxed border-l-2 border-echo-accent/25 pl-3">
                <span className="text-echo-text-muted uppercase tracking-wider text-[10px] block mb-1">
                  Context & changes
                </span>
                {result.emotion_context_notes}
              </p>
            )}
            {result.keywords?.length > 0 && (
              <div className="mt-3">
                <p className="text-echo-text-muted text-[10px] uppercase tracking-wider mb-1.5">
                  Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords.map((word, i) => (
                    <span
                      key={i}
                      className="text-[11px] text-echo-text bg-echo-card border border-echo-border px-2 py-0.5 rounded-md"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.topics?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {result.topics.map((topic, i) => (
                  <span
                    key={i}
                    className="text-xs text-echo-accent bg-echo-accent/10 px-2.5 py-1 rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Record another */}
          <button
            onClick={reset}
            className="w-full py-3 flex items-center justify-center gap-2 text-echo-text-muted hover:text-echo-text text-sm transition-colors"
          >
            <RotateCcw size={14} />
            Record another
          </button>
        </motion.div>
      )}

      {/* Error state */}
      {state === 'error' && error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mt-6 text-center space-y-4"
        >
          <p className="text-echo-red text-sm">{error}</p>
          <button
            onClick={reset}
            className="px-6 py-2.5 text-echo-text text-sm bg-echo-surface border border-echo-border rounded-xl hover:border-echo-accent transition-colors"
          >
            Try again
          </button>
        </motion.div>
      )}

      {import.meta.env.DEV && !!import.meta.env.VITE_DEV_TYPED_ENTRY && state === 'idle' && (
        <DevTypedEntry />
      )}
    </div>
  );
}

function DevTypedEntry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user?.id) {
      setLocalError('Sign in to save.');
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      await saveJournalFromText(user.id, text, 5);
      setText('');
      navigate('/');
    } catch (err) {
      setLocalError(err.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mt-10 pt-8 border-t border-echo-border space-y-3"
    >
      <p className="text-echo-text-dim text-xs uppercase tracking-wider">Dev · typed entry</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Type a journal entry to test DB + Flash extraction (no mic)."
        className="w-full bg-echo-card border border-echo-border rounded-xl px-3 py-2 text-sm text-echo-text placeholder:text-echo-text-dim focus:outline-none focus:ring-1 focus:ring-echo-accent resize-y min-h-[80px]"
      />
      {localError && <p className="text-echo-red text-xs">{localError}</p>}
      <button
        type="submit"
        disabled={busy || !text.trim()}
        className="w-full py-2.5 rounded-xl text-sm bg-echo-card border border-echo-border text-echo-text hover:border-echo-accent/50 disabled:opacity-40 disabled:pointer-events-none"
      >
        {busy ? 'Saving…' : 'Save typed entry'}
      </button>
    </form>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
