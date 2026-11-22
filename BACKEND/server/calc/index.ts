// Calculation API: every handler takes the JSON request body and returns a JSON-safe result.
// Mounted by routes/calc.js at POST /api/calc/:domain/:action.

import {
  computeNatalChart,
  degToZodiac,
  extractUserBirthDateTime,
  unwrapUserObject,
} from './astrology/astrology.calculations';
import {
  analyzeBondCompatibility,
  buildTimeTravelSnapshot,
  calculateTransitsForDate,
  getSkyPositionsForDate,
} from './astrology/astrology.transits';
import {
  PUBLIC_FIGURES_CATALOG,
  buildAstrologyClasses,
  buildAudioJourneys,
  buildContentLibrary,
  buildDailyUpdatePackage,
  buildPatternAnalyses,
  buildPersonalPsychologicalInsights,
} from './astrology/astrology.insights';
import { NatalChartResults, UserBirthDateTime } from './astrology/astrology.types';
import { calculateBaZiChart, compareBaZiCharts, getTenGod } from './bazi/bazi.calculator';
import { convertLocalToTrueSolarTime } from './bazi/bazi.solar';
import {
  BaZiChart,
  CityPreset,
  Gender,
  MatchType,
  TrueSolarTimeResult,
} from './bazi/bazi.types';
import {
  calculateAyurvedaProfile,
  compareAyurvedaProfiles,
  getActiveDoshaClock,
} from './ayurveda/ayurveda.calculator';
import { AyurvedaMatchType } from './ayurveda/ayurveda.types';
import { calculateMbtiResult, resolveCurrentResultData } from './mbti/mbti.calculations';
import {
  PlanetPositionLookup,
  computePlanetaryPositions,
  getMoonDayInfo,
  getMoonPhaseData,
} from './sky/home.calculations';
import { calculateLifePath, getFormattedUserDate } from './numerology/numerology';
import { findBirthCard } from './cardology/cardology';
import { buildProfileFields, calculateElementsFromBirthDate } from './profile/profile';
import {
  SIGN_ELEMENTS,
  calculateCompatibility,
  getAgeFromBirthdate,
  resolveLifePath,
  resolveMbtiType,
  resolveSunSign,
} from './people/people.compatibility';
import { toMatchEngineInput } from './match-engine/people.compatibility';
import { getEligibleRankedCandidates } from './match-engine/ranker';

export class CalcInputError extends Error {}

type Handler = (body: any) => unknown | Promise<unknown>;

// ───────────────────────────── helpers ─────────────────────────────

/** Absolute instant (ISO string with zone / epoch ms); defaults to now. */
function instant(value: unknown): Date {
  if (value === undefined || value === null || value === '') return new Date();
  const d = new Date(value as any);
  if (Number.isNaN(d.getTime())) throw new CalcInputError(`Invalid date: ${String(value)}`);
  return d;
}

/**
 * Client wall-clock time sent as "YYYY-MM-DDTHH:mm[:ss]" without a zone. Parsed as server-local,
 * so getHours()/getMonth() return the client's local values for clock/season calculations.
 */
function wallClock(value: unknown): Date {
  if (value === undefined || value === null || value === '') return new Date();
  const str = String(value).replace(/(Z|[+-]\d{2}:?\d{2})$/, '');
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) throw new CalcInputError(`Invalid local date: ${String(value)}`);
  return d;
}

function requireObject(value: unknown, name: string): any {
  if (!value || typeof value !== 'object') throw new CalcInputError(`Missing "${name}"`);
  return value;
}

// ───────────────────────────── astrology ─────────────────────────────

type BirthInfo = Omit<UserBirthDateTime, 'date'>;

const CHART_CACHE_LIMIT = 500;
const chartCache = new Map<string, NatalChartResults | null>();

/** Accepts either { user } (raw profile) or { birth } (already-extracted birth data). */
function resolveBirth(body: any): BirthInfo | null {
  if (body?.birth) {
    const b = body.birth;
    return {
      dStr: String(b.dStr),
      tStr: String(b.tStr ?? '12:00'),
      hasExactBirthTime: b.hasExactBirthTime !== false,
      lat: Number(b.lat),
      lon: Number(b.lon),
      cityName: String(b.cityName ?? ''),
      timezone: b.timezone || undefined,
    };
  }
  const info = extractUserBirthDateTime(unwrapUserObject(body?.user));
  if (!info) return null;
  const { date: _date, ...rest } = info;
  return rest;
}

