/**
 * Gemini Live API Integration
 *
 * Handles real-time audio transcription and post-recording
 * analysis (entity extraction, sentiment, topics, etc.)
 *
 * Live API docs: https://ai.google.dev/gemini-api/docs/live
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const LIVE_API_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeModel`;

/**
 * Connect to Gemini Live API via WebSocket
 * Returns controller object for sending audio chunks and receiving transcriptions
 */
export function connectLiveAPI({ onTranscript, onError, onClose }) {
  const ws = new WebSocket(
    `${LIVE_API_URL}?key=${GEMINI_API_KEY}`
  );

  let isConnected = false;

  ws.onopen = () => {
    isConnected = true;

    // Send setup message
    ws.send(JSON.stringify({
      setup: {
        model: 'models/gemini-2.0-flash-live-001',
        generationConfig: {
          responseModalities: ['TEXT'],
        },
        systemInstruction: {
          parts: [{
            text: `You are a transcription assistant. Transcribe the audio exactly as spoken. 
            Do not add commentary. Output only the transcribed text.`
          }]
        }
      }
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Handle setup complete
      if (data.setupComplete) {
        console.log('[Gemini Live] Setup complete');
        return;
      }

      // Handle server content (transcription)
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
    onClose?.();
  };

  return {
    /**
     * Send audio chunk as base64 PCM data
     * @param {string} base64Audio - Base64 encoded audio data
     */
    sendAudio(base64Audio) {
      if (!isConnected || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [{
            mimeType: 'audio/pcm;rate=16000',
            data: base64Audio,
          }]
        }
      }));
    },

    /** Signal end of audio input */
    endAudio() {
      if (!isConnected || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({
        clientContent: { turnComplete: true }
      }));
    },

    /** Close WebSocket connection */
    disconnect() {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    },

    get connected() {
      return isConnected;
    }
  };
}

/**
 * Run Gemini extraction pass on a completed transcript
 * Extracts: sentiment, entities, topics, unresolved threads, summary
 */
export async function extractInsights(transcript, acousticFeatures = {}) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Analyze this journal entry transcript. Return ONLY a JSON object with no markdown formatting.

Transcript: "${transcript}"

Acoustic signals:
- Energy level: ${acousticFeatures.energy ?? 'unknown'}
- Speaking rate: ${acousticFeatures.speakingRate ?? 'unknown'} wpm
- Pause ratio: ${acousticFeatures.pauseRatio ?? 'unknown'}
- Pitch variance: ${acousticFeatures.pitchVariance ?? 'unknown'}

Return this exact JSON structure:
{
  "sentiment_score": <float from -1.0 to 1.0>,
  "sentiment_label": "<positive|neutral|negative>",
  "entities": ["<person/place/thing mentioned>"],
  "topics": ["<theme or subject>"],
  "unresolved_threads": ["<things mentioned with emotional weight but not resolved>"],
  "summary": "<one sentence summary of the entry>"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
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
 */
export async function generateWeeklySummary(entries) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const entrySummaries = entries.map((e, i) =>
    `Day ${i + 1}: [sentiment: ${e.sentiment_score}] ${e.summary || e.transcript.slice(0, 200)}`
  ).join('\n');

  const prompt = `Summarize this week of journal entries. Be warm but direct. No platitudes.

${entrySummaries}

Return ONLY a JSON object:
{
  "summary": "<2-3 sentence narrative of the week>",
  "emotional_arc": "<brief description of emotional trajectory>",
  "top_topics": ["<top 3 recurring themes>"],
  "avg_sentiment": <float average>
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('[Gemini] Weekly summary error:', err);
    return null;
  }
}
