/**
 * Audio Utilities
 *
 * Handles microphone capture, waveform visualization data,
 * and acoustic feature extraction (energy, pause ratio, speaking rate, pitch variance).
 * Audio is processed client-side — raw audio never leaves the device.
 */

/**
 * Initialize audio recording with Web Audio API
 * Returns controller for recording lifecycle
 */
export async function initAudioRecorder({
  onWaveformData,
  onAudioChunk,
  sampleRate = 16000,
}) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      sampleRate,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  const audioContext = new AudioContext(); // use mic's native sample rate
  const source = audioContext.createMediaStreamSource(stream);
  const nativeRate = audioContext.sampleRate;
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);

  // ScriptProcessor for raw PCM chunks (to send to Gemini Live API)
  const bufferSize = 4096;
  const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
  source.connect(processor);
  processor.connect(audioContext.destination);

  let isRecording = false;
  let animFrameId = null;
  const rawSamples = []; // Store all samples for post-processing

  processor.onaudioprocess = (event) => {
    if (!isRecording) return;

    const inputData = event.inputBuffer.getChannelData(0);
    // Downsample from native rate to target rate (16kHz) for Gemini
    const downsampled = downsample(inputData, nativeRate, sampleRate);
    rawSamples.push(...downsampled);

    // Convert to 16-bit PCM and base64 for Gemini Live API
    const pcm16 = float32ToPCM16(downsampled);
    const base64 = arrayBufferToBase64(pcm16.buffer);
    onAudioChunk?.(base64);
  };

  // Waveform visualization loop
  const waveformBuffer = new Uint8Array(analyser.frequencyBinCount);

  function drawLoop() {
    if (!isRecording) return;
    analyser.getByteTimeDomainData(waveformBuffer);
    onWaveformData?.(Array.from(waveformBuffer));
    animFrameId = requestAnimationFrame(drawLoop);
  }

  return {
    start() {
      isRecording = true;
      rawSamples.length = 0;
      drawLoop();
    },

    stop() {
      isRecording = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);

      // Extract acoustic features from accumulated samples
      const features = extractAcousticFeatures(
        new Float32Array(rawSamples),
        sampleRate
      );

      // Cleanup
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      audioContext.close();

      return features;
    },

    get recording() {
      return isRecording;
    },
  };
}

/**
 * Extract acoustic features from raw audio samples
 */
export function extractAcousticFeatures(samples, sampleRate) {
  const frameSize = Math.floor(sampleRate * 0.025); // 25ms frames
  const hopSize = Math.floor(sampleRate * 0.01);    // 10ms hop
  const totalFrames = Math.floor((samples.length - frameSize) / hopSize);

  if (totalFrames <= 0) {
    return { energy: 0, speakingRate: 0, pauseRatio: 1, pitchVariance: 0 };
  }

  // --- Energy ---
  let totalEnergy = 0;
  const frameEnergies = [];

  for (let i = 0; i < totalFrames; i++) {
    const start = i * hopSize;
    let frameEnergy = 0;
    for (let j = start; j < start + frameSize && j < samples.length; j++) {
      frameEnergy += samples[j] * samples[j];
    }
    frameEnergy /= frameSize;
    frameEnergies.push(frameEnergy);
    totalEnergy += frameEnergy;
  }

  const avgEnergy = totalEnergy / totalFrames;
  const normalizedEnergy = Math.min(1, avgEnergy * 50); // Scale to 0-1

  // --- Pause Ratio ---
  const silenceThreshold = avgEnergy * 0.1;
  let silentFrames = 0;
  for (const e of frameEnergies) {
    if (e < silenceThreshold) silentFrames++;
  }
  const pauseRatio = silentFrames / totalFrames;

  // --- Speaking Rate (estimated from energy transitions) ---
  let transitions = 0;
  let wasSilent = frameEnergies[0] < silenceThreshold;
  for (let i = 1; i < frameEnergies.length; i++) {
    const isSilent = frameEnergies[i] < silenceThreshold;
    if (wasSilent && !isSilent) transitions++;
    wasSilent = isSilent;
  }
  const durationSeconds = samples.length / sampleRate;
  const estimatedWords = transitions * 1.5; // rough estimate
  const speakingRate = durationSeconds > 0
    ? Math.round(estimatedWords / (durationSeconds / 60))
    : 0;

  // --- Pitch Variance (using zero-crossing rate as proxy) ---
  let zeroCrossings = 0;
  const zcRates = [];
  for (let i = 0; i < totalFrames; i++) {
    const start = i * hopSize;
    let zc = 0;
    for (let j = start + 1; j < start + frameSize && j < samples.length; j++) {
      if ((samples[j] >= 0) !== (samples[j - 1] >= 0)) zc++;
    }
    zcRates.push(zc / frameSize);
    zeroCrossings += zc;
  }

  const avgZCR = zcRates.reduce((a, b) => a + b, 0) / zcRates.length;
  const zcVariance = zcRates.reduce((acc, z) => acc + (z - avgZCR) ** 2, 0) / zcRates.length;
  const pitchVariance = Math.min(1, zcVariance * 1000);

  return {
    energy: Math.round(normalizedEnergy * 100) / 100,
    speakingRate,
    pauseRatio: Math.round(pauseRatio * 100) / 100,
    pitchVariance: Math.round(pitchVariance * 100) / 100,
  };
}

// ---- Helpers ----

function downsample(buffer, fromRate, toRate) {
  if (fromRate === toRate) return new Float32Array(buffer);
  const ratio = fromRate / toRate;
  const newLength = Math.floor(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    result[i] = buffer[Math.floor(i * ratio)];
  }
  return result;
}

function float32ToPCM16(float32Array) {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