function chartFor(birth: BirthInfo): NatalChartResults | null {
  const key = JSON.stringify([
    birth.dStr,
    birth.tStr,
    birth.lat,
    birth.lon,
    birth.timezone,
    birth.hasExactBirthTime,
  ]);
  if (chartCache.has(key)) return chartCache.get(key)!;

  const chart = computeNatalChart(
    birth.dStr,
    birth.tStr,
    birth.lat,
    birth.lon,
    birth.timezone,
    birth.hasExactBirthTime
  );
  if (chartCache.size >= CHART_CACHE_LIMIT) {
    chartCache.delete(chartCache.keys().next().value as string);
  }
  chartCache.set(key, chart);
  return chart;
}

function requireChart(body: any): NatalChartResults {
  const birth = resolveBirth(body);
  if (!birth) throw new CalcInputError('Missing birth data');
  const chart = chartFor(birth);
  if (!chart) throw new CalcInputError('Could not compute natal chart for the given birth data');
  return chart;
}

/** Profile fields derived from the chart, persisted on the user document. */
function buildNatalProfilePatch(chart: NatalChartResults, birth: BirthInfo) {
  const sunDeg = chart.planetsByKey.sun?.deg ?? 0;
  const moonDeg = chart.planetsByKey.moon?.deg ?? 0;

  return {
    hasExactBirthTime: birth.hasExactBirthTime,
    westernElements: {
      shares: chart.elements.shares,
      dominantElement: chart.elements.dominantElement,
      lackingElement: chart.elements.lackingElement,
      includesAscendant: birth.hasExactBirthTime,
      source: 'weighted_planets',
    },
    polarity: {
      score: chart.polarity.score,
      dominantPolarity: chart.polarity.dominantPolarity,
      sourceCoverage: 1.0,
      provenance: 'natal_chart_weighted_planets',
    },
    natalChart: {
      sunSign: degToZodiac(sunDeg).sign,
      moonSign: degToZodiac(moonDeg).sign,
      ascendant: degToZodiac(chart.asc).sign,
      midheaven: degToZodiac(chart.mc).sign,
      descendant: degToZodiac(chart.dsc).sign,
      imumCoeli: degToZodiac(chart.ic).sign,
      dominantElement: chart.elements.dominantElement,
      dominantModality: chart.modalities.dominantModality,
      isDayChart: chart.isDayChart,
      chartRuler: chart.chartRuler,

      signature: chart.signature,
      calculatedAt: chart.calculatedAt,
      zodiacType: chart.zodiacType,
      houseSystem: chart.houseSystem,
      ephemerisSource: chart.ephemerisSource,
      hasExactBirthTime: chart.hasExactBirthTime,
      dateStr: chart.dateStr,
      timeStr: chart.timeStr,
      birthDateTimeUtc: chart.birthDateTimeUtc,
      lat: chart.lat,
      lon: chart.lon,
      timezone: chart.timezone,

      asc: chart.asc,
      mc: chart.mc,
      dsc: chart.dsc,
      ic: chart.ic,
      angles: chart.angles,
      cusps: chart.cusps,
      houses: chart.houses,

      planetPositions: chart.planetPositions,
      planets: chart.planetsByKey,

      aspects: chart.aspects,
      patterns: chart.patterns,

      elements: chart.elements,
      modalities: chart.modalities,
      polarity: chart.polarity,
      hemispheres: chart.hemispheres,
    },
  };
}

const astrology: Record<string, Handler> = {
  // { user } | { birth } → { birthInfo, chart, profilePatch } (birthInfo null when no birth data)
  'natal-chart': (body) => {
    const birth = resolveBirth(body);
    if (!birth) return { birthInfo: null, chart: null, profilePatch: null };
    const chart = chartFor(birth);
    return {
      birthInfo: birth,
      chart,
      profilePatch: chart ? buildNatalProfilePatch(chart, birth) : null,
    };
  },

  // Static chart-derived content for the Astrology screen tabs
  insights: (body) => {
    const chart = requireChart(body);
    return {
      psychological: buildPersonalPsychologicalInsights(chart),
      patterns: buildPatternAnalyses(chart),
      library: buildContentLibrary(chart),
      audioJourneys: buildAudioJourneys(chart),
      classes: buildAstrologyClasses(chart),
    };
  },

  // { birth, date } → time-travel snapshot, 14-day preview and daily update package
  'time-travel': (body) => {
    const chart = requireChart(body);
    const date = instant(body.date);
    const timeTravel = buildTimeTravelSnapshot(chart, date);
    const plus14d = new Date(date.getTime() + 14 * 86400000);
    return {
      timeTravel,
      upcomingPreview: calculateTransitsForDate(chart, plus14d).slice(0, 6),
      dailyUpdate: buildDailyUpdatePackage(chart, timeTravel.activeTransits, date),
    };
  },

  transits: (body) => calculateTransitsForDate(requireChart(body), instant(body.date)),

  sky: (body) => getSkyPositionsForDate(instant(body.date)),

  atlas: (body) => {
    const date = instant(body.date);
    const birth = resolveBirth(body);
    const natal = birth ? chartFor(birth) : null;
    return {
      natal,
      current: getSkyPositionsForDate(date),
      transits: natal?.hasExactBirthTime ? calculateTransitsForDate(natal, date) : [],
    };
  },

  // { birth, userName, partner: BondProfileInput, date }
  bond: (body) =>
    analyzeBondCompatibility(
      requireChart(body),
      String(body.userName || 'You'),
      requireObject(body.partner, 'partner'),
      instant(body.date)
    ),

  'public-figures': () => PUBLIC_FIGURES_CATALOG,
};

