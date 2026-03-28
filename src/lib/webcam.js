/**
 * Webcam frame sampling for multimodal journal analysis.
 * Captures occasional JPEG stills from the user's camera during recording.
 */

/**
 * @param {MediaStream} stream - Must include a video track
 * @param {object} [opts]
 * @param {number} [opts.intervalMs] - Time between captures (default 7500)
 * @param {number} [opts.maxFrames] - Cap stored frames (default 4)
 * @param {number} [opts.quality] - JPEG quality 0–1 (default 0.72)
 * @param {number} [opts.maxWidth] - Max width in px (default 512)
 */
export function createFaceSampler(stream, opts = {}) {
  const intervalMs = opts.intervalMs ?? 7500;
  const maxFrames = opts.maxFrames ?? 4;
  const quality = opts.quality ?? 0.72;
  const maxWidth = opts.maxWidth ?? 512;

  const snapshots = [];
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.srcObject = stream;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let intervalId = null;
  let started = false;
  const fallbackStart = setTimeout(() => startIntervals(), 2500);

  function capture() {
    if (snapshots.length >= maxFrames) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const tw = Math.min(maxWidth, w);
    canvas.width = tw;
    canvas.height = Math.round((h / w) * tw);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const i = dataUrl.indexOf(',');
    if (i >= 0) snapshots.push(dataUrl.slice(i + 1));
  }

  function startIntervals() {
    if (started) return;
    started = true;
    clearTimeout(fallbackStart);
    capture();
    intervalId = setInterval(() => capture(), intervalMs);
  }

  video.addEventListener('loadeddata', () => {
    startIntervals();
  });

  const playPromise = video.play().catch(() => {});

  playPromise.then(() => {
    if (video.readyState >= 2) startIntervals();
  });

  return {
    getSnapshots: () => [...snapshots],
    flush: () => capture(),
    dispose() {
      clearTimeout(fallbackStart);
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      video.srcObject = null;
    },
  };
}
