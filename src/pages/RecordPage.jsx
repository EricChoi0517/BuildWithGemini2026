import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Check, RotateCcw } from 'lucide-react';
import { useRecorder } from '@/hooks/useRecorder';
import Waveform from '@/components/Waveform';
import MoodDot from '@/components/MoodDot';

export default function RecordPage() {
  const {
    state,
    elapsed,
    maxDuration,
    waveformData,
    transcript,
    result,
    error,
    startRecording,
    stopRecording,
    reset,
  } = useRecorder();

  const progress = elapsed / maxDuration;
  const timeLeft = maxDuration - elapsed;

  return (
    <div className="pt-8 pb-4 flex flex-col items-center min-h-[calc(100vh-120px)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-2xl text-echo-text">
          {state === 'idle' && 'Ready to record'}
          {state === 'recording' && 'Listening...'}
          {state === 'processing' && 'Processing...'}
          {state === 'done' && 'Entry saved'}
          {state === 'error' && 'Something went wrong'}
        </h1>
        {state === 'idle' && (
          <p className="text-echo-text-muted text-sm mt-2">
            Tap the mic to start. 30 seconds max.
          </p>
        )}
      </motion.div>

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
                onClick={startRecording}
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
              <span className="text-echo-text text-sm font-medium capitalize">
                {result.sentiment_label} mood
              </span>
            </div>
            {result.summary && (
              <p className="text-echo-text-muted text-sm">{result.summary}</p>
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
    </div>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