// ───────────────────────────── BaZi ─────────────────────────────

interface BaZiInput {
  y: number;
  m: number;
  d: number;
  hour?: number | null;
  minute?: number | null;
  city?: CityPreset | null;
  gender?: Gender;
}

/** Applies true-solar-time correction when an exact hour and city are known. */
function baziChartWithSolar(input: BaZiInput): { chart: BaZiChart; solar: TrueSolarTimeResult | null } {
  const { y, m, d, hour, minute, city, gender = 'female' } = requireObject(input, 'input');
  const hasTime = typeof hour === 'number' && hour >= 0 && hour <= 23 && city;
  if (hasTime) {
    const solar = convertLocalToTrueSolarTime(y, m, d, hour, minute || 0, city);
    const chart = calculateBaZiChart(
      solar.solarYear,
      solar.solarMonth,
      solar.solarDay,
      solar.shichenBranchIndex,
      gender
    );
    return { chart, solar };
  }
  return { chart: calculateBaZiChart(y, m, d, null, gender), solar: null };
}

function baziChartFor(input: BaZiInput): BaZiChart {
  return baziChartWithSolar(input).chart;
}

const bazi: Record<string, Handler> = {
  // { input } → { chart, solar }
  chart: (body) => baziChartWithSolar(body.input),

  // { user: BaZiInput, partner: BaZiInput, matchType } → { partnerChart, match }
  compare: (body) => {
    const userChart = baziChartFor(body.user);
    const partnerChart = baziChartFor(body.partner);
    return {
      partnerChart,
      match: compareBaZiCharts(userChart, partnerChart, body.matchType as MatchType),
    };
  },

  // { natal: BaZiInput, city, local: { y, m, d, hour, minute } } → live energy for that moment
  today: (body) => {
    const natalChart = baziChartFor(body.natal);
    const city = requireObject(body.city, 'city');
    const l = requireObject(body.local, 'local');
    const solarNow = convertLocalToTrueSolarTime(l.y, l.m, l.d, l.hour, l.minute, city);
    const liveChart = calculateBaZiChart(
      solarNow.solarYear,
      solarNow.solarMonth,
      solarNow.solarDay,
      solarNow.shichenBranchIndex,
      natalChart.gender
    );
    return {
      solarNow,
      liveChart,
      dayStemRelation: getTenGod(natalChart.dayMaster.stem, liveChart.dayPillar.stem),
      hourStemRelation: liveChart.hourPillar
        ? getTenGod(natalChart.dayMaster.stem, liveChart.hourPillar.stem)
        : 'Neutral',
    };
  },
};

// ───────────────────────────── Ayurveda ─────────────────────────────

const ayurveda: Record<string, Handler> = {
  // { options, localDate }
  profile: (body) =>
    calculateAyurvedaProfile({ ...(body.options || {}), date: wallClock(body.localDate) }),

  // { user: options, partner: options, matchType, localDate } → { partnerProfile, match }
  compare: (body) => {
    const date = wallClock(body.localDate);
    const userProfile = calculateAyurvedaProfile({ ...requireObject(body.user, 'user'), date });
    const partnerProfile = calculateAyurvedaProfile({
      ...requireObject(body.partner, 'partner'),
      date,
    });
    return {
      partnerProfile,
      match: compareAyurvedaProfiles(
        userProfile,
        partnerProfile,
        body.matchType as AyurvedaMatchType
      ),
    };
  },

  clock: (body) => getActiveDoshaClock(wallClock(body.localDate)),
};

