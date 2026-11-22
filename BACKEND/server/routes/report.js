const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { GoogleGenAI, Type } = require('@google/genai');
const puppeteer = require('puppeteer');
const User = require('../models/User');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Извиква Gemini с автоматичен retry и превключване към резервен модел при 503 / 429
async function generateAnalysisWithFallback(ai, prompt, config) {
  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  let lastError;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });
      } catch (err) {
        lastError = err;
        const status = err?.status || err?.code;
        const isTransient =
          status === 503 ||
          status === 429 ||
          String(err?.message).includes('503') ||
          String(err?.message).includes('UNAVAILABLE');

        if (!isTransient) {
          throw err; // Ако грешката не е временно претоварване (напр. грешен API ключ), спираме веднага
        }

        console.warn(
          `⚠️ Моделът ${model} е временно претоварен (опит ${attempt}/2). Изчакване...`
        );
        await sleep(1500 * attempt);
      }
    }
  }

  throw lastError;
}

function resolveBrowserPath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates = [
    ...[process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA]
      .filter(Boolean)
      .flatMap((root) => [path.join(root, 'Google/Chrome/Application/chrome.exe'), path.join(root, 'Microsoft/Edge/Application/msedge.exe')]),
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function buildReportHtml(user, aiAnalysis) {
  const birthDateFormatted = user.birthdate
    ? new Date(user.birthdate).toLocaleDateString('bg-BG')
    : 'Непосочена';

  const tipsHtml = (aiAnalysis?.actionableTips || [])
    .map((tip) => `<li>${escapeHtml(tip)}</li>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="bg">
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          font-family: 'Inter', Arial, sans-serif;
          color: #1e1b4b;
          margin: 0;
          padding: 36px;
          line-height: 1.6;
          background: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%);
          color: #ffffff;
          padding: 28px;
          border-radius: 14px;
          margin-bottom: 24px;
        }
        .header h1 {
          margin: 0 0 6px 0;
          font-size: 25px;
        }
        .header p {
          margin: 0;
          opacity: 0.88;
          font-size: 13px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 26px;
        }
        .badge {
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          border-radius: 10px;
          padding: 12px;
        }
        .badge-label {
          font-size: 10px;
          text-transform: uppercase;
          color: #6d28d9;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .badge-val {
          font-size: 14px;
          font-weight: 600;
          margin-top: 4px;
        }
        .section {
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
        }
        .section h2 {
          font-size: 16px;
          color: #4338ca;
          margin: 0 0 8px 0;
        }
        .section p {
          margin: 0;
          font-size: 13.5px;
          color: #374151;
          white-space: pre-line;
        }
        .recommendations {
          background: #eef2ff;
          padding: 18px 22px;
          border-radius: 12px;
          border-left: 4px solid #4338ca;
          margin-top: 10px;
        }
        .recommendations strong {
          font-size: 15px;
          color: #1e1b4b;
        }
        .recommendations ul {
          margin: 10px 0 0 0;
          padding-left: 18px;
          font-size: 13.5px;
          color: #374151;
        }
        .recommendations li {
          margin-bottom: 6px;
        }
        .footer {
          margin-top: 28px;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Персонален Холистичен Профил</h1>
        <p>${escapeHtml(user.name || 'Потребител')} • Роден/а на ${escapeHtml(birthDateFormatted)} (${escapeHtml(user.birthTime || 'няма час')}) • ${escapeHtml(user.birthCity?.name || 'Непосочен град')}</p>
      </div>

      <div class="grid">
        <div class="badge">
          <div class="badge-label">Астрология</div>
          <div class="badge-val">☉ ${escapeHtml(user.natalChart?.sunSign || '-')} / ☽ ${escapeHtml(user.natalChart?.moonSign || '-')} / ASC ${escapeHtml(user.natalChart?.ascendant || '-')}</div>
        </div>
        <div class="badge">
          <div class="badge-label">MBTI & Нумерология</div>
          <div class="badge-val">${escapeHtml(user.mbti?.type || '-')} • Житейски път ${escapeHtml(user.numerology?.lifePathNumber || '-')}</div>
        </div>
        <div class="badge">
          <div class="badge-label">BaZi & Аюрведа</div>
          <div class="badge-val">${escapeHtml(user.bazi?.dayMaster || '-')} • Доша: ${escapeHtml((user.ayurveda?.dominantDosha || '-').toUpperCase())}</div>
        </div>
      </div>

      ${aiAnalysis ? `
      <div class="section">
        <h2>1. Общ психологически и енергиен портрет</h2>
        <p>${escapeHtml(aiAnalysis.executiveSummary)}</p>
      </div>

      <div class="section">
        <h2>2. Натална карта и MBTI динамика</h2>
        <p>${escapeHtml(aiAnalysis.astrologyAndMbti)}</p>
      </div>

      <div class="section">
        <h2>3. Китайска метафизика (BaZi) и Аюрведа баланс</h2>
        <p>${escapeHtml(aiAnalysis.baziAndAyurveda)}</p>
      </div>

      <div class="section">
        <h2>4. Нумерология и Кардология (${escapeHtml(user.cardology?.birthCard || '-')})</h2>
        <p>${escapeHtml(aiAnalysis.numerologyAndCardology)}</p>
      </div>

      <div class="recommendations">
        <strong>Ключови препоръки за развитие и баланс:</strong>
        <ul>${tipsHtml}</ul>
      </div>

      ` : `<div class="section"><h2>Profile summary</h2><p>Birth card: ${escapeHtml(user.cardology?.birthCard || "-")}</p><p>AI analysis is currently unavailable.</p></div>`}

      <div class="footer">
        ${aiAnalysis ? 'Personal AI analysis' : 'Profile summary'} | Natala App
      </div>
    </body>
    </html>
  `;
}

router.post('/api/users/:id/report/pdf', async (req, res) => {
  let browser;
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ error: 'Потребителят не е намерен.' });
    }

    const prompt = `
      Направи задълбочен, проницателен и добре структуриран персонален анализ на български език за следния човек,
      обединявайки западна астрология, MBTI, BaZi (Четирите стълба), Аюрведа, нумерология и кардология.
      Тонът да бъде топъл, психологически обоснован и практически насочен (без клишета).

      Данни за профила:
      - Име: ${user.name}
      - Дата и час на раждане: ${user.birthdate}, ${user.birthTime}
      - Град: ${user.birthCity?.name}, ${user.birthCity?.country}
      - Кръвна група: ${user.bloodGroup}
      - MBTI: ${JSON.stringify(user.mbti)}
      - Натална карта: ${JSON.stringify(user.natalChart)}
      - Кардология: ${JSON.stringify(user.cardology)}
      - Аюрведа: ${JSON.stringify(user.ayurveda)}
      - Нумерология: ${JSON.stringify(user.numerology)}
      - BaZi: ${JSON.stringify(user.bazi)}
      - Интереси: ${(user.interests || []).join(', ')}
      - Био: ${user.bio || ''}
    `;

    const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
    let aiAnalysis;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey, vertexai: false, apiVersion: 'v1beta' });
        const response = await generateAnalysisWithFallback(ai, prompt, {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              astrologyAndMbti: { type: Type.STRING },
              baziAndAyurveda: { type: Type.STRING },
              numerologyAndCardology: { type: Type.STRING },
              actionableTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'executiveSummary',
              'astrologyAndMbti',
              'baziAndAyurveda',
              'numerologyAndCardology',
              'actionableTips',
            ],
          },
        });
        aiAnalysis = JSON.parse(response.text);
      } catch (error) {
        console.warn('Gemini report analysis unavailable; generating the profile summary.', error?.status || error?.code || '');
      }
    }
    const html = buildReportHtml(user, aiAnalysis);

    const executablePath = resolveBrowserPath();
    browser = await puppeteer.launch({
      ...(executablePath ? { executablePath } : {}),
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setContent(html, { waitUntil: 'load' });

    const pdfBuffer = Buffer.from(await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
    }));
    const savedFileName = 'Natala-Profile-Report.pdf';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${savedFileName}"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Грешка при генериране на PDF доклад:', error);
    const statusCode = error?.status === 503 ? 503 : 500;
    return res.status(statusCode).json({
      error:
        statusCode === 503
          ? 'AI услугата е временно претоварена. Опитай отново след малко.'
          : 'Неуспешно генериране на PDF доклад.',
    });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

module.exports = router;