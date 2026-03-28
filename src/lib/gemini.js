/**
 * Gemini Live API Integration
 *
 * Handles real-time audio transcription and post-recording
 * analysis (entity extraction, sentiment, topics, unresolved threads)
 *
 * Live API docs: https://ai.google.dev/gemini-api/docs/live
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ✅ Correct Live API WebSocket URL (v1alpha, not v1beta model path)
const LIVE_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

// ✅ REST endpoint for post-recording extraction
const REST_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Connect to Gemini Live API via WebSocket
 * Returns controller object for sending audio and receiving transcripts
 */
export function connectLiveAPI({ onTranscript, onError, onClose }) {
  const ws = new WebSocket(LIVE_WS_URL);
  let isConnected = false;
  let setupComplete = false;

  ws.onopen = () => {
    isConnected = true;

    // Send setup message — must be first message sent
    ws.send(JSON.stringify({
      setup: {
        model: 'models/gemini-2.0-flash-live-001',
        generation_config: {
          response_modalities: ['TEXT'],
        },
        system_instruction: {
          parts: [{
            text: 'You are a transcription assistant. Transcribe the audio exactly as spoken. Do not add commentary. Output only the transcribed text.'
          }]
        }
      }
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Server confirms setup is ready
      if (data.setupComplete !== undefined) {
        setupComplete = true;
        console.log('[Gemini Live] Ready');
        return;
      }

      // Incoming transcript chunks
      if (data.serverContent?.modelTurn?.parts) {
        const text = data.serverContent.modelTurn.parts
          .filter(p => p.text)
          .map(p => p.text)
          .join('');
        if (text) onTranscript?.(text);
      }

    } catch (err) {
      console.error('[Gemini Live] Parse error:', err);
    }
  };

  ws.onerror = (err) => {
    console.error('[Gemini Live] WebSocket error:', err);
    onError?.(err);
  };

  ws.onclose = () => {
    isConnected = false;
    setupComplete = false;
    onClose?.();
  };

  return {
    /**
     * Send a base64-encoded PCM16 audio chunk to Gemini Live
     * Called continuously while recording
     */
    sendAudio(base64Audio) {
      if (!setupComplete || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({
        realtime_input: {
          media_chunks: [{
            mime_type: 'audio/pcm;rate=16000',
            data: base64Audio,
          }]
        }
      }));
    },

    /** Signal end of audio — triggers final transcript flush */
    endAudio() {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({
        client_content: { turn_complete: true }
      }));
    },

    /** Close the WebSocket */
    disconnect() {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    },

    get connected() { return isConnected; },
    get ready() { return setupComplete; }
  };
}

/**
 * Run Gemini extraction pass on completed transcript
 * Uses plain REST fetch — no SDK needed, works in any Vite project
 * Extracts: sentiment, entities, topics, unresolved threads, summary
 */
export async function extractInsights(transcript, acousticFeatures = {}) {
  const prompt = `Analyze this journal entry transcript. Return ONLY a valid JSON object with no markdown formatting or backticks.

Transcript: "${transcript}"

Acoustic signals:
- Energy level: ${acousticFeatures.energy ?? 'unknown'}
- Speaking rate: ${acousticFeatures.speakingRate ?? 'unknown'} wpm
- Pause ratio: ${acousticFeatures.pauseRatio ?? 'unknown'}
- Pitch variance: ${acousticFeatures.pitchVariance ?? 'unknown'}

Return exactly this JSON structure:
{
  "sentiment_score": <float from -1.0 to 1.0>,
  "sentiment_label": "<positive|neutral|negative>",
  "entities": ["<person/place/thing mentioned>"],
  "topics": ["<theme or subject>"],
  "unresolved_threads": ["<things mentioned with emotional weight but not resolved>"],
  "summary": "<one sentence summary of the entry>"
}`;

  try {
    const response = await fetch(REST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    return JSON.parse(text.replace(/```json\n?|```/g, '').trim());

  } catch (err) {
    console.error('[Gemini] Extraction error:', err);
    return {
      sentiment_score: 0,
      sentiment_label: 'neutral',
      entities: [],
      topics: [],
      unresolved_threads: [],
      summary: 'Unable to analyze entry.',
    };
  }
}

/**
 * Generate weekly summary from multiple entries
 * Called from weeklySummary.js
 */
export async function generateWeeklySummary(entries) {
  const entrySummaries = entries.map((e, i) =>
    `Day ${i + 1}: [sentiment: ${e.sentiment_score}] ${e.summary || e.transcript?.slice(0, 200)}`
  ).join('\n');

  const prompt = `Summarize this week of journal entries. Be warm but direct. No platitudes.

${entrySummaries}

Return ONLY a valid JSON object:
{
  "summary": "<2-3 sentence narrative of the week>",
  "emotional_arc": "<brief description of emotional trajectory>",
  "top_topics": ["<top 3 recurring themes>"],
  "avg_sentiment": <float average>
}`;

  try {
    const response = await fetch(REST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    return JSON.parse(text.replace(/```json\n?|```/g, '').trim());

  } catch (err) {
    console.error('[Gemini] Weekly summary error:', err);
    return null;
  }
}