// ───────────────────────────── MBTI ─────────────────────────────

const mbti: Record<string, Handler> = {
  result: (body) => calculateMbtiResult(requireObject(body.answers, 'answers')),

  // { showSavedResult, user, answers }
  current: (body) =>
    resolveCurrentResultData(Boolean(body.showSavedResult), body.user, body.answers || {}),
};

// ───────────────────────────── Sky (Home) ─────────────────────────────

let planetLookup: PlanetPositionLookup | null = null;

/** routes/calc.js injects the JPL Horizons lookup (kept in plain JS with its cache). */
export function setPlanetPositionLookup(lookup: PlanetPositionLookup) {
  planetLookup = lookup;
}

const sky: Record<string, Handler> = {
  planets: (body) =>
    computePlanetaryPositions(planetLookup || (async () => null), instant(body.date)),

  // { dates: ISO[] } → MoonPhaseData[]
  'moon-phases': (body) => {
    const dates: unknown[] = Array.isArray(body.dates) ? body.dates : [body.date];
    if (dates.length > 62) throw new CalcInputError('Too many dates (max 62)');
    return dates.map((d) => getMoonPhaseData(instant(d)));
  },

  'moon-day': (body) => getMoonDayInfo(instant(body.date)),
};

// ───────────────────────────── Numerology & Cardology ─────────────────────────────

const numerology: Record<string, Handler> = {
  'life-path': (body) => {
    const dateStr = getFormattedUserDate(body.user);
    return dateStr ? calculateLifePath(dateStr) : null;
  },
};

const cardology: Record<string, Handler> = {
  'birth-card': (body) => findBirthCard(body.user),
};

// ───────────────────────────── Profile ─────────────────────────────

const profile: Record<string, Handler> = {
  // { input: RawUserInput, birthdateIso, currentUser: { name, bloodGroup } } → computed profile fields
  build: (body) => {
    const input = requireObject(body.input, 'input');
    requireObject(input.birthDate, 'input.birthDate');
    return buildProfileFields(input, String(body.birthdateIso), body.currentUser);
  },

  // { birthdate } → Fire/Earth/Air/Water balance shown on the Profile screen
  elements: (body) => calculateElementsFromBirthDate(body.birthdate),
};

// ───────────────────────────── People ─────────────────────────────

/** Compatibility with the current user plus the derived fields the People screens display. */
export function annotatePerson(me: any, person: any) {
  const sunSign = resolveSunSign(person);
  return {
    ...person,
    compatibility: calculateCompatibility(me, person),
    derived: {
      sunSign,
      sunElement: SIGN_ELEMENTS[sunSign] || null,
      mbtiType: resolveMbtiType(person),
      lifePath: resolveLifePath(person),
      age: getAgeFromBirthdate(person.birthdate),
    },
  };
}

/**
 * Annotates people lists for the current user and ranks discover / potential matches with the
 * match engine (which also drops mutually ineligible candidates). Used by GET /api/people/hub.
 */
export function enrichPeopleHub(
  me: any,
  hub: { friends: any[]; incomingRequests: any[]; potentialMatches: any[]; discover: any[] },
  profiles = new Map<string, any>(),
) {
  const rank = (people: any[], requireDatingAdultCheck: boolean) => {
    if (people.length === 0) return people;
    const ranked = getEligibleRankedCandidates(
      toMatchEngineInput(me),
      people.map((person) => toMatchEngineInput(profiles.get(person.id) ?? person)),
      { limit: people.length, requireDatingAdultCheck }
    );
    const byId = new Map(people.map((p) => [String(p.id), p]));
    return ranked.items
      .map((item: any) => byId.get(String(item.candidate.id)))
      .filter(Boolean);
  };
  const annotateAll = (people: any[]) => people.map((p) => annotatePerson(me, p));

  return {
    friends: annotateAll(hub.friends),
    incomingRequests: annotateAll(hub.incomingRequests),
    potentialMatches: annotateAll(rank(hub.potentialMatches, true)),
    discover: annotateAll(rank(hub.discover, false)),
  };
}

const people: Record<string, Handler> = {
  // { user, person } — ad-hoc pair breakdown
  compatibility: (body) =>
    calculateCompatibility(requireObject(body.user, 'user'), requireObject(body.person, 'person')),
};

export const handlers: Record<string, Record<string, Handler>> = {
  astrology,
  bazi,
  ayurveda,
  mbti,
  sky,
  numerology,
  cardology,
  profile,
  people,
};
