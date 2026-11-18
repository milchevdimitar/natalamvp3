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
  getHouseForPlanet,
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
    ].includes(b.key)
  );

  return tracked.map((cfg) => {
    let lon = 0;
    let isRetro = false;

    if (cfg.specialType === 'north_node') {
      lon = getTrueNorthNodeLongitude(safeDate);
      isRetro = true;
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
  let guidance = 'Засаждане на намерения, тишина и ясен фокус върху нов личен цикъл.';

  if (phaseAngle < 22.5 || phaseAngle >= 337.5) {
    name = 'New Moon';
    symbol = '🌑';
    guidance = 'Време за ново начало, вътрешна настройка и формулиране на ясни намерения.';
  } else if (phaseAngle < 67.5) {
    name = 'Waxing Crescent';
    symbol = '🌒';
    guidance = 'Първи конкретни стъпки. Събирай ресурси и тествай идеите си в действие.';
  } else if (phaseAngle < 112.5) {
    name = 'First Quarter';
    symbol = '🌓';
    guidance = 'Момент за смели решения и преодоляване на първото съпротивление.';
  } else if (phaseAngle < 157.5) {
    name = 'Waxing Gibbous';
    symbol = '🌔';
    guidance = 'Прецизиране на детайлите и подготовка преди кулминацията.';
  } else if (phaseAngle < 202.5) {
    name = 'Full Moon';
    symbol = '🌕';
    guidance = 'Емоционална кулминация, яснота и осветяване на скрити истини във връзките.';
  } else if (phaseAngle < 247.5) {
    name = 'Waning Gibbous';
    symbol = '🌖';
    guidance = 'Споделяне на наученото, благодарност и интегриране на опита.';
  } else if (phaseAngle < 292.5) {
    name = 'Last Quarter';
    symbol = '🌗';
    guidance = 'Освобождаване от остарели навици, граници и преоценка на приоритетите.';
  } else {
    name = 'Waning Crescent';
    symbol = '🌘';
    guidance = 'Почивка, сънища, интуитивно пречистване преди следващото новолуние.';
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
    1: 'личната идентичност и посока',
    2: 'самооценката, ресурсите и сигурността',
    3: 'комуникацията, мисленето и ежедневните контакти',
    4: 'дома, корените и вътрешната емоционална основа',
    5: 'творчеството, любовта и себеизразяването',
    6: 'ежедневния ритъм, здравето и навиците',
    7: 'партньорствата и огледалните отношения',
    8: 'дълбоката трансформация, интимността и доверието',
    9: 'мирогледа, обучението и разширяването на хоризонта',
    10: 'кариерата, призванието и обществената роля',
    11: 'приятелския кръг, общностите и визията за бъдещето',
    12: 'подсъзнанието, интуицията и вътрешното освобождаване',
  };

  const area = houseThemes[nHouse] || 'ключова житейска сфера';
  const title = `${tName} ${aspectType} Natal ${nName}`;

  if (harmony === 'harmonious') {
    return {
      title,
      summary: `Транзитният ${tName} подкрепя твоя натален ${nName} в Дом ${nHouse} (${area}), отваряйки естествен поток от яснота и синхрон.`,
      guidance: `Използвай този прозорец за инициативи, разговори и решения, свързани с ${area}.`,
    };
  }

  if (harmony === 'challenging') {
    return {
      title,
      summary: `Транзитният ${tName} активира напрежение с наталния ${nName} в Дом ${nHouse} (${area}), изкарвайки на повърхността несъзнавани модели.`,
      guidance: `Действай осъзнато без импулсивни реакции — напрежението е катализатор за пробив в ${area}.`,
    };
  }

  return {
    title,
    summary: `Транзитният ${tName} се слива с енергията на наталния ${nName} в Дом ${nHouse} (${area}) и поставя силен акцент върху тази тема.`,
    guidance: `Наблюдавай какво се задвижва в ${area} — поставяш основите на нов цикъл.`,
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
    const isOuter = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode'].includes(
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
      title: 'Първи квадрат на Сатурн (Осъзнаване на границите)',
      subtitle: 'Формиране на самостоятелност',
      startAge: 6.5,
      endAge: 8.5,
      description: 'Първи сблъсък с правилата на външния свят и изграждане на лична отговорност.',
    },
    {
      id: 'nodal_return_1',
      title: 'Първо завръщане на Лунните възли',
      subtitle: 'Компас на житейската посока',
      startAge: 18.0,
      endAge: 19.5,
      description: 'Повратна точка на съзряване и избор на собствен път извън семейния сценарий.',
    },
    {
      id: 'jupiter_return_2',
      title: 'Второ завръщане на Юпитер',
      subtitle: 'Разширение, визия и нови хоризонти',
      startAge: 23.0,
      endAge: 24.5,
      description: 'Период на смело търсене на смисъл, пътувания, обучение и социален растеж.',
    },
    {
      id: 'saturn_return_1',
      title: 'Първо Сатурново завръщане (Истинска зрялост)',
      subtitle: 'Пренареждане на основите на живота',
      startAge: 28.0,
      endAge: 30.8,
      description:
        'Сатурн се връща на наталната си позиция. Всичко неавтентично отпада, за да изградиш стабилна кариера, граници и мисия.',
    },
    {
      id: 'nodal_return_2',
      title: 'Второ завръщане на Лунните възли',
      subtitle: 'Пренастройка към Северния възел',
      startAge: 36.5,
      endAge: 38.2,
      description: 'Дълбока преоценка на житейските приоритети и съдбовни срещи.',
    },
    {
      id: 'uranus_opposition',
      title: 'Уранова опозиция (Пробуждане на автентичността)',
      subtitle: 'Освобождаване от остарели роли',
      startAge: 40.5,
      endAge: 43.5,
      description: 'Силна нужда от свобода, творческо обновяване и живот според собствената истина.',
    },
    {
      id: 'saturn_return_2',
      title: 'Второ Сатурново завръщане',
      subtitle: 'Мъдрост и наследство',
      startAge: 57.5,
      endAge: 60.5,
      description: 'Жътва на житейския опит и фокусиране върху най-смислените проекти и връзки.',
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
      ageRange: `${c.startAge.toFixed(0)}–${c.endAge.toFixed(0)} г.`,
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
        title: `Ключов фокус за ${dateStr}: ${topTransit.title}`,
        theme: topTransit.summary,
        advice: topTransit.guidance,
      }
    : {
        title: `Хармоничен период за интеграция (${dateStr})`,
        theme:
          'Няма тежки точни транзитни сблъсъци — периодът е подходящ за спокоен ритъм и утвърждаване на постигнатото.',
        advice: 'Фокусирай се върху ежедневните навици и вътрешния баланс.',
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

// --- Модули 6 и 7: Bonds, Synastry & Bond Transits ---

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
              ? `${p1.name} на ${userName} в ${def.type} с ${p2.name} на ${partner.name} създава естествена подкрепа и лекота в обмена.`
              : def.harmony === 'challenging'
              ? `${p1.name} на ${userName} в ${def.type} с ${p2.name} на ${partner.name} носи силно привличане, но изисква осъзнат диалог при различия.`
              : `${p1.name} на ${userName} в съвпад с ${p2.name} на ${partner.name} усилва взаимното огледало и споделената енергия.`;

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
      `Споделена стихийна динамика (${userChart.elements.dominantElement} и ${partnerChart.elements.dominantElement}), която стимулира взаимно развитие.`
    );
  }

  const conflicts = synastryAspects
    .filter((a) => a.harmony === 'challenging')
    .slice(0, 3)
    .map((a) => `${a.person1Body} ${a.aspectSymbol} ${a.person2Body}: ${a.interpretation}`);

  if (conflicts.length === 0) {
    conflicts.push('Минимални директни напрежения — важно е да пазите индивидуалното пространство.');
  }

  // Bond Transits: транзити, които едновременно докосват двете карти
  const userTransits = calculateTransitsForDate(userChart, targetDate);
  const partnerTransits = calculateTransitsForDate(partnerChart, targetDate);
  const bondTransits = [...userTransits.slice(0, 4), ...partnerTransits.slice(0, 4)].sort(
    (a, b) => b.intensity - a.intensity
  );

  const harmoniousTransits = bondTransits.filter((t) => t.harmony === 'harmonious');
  const challengingTransits = bondTransits.filter((t) => t.harmony === 'challenging');

  const romanticTimingScore = Math.max(
    45,
    Math.min(
      98,
      Math.round(
        70 + harmoniousTransits.length * 6 - challengingTransits.length * 4
      )
    )
  );

  const phaseLabel =
    romanticTimingScore >= 80
      ? 'Фаза на дълбоко сближаване и синхрон'
      : romanticTimingScore >= 65
      ? 'Фаза на градивен диалог и споделен ритъм'
      : 'Фаза на пренастройка и осъзнаване на границите';

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
      `Балансиране между ${userChart.modalities.dominantModality} темпото на ${userName} и ${partnerChart.modalities.dominantModality} подхода на ${partner.name}.`,
      `Съгласуване на емоционалните нужди (Луна в ${userChart.planetsByKey.moon?.sign} срещу Луна в ${partnerChart.planetsByKey.moon?.sign}).`,
    ],
    sharedThemes: [
      `Еволюционна ос: Северен възел в ${userChart.planetsByKey.northNode?.sign} и ${partnerChart.planetsByKey.northNode?.sign}.`,
      `Стихиен обмен между ${userChart.elements.dominantElement} и ${partnerChart.elements.dominantElement}.`,
    ],
    mutualInfluence: `${userName} внася енергията на ${userChart.planetsByKey.sun?.sign} (${userChart.elements.dominantElement}), докато ${partner.name} активира качествата на ${partnerChart.planetsByKey.sun?.sign} (${partnerChart.elements.dominantElement}).`,
    repeatingPatterns: [
      `При активиране на ${userChart.planetsByKey.venus?.sign}/${partnerChart.planetsByKey.mars?.sign} оста връзката преминава през цикъл на интензивно привличане, последвано от нужда от ясни правила.`,
    ],
    personalizedSummary: `Връзката между ${userName} (${userChart.planetsByKey.sun?.sign} ☉ / ${userChart.planetsByKey.moon?.sign} ☾) и ${partner.name} (${partnerChart.planetsByKey.sun?.sign} ☉ / ${partnerChart.planetsByKey.moon?.sign} ☾) съчетава ${overall}% общ резонанс с фокус върху емоционалната честност и взаимното израстване.`,
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
          : [`Следващите 7 дни около ${formatShortDate(targetDate)} (Лунен хармоничен прозорец)`],
      tensionWindows:
        challengingTransits.length > 0
          ? challengingTransits
              .slice(0, 2)
              .map((t) => `Пик на ${t.peakDateStr}: ${t.title}`)
          : ['Няма критични напрегнати пикове за избраната дата'],
      dynamicShift:
        bondTransits[0]?.summary ||
        'Динамиката между двете карти е стабилна и благоприятна за споделени планове.',
    },
  };
}