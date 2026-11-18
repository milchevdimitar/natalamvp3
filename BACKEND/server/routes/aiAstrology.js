const express = require('express');
const router = express.Router();

function buildLocalFallbackResponse(mode, payload) {
  const chart = payload?.chartSummary || {};
  const sun = chart.sun || 'Aries';
  const moon = chart.moon || 'Cancer';
  const asc = chart.asc || 'Leo';
  const element = chart.dominantElement || 'Fire';

  if (mode === 'transit_guidance') {
    const top = payload?.topTransit || 'current lunar cycle';
    return `With your ${sun} Sun and ${moon} Moon, ${top} invites deliberate, grounded action rather than reactive decisions. Focus on one core priority today, honor your ${element} energy rhythm, and allow clarity to emerge before committing to major shifts.`;
  }

  if (mode === 'bond_synastry') {
    const partnerName = payload?.partnerName || 'your partner';
    const score = payload?.overallScore || 78;
    return `The connection between you (${sun} Sun / ${moon} Moon) and ${partnerName} holds a ${score}% resonance. Your strongest bridge lies in emotional honesty and shared growth, while friction points act as catalysts for clearer boundaries and mutual understanding.`;
  }

  if (mode === 'astro_coach') {
    const question = payload?.question || 'my current path';
    return `Looking at your ${sun} Sun, ${moon} Moon, and ${asc} Rising in light of "${question}": your ${element}-dominant chart thrives when your outer commitments match your inner emotional truth. Observe which area of life feels stagnant right now—that is where your next breakthrough is forming.`;
  }

  return `Your ${sun} Sun, ${moon} Moon, and ${asc} Rising form a distinct psychological signature anchored in ${element} energy. Your core strength lies in integrating conscious purpose with emotional intuition, turning internal tension into creative direction.`;
}

router.post('/', async (req, res) => {
  const { mode = 'chart_synthesis', payload = {} } = req.body || {};

  const systemPrompt =
    'You are an insightful, psychologically grounded modern astrologer inside the Natala app. Respond in clear, empathetic, concrete English (max 140 words). Avoid generic clichés and reference the exact placements provided.';

  const userPrompt = `Mode: ${mode}\nAstrological Context:\n${JSON.stringify(payload, null, 2)}`;

  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return res.json({ success: true, source: 'gemini', text });
        }
      }
    }

    if (openAiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 260,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          return res.json({ success: true, source: 'openai', text });
        }
      }
    }

    return res.json({
      success: true,
      source: 'local-synthesis',
      text: buildLocalFallbackResponse(mode, payload),
    });
  } catch (err) {
    return res.json({
      success: true,
      source: 'local-synthesis',
      text: buildLocalFallbackResponse(mode, payload),
    });
  }
});

module.exports = router;