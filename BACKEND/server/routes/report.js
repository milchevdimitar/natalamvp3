const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const puppeteer = require('puppeteer');
const User = require('../models/User');
const { getReport, reportSnapshot } = require('./reportContent');

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

function pageHtml({ title, number, subtitle, paragraphs }) {
  return `<section class="chapter">
    <header><span class="brand">Natala</span><span class="stars" aria-hidden="true">✧ · ✦ · ✧</span></header>
    <div class="orbit" aria-hidden="true">✦</div>
    <div class="chapter-label">${number ? 'Chapter ' + String(number).padStart(2, '0') + ' / 12' : 'Your personal cosmic report'}</div>
    <h1>${escapeHtml(title)}</h1>
    <p class="subtitle">${escapeHtml(subtitle)}</p>
    <div class="rule"></div>
    <div class="reading">${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</div>
    <footer>Natala · A reading for reflection</footer>
  </section>`;
}

async function summaryPage(user, extras) {
  const { systems } = await reportSnapshot(user, extras);
  const details = [
    ['Astrology', systems.astrology?.sunSign],
    ['16 Archetypes', systems.archetypes?.type],
    ['Numerology', systems.numerology?.lifePathNumber],
    ['Cardology', systems.cardology?.name || systems.cardology?.birthCard],
    ['BaZi', systems.bazi?.dayMaster],
    ['Chinese Zodiac', systems.chineseZodiac?.animal],
    ['Ayurveda', systems.ayurveda?.dominantDosha],
    ['Tarot', systems.tarot?.result],
  ].filter(([, value]) => value);
  return {
    title: 'Your Natala Profile', number: 0, subtitle: user.name || 'Profile summary',
    paragraphs: [
      'This summary shows your saved profile results. The AI reading is currently unavailable.',
      ...details.map(([label, value]) => label + ' · ' + value),
    ],
  };
}

function buildReportHtml(pages) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Natala Profile Report</title>
  <style>
    @page { size: A5; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    body { background: #0b1230; color: #f5f3ff; font: 14.5px/1.5 Arial, sans-serif; }
    .chapter { min-height: 209mm; break-after: page; padding: 12mm 13mm 10mm; background: radial-gradient(ellipse at 80% 12%, #312854 0%, transparent 52%), linear-gradient(155deg, #111d49, #0b1230 63%); }
    .chapter:last-child { break-after: auto; }
    header { display: flex; justify-content: space-between; align-items: center; }
    .brand { font: italic 33px Georgia, serif; }
    .stars, .orbit { color: #e8cc9d; }
    .orbit { margin: 13px 0 12px; width: 54px; height: 54px; border: 1px solid #9585b4; border-radius: 50%; text-align: center; line-height: 51px; font-size: 25px; }
    .chapter-label { font-size: 10px; letter-spacing: 1.7px; text-transform: uppercase; color: #dbbf94; }
    h1 { margin: 7px 0 6px; font: 29px/1.10 Georgia, serif; }
    .subtitle { color: #d7cdf7; margin: 0; line-height: 1.35; }
    .rule { height: 1px; background: #58608d; margin: 16px 0; }
    .reading { overflow-wrap: anywhere; }
    .reading p { margin: 0 0 12px; white-space: pre-line; orphans: 2; widows: 2; }
    footer { font-size: 10px; color: #bfc5e1; padding-top: 8px; }
  </style></head><body>${pages.map(pageHtml).join('')}</body></html>`;
}

router.post('/api/users/:id/report/reading', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.sendStatus(404);
    res.set('Cache-Control', 'no-store').json(await getReport(user, req.body));
  } catch (error) {
    const status = [422, 503].includes(error?.status) ? error.status : 500;
    res.status(status).json({ error: status === 500 ? 'Could not load your report.' : error.message });
  }
});

router.post('/api/users/:id/report/pdf', async (req, res) => {
  let browser;
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.sendStatus(404);
    const report = await getReport(user, req.body).catch(() => null);
    const pages = report?.pages ?? [await summaryPage(user, req.body)];
    const executablePath = resolveBrowserPath();
    browser = await puppeteer.launch({
      ...(executablePath ? { executablePath } : {}),
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setContent(buildReportHtml(pages), { waitUntil: 'load' });
    const pdf = Buffer.from(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
    res.set({
      'Cache-Control': 'no-store',
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Natala-Profile-Report.pdf"',
    }).send(pdf);
  } catch (error) {
    console.error('PDF rendering failed:', error?.name);
    res.status(500).json({ error: 'Could not generate your PDF report.' });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

module.exports = router;
