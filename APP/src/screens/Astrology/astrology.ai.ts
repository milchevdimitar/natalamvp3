import * as Api from '../../services/api';
import {
  BondAnalysisResult,
  NatalChartResults,
  TransitAspectItem,
} from './astrology.types';

export type AstrologyAIMode =
  | 'chart_synthesis'
  | 'transit_guidance'
  | 'bond_synastry'
  | 'astro_coach';

function resolveApiBaseUrl(): string {
  const apiAny = Api as Record<string, any>;
  return (
    process.env.EXPO_PUBLIC_API_URL ||
    apiAny.API_URL ||
    apiAny.BASE_URL ||
    'http://localhost:5000'
  ).replace(/\/$/, '');
}

function summarizeChart(chart: NatalChartResults) {
  return {
    sun: `${chart.planetsByKey.sun?.sign} (House ${chart.planetsByKey.sun?.house})`,
    moon: `${chart.planetsByKey.moon?.sign} (House ${chart.planetsByKey.moon?.house})`,
    asc: chart.angles.asc.sign,
    mc: chart.angles.mc.sign,
    venus: `${chart.planetsByKey.venus?.sign} (House ${chart.planetsByKey.venus?.house})`,
    mars: `${chart.planetsByKey.mars?.sign} (House ${chart.planetsByKey.mars?.house})`,
    saturn: `${chart.planetsByKey.saturn?.sign} (House ${chart.planetsByKey.saturn?.house})`,
    northNode: `${chart.planetsByKey.northNode?.sign} (House ${chart.planetsByKey.northNode?.house})`,
    dominantElement: chart.elements.dominantElement,
    dominantModality: chart.modalities.dominantModality,
    chartRuler: `${chart.chartRuler.modernRuler} in ${chart.chartRuler.rulerSign} (House ${chart.chartRuler.rulerHouse})`,
    topAspects: chart.aspects
      .slice(0, 4)
      .map((a) => `${a.body1} ${a.aspectType} ${a.body2}`),
  };
}

function localClientFallback(mode: AstrologyAIMode, payload: Record<string, any>): string {
  const c = payload.chartSummary || {};
  if (mode === 'transit_guidance') {
    return `For ${payload.dateStr || 'today'}, ${
      payload.topTransit || 'the current sky'
    } highlights your ${c.sun || ''} and ${
      c.moon || ''
    }. Move intentionally, prioritize clarity over urgency, and use this window to align your daily habits with your long-term goals.`;
  }
  if (mode === 'bond_synastry') {
    return `Your ${c.sun || ''} and ${c.moon || ''} interact with ${
      payload.partnerName || 'your partner'
    } at ${
      payload.overallScore || 75
    }% overall compatibility. Lean into your shared emotional strengths while giving space for different communication rhythms.`;
  }
  if (mode === 'astro_coach') {
    return `Reflecting on "${payload.question || 'your path'}": with ${c.asc || ''} Rising and ${
      c.chartRuler || ''
    }, your next step comes from trusting your ${
      c.dominantElement || 'core'
    } intuition while setting clear, practical boundaries.`;
  }
  return `Your ${c.sun || ''}, ${c.moon || ''}, and ${
    c.asc || ''
  } Rising create a balanced interplay between purpose and emotional depth, guided by ${
    c.chartRuler || 'your chart ruler'
  }.`;
}

export async function requestAstrologyAI(
  mode: AstrologyAIMode,
  chart: NatalChartResults,
  extra: {
    dateStr?: string;
    transits?: TransitAspectItem[];
    bond?: BondAnalysisResult;
    question?: string;
    history?: Array<{ sender: 'guide' | 'user'; text: string }>;
  } = {}
): Promise<{ text: string; source: string }> {
  const chartSummary = summarizeChart(chart);

  const payload: Record<string, any> = { chartSummary };

  if (extra.dateStr) payload.dateStr = extra.dateStr;
  if (extra.transits && extra.transits.length > 0) {
    payload.topTransit = `${extra.transits[0].title} (${extra.transits[0].intensity}% intensity, peak ${extra.transits[0].peakDateStr})`;
    payload.activeTransits = extra.transits.slice(0, 4).map((t) => t.title);
  }
  if (extra.bond) {
    payload.partnerName = extra.bond.partner.name;
    payload.relationshipType = extra.bond.partner.relationshipType;
    payload.overallScore = extra.bond.scores.overall;
    payload.partnerSun = extra.bond.partnerChart.planetsByKey.sun?.sign;
    payload.partnerMoon = extra.bond.partnerChart.planetsByKey.moon?.sign;
    payload.topSynastry = extra.bond.synastryAspects
      .slice(0, 3)
      .map((s) => `${s.person1Body} ${s.aspectType} ${s.person2Body}`);
  }
  if (extra.question) payload.question = extra.question;
  if (extra.history) payload.recentHistory = extra.history.slice(-4);

  try {
    const baseUrl = resolveApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/ai/astrology`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, payload }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.text) {
        return { text: data.text, source: data.source || 'ai' };
      }
    }
  } catch {
    // Fallback when offline
  }

  return {
    text: localClientFallback(mode, payload),
    source: 'offline-synthesis',
  };
}