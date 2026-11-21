import * as Astronomy from 'astronomy-engine';
import {
  ASPECT_DEFINITIONS,
  DEFAULT_LAT,
  DEFAULT_LON,
  PLANET_BODIES,
} from './astrology.constants';
import {
  computeNatalChart,
  degToZodiac,
  extractUserBirthDateTime,
  getMeanLilithLongitude,
  getTrueNorthNodeLongitude,
} from './astrology.calculations';
import {
  BondAnalysisResult,
  BondProfileInput,
  LifeCycleItem,
  MoonPhaseInfo,
  NatalChartResults,
  SkyBodySnapshot,
  SynastryAspectItem,
  TimeTravelSnapshot,
  TransitAspectItem,
} from './astrology.types';

const AVG_SPEED_DEG_PER_DAY: Record<string, number> = {
  sun: 0.9856,
  moon: 13.1764,
  mercury: 1.2,
  venus: 1.15,
  mars: 0.524,
  jupiter: 0.0831,
  saturn: 0.0335,
  uranus: 0.0117,
  neptune: 0.006,
  pluto: 0.004,
  northNode: 0.053,
  southNode: 0.053,
  lilith: 0.111,
};

function shortestAngularDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function formatShortDate(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}.${m}.${y}`;
}

export function getSkyPositionsForDate(targetDate: Date): SkyBodySnapshot[] {
  const safeDate = Number.isNaN(targetDate.getTime()) ? new Date() : targetDate;
  const plus1h = new Date(safeDate.getTime() + 3600 * 1000);

  const tracked = PLANET_BODIES.filter((b) =>
    [
      'sun',
      'moon',
      'mercury',
      'venus',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto',
      'northNode',
      'southNode',
      'lilith',
    ].includes(b.key)
  );

  return tracked.map((cfg) => {
    let lon = 0;
    let isRetro = false;

    if (cfg.specialType === 'north_node' || cfg.specialType === 'south_node') {
      const north = getTrueNorthNodeLongitude(safeDate);
      lon = cfg.specialType === 'south_node' ? (north + 180) % 360 : north;
      isRetro = true;
    } else if (cfg.specialType === 'lilith') {
      lon = getMeanLilithLongitude(safeDate);
    } else if (cfg.body) {
      const geo1 = Astronomy.GeoVector(cfg.body, safeDate, true);
      lon = ((Astronomy.Ecliptic(geo1).elon % 360) + 360) % 360;

      if (cfg.key !== 'sun' && cfg.key !== 'moon') {
        const geo2 = Astronomy.GeoVector(cfg.body, plus1h, true);
        const lon2 = ((Astronomy.Ecliptic(geo2).elon % 360) + 360) % 360;
        const diff = ((lon2 - lon + 540) % 360) - 180;
        isRetro = diff < 0;
      }
    }

    const z = degToZodiac(lon);
    return {
      key: cfg.key,
      name: cfg.name,
      symbol: cfg.symbol,
      deg: Math.round(lon * 1000) / 1000,
      sign: z.sign,
      signSymbol: z.symbol,
      degFormatted: z.degFormatted,
      isRetrograde: isRetro,
    };
  });
}

export function getMoonPhaseInfo(targetDate: Date): MoonPhaseInfo {
  const sky = getSkyPositionsForDate(targetDate);
  const sun = sky.find((b) => b.key === 'sun');
  const moon = sky.find((b) => b.key === 'moon');

  const sunLon = sun?.deg ?? 0;
  const moonLon = moon?.deg ?? 0;
  const phaseAngle = (moonLon - sunLon + 360) % 360;
  const illumination = Math.round(((1 - Math.cos((phaseAngle * Math.PI) / 180)) / 2) * 100);

  let name = 'New Moon';
  let symbol = '🌑';
  let guidance = 'Set clear intentions, embrace stillness, and plant seeds for a new personal cycle.';

  if (phaseAngle < 22.5 || phaseAngle >= 337.5) {
    name = 'New Moon';
    symbol = '🌑';
    guidance = 'A time for new beginnings, inward alignment, and setting clear intentions.';
  } else if (phaseAngle < 67.5) {
    name = 'Waxing Crescent';
    symbol = '🌒';
    guidance = 'Take initial concrete steps. Gather momentum and test your ideas in motion.';
  } else if (phaseAngle < 112.5) {
    name = 'First Quarter';
    symbol = '🌓';
    guidance = 'A turning point for decisive action and overcoming initial resistance.';
  } else if (phaseAngle < 157.5) {
    name = 'Waxing Gibbous';
    symbol = '🌔';
    guidance = 'Refine the details and prepare before the upcoming culmination.';
  } else if (phaseAngle < 202.5) {
    name = 'Full Moon';
    symbol = '🌕';
    guidance = 'Emotional culmination, heightened clarity, and illumination in relationships.';
  } else if (phaseAngle < 247.5) {
    name = 'Waning Gibbous';
    symbol = '🌖';
    guidance = 'Share insights gained, practice gratitude, and integrate recent lessons.';
  } else if (phaseAngle < 292.5) {
    name = 'Last Quarter';
    symbol = '🌗';
    guidance = 'Release outdated habits, strengthen boundaries, and re-evaluate priorities.';
  } else {
    name = 'Waning Crescent';
    symbol = '🌘';
    guidance = 'Rest, dreamwork, and intuitive clearing before the next New Moon.';
  }

  return {
    name,
    symbol,
    illumination,
    sign: moon?.sign || 'Aries',
    signSymbol: moon?.signSymbol || '♈',
    guidance,
  };
}

function describeTransitInfluence(
  tName: string,
  aspectType: string,
  nName: string,
  nHouse: number,
  harmony: string
): { title: string; summary: string; guidance: string } {
  const houseThemes: Record<number, string> = {
    1: 'personal identity and direction',
    2: 'self-worth, resources, and stability',
    3: 'communication, mindset, and daily exchanges',
    4: 'home, roots, and emotional foundations',
    5: 'creativity, romance, and authentic self-expression',
    6: 'daily rhythm, wellbeing, and habits',
    7: 'partnerships and relational dynamics',
    8: 'deep transformation, intimacy, and trust',
    9: 'worldview, higher learning, and expansion',
    10: 'career, vocation, and public role',
    11: 'friendships, communities, and future vision',
    12: 'the subconscious, intuition, and inner release',
  };

  const area = houseThemes[nHouse] || 'a core life area';
  const title = `${tName} ${aspectType} Natal ${nName}`;

  if (harmony === 'harmonious') {
    return {
      title,
      summary: `Transiting ${tName} supports your natal ${nName} in House ${nHouse} (${area}), opening a natural flow of clarity and alignment.`,
      guidance: `Use this window for initiatives, conversations, and decisions centered on ${area}.`,
    };
  }

  if (harmony === 'challenging') {
    return {
      title,
      summary: `Transiting ${tName} creates productive friction with your natal ${nName} in House ${nHouse} (${area}), surfacing unconscious patterns.`,
      guidance: `Respond consciously rather than impulsively—this tension is a catalyst for a breakthrough in ${area}.`,
    };
  }

  return {
    title,
    summary: `Transiting ${tName} merges with your natal ${nName} in House ${nHouse} (${area}), placing strong focus on this domain.`,
    guidance: `Observe what is initiating in ${area}—you are laying the groundwork for a fresh cycle.`,
  };
}

export function calculateTransitsForDate(
  natalChart: NatalChartResults,
  targetDate: Date = new Date()
): TransitAspectItem[] {
  const sky = getSkyPositionsForDate(targetDate);
  const skyPlus6h = getSkyPositionsForDate(new Date(targetDate.getTime() + 6 * 3600 * 1000));

  const natalTargets: Array<{
    key: string;
    name: string;
    symbol: string;
    deg: number;
    sign: string;
    house: number;
  }> = [
    ...natalChart.planetPositions.slice(0, 10).map((p) => ({
      key: p.key,
      name: p.name,
      symbol: p.symbol,
      deg: p.deg,
      sign: p.sign,
      house: p.house,
    })),
    {
      key: 'asc',
      name: 'Ascendant',
      symbol: 'ASC',
      deg: natalChart.asc,
      sign: natalChart.angles.asc.sign,
      house: 1,
    },
    {
      key: 'mc',
      name: 'Midheaven',
      symbol: 'MC',
      deg: natalChart.mc,
      sign: natalChart.angles.mc.sign,
      house: 10,
    },
  ];

  const majorAspectDefs = ASPECT_DEFINITIONS.filter((a) =>
    ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile'].includes(a.type)
  );

  const items: TransitAspectItem[] = [];

  for (const tBody of sky) {
    const tNext = skyPlus6h.find((s) => s.key === tBody.key);
    const isOuter = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode', 'southNode', 'lilith'].includes(
      tBody.key
    );
    const isFast = ['sun', 'moon', 'mercury', 'venus', 'mars'].includes(tBody.key);

    for (const nTarget of natalTargets) {
      const actualAngle = shortestAngularDiff(tBody.deg, nTarget.deg);

      for (const def of majorAspectDefs) {
        const maxOrb = isOuter ? 3.5 : tBody.key === 'moon' ? 2.5 : 3.0;
        const orb = Math.abs(actualAngle - def.angle);

        if (orb <= maxOrb) {
          const nextAngle = tNext ? shortestAngularDiff(tNext.deg, nTarget.deg) : actualAngle;
          const nextOrb = Math.abs(nextAngle - def.angle);
          const isApplying = nextOrb <= orb;

          const speed = AVG_SPEED_DEG_PER_DAY[tBody.key] || 0.5;
          const daysToPeak = Math.max(0.2, orb / speed);
          const halfWindowDays = Math.max(0.5, maxOrb / speed);

          const peakMs = isApplying
            ? targetDate.getTime() + daysToPeak * 86400000
            : targetDate.getTime() - daysToPeak * 86400000;
          const startMs = peakMs - halfWindowDays * 86400000;
          const endMs = peakMs + halfWindowDays * 86400000;

          const totalSpan = Math.max(1, endMs - startMs);
          const progress = Math.max(
            0.05,
            Math.min(0.98, (targetDate.getTime() - startMs) / totalSpan)
          );
          const intensity = Math.max(15, Math.min(100, Math.round((1 - orb / maxOrb) * 100)));

          const desc = describeTransitInfluence(
            tBody.name,
            def.type,
            nTarget.name,
            nTarget.house,
            def.harmony
          );

          items.push({
            id: `tr_${tBody.key}_${def.type.toLowerCase()}_${nTarget.key}_${formatShortDate(
              targetDate
            )}`,
            transitPlanet: tBody.name,
            transitKey: tBody.key,
            transitSymbol: tBody.symbol,
            transitSign: tBody.sign,
            aspectType: def.type,
            aspectSymbol: def.symbol,
            natalPlanet: nTarget.name,
            natalKey: nTarget.key,
            natalSymbol: nTarget.symbol,
            natalSign: nTarget.sign,
            natalHouse: nTarget.house,
            orb: Math.round(orb * 100) / 100,
            maxOrb,
            isApplying,
            intensity,
            progress: Math.round(progress * 100) / 100,
            harmony: def.harmony,
            timeframeLabel: isOuter
              ? 'Deep Outer Cycle'
              : isFast
              ? 'Short-term'
              : 'Medium Cycle',
            startDateStr: formatShortDate(new Date(startMs)),
            peakDateStr: formatShortDate(new Date(peakMs)),
            endDateStr: formatShortDate(new Date(endMs)),
            title: desc.title,
            summary: desc.summary,
            guidance: desc.guidance,
          });
          break;
        }
      }
    }
  }

  return items.sort((a, b) => b.intensity - a.intensity);
}

export function calculateLifeCycles(
  natalChart: NatalChartResults,
  targetDate: Date
): LifeCycleItem[] {
  const birthMs = new Date(natalChart.birthDateTimeUtc).getTime();
  const ageYears = Math.max(0, (targetDate.getTime() - birthMs) / (365.2425 * 86400000));

  const cycles: Array<{
    id: string;
    title: string;
    subtitle: string;
    startAge: number;
    endAge: number;
    description: string;
  }> = [
    {
      id: 'first_saturn_square',
      title: 'First Saturn Square (Awareness of Boundaries)',
      subtitle: 'Early autonomy formation',
      startAge: 6.5,
      endAge: 8.5,
      description: 'First encounter with external rules and developing personal accountability.',
    },
    {
      id: 'nodal_return_1',
      title: 'First Lunar Nodal Return',
      subtitle: 'Life direction compass',
      startAge: 18.0,
      endAge: 19.5,
      description: 'A threshold of maturation and choosing an independent path beyond family conditioning.',
    },
    {
      id: 'jupiter_return_2',
      title: 'Second Jupiter Return',
      subtitle: 'Expansion, vision & new horizons',
      startAge: 23.0,
      endAge: 24.5,
      description: 'A cycle of bold exploration, study, travel, and social expansion.',
    },
    {
      id: 'saturn_return_1',
      title: 'First Saturn Return (True Adulthood)',
      subtitle: 'Rebuilding life foundations',
      startAge: 28.0,
      endAge: 30.8,
      description:
        'Saturn returns to its natal degree. Everything unauthentic falls away so you can build lasting structures, boundaries, and purpose.',
    },
    {
      id: 'nodal_return_2',
      title: 'Second Lunar Nodal Return',
      subtitle: 'Realignment with the North Node',
      startAge: 36.5,
      endAge: 38.2,
      description: 'Deep reassessment of life priorities and pivotal encounters.',
    },
    {
      id: 'uranus_opposition',
      title: 'Uranus Opposition (Awakening Authenticity)',
      subtitle: 'Releasing outdated roles',
      startAge: 40.5,
      endAge: 43.5,
      description: 'A powerful urge for freedom, creative renewal, and living your truth.',
    },
    {
      id: 'saturn_return_2',
      title: 'Second Saturn Return',
      subtitle: 'Wisdom & legacy',
      startAge: 57.5,
      endAge: 60.5,
      description: 'Harvesting life experience and focusing on meaningful legacy and relationships.',
    },
  ];

  return cycles.map((c) => {
    let status: 'active' | 'upcoming' | 'completed' = 'upcoming';
    let progress = 0;

    if (ageYears >= c.endAge) {
      status = 'completed';
      progress = 100;
    } else if (ageYears >= c.startAge) {
      status = 'active';
      progress = Math.round(((ageYears - c.startAge) / (c.endAge - c.startAge)) * 100);
    } else {
      status = 'upcoming';
      progress = 0;
    }

    return {
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      ageRange: `Age ${c.startAge.toFixed(0)}–${c.endAge.toFixed(0)}`,
      status,
      progress,
      description: c.description,
    };
  });
}

export function buildTimeTravelSnapshot(
  natalChart: NatalChartResults,
  targetDate: Date
): TimeTravelSnapshot {
  const skyPositions = getSkyPositionsForDate(targetDate);
  const activeTransits = calculateTransitsForDate(natalChart, targetDate);
  const lifeCycles = calculateLifeCycles(natalChart, targetDate);
  const topTransit = activeTransits[0];
  const dateStr = formatShortDate(targetDate);

  const periodInsight = topTransit
    ? {
        title: `Key Focus for ${dateStr}: ${topTransit.title}`,
        theme: topTransit.summary,
        advice: topTransit.guidance,
      }
    : {
        title: `Harmonious Integration Window (${dateStr})`,
        theme:
          'No heavy exact transit friction—an ideal window for steady rhythm and consolidating recent progress.',
        advice: 'Focus on daily grounding habits and inner clarity.',
      };

  return {
    targetDate,
    dateStr,
    skyPositions,
    activeTransits,
    lifeCycles,
    periodInsight,
  };
}

export function analyzeBondCompatibility(
  userChart: NatalChartResults,
  userName: string,
  partner: BondProfileInput,
  targetDate: Date = new Date()
): BondAnalysisResult | null {
  const parsed = extractUserBirthDateTime({
    birthdate: partner.birthdate,
    birthTime: partner.birthTime,
    birthCity: partner.birthCity,
  });

  const dStr = parsed?.dStr || '15.06.1995';
  const tStr = parsed?.tStr || '12:00';
  const lat = parsed?.lat ?? partner.birthCity?.latitude ?? DEFAULT_LAT;
  const lon = parsed?.lon ?? partner.birthCity?.longitude ?? DEFAULT_LON;
  const hasTime = Boolean(partner.birthTime && parsed?.hasExactBirthTime);

  const partnerChart = computeNatalChart(dStr, tStr, lat, lon, undefined, hasTime);
  if (!partnerChart) return null;

  const coreKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'pluto'];
  const synastryAspects: SynastryAspectItem[] = [];

  for (const k1 of coreKeys) {
    const p1 = userChart.planetsByKey[k1];
    if (!p1) continue;

    for (const k2 of coreKeys) {
      const p2 = partnerChart.planetsByKey[k2];
      if (!p2) continue;

      const angle = shortestAngularDiff(p1.deg, p2.deg);
      for (const def of ASPECT_DEFINITIONS.slice(0, 5)) {
        const maxOrb = 6.0;
        const orb = Math.abs(angle - def.angle);
        if (orb <= maxOrb) {
          let domain: SynastryAspectItem['domain'] = 'psychological';
          if (['venus', 'mars'].includes(k1) || ['venus', 'mars'].includes(k2)) {
            domain = 'romantic';
          } else if (k1 === 'moon' || k2 === 'moon') {
            domain = 'emotional';
          } else if (k1 === 'mercury' || k2 === 'mercury') {
            domain = 'communication';
          } else if (['jupiter', 'saturn', 'pluto'].includes(k1)) {
            domain = 'growth';
          }

          const interpretation =
            def.harmony === 'harmonious'
              ? `${userName}'s ${p1.name} in ${def.type} with ${partner.name}'s ${p2.name} fosters natural support and effortless exchange.`
              : def.harmony === 'challenging'
              ? `${userName}'s ${p1.name} in ${def.type} with ${partner.name}'s ${p2.name} generates magnetic tension that rewards conscious dialogue.`
              : `${userName}'s ${p1.name} conjunct ${partner.name}'s ${p2.name} amplifies mutual mirroring and shared intensity.`;

          synastryAspects.push({
            id: `syn_${k1}_${def.type.toLowerCase()}_${k2}`,
            person1Body: p1.name,
            person1Symbol: p1.symbol,
            person2Body: p2.name,
            person2Symbol: p2.symbol,
            aspectType: def.type,
            aspectSymbol: def.symbol,
            orb: Math.round(orb * 100) / 100,
            harmony: def.harmony,
            domain,
            interpretation,
          });
          break;
        }
      }
    }
  }

  synastryAspects.sort((a, b) => a.orb - b.orb);

  const scoreByDomain = (dom: SynastryAspectItem['domain'], base: number) => {
    const relevant = synastryAspects.filter((a) => a.domain === dom);
    if (relevant.length === 0) return base;
    let delta = 0;
    for (const r of relevant) {
      delta += r.harmony === 'harmonious' ? 7 : r.harmony === 'neutral' ? 5 : -3;
    }
    return Math.max(48, Math.min(98, Math.round(base + delta)));
  };

  const elemBonus =
    userChart.elements.dominantElement === partnerChart.elements.dominantElement ? 8 : 4;
  const romantic = scoreByDomain('romantic', 72 + elemBonus);
  const emotional = scoreByDomain('emotional', 70 + elemBonus);
  const psychological = scoreByDomain('psychological', 74 + elemBonus);
  const communication = scoreByDomain('communication', 71 + elemBonus);
  const overall = Math.round((romantic + emotional + psychological + communication) / 4);

  const strengths = synastryAspects
    .filter((a) => a.harmony !== 'challenging')
    .slice(0, 3)
    .map((a) => `${a.person1Body} ${a.aspectSymbol} ${a.person2Body}: ${a.interpretation}`);

  if (strengths.length === 0) {
    strengths.push(
      `Complementary elemental dynamic (${userChart.elements.dominantElement} and ${partnerChart.elements.dominantElement}) that stimulates mutual growth.`
    );
  }

  const conflicts = synastryAspects
    .filter((a) => a.harmony === 'challenging')
    .slice(0, 3)
    .map((a) => `${a.person1Body} ${a.aspectSymbol} ${a.person2Body}: ${a.interpretation}`);

  if (conflicts.length === 0) {
    conflicts.push('Minimal direct friction—remember to nurture individual autonomy alongside closeness.');
  }

  const userTransits = calculateTransitsForDate(userChart, targetDate);
  const partnerTransits = calculateTransitsForDate(partnerChart, targetDate);
  const bondTransits = [...userTransits.slice(0, 4), ...partnerTransits.slice(0, 4)].sort(
    (a, b) => b.intensity - a.intensity
  );

  const harmoniousTransits = bondTransits.filter((t) => t.harmony === 'harmonious');
  const challengingTransits = bondTransits.filter((t) => t.harmony === 'challenging');

  const romanticTimingScore = Math.max(
    45,
    Math.min(98, Math.round(70 + harmoniousTransits.length * 6 - challengingTransits.length * 4))
  );

  const phaseLabel =
    romanticTimingScore >= 80
      ? 'Phase of Deep Closeness & Alignment'
      : romanticTimingScore >= 65
      ? 'Phase of Constructive Dialogue & Shared Rhythm'
      : 'Phase of Recalibration & Boundary Awareness';

  return {
    partner,
    partnerChart,
    scores: {
      overall,
      romantic,
      emotional,
      psychological,
      communication,
    },
    strengths,
    conflicts,
    challenges: [
      `Balancing ${userName}'s ${userChart.modalities.dominantModality} pace with ${partner.name}'s ${partnerChart.modalities.dominantModality} approach.`,
      `Harmonizing emotional needs (${userChart.planetsByKey.moon?.sign} Moon vs. ${partnerChart.planetsByKey.moon?.sign} Moon).`,
    ],
    sharedThemes: [
      `Evolutionary axis: North Nodes in ${userChart.planetsByKey.northNode?.sign} and ${partnerChart.planetsByKey.northNode?.sign}.`,
      `Elemental exchange between ${userChart.elements.dominantElement} and ${partnerChart.elements.dominantElement}.`,
    ],
    mutualInfluence: `${userName} brings ${userChart.planetsByKey.sun?.sign} (${userChart.elements.dominantElement}) vitality, while ${partner.name} activates ${partnerChart.planetsByKey.sun?.sign} (${partnerChart.elements.dominantElement}) qualities.`,
    repeatingPatterns: [
      `Whenever the ${userChart.planetsByKey.venus?.sign}/${partnerChart.planetsByKey.mars?.sign} axis is triggered, the bond cycles through heightened attraction followed by a need for clear agreements.`,
    ],
    personalizedSummary: `The bond between ${userName} (${userChart.planetsByKey.sun?.sign} ☉ / ${userChart.planetsByKey.moon?.sign} ☾) and ${partner.name} (${partnerChart.planetsByKey.sun?.sign} ☉ / ${partnerChart.planetsByKey.moon?.sign} ☾) carries ${overall}% overall resonance centered on emotional honesty and mutual evolution.`,
    synastryAspects: synastryAspects.slice(0, 12),
    bondTransits: bondTransits.slice(0, 6),
    romanticTiming: {
      score: romanticTimingScore,
      phaseLabel,
      closenessWindows:
        harmoniousTransits.length > 0
          ? harmoniousTransits
              .slice(0, 2)
              .map((t) => `${t.startDateStr} – ${t.endDateStr} (${t.title})`)
          : [`Next 7 days around ${formatShortDate(targetDate)} (Harmonious Lunar Window)`],
      tensionWindows:
        challengingTransits.length > 0
          ? challengingTransits.slice(0, 2).map((t) => `Peak on ${t.peakDateStr}: ${t.title}`)
          : ['No critical tension peaks for the selected date'],
      dynamicShift:
        bondTransits[0]?.summary ||
        'The dynamic between both charts is steady and supportive for shared plans.',
    },
  };
}
