import { useRef, useEffect } from 'react';

/**
 * Real-time waveform visualization
 * Receives array of byte values (0-255) from Web Audio API AnalyserNode
 */
export default function Waveform({ data, isRecording, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerY = height / 2;

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) {
      // Draw flat line when not recording
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.strokeStyle = isRecording ? '#6C63FF' : '#2A2A3A';
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }

    // Draw waveform
    const sliceWidth = width / data.length;

    // Glow effect
    ctx.shadowColor = '#6C63FF';
    ctx.shadowBlur = isRecording ? 8 : 0;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isRecording ? '#6C63FF' : '#4A4280';

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * centerY);
      const x = i * sliceWidth;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw center line (subtle)
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.strokeStyle = 'rgba(42, 42, 58, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [data, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full waveform-canvas ${className}`}
      style={{ height: '120px' }}
    />
  );
}
