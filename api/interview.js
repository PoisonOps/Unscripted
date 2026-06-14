// ─── Vercel Serverless Function: AI Interview API ─────────────────────────────
// Tries Gemini 2.0 Flash first, falls back to Groq llama-3.3-70b

export default async function handler(req, res) {
  // CORS headers (allow requests from any origin during development)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, systemPrompt } = req.body || {};

  if (!messages || !systemPrompt) {
    return res.status(400).json({ error: 'Missing required fields: messages and systemPrompt' });
  }

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages must be an array' });
  }

  // ── Provider 1: Gemini 2.0 Flash ─────────────────────────────────────────
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiBody = {
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content || '' }]
        })),
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 350,
          topP: 0.9,
          stopSequences: [],
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ]
      };

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
          signal: AbortSignal.timeout(12000),
        }
      );

      if (!geminiRes.ok) {
        const errBody = await geminiRes.text();
        throw new Error(`Gemini ${geminiRes.status}: ${errBody.slice(0, 200)}`);
      }

      const geminiData = await geminiRes.json();
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        const reason = geminiData.candidates?.[0]?.finishReason;
        throw new Error(`No text in Gemini response. Finish reason: ${reason}`);
      }

      return res.status(200).json({ response: text.trim(), provider: 'gemini' });
    } catch (e) {
      console.warn('[API] Gemini failed:', e.message);
    }
  }

  // ── Provider 2: Groq (llama-3.3-70b-versatile) ───────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      const groqBody = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content || '' }))
        ],
        temperature: 0.85,
        max_tokens: 350,
        top_p: 0.9,
        stream: false,
      };

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify(groqBody),
        signal: AbortSignal.timeout(12000),
      });

      if (!groqRes.ok) {
        const errBody = await groqRes.text();
        throw new Error(`Groq ${groqRes.status}: ${errBody.slice(0, 200)}`);
      }

      const groqData = await groqRes.json();
      const text = groqData.choices?.[0]?.message?.content;

      if (!text) throw new Error('No text in Groq response');

      return res.status(200).json({ response: text.trim(), provider: 'groq' });
    } catch (e) {
      console.error('[API] Groq failed:', e.message);
    }
  }

  // ── Both providers failed ─────────────────────────────────────────────────
  console.error('[API] All AI providers failed or no API keys configured');
  return res.status(503).json({
    error: 'AI service temporarily unavailable. Please try again in a moment.',
    providers_attempted: [
      process.env.GEMINI_API_KEY ? 'gemini' : null,
      process.env.GROQ_API_KEY   ? 'groq'   : null,
    ].filter(Boolean)
  });
}
