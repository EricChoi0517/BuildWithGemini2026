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

/** Flash model for REST extraction (Live uses a different model). */
const GEMINI_EXTRACT_MODEL =
  normalizeLiveModelId(import.meta.env.VITE_GEMINI_EXTRACT_MODEL) ||
  'gemini-2.5-flash';

// Official Live API WebSocket (v1beta). See https://ai.google.dev/api/live
function liveWsUrl() {
  const k = encodeURIComponent(GEMINI_API_KEY);
  return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${k}`;
}

function restExtractUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EXTRACT_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
}

/** POST generateContent; retries on 429/503 with backoff (Retry-After when present). */
async function fetchGenerateContentWithRetry(url, body, logLabel = 'Gemini') {
  const maxAttempts = 4;
  let lastResponse;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    lastResponse = await fetch(url, {
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

/** Concatenate text parts; log blocks / finish reasons. */
function extractCandidateText(data) {
  const c = data?.candidates?.[0];
  if (!c) {
    const pb = data?.promptFeedback?.blockReason;
    if (pb) console.warn('[Gemini] prompt blocked:', pb, data?.promptFeedback);
    return null;
  }
  const fr = c.finishReason;
  if (fr && fr !== 'STOP' && fr !== 'FINISH_REASON_STOP') {
    console.warn('[Gemini] candidate finishReason:', fr);
  }
  const parts = c.content?.parts;
  if (!Array.isArray(parts)) return null;
  const texts = parts.map((p) => p?.text).filter((t) => typeof t === 'string' && t.trim());
  return texts.length ? texts.join('\n') : null;
}

function tryParseExtractionJson(text) {
  if (text == null || !String(text).trim()) return null;
  const cleaned = String(text)
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

const MOOD_LABEL_ALIASES = {
  hyperbolic: 'hyperbolic_or_performative',
  performative: 'hyperbolic_or_performative',
  ironic: 'hyperbolic_or_performative',
  sarcasm: 'hyperbolic_or_performative',
  sarcastic: 'hyperbolic_or_performative',
  playful: 'hyperbolic_or_performative',
  manic: 'anxious',
};

const ALLOWED_MOOD_LABELS = new Set([
  'positive',
  'neutral',
  'negative',
  'mixed',
  'conflicted',
  'bittersweet',
  'hyperbolic_or_performative',
  'subdued',
  'anxious',
  'flat',
  'guarded',
  'hopeful',
  'heavy',
  'warm',
  'numb',
  'disengaged',
]);

function normalizeMoodLabel(raw) {
  if (raw == null || raw === '') return 'neutral';
  let s = String(raw).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (MOOD_LABEL_ALIASES[s]) s = MOOD_LABEL_ALIASES[s];
  if (ALLOWED_MOOD_LABELS.has(s)) return s;
  return 'neutral';
}

function formatRecentSessionsForPrompt(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return '';
  const lines = entries.slice(0, 8).map((e, i) => {
    const d = e.created_at
      ? new Date(e.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      : `prior_${i + 1}`;
    const lbl = e.sentiment_label ?? '?';
    const sc = e.sentiment_score != null ? Number(e.sentiment_score).toFixed(2) : '?';
    const tone = (e.speaking_tone || '—').replace(/\s+/g, ' ').slice(0, 200);
    const face = (e.facial_affect_summary || '—').replace(/\s+/g, ' ').slice(0, 140);
    const summ = (e.summary || e.transcript || '').replace(/\s+/g, ' ').slice(0, 160);
    const ctx = (e.emotion_context_notes || '').replace(/\s+/g, ' ').slice(0, 160);
    return `- [${d}] mood:${lbl} score:${sc} | tone: ${tone}${ctx && ctx !== '—' ? ` | prior context: ${ctx}` : ''} | face: ${face} | recap: ${summ}`;
  });
  return `Recent journal sessions (newest first). Use these ONLY to describe change vs continuity—do not invent sessions:\n${lines.join('\n')}`;
}

/**
 * Cheap heuristic when Gemini is off: very short answers or no lexical overlap with prompt.
 * Keeps analytics honest when someone ignores or barely engages the journal prompt.
 */
function heuristicJournalPromptNote(transcript, journalPrompt) {
  const jp = (journalPrompt || '').trim();
  if (!jp) return '';
  const t = transcript.trim();
  const words = t.split(/\s+/).filter(Boolean);
  const wc = words.length;
  if (wc < 8) {
    return 'They spoke very little—hard to know if the journal prompt was answered; treat mood and topics as low-confidence.';
  }
  const stop = new Set([
    'tell', 'describe', 'talk', 'about', 'what', 'your', 'been', 'have', 'something', 'would', 'could',
    'that', 'this', 'with', 'from', 'they', 'them', 'when', 'where', 'which', 'there', 'here', 'just',
    'like', 'some', 'into', 'make', 'good', 'does', 'did', 'doesn', 'don', 'want', 'need',
  ]);
  const promptTokens = jp.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const meaningful = [...new Set(promptTokens)].filter((w) => !stop.has(w));
  if (meaningful.length < 2) return '';
  const textLower = t.toLowerCase();
  const hits = meaningful.filter((w) => textLower.includes(w)).length;
  const ratio = hits / meaningful.length;
  if (wc >= 18 && ratio < 0.12) {
    return 'What they said may not match the suggested journal prompt much—summaries and topics reflect their actual words, not the prompt theme.';
  }
  return '';
}

/** True when the model returned JSON without usable analysis fields. */
function extractionPayloadLooksEmpty(parsed) {
  if (!parsed || typeof parsed !== 'object') return true;
  const hasSummary = typeof parsed.summary === 'string' && parsed.summary.trim().length > 3;
  const hasTone =
    typeof parsed.speaking_tone === 'string' && parsed.speaking_tone.trim().length > 3;
  const hasTopics = Array.isArray(parsed.topics) && parsed.topics.length > 0;
  const hasKeywords = Array.isArray(parsed.keywords) && parsed.keywords.length > 0;
  return !hasSummary && !hasTone && !hasTopics && !hasKeywords;
}

/**
 * When the API fails or returns empty JSON, infer mood from wording + acoustic features
 * so the UI never shows only "Unable to analyze entry."
 */
function heuristicExtractionFromAudio(transcript, acoustic = {}, recentEntries = [], journalPrompt = '') {
  const t = transcript.trim();
  const lower = t.toLowerCase();
  let score = 0;
  const positives =
    'great good happy love thanks excited hope better nice amazing wonderful yes relaxed calm grateful proud fun glad'.split(
      /\s+/
    );
  const negatives =
    'sad bad hate tired anxious worried scared lonely stressed awful terrible cry angry hurt ugh never worst depressed down'.split(
      /\s+/
    );
  let pw = 0;
  let nw = 0;
  for (const w of positives) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) pw++;
  }
  for (const w of negatives) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) nw++;
  }
  if (pw + nw > 0) {
    score = (pw - nw) / Math.max(1, pw + nw);
  }
  const e = typeof acoustic.energy === 'number' ? acoustic.energy : 0.45;
  const pr = typeof acoustic.pauseRatio === 'number' ? acoustic.pauseRatio : 0.35;
  const sr = typeof acoustic.speakingRate === 'number' ? acoustic.speakingRate : 110;
  const pv = typeof acoustic.pitchVariance === 'number' ? acoustic.pitchVariance : 0.3;
  if (pw + nw === 0) {
    score = (e - 0.45) * 1.1 + (0.4 - pr) * 0.2;
  } else {
    score = score * 0.62 + (e - 0.5) * 0.45 + (0.35 - pr) * 0.15;
  }
  score = Math.max(-1, Math.min(1, score));
  const hyperMarkers =
    /\b(literally|omg|so funny|best day ever|worst day ever|dying|insane|unhinged|haha|lmao)\b/i;
  const hasHyper = hyperMarkers.test(lower);

  let label =
    score > 0.22 ? 'positive' : score < -0.22 ? 'negative' : 'neutral';
  let emotion_notes = '';

  if (nw >= 1 && (e > 0.52 || hasHyper) && score > -0.15) {
    if (nw >= pw) {
      label = 'conflicted';
      score = Math.max(-1, Math.min(1, score * 0.55 - 0.12));
    } else {
      label = 'mixed';
      score = Math.max(-1, Math.min(1, score * 0.7));
    }
    emotion_notes +=
      'Estimated: energetic or exaggerated delivery with heavier wording—could be irony, coping humor, or storytelling. ';
  } else if (hasHyper && nw >= 2) {
    label = 'hyperbolic_or_performative';
    score = Math.max(-1, Math.min(1, score * 0.5));
    emotion_notes += 'Estimated: amplified language; valence is ambiguous. ';
  }

  if (recentEntries.length > 0) {
    const last = recentEntries[0];
    const ls = last?.sentiment_score;
    if (typeof ls === 'number' && Number.isFinite(ls)) {
      const delta = score - ls;
      if (Math.abs(delta) >= 0.35) {
        emotion_notes += `Rough shift vs last entry: ${delta > 0 ? 'warmer' : 'cooler'} (Δ≈${delta.toFixed(2)}). `;
      }
    }
    const lt = (last?.speaking_tone || '').toLowerCase();
    if (e > 0.58 && lt.includes('lower energy')) {
      emotion_notes += 'Compared to last session you sound more animated. ';
    }
    if (e < 0.35 && lt.includes('animated')) {
      emotion_notes += 'Compared to last session you sound more subdued. ';
    }
  }

  const toneParts = [];
  if (e < 0.32) toneParts.push('softer, lower energy in your voice');
  if (e > 0.62) toneParts.push('higher energy and animation');
  if (pr > 0.48) toneParts.push('more pauses between phrases');
  if (sr > 145) toneParts.push('relatively fast pacing');
  if (sr < 95) toneParts.push('slower, measured pacing');
  if (pv > 0.45) toneParts.push('more pitch variation (expressive)');
  if (pv < 0.22 && e < 0.42) toneParts.push('flatter, steadier delivery');
  const speaking_tone =
    toneParts.length > 0
      ? `${toneParts.join('; ')} (from your recording’s audio features).`
      : 'Steady delivery — estimated from your recording’s audio features.';
  const clip = t.slice(0, 280);
  const summary =
    clip.length > 0
      ? clip + (t.length > clip.length ? '…' : '')
      : 'Journal entry captured.';
  const promptNote = heuristicJournalPromptNote(t, journalPrompt);
  const mergedCtx = [emotion_notes.trim(), promptNote].filter(Boolean).join(' ') || null;
  return normalizeEntryExtraction({
    sentiment_score: Math.round(score * 100) / 100,
    sentiment_label: normalizeMoodLabel(label),
    summary,
    speaking_tone,
    entities: [],
    topics: [],
    keywords: [],
    unresolved_threads: [],
    facial_affect_summary: null,
    emotion_context_notes: mergedCtx,
  });
}

/** Fill missing summary/tone/context when the model returned partial JSON. */
function enrichExtractionOutput(result, transcript, acoustic, recentEntries = [], journalPrompt = '') {
  let out = { ...result };
  if (out.summary === EXTRACTION_FALLBACK.summary && transcript?.trim()) {
    const tr = transcript.trim();
    out = {
      ...out,
      summary: tr.slice(0, 300) + (tr.length > 300 ? '…' : ''),
    };
  }
  const needTone = !out.speaking_tone?.trim();
  const needCtx = !out.emotion_context_notes?.trim();
  if (needTone || needCtx) {
    const h = heuristicExtractionFromAudio(transcript, acoustic, recentEntries, journalPrompt);
    if (needTone) out = { ...out, speaking_tone: h.speaking_tone };
    if (needCtx && h.emotion_context_notes) {
      out = { ...out, emotion_context_notes: h.emotion_context_notes };
    }
  }
  if (!out.emotion_context_notes?.trim() && recentEntries.length === 0) {
    out = {
      ...out,
      emotion_context_notes: 'No earlier entries in context—this recording stands alone.',
    };
  }
  if (journalPrompt) {
    const hn = heuristicJournalPromptNote((transcript || '').trim(), journalPrompt);
    if (hn && !(out.emotion_context_notes || '').includes(hn)) {
      out = {
        ...out,
        emotion_context_notes: out.emotion_context_notes
          ? `${out.emotion_context_notes} ${hn}`
          : hn,
      };
    }
  }
  return out;
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
  facial_affect_summary: null,
  emotion_context_notes: null,
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

  const faceRaw =
    raw.facial_affect_summary ??
    raw.facialAffectSummary ??
    raw.visible_demeanor ??
    null;
  const facial_affect_summary =
    faceRaw != null && String(faceRaw).trim()
      ? String(faceRaw).trim().slice(0, 600)
      : null;

  const ctxRaw =
    raw.emotion_context_notes ??
    raw.emotionContextNotes ??
    raw.session_emotional_context ??
    raw.emotional_discrepancy ??
    null;
  let emotion_context_notes =
    ctxRaw != null && String(ctxRaw).trim()
      ? String(ctxRaw).trim().slice(0, 1200)
      : null;

  const padhRaw = raw.prompt_adherence ?? raw.promptAdherence ?? null;
  const padh =
    padhRaw != null &&
    String(padhRaw).trim() &&
    String(padhRaw).trim().toLowerCase() !== 'null'
      ? String(padhRaw).trim().slice(0, 450)
      : null;
  if (padh) {
    emotion_context_notes = emotion_context_notes
      ? `${emotion_context_notes} ${padh}`
      : padh;
  }

  return {
    sentiment_score: coerceNumber(raw.sentiment_score),
    sentiment_label: normalizeMoodLabel(raw.sentiment_label),
    entities: coerceStringArray(raw.entities, 20),
    topics: coerceStringArray(raw.topics, 12),
    unresolved_threads: coerceStringArray(raw.unresolved_threads, 8),
    summary:
      typeof raw.summary === 'string' && raw.summary.trim()
        ? raw.summary.trim().slice(0, 500)
        : EXTRACTION_FALLBACK.summary,
    keywords,
    speaking_tone,
    facial_affect_summary,
    emotion_context_notes,
  };
}

/**
 * Run Gemini extraction pass on completed transcript
 * Uses plain REST fetch — no SDK needed, works in any Vite project
 * @param {string} transcript
 * @param {object} acousticFeatures
 * @param {{ faceImageBase64s?: string[], recentEntries?: object[], journalPrompt?: string, transcriptVeryShort?: boolean }} [multimodal]
 */
export async function extractInsights(transcript, acousticFeatures = {}, multimodal = {}) {
  const faceImageBase64s = Array.isArray(multimodal.faceImageBase64s)
    ? multimodal.faceImageBase64s.filter(Boolean).slice(0, 4)
    : [];
  const recentEntries = Array.isArray(multimodal.recentEntries) ? multimodal.recentEntries : [];
  const journalPrompt =
    typeof multimodal.journalPrompt === 'string' ? multimodal.journalPrompt.trim() : '';
  const transcriptVeryShort = !!multimodal.transcriptVeryShort;

  const hasFaces = faceImageBase64s.length > 0;
  const priorBlock = formatRecentSessionsForPrompt(recentEntries);

  const faceBlock = hasFaces
    ? `Webcam: ${faceImageBase64s.length} still frame(s) from the same recording. Describe visible demeanor (smiling, tension, eyes) conservatively—no diagnoses. If the face looks cheerful but the words are sad/heavy (or the opposite), call that OUT explicitly in emotion_context_notes and facial_affect_summary; do not let the smile alone force "positive" sentiment.`
    : `No webcam stills; set "facial_affect_summary" to null.`;

  const discrepancyBlock = `Discrepancies & performance (important):
- Hyperbolic, theatrical, or "storytelling" delivery (big reactions, "literally dying", ironic cheer) can CONTRADICT sad or heavy CONTENT—prefer labels like mixed, conflicted, bittersweet, or hyperbolic_or_performative when delivery and content diverge.
- Do NOT map loud/fast/happy-sounding voice alone to positive if the topic is loss, stress, or pain unless they clearly frame it as genuine relief.
- sentiment_score should reflect underlying emotional weight when content and performance conflict (often nearer -0.3…0.3), not only surface energy.`;

  const journalBlock = journalPrompt
    ? `Journal prompt they were invited to respond to (they could ignore or pivot—your job is to notice):
"""${journalPrompt.replace(/"""/g, '"')}"""

Prompt adherence:
- Fill "prompt_adherence" with ONE short neutral sentence: did they engage this topic, brush it off, go elsewhere, answer in one word, or ramble on something unrelated? If off-topic, say so clearly.
- Do NOT invent entities or topics from the prompt if the speaker never mentioned those things—reflect their actual words.
- Never shame; stay matter-of-fact.`
    : `No journal prompt was tied to this clip. Set JSON field "prompt_adherence" to null.`;

  const shortBlock = transcriptVeryShort
    ? `The transcript is VERY SHORT. If a journal prompt exists, say in "prompt_adherence" that fit is uncertain. Keep sentiment_score modest unless words are strongly valenced; avoid speculative topics—prefer empty arrays over guessing.`
    : '';

  const prompt = `You analyze spoken journal clips. Integrate WORDS + acoustic hints${hasFaces ? ' + webcam stills' : ''}. Be specific.

${discrepancyBlock}

${faceBlock}

${journalBlock}
${shortBlock ? `\n${shortBlock}\n` : ''}
${priorBlock ? `${priorBlock}\n\n` : ''}Transcript: """${transcript.replace(/"""/g, '"')}"""

Acoustic hints (microphone, not judgmental):
- Energy (0–1): ${acousticFeatures.energy ?? 'unknown'}
- Speaking rate (wpm): ${acousticFeatures.speakingRate ?? 'unknown'}
- Pause ratio: ${acousticFeatures.pauseRatio ?? 'unknown'}
- Pitch variance: ${acousticFeatures.pitchVariance ?? 'unknown'}

Rules:
- sentiment_label: pick the BEST fit from this list (snake_case): positive, neutral, negative, mixed, conflicted, bittersweet, hyperbolic_or_performative, subdued, anxious, flat, guarded, hopeful, heavy, warm, numb, disengaged.
- sentiment_score: -1.0 to 1.0; when delivery contradicts content, keep score moderate unless words are clearly celebratory or clearly devastating.
- emotion_context_notes: REQUIRED (string, can be short). Mention (1) any mismatch: hyper tone vs sad words, cheerful face vs heavy words, flat voice vs upbeat words; (2) if prior sessions are listed, how THIS entry compares (warmer/colder, more guarded, energy shift, recurring theme). If no priors, say "First entries—no prior comparison." or similar.
- prompt_adherence: If a journal prompt was given above, one concise sentence on how their speech relates to it; if none was given, null.
- speaking_tone: how they sound + how it relates to words (and face if any).
- summary: one neutral sentence on what they shared (what they actually talked about, not the prompt text unless they engaged it).
- Output ONLY valid JSON (no markdown).

{
  "sentiment_score": <number>,
  "sentiment_label": "<one allowed label>",
  "entities": [],
  "topics": [],
  "keywords": [],
  "speaking_tone": "<required>",
  "facial_affect_summary": ${hasFaces ? '<string or null>' : 'null'},
  "emotion_context_notes": "<required string>",
  "prompt_adherence": ${journalPrompt ? '"<one sentence>"' : 'null'},
  "unresolved_threads": [],
  "summary": "<required string>"
}`;

  if (!GEMINI_API_KEY || geminiKeyLooksInvalid(GEMINI_API_KEY)) {
    console.warn('[Gemini] Missing or invalid VITE_GEMINI_API_KEY — skipping extraction.');
    return enrichExtractionOutput(
      heuristicExtractionFromAudio(transcript, acousticFeatures, recentEntries, journalPrompt),
      transcript,
      acousticFeatures,
      recentEntries,
      journalPrompt
    );
  }

  const url = restExtractUrl();
  const parts = [{ text: prompt }];
  for (const b64 of faceImageBase64s) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: b64,
      },
    });
  }

  async function runOnce(generationConfig) {
    const body = { contents: [{ parts }], generationConfig };
    const response = await fetchGenerateContentWithRetry(url, body, 'Gemini extractInsights');
    const data = await response.json().catch(() => ({}));
    return { response, data };
  }

  try {
    let { response, data } = await runOnce({
      responseMimeType: 'application/json',
      temperature: 0.35,
    });

    let text = extractCandidateText(data);
    let parsed = tryParseExtractionJson(text);

    if (
      !response.ok ||
      !parsed ||
      extractionPayloadLooksEmpty(parsed)
    ) {
      if (!response.ok) {
        console.warn('[Gemini] extractInsights first pass HTTP', response.status, data);
      } else {
        console.warn('[Gemini] extractInsights empty JSON; retrying without JSON mode');
      }
      ({ response, data } = await runOnce({ temperature: 0.4 }));
      text = extractCandidateText(data);
      parsed = tryParseExtractionJson(text);
    }

    if (!response.ok) {
      console.error('[Gemini] extractInsights HTTP', response.status, data);
      return enrichExtractionOutput(
        heuristicExtractionFromAudio(transcript, acousticFeatures, recentEntries, journalPrompt),
        transcript,
        acousticFeatures,
        recentEntries,
        journalPrompt
      );
    }

    if (!parsed || extractionPayloadLooksEmpty(parsed)) {
      console.warn('[Gemini] extractInsights still empty; using acoustic + text heuristics');
      return enrichExtractionOutput(
        heuristicExtractionFromAudio(transcript, acousticFeatures, recentEntries, journalPrompt),
        transcript,
        acousticFeatures,
        recentEntries,
        journalPrompt
      );
    }

    return enrichExtractionOutput(
      normalizeEntryExtraction(parsed),
      transcript,
      acousticFeatures,
      recentEntries,
      journalPrompt
    );
  } catch (err) {
    console.error('[Gemini] Extraction error:', err);
    return enrichExtractionOutput(
      heuristicExtractionFromAudio(transcript, acousticFeatures, recentEntries, journalPrompt),
      transcript,
      acousticFeatures,
      recentEntries,
      journalPrompt
    );
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
    const ctx = e.emotion_context_notes
      ? ` context: ${String(e.emotion_context_notes).slice(0, 120)}`
      : '';
    return `Day ${i + 1}: [${e.sentiment_label ?? 'unknown'} ${e.sentiment_score ?? ''}]${tone}${ctx} keywords: [${kw}] ${e.summary || e.transcript?.slice(0, 200)}`;
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
    const response = await fetchGenerateContentWithRetry(restExtractUrl(), body, 'Gemini weekly');

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
