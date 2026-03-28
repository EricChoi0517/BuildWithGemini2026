/**
 * Gemini Live API Integration
 *
 * Handles real-time audio transcription and post-recording
 * analysis (entity extraction, sentiment, topics, unresolved threads)
 *
 * Live API docs: https://ai.google.dev/gemini-api/docs/live
 */

/** Trim + strip accidental quotes from .env (common copy/paste mistake). */
function normalizeGeminiKey(raw) {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

const GEMINI_API_KEY = normalizeGeminiKey(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Google AI Studio keys for Generative Language are ~39 chars and start with "AIza".
 * Catches leaving .env.example placeholder in place.
 */
function geminiKeyLooksInvalid(k) {
  if (!k) return true;
  const lower = k.toLowerCase();
  if (
    lower === 'your-gemini-api-key' ||
    lower === 'apikey' ||
    lower.includes('your_api_key')
  ) {
    return true;
  }
  return k.length < 30 || !k.startsWith('AIza');
}

const GEMINI_KEY_SETUP_HINT =
  'Open .env, set VITE_GEMINI_API_KEY to the full key from https://aistudio.google.com/apikey (not the placeholder text), save, then restart npm run dev.';

/** Strip accidental `models/` so we never send `models/models/...` (invalid). */
function normalizeLiveModelId(raw) {
  let s = normalizeGeminiKey(raw);
  if (!s) return '';
  if (s.toLowerCase().startsWith('models/')) s = s.slice('models/'.length);
  return s.trim();
}

// Live native-audio models. Default matches Live API guide; override with VITE_GEMINI_LIVE_MODEL.
// See https://ai.google.dev/gemini-api/docs/live-guide
const GEMINI_LIVE_MODEL =
  normalizeLiveModelId(import.meta.env.VITE_GEMINI_LIVE_MODEL) ||
  'gemini-3.1-flash-live-preview';

// Official Live API WebSocket (v1beta). See https://ai.google.dev/api/live
function liveWsUrl() {
  const k = encodeURIComponent(GEMINI_API_KEY);
  return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${k}`;
}

function restUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
}

/** POST generateContent; retries on 429/503 with backoff (Retry-After when present). */
async function fetchGenerateContentJson(body, logLabel = 'Gemini') {
  const maxAttempts = 4;
  let lastResponse;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    lastResponse = await fetch(restUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (lastResponse.status !== 429 && lastResponse.status !== 503) {
      return lastResponse;
    }
    const ra = lastResponse.headers.get('Retry-After');
    let ms = 500 * (attempt + 1) ** 2;
    if (ra != null && ra !== '') {
      const n = Number(ra);
      if (Number.isFinite(n)) ms = Math.min(12000, Math.max(200, n * 1000));
    }
    if (attempt < maxAttempts - 1) {
      console.warn(`[${logLabel}] HTTP ${lastResponse.status}, retrying in ${ms}ms`);
      await new Promise((r) => setTimeout(r, ms));
    }
  }
  return lastResponse;
}

function formatLiveApiErrorMessage(err) {
  const base =
    typeof err?.message === 'string'
      ? err.message
      : typeof err === 'string'
        ? err
        : JSON.stringify(err);
  if (/API key not valid|invalid api key|permission denied/i.test(base)) {
    return `${base} Create a key in Google AI Studio, paste it as VITE_GEMINI_API_KEY in .env (no quotes), restart npm run dev. In Google Cloud → APIs & Services → Credentials, set Application restrictions to "None" for localhost WebSockets, and ensure "Generative Language API" is enabled for that project.`;
  }
  if (/invalid argument|invalid value at/i.test(base)) {
    return `${base} For VITE_GEMINI_LIVE_MODEL use only the model id (e.g. gemini-3.1-flash-live-preview), not the full "models/..." path. Remove VITE_GEMINI_LIVE_MODEL to use the default. Restart npm run dev after changing .env.`;
  }
  return base;
}

function rejectingLive(err) {
  const e = err instanceof Error ? err : new Error(String(err));
  return {
    sendAudio() {},
    endAudio() {},
    disconnect() {},
    whenReady() {
      return Promise.reject(e);
    },
    connected: false,
    ready: false,
  };
}

/**
 * Connect to Gemini Live API via WebSocket (v1beta JSON, camelCase).
 * Waits for setupComplete before sending audio — otherwise chunks are dropped and transcript stays empty.
 */
export function connectLiveAPI({ onTranscript, onError, onClose }) {
  if (!GEMINI_API_KEY) {
    const err = new Error(`Missing VITE_GEMINI_API_KEY. ${GEMINI_KEY_SETUP_HINT}`);
    console.warn('[Gemini Live]', err.message);
    onError?.(err);
    onClose?.();
    return rejectingLive(err);
  }
  if (geminiKeyLooksInvalid(GEMINI_API_KEY)) {
    const err = new Error(
      `VITE_GEMINI_API_KEY is missing, truncated, or still the example placeholder. ${GEMINI_KEY_SETUP_HINT}`
    );
    console.warn('[Gemini Live]', err.message);
    onError?.(err);
    onClose?.();
    return rejectingLive(err);
  }

  const ws = new WebSocket(liveWsUrl());
  let isConnected = false;
  let setupComplete = false;
  let readySettled = false;
  let setupTimeoutId;
  let resolveReady;
  let rejectReady;

  const readyPromise = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
    setupTimeoutId = setTimeout(() => {
      failSetup(new Error('Live API setup timed out'));
    }, 15000);
  });

  function finishSetup() {
    if (readySettled) return;
    readySettled = true;
    setupComplete = true;
    clearTimeout(setupTimeoutId);
    resolveReady?.();
    console.log('[Gemini Live] Ready');
  }

  function failSetup(err) {
    if (readySettled) return;
    readySettled = true;
    clearTimeout(setupTimeoutId);
    rejectReady?.(err);
  }

  ws.onopen = () => {
    isConnected = true;

    // Minimal setup + input transcription. Extra realtimeInputConfig can trigger INVALID_ARGUMENT on some model/API combos.
    // Docs: https://ai.google.dev/gemini-api/docs/live-guide
    const setup = {
      model: `models/${GEMINI_LIVE_MODEL}`,
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Puck',
            },
          },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: 'The user is recording a short voice journal. Transcribe their speech accurately. You may give very brief text acknowledgements only if needed; prioritize faithful transcription of what they say.',
          },
        ],
      },
      inputAudioTranscription: {},
    };

    ws.send(JSON.stringify({ setup }));
  };

  ws.onmessage = async (event) => {
    try {
      let raw = event.data;
      if (raw instanceof Blob) raw = await raw.text();
      else if (typeof raw !== 'string') raw = String(raw);
      const data = JSON.parse(raw);

      if (data.error) {
        const rawMsg =
          data.error.message ||
          data.error.status ||
          (typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
        const msg = formatLiveApiErrorMessage({ message: rawMsg });
        console.error('[Gemini Live] Server error:', data.error);
        failSetup(new Error(msg));
        onError?.(new Error(msg));
        try {
          ws.close();
        } catch (_) {
          /* ignore */
        }
        return;
      }

      if (Object.prototype.hasOwnProperty.call(data, 'setupComplete')) {
        finishSetup();
        return;
      }

      const sc = data.serverContent;
      if (!sc) return;

      if (sc.inputTranscription?.text) {
        onTranscript?.(sc.inputTranscription.text);
      } else if (sc.modelTurn?.parts?.length) {
        const text = sc.modelTurn.parts
          .filter((p) => p.text)
          .map((p) => p.text)
          .join('');
        if (text) onTranscript?.(text);
      }
    } catch (err) {
      console.error('[Gemini Live] Parse error:', err);
    }
  };

  ws.onerror = () => {
    console.error('[Gemini Live] WebSocket error');
    if (!readySettled) failSetup(new Error('WebSocket error'));
    onError?.(new Error('WebSocket error'));
  };

  ws.onclose = (event) => {
    if (!readySettled) {
      const why =
        event.reason?.trim() ||
        (event.code ? `code ${event.code}` : 'no reason');
      const msg = formatLiveApiErrorMessage({ message: why });
      failSetup(
        new Error(
          msg.includes('Create a key in Google')
            ? msg
            : `Live API closed before ready (${msg}). Check model name and API key.`
        )
      );
    }
    isConnected = false;
    setupComplete = false;
    onClose?.();
  };

  return {
    whenReady() {
      return readyPromise;
    },

    sendAudio(base64Pcm16) {
      if (!setupComplete || ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          realtimeInput: {
            audio: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Pcm16,
            },
          },
        })
      );
    },

    endAudio() {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      ws.send(JSON.stringify({ clientContent: { turnComplete: true } }));
    },

    disconnect() {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    },

    get connected() {
      return isConnected;
    },
    get ready() {
      return setupComplete;
    },
  };
}

const EXTRACTION_FALLBACK = {
  sentiment_score: 0,
  sentiment_label: 'neutral',
  entities: [],
  topics: [],
  unresolved_threads: [],
  summary: 'Unable to analyze entry.',
  keywords: [],
  speaking_tone: null,
};

function coerceNumber(v, fallback = 0) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? Math.max(-1, Math.min(1, n)) : fallback;
}

function coerceStringArray(v, max = 16) {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === 'string' ? x.trim() : String(x)))
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Normalize model output to DB column names (snake_case).
 */
export function normalizeEntryExtraction(raw) {
  if (!raw || typeof raw !== 'object') return { ...EXTRACTION_FALLBACK };

  const keywords = coerceStringArray(raw.keywords ?? raw.key_phrases, 12);
  const tone =
    raw.speaking_tone ??
    raw.speakingTone ??
    raw.tone_of_voice ??
    raw.tone_summary ??
    null;
  const speaking_tone =
    tone != null && String(tone).trim()
      ? String(tone).trim().slice(0, 600)
      : null;

  return {
    sentiment_score: coerceNumber(raw.sentiment_score),
    sentiment_label: ['positive', 'neutral', 'negative'].includes(raw.sentiment_label)
      ? raw.sentiment_label
      : 'neutral',
    entities: coerceStringArray(raw.entities, 20),
    topics: coerceStringArray(raw.topics, 12),
    unresolved_threads: coerceStringArray(raw.unresolved_threads, 8),
    summary:
      typeof raw.summary === 'string' && raw.summary.trim()
        ? raw.summary.trim().slice(0, 500)
        : EXTRACTION_FALLBACK.summary,
    keywords,
    speaking_tone,
  };
}

/**
 * Run Gemini extraction pass on completed transcript
 * Uses plain REST fetch — no SDK needed, works in any Vite project
 */
export async function extractInsights(transcript, acousticFeatures = {}) {
  const prompt = `You analyze short spoken journal transcripts. Use BOTH the words they chose and the acoustic hints below to infer how they sounded emotionally (tone of voice / delivery), not only what they said.

Transcript: """${transcript.replace(/"""/g, '"')}"""

Acoustic hints (from their microphone, not judgmental):
- Energy level (0–1): ${acousticFeatures.energy ?? 'unknown'}
- Speaking rate (wpm): ${acousticFeatures.speakingRate ?? 'unknown'}
- Pause ratio: ${acousticFeatures.pauseRatio ?? 'unknown'}
- Pitch variance: ${acousticFeatures.pitchVariance ?? 'unknown'}

Return ONLY a valid JSON object (no markdown):
{
  "sentiment_score": <float -1.0 to 1.0>,
  "sentiment_label": "positive" | "neutral" | "negative",
  "entities": ["<people, places, concrete things>"],
  "topics": ["<2–4 broader themes>"],
  "keywords": ["<4–10 distinctive words or short phrases actually used or clearly implied—good for search/trends>"],
  "speaking_tone": "<one concise sentence: how they sound—e.g. rushed, flat, warm, anxious, tentative, grounded; tie wording + acoustic hints>",
  "unresolved_threads": ["<0–3 emotionally weighted loose ends>"],
  "summary": "<one sentence neutral summary>"
}`;

  if (!GEMINI_API_KEY || geminiKeyLooksInvalid(GEMINI_API_KEY)) {
    console.warn('[Gemini] Missing or invalid VITE_GEMINI_API_KEY — skipping extraction.');
    return normalizeEntryExtraction(null);
  }

  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    };
    const response = await fetchGenerateContentJson(body, 'Gemini extractInsights');

    const data = await response.json();
    if (!response.ok) {
      console.error('[Gemini] extractInsights HTTP', response.status, data);
      return normalizeEntryExtraction(null);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }
    return normalizeEntryExtraction(parsed);
  } catch (err) {
    console.error('[Gemini] Extraction error:', err);
    return normalizeEntryExtraction(null);
  }
}

/**
 * Generate weekly summary from multiple entries
 * Called from weeklySummary.js
 */
export async function generateWeeklySummary(entries) {
  if (!GEMINI_API_KEY || geminiKeyLooksInvalid(GEMINI_API_KEY)) {
    console.warn('[Gemini] Missing or invalid VITE_GEMINI_API_KEY for weekly summary');
    return null;
  }

  const entrySummaries = entries.map((e, i) => {
    const kw = (e.keywords || []).slice(0, 6).join(', ');
    const tone = e.speaking_tone ? ` tone: ${e.speaking_tone}` : '';
    return `Day ${i + 1}: [sentiment: ${e.sentiment_score}]${tone} keywords: [${kw}] ${e.summary || e.transcript?.slice(0, 200)}`;
  }).join('\n');

  const prompt = `Summarize this week of journal entries. Be warm but direct. No platitudes.
Call out recurring keywords or tones if they repeat across days.

${entrySummaries}

Return ONLY a valid JSON object:
{
  "summary": "<2-3 sentence narrative of the week>",
  "emotional_arc": "<brief description of emotional trajectory>",
  "top_topics": ["<top 3 recurring themes>"],
  "avg_sentiment": <float average>
}`;

  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    };
    const response = await fetchGenerateContentJson(body, 'Gemini weekly');

    const data = await response.json();
    if (!response.ok) {
      console.error('[Gemini] weekly HTTP', response.status, data);
      return null;
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    return JSON.parse(text.replace(/```json\n?|```/g, '').trim());
  } catch (err) {
    console.error('[Gemini] Weekly summary error:', err);
    return null;
  }
}
