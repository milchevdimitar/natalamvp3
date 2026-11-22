import * as Astronomy from 'astronomy-engine';
import {
  ASPECT_DEFINITIONS,
  DEFAULT_LAT,
  DEFAULT_LON,
  OBLIQUITY_RAD,
  PLANET_BODIES,
  PLANET_DIGNITIES,
  ZODIAC_SIGNS,
} from './astrology.constants';
import {
  ChartPattern,
  ChartRulerInfo,
  DignityType,
  ElementDistribution,
  ElementType,
  HemisphereBalance,
  HouseCuspInfo,
  ModalityDistribution,
  ModalityType,
  NatalAspect,
  NatalChartResults,
  PlanetPosition,
  PolarityBalance,
  UserBirthDateTime,
  ZodiacPosition,
} from './astrology.types';

function getTimezoneOffsetMinutes(utcDate: Date, timezone: string): number | null {
  try {
    if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
      return null;
    }
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const parts = formatter.formatToParts(utcDate);
    const map: Record<string, string> = {};
    for (const part of parts) {
      map[part.type] = part.value;
    }

    const y = Number(map.year);
    const m = Number(map.month);
    const d = Number(map.day);
    const h = Number(map.hour) % 24;
    const min = Number(map.minute);
    const sec = Number(map.second || '0');

    if ([y, m, d, h, min, sec].some((n) => Number.isNaN(n))) {
      return null;
    }

    const targetUtcMs = Date.UTC(y, m - 1, d, h, min, sec);
    return Math.round((utcDate.getTime() - targetUtcMs) / 60000);
  } catch {
    return null;
  }
}

export function parseDateTimeToUTC(
  dStr: string,
  tStr: string,
  lon: number = DEFAULT_LON,
  timezone?: string
): Date {
  const [day, month, year] = dStr.split('.').map(Number);
  const [hour, min] = tStr.split(':').map(Number);

  const safeYear = Number.isFinite(year) ? year : 1995;
  const safeMonth = Number.isFinite(month) ? month : 1;
  const safeDay = Number.isFinite(day) ? day : 1;
  const safeHour = Number.isFinite(hour) ? hour : 12;
  const safeMin = Number.isFinite(min) ? min : 0;

  if (timezone && typeof timezone === 'string') {
    const testDate = new Date(Date.UTC(safeYear, safeMonth - 1, safeDay, safeHour, safeMin));
    const diffMinutes = getTimezoneOffsetMinutes(testDate, timezone.trim());
    if (diffMinutes !== null && Number.isFinite(diffMinutes)) {
      const resolved = new Date(testDate.getTime() + diffMinutes * 60000);
      if (!Number.isNaN(resolved.getTime())) {
        return resolved;
      }
    }
  }

  if (Math.abs(lon - DEFAULT_LON) < 6) {
    const isSofiaDST = (y: number, m: number, dNum: number) => {
      if (m < 3 || m > 10) return false;
      if (m > 3 && m < 10) return true;
      if (m === 3) {
        const lastSun = 31 - new Date(Date.UTC(y, 2, 31)).getUTCDay();
        return dNum >= lastSun;
      }
      if (m === 10) {
        const lastSun = 31 - new Date(Date.UTC(y, 9, 31)).getUTCDay();
        return dNum < lastSun;
      }
      return false;
    };
    const offsetHours = isSofiaDST(safeYear, safeMonth, safeDay) ? 3 : 2;
    return new Date(Date.UTC(safeYear, safeMonth - 1, safeDay, safeHour - offsetHours, safeMin));
  }

  const approxOffsetHours = Math.round(lon / 15);
  return new Date(Date.UTC(safeYear, safeMonth - 1, safeDay, safeHour - approxOffsetHours, safeMin));
}

export function degToZodiac(deg: number): ZodiacPosition {
  const normalized = ((deg % 360) + 360) % 360;
  const signIdx = Math.floor(normalized / 30);
  const signDeg = normalized % 30;
  const degInt = Math.floor(signDeg);
  const minInt = Math.floor((signDeg - degInt) * 60);
  const signInfo = ZODIAC_SIGNS[signIdx];

  return {
    deg: normalized,
    signDeg,
    degFormatted: `${String(degInt).padStart(2, '0')}°${String(minInt).padStart(2, '0')}'`,
    sign: signInfo.name,
    latinSign: signInfo.latin,
    symbol: signInfo.symbol,
    bgName: signInfo.bgName,
    element: signInfo.element,
    modality: signInfo.modality,
    polarity: signInfo.polarity,
  };
}

export function getPlanetDignity(planetName: string, sign: string): DignityType {
  const rules = PLANET_DIGNITIES[planetName];
  if (!rules) return 'Peregrine';
  if (rules.Domicile?.includes(sign)) return 'Domicile';
  if (rules.Exaltation?.includes(sign)) return 'Exaltation';
  if (rules.Detriment?.includes(sign)) return 'Detriment';
  if (rules.Fall?.includes(sign)) return 'Fall';
  return 'Peregrine';
}

export function getHouseForPlanet(planetDeg: number, cusps: number[]): number {
  const deg = ((planetDeg % 360) + 360) % 360;
  for (let i = 1; i <= 12; i++) {
    const cCurr = cusps[i];
    const cNext = i < 12 ? cusps[i + 1] : cusps[1];
    if (cCurr < cNext) {
      if (deg >= cCurr && deg < cNext) return i;
    } else if (deg >= cCurr || deg < cNext) {
      return i;
    }
  }
  return 1;
}

export function calculatePlacidusHouses(
  date: Date,
  lat: number = DEFAULT_LAT,
  lon: number = DEFAULT_LON
) {
  const siderealTimeHours = Astronomy.SiderealTime(date);
  const ramcDeg = (siderealTimeHours * 15 + lon + 360) % 360;
  const ramcRad = (ramcDeg * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;

  const mcRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(OBLIQUITY_RAD));
  const mc = ((mcRad * 180) / Math.PI + 360) % 360;

  const ascRad = Math.atan2(
    Math.cos(ramcRad),
    -Math.sin(ramcRad) * Math.cos(OBLIQUITY_RAD) - Math.tan(latRad) * Math.sin(OBLIQUITY_RAD)
  );
  const asc = ((ascRad * 180) / Math.PI + 360) % 360;

  const ic = (mc + 180) % 360;
  const dsc = (asc + 180) % 360;

  const solvePlacidusCusp = (degreeOffset: number, factor: number, isAbove: boolean) => {
    let ra = (ramcDeg + degreeOffset) * (Math.PI / 180);
    for (let i = 0; i < 15; i++) {
      const sinRA = Math.sin(ra);
      const decl = Math.asin(Math.sin(OBLIQUITY_RAD) * sinRA);
      const val = Math.tan(latRad) * Math.tan(decl);
      const clampedVal = Math.max(-0.9999, Math.min(0.9999, val));
      const ascDiff = Math.asin(clampedVal);
      const diurnalArc = isAbove ? Math.PI / 2 + ascDiff : Math.PI / 2 - ascDiff;
      const targetRA = (ramcDeg * Math.PI) / 180 + factor * diurnalArc;
      ra = ra + (targetRA - ra) * 0.5;
    }
    const lonRad = Math.atan2(
      Math.sin(ra) * Math.cos(OBLIQUITY_RAD) +
        Math.tan(Math.asin(Math.sin(OBLIQUITY_RAD) * Math.sin(ra))) * Math.sin(OBLIQUITY_RAD),
      Math.cos(ra)
    );
    return ((lonRad * 180) / Math.PI + 360) % 360;
  };

  let cusp11 = solvePlacidusCusp(30, 1 / 3, true);
  let cusp12 = solvePlacidusCusp(60, 2 / 3, true);
  let cusp2 = solvePlacidusCusp(120, 1 + 1 / 3, false);
  let cusp3 = solvePlacidusCusp(150, 1 + 2 / 3, false);

  if (isNaN(cusp11)) cusp11 = (mc + 30) % 360;
  if (isNaN(cusp12)) cusp12 = (mc + 60) % 360;
  if (isNaN(cusp2)) cusp2 = (asc + 30) % 360;
  if (isNaN(cusp3)) cusp3 = (asc + 60) % 360;

  const cusps = [
    0,
    asc,
    cusp2,
    cusp3,
    ic,
    (cusp11 + 180) % 360,
    (cusp12 + 180) % 360,
    dsc,
    (cusp2 + 180) % 360,
    (cusp3 + 180) % 360,
    mc,
    cusp11,
    cusp12,
  ];

  return { cusps, asc, mc, dsc, ic };
}

export function getTrueNorthNodeLongitude(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  return (((125.04452 - 0.0529537617 * d) % 360) + 360) % 360;
}

export function getMeanLilithLongitude(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  return (((83.353243 + 0.1114035239 * d) % 360) + 360) % 360;
}

function getBodyLongitudeAt(body: Astronomy.Body, dateUtc: Date): number {
  const geoVector = Astronomy.GeoVector(body, dateUtc, true);
  const ecliptic = Astronomy.Ecliptic(geoVector);
  return ((ecliptic.elon % 360) + 360) % 360;
}

function shortestAngularDiff(degA: number, degB: number): number {
  const diff = Math.abs(degA - degB) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function calculateNatalAspects(planets: PlanetPosition[]): NatalAspect[] {
  const coreBodies = planets.filter(
    (p) => p.key !== 'southNode' && p.key !== 'partOfFortune'
  );
  const aspects: NatalAspect[] = [];

  for (let i = 0; i < coreBodies.length; i++) {
    for (let j = i + 1; j < coreBodies.length; j++) {
      const p1 = coreBodies[i];
      const p2 = coreBodies[j];
      const actualAngle = shortestAngularDiff(p1.deg, p2.deg);
      const isLuminary =
        p1.key === 'sun' || p1.key === 'moon' || p2.key === 'sun' || p2.key === 'moon';

      for (const def of ASPECT_DEFINITIONS) {
        const maxOrb = isLuminary && def.orb >= 7 ? def.orb + 1.5 : def.orb;
        const orb = Math.abs(actualAngle - def.angle);

        if (orb <= maxOrb) {
          const p1Later = (p1.deg + p1.speedDegPerDay / 24 + 360) % 360;
          const p2Later = (p2.deg + p2.speedDegPerDay / 24 + 360) % 360;
          const angleLater = shortestAngularDiff(p1Later, p2Later);
          const orbLater = Math.abs(angleLater - def.angle);

          aspects.push({
            id: `${p1.key}_${def.type.toLowerCase()}_${p2.key}`,
            body1: p1.name,
            body1Key: p1.key,
            body2: p2.name,
            body2Key: p2.key,
            aspectType: def.type,
            symbol: def.symbol,
            exactAngle: def.angle,
            actualAngle: Math.round(actualAngle * 100) / 100,
            orb: Math.round(orb * 100) / 100,
            maxOrb,
            isApplying: orbLater < orb,
            harmony: def.harmony,
            weight: Math.round(def.weight * (1 - orb / (maxOrb + 1)) * 100) / 100,
          });
          break;
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

function detectChartPatterns(
  planets: PlanetPosition[],
  aspects: NatalAspect[]
): ChartPattern[] {
  const majorTen = planets.slice(0, 10);
  const patterns: ChartPattern[] = [];

  const bySign = new Map<string, PlanetPosition[]>();
  for (const p of majorTen) {
    const arr = bySign.get(p.sign) || [];
    arr.push(p);
    bySign.set(p.sign, arr);
  }
  for (const [sign, group] of bySign.entries()) {
    if (group.length >= 3) {
      patterns.push({
        id: `stellium_sign_${sign.toLowerCase()}`,
        type: 'Stellium',
        bodies: group.map((g) => g.name),
        sign,
        element: group[0].element,
      });
    }
  }

  const byHouse = new Map<number, PlanetPosition[]>();
  for (const p of majorTen) {
    const arr = byHouse.get(p.house) || [];
    arr.push(p);
    byHouse.set(p.house, arr);
  }
  for (const [house, group] of byHouse.entries()) {
    if (group.length >= 3) {
      patterns.push({
        id: `stellium_house_${house}`,
        type: 'Stellium',
        bodies: group.map((g) => g.name),
        house,
      });
    }
  }

  const hasAspect = (k1: string, k2: string, type: string) =>
    aspects.some(
      (a) =>
        a.aspectType === type &&
        ((a.body1Key === k1 && a.body2Key === k2) ||
          (a.body1Key === k2 && a.body2Key === k1))
    );

  const oppositions = aspects.filter(
    (a) =>
      a.aspectType === 'Opposition' &&
      majorTen.some((p) => p.key === a.body1Key) &&
      majorTen.some((p) => p.key === a.body2Key)
  );
  for (const opp of oppositions) {
    for (const apex of majorTen) {
      if (apex.key === opp.body1Key || apex.key === opp.body2Key) continue;
      if (
        hasAspect(opp.body1Key, apex.key, 'Square') &&
        hasAspect(opp.body2Key, apex.key, 'Square')
      ) {
        patterns.push({
          id: `tsquare_${opp.body1Key}_${opp.body2Key}_${apex.key}`,
          type: 'T-Square',
          bodies: [opp.body1, opp.body2, apex.name],
          apexBody: apex.name,
        });
      }
    }
  }

  for (let i = 0; i < oppositions.length; i++) {
    for (let j = i + 1; j < oppositions.length; j++) {
      const oppA = oppositions[i];
      const oppB = oppositions[j];
      const keys = [oppA.body1Key, oppA.body2Key, oppB.body1Key, oppB.body2Key];
      if (new Set(keys).size !== 4) continue;

      if (
        hasAspect(oppA.body1Key, oppB.body1Key, 'Square') &&
        hasAspect(oppA.body1Key, oppB.body2Key, 'Square') &&
        hasAspect(oppA.body2Key, oppB.body1Key, 'Square') &&
        hasAspect(oppA.body2Key, oppB.body2Key, 'Square')
      ) {
        patterns.push({
          id: `grand_cross_${[...keys].sort().join('_')}`,
          type: 'Grand Cross',
          bodies: [oppA.body1, oppA.body2, oppB.body1, oppB.body2],
        });
      }
    }
  }

  for (let i = 0; i < majorTen.length; i++) {
    for (let j = i + 1; j < majorTen.length; j++) {
      if (!hasAspect(majorTen[i].key, majorTen[j].key, 'Trine')) continue;
      for (let k = j + 1; k < majorTen.length; k++) {
        if (
          hasAspect(majorTen[i].key, majorTen[k].key, 'Trine') &&
          hasAspect(majorTen[j].key, majorTen[k].key, 'Trine')
        ) {
          patterns.push({
            id: `grand_trine_${majorTen[i].key}_${majorTen[j].key}_${majorTen[k].key}`,
            type: 'Grand Trine',
            bodies: [majorTen[i].name, majorTen[j].name, majorTen[k].name],
            element: majorTen[i].element,
          });
        }
      }
    }
  }

  const sextiles = aspects.filter(
    (a) =>
      a.aspectType === 'Sextile' &&
      majorTen.some((p) => p.key === a.body1Key) &&
      majorTen.some((p) => p.key === a.body2Key)
  );
  for (const sex of sextiles) {
    for (const apex of majorTen) {
      if (apex.key === sex.body1Key || apex.key === sex.body2Key) continue;
      if (
        hasAspect(sex.body1Key, apex.key, 'Quincunx') &&
        hasAspect(sex.body2Key, apex.key, 'Quincunx')
      ) {
        patterns.push({
          id: `yod_${sex.body1Key}_${sex.body2Key}_${apex.key}`,
          type: 'Yod',
          bodies: [sex.body1, sex.body2, apex.name],
          apexBody: apex.name,
        });
      }
    }
  }

  return patterns;
}

function parseFlexibleBirthDate(rawDate: any): {
  year: number;
  month: number;
  day: number;
  embeddedHour?: number;
  embeddedMin?: number;
  dateObj: Date;
} | null {
  if (!rawDate) return null;

  if (typeof rawDate === 'object' && !(rawDate instanceof Date)) {
    if (rawDate.$date) return parseFlexibleBirthDate(rawDate.$date);
    if (typeof rawDate.seconds === 'number') {
      return parseFlexibleBirthDate(rawDate.seconds * 1000);
    }
    if (typeof rawDate._seconds === 'number') {
      return parseFlexibleBirthDate(rawDate._seconds * 1000);
    }
    if (
      typeof rawDate.year === 'number' &&
      typeof rawDate.month === 'number' &&
      typeof rawDate.day === 'number'
    ) {
      const d = new Date(Date.UTC(rawDate.year, rawDate.month - 1, rawDate.day, 12, 0));
      if (!isNaN(d.getTime())) {
        return {
          year: rawDate.year,
          month: rawDate.month,
          day: rawDate.day,
          dateObj: d,
        };
      }
    }
  }

  if (typeof rawDate === 'string') {
    const trimmed = rawDate.trim();

    const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dmyMatch) {
      const day = Number(dmyMatch[1]);
      const month = Number(dmyMatch[2]);
      const year = Number(dmyMatch[3]);
      const d = new Date(Date.UTC(year, month - 1, day, 12, 0));
      if (!isNaN(d.getTime())) {
        return { year, month, day, dateObj: d };
      }
    }

    const ymdMatch = trimmed.match(
      /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[T\s](\d{1,2}):(\d{2}))?/
    );
    if (ymdMatch) {
      const year = Number(ymdMatch[1]);
      const month = Number(ymdMatch[2]);
      const day = Number(ymdMatch[3]);
      const hasTime = ymdMatch[4] !== undefined && ymdMatch[5] !== undefined;
      const embeddedHour = hasTime ? Number(ymdMatch[4]) : undefined;
      const embeddedMin = hasTime ? Number(ymdMatch[5]) : undefined;
      const d = new Date(
        Date.UTC(year, month - 1, day, embeddedHour ?? 12, embeddedMin ?? 0)
      );
      if (!isNaN(d.getTime())) {
        return { year, month, day, embeddedHour, embeddedMin, dateObj: d };
      }
    }
  }

  const d =
    rawDate instanceof Date
      ? rawDate
      : typeof rawDate === 'number'
      ? new Date(rawDate < 1e12 ? rawDate * 1000 : rawDate)
      : new Date(rawDate);

  if (!isNaN(d.getTime())) {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      embeddedHour: d.getUTCHours(),
      embeddedMin: d.getUTCMinutes(),
      dateObj: d,
    };
  }

  return null;
}

function parseFlexibleBirthTime(rawTime: any): string | null {
  if (!rawTime) return null;

  if (rawTime instanceof Date && !isNaN(rawTime.getTime())) {
    return `${String(rawTime.getHours()).padStart(2, '0')}:${String(
      rawTime.getMinutes()
    ).padStart(2, '0')}`;
  }

  if (typeof rawTime !== 'string') return null;
  const trimmed = rawTime.trim();

  if (trimmed.includes('T')) {
    const dt = new Date(trimmed);
    if (!isNaN(dt.getTime())) {
      return `${String(dt.getHours()).padStart(2, '0')}:${String(
        dt.getMinutes()
      ).padStart(2, '0')}`;
    }
  }

  const m24 = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (m24) {
    return `${String(Number(m24[1])).padStart(2, '0')}:${m24[2]}`;
  }

  const m12 = trimmed.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
  if (m12) {
    let h = Number(m12[1]);
    const min = m12[2];
    const period = m12[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${min}`;
  }

  return null;
}

export function unwrapUserObject(rawUser: any): any {
  if (!rawUser || typeof rawUser !== 'object') return rawUser;
  if (
    rawUser.birthdate ||
    rawUser.birthDate ||
    rawUser.dateOfBirth ||
    rawUser.dob ||
    rawUser.birth_date ||
    rawUser.birthday
  ) {
    return rawUser;
  }
  return rawUser.user || rawUser.data || rawUser.profile || rawUser.userData || rawUser;
}

export function extractUserBirthDateTime(rawUser: any): UserBirthDateTime | null {
  if (!rawUser) return null;

  const user = unwrapUserObject(rawUser);

  const rawDate =
    user.birthdate ??
    user.birthDate ??
    user.dateOfBirth ??
    user.dob ??
    user.birth_date ??
    user.birthday ??
    user.profile?.birthdate ??
    user.profile?.birthDate ??
    user.profile?.dateOfBirth ??
    user.profile?.dob ??
    user.profile?.birth_date ??
    user.profile?.birthday;

  const parsedDate = parseFlexibleBirthDate(rawDate);
  if (!parsedDate) return null;

  const birthCityObj =
    user.birthCity ||
    user.birthLocation ||
    user.birthPlace ||
    user.profile?.birthCity ||
    user.profile?.birthLocation ||
    user.profile?.birthPlace;

  const lat =
    typeof birthCityObj?.latitude === 'number'
      ? birthCityObj.latitude
      : typeof birthCityObj?.lat === 'number'
      ? birthCityObj.lat
      : DEFAULT_LAT;

  const lon =
    typeof birthCityObj?.longitude === 'number'
      ? birthCityObj.longitude
      : typeof birthCityObj?.lng === 'number'
      ? birthCityObj.lng
      : typeof birthCityObj?.lon === 'number'
      ? birthCityObj.lon
      : DEFAULT_LON;

  const cityName =
    typeof birthCityObj === 'string' && birthCityObj.trim()
      ? birthCityObj.trim()
      : birthCityObj?.name || user.city || 'Sofia';
  const countryName = birthCityObj?.country || '';

  const explicitTimeRaw =
    user.birthTime ??
    user.timeOfBirth ??
    user.birth_time ??
    user.birthtime ??
    user.profile?.birthTime ??
    user.profile?.timeOfBirth ??
    user.profile?.birth_time;

  const explicitTime = parseFlexibleBirthTime(explicitTimeRaw);

  const hasEmbeddedNonZero =
    typeof parsedDate.embeddedHour === 'number' &&
    typeof parsedDate.embeddedMin === 'number' &&
    (parsedDate.embeddedHour !== 0 || parsedDate.embeddedMin !== 0);

  const embeddedTimeStr = hasEmbeddedNonZero
    ? `${String(parsedDate.embeddedHour).padStart(2, '0')}:${String(
        parsedDate.embeddedMin
      ).padStart(2, '0')}`
    : null;

  const tStr = explicitTime || embeddedTimeStr || '12:00';
  const hasExactBirthTime = Boolean(
    explicitTime || user.hasExactBirthTime || hasEmbeddedNonZero
  );

  const dStr = `${String(parsedDate.day).padStart(2, '0')}.${String(
    parsedDate.month
  ).padStart(2, '0')}.${parsedDate.year}`;

  return {
    date: parsedDate.dateObj,
    dStr,
    tStr,
    hasExactBirthTime,
    lat,
    lon,
    cityName: countryName ? `${cityName}, ${countryName}` : cityName,
    timezone: birthCityObj?.timezone,
  };
}

export function computeNatalChart(
  dStr: string,
  tStr: string,
  lat: number,
  lon: number,
  timezone?: string,
  hasExactBirthTime: boolean = true
): NatalChartResults | null {
  try {
    const safeLat = typeof lat === 'number' && Number.isFinite(lat) ? lat : DEFAULT_LAT;
    const safeLon = typeof lon === 'number' && Number.isFinite(lon) ? lon : DEFAULT_LON;
    const dateUtc = parseDateTimeToUTC(dStr, tStr, safeLon, timezone);

    if (Number.isNaN(dateUtc.getTime())) {
      console.warn('[computeNatalChart] Invalid dateUtc for:', dStr, tStr, timezone);
      return null;
    }

    const datePlus1Hour = new Date(dateUtc.getTime() + 3600 * 1000);
    const { cusps, asc, mc, dsc, ic } = calculatePlacidusHouses(dateUtc, safeLat, safeLon);

    const sunDeg = getBodyLongitudeAt(Astronomy.Body.Sun, dateUtc);
    const moonDeg = getBodyLongitudeAt(Astronomy.Body.Moon, dateUtc);
    const sunHouse = getHouseForPlanet(sunDeg, cusps);
    const isDayChart = sunHouse >= 7 && sunHouse <= 12;

    const planetPositions: PlanetPosition[] = PLANET_BODIES.map((cfg) => {
      let planetLon = 0;
      let speedDegPerDay = 0;

      if (cfg.specialType === 'north_node') {
        planetLon = getTrueNorthNodeLongitude(dateUtc);
        speedDegPerDay = -0.053;
      } else if (cfg.specialType === 'south_node') {
        planetLon = (getTrueNorthNodeLongitude(dateUtc) + 180) % 360;
        speedDegPerDay = -0.053;
      } else if (cfg.specialType === 'lilith') {
        planetLon = getMeanLilithLongitude(dateUtc);
        speedDegPerDay = 0.1114;
      } else if (cfg.specialType === 'part_of_fortune') {
        planetLon = isDayChart
          ? (asc + moonDeg - sunDeg + 360) % 360
          : (asc + sunDeg - moonDeg + 360) % 360;
        speedDegPerDay = 0;
      } else if (cfg.body) {
        planetLon = getBodyLongitudeAt(cfg.body, dateUtc);
        const lonNext = getBodyLongitudeAt(cfg.body, datePlus1Hour);
        const diff = ((lonNext - planetLon + 540) % 360) - 180;
        speedDegPerDay = Math.round(diff * 24 * 10000) / 10000;
      }

      const zInfo = degToZodiac(planetLon);
      const house = getHouseForPlanet(planetLon, cusps);
      const isRetrograde =
        cfg.key !== 'sun' &&
        cfg.key !== 'moon' &&
        cfg.specialType !== 'part_of_fortune' &&
        speedDegPerDay < 0;

      return {
        key: cfg.key,
        name: cfg.name,
        symbol: cfg.symbol,
        deg: Math.round(planetLon * 10000) / 10000,
        signDeg: Math.round(zInfo.signDeg * 10000) / 10000,
        degFormatted: zInfo.degFormatted,
        sign: zInfo.sign,
        latinSign: zInfo.latinSign,
        signSymbol: zInfo.symbol,
        signBg: zInfo.bgName,
        house,
        element: zInfo.element,
        modality: zInfo.modality,
        polarity: zInfo.polarity,
        isRetrograde,
        speedDegPerDay,
        dignity: getPlanetDignity(cfg.name, zInfo.sign),
      };
    });

    const planetsByKey: Record<string, PlanetPosition> = {};
    for (const p of planetPositions) {
      planetsByKey[p.key] = p;
    }

    const houses: HouseCuspInfo[] = [];
    for (let h = 1; h <= 12; h++) {
      const cuspDeg = cusps[h];
      const zInfo = degToZodiac(cuspDeg);
      const signMeta = ZODIAC_SIGNS.find((s) => s.name === zInfo.sign)!;
      const inHouse = planetPositions
        .filter((p) => p.house === h)
        .map((p) => p.name);

      houses.push({
        house: h,
        cuspDeg: Math.round(cuspDeg * 10000) / 10000,
        signDeg: Math.round(zInfo.signDeg * 10000) / 10000,
        degFormatted: zInfo.degFormatted,
        sign: zInfo.sign,
        latinSign: zInfo.latinSign,
        symbol: zInfo.symbol,
        bgName: zInfo.bgName,
        element: zInfo.element,
        modality: zInfo.modality,
        traditionalRuler: signMeta.traditionalRuler,
        modernRuler: signMeta.modernRuler,
        planetsInHouse: inHouse,
      });
    }

    const aspects = calculateNatalAspects(planetPositions);
    const patterns = detectChartPatterns(planetPositions, aspects);

    const elScores: Record<ElementType, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    const modScores: Record<ModalityType, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
    let yangScore = 0;
    let yinScore = 0;
    let eastern = 0;
    let western = 0;
    let northern = 0;
    let southern = 0;

    for (const cfg of PLANET_BODIES) {
      const p = planetsByKey[cfg.key];
      if (!p) continue;
      elScores[p.element] += cfg.weight;
      modScores[p.modality] += cfg.weight;
      if (p.polarity === 'Yang') yangScore += cfg.weight;
      else yinScore += cfg.weight;

      if ([10, 11, 12, 1, 2, 3].includes(p.house)) eastern += 1;
      else western += 1;

      if (p.house >= 1 && p.house <= 6) northern += 1;
      else southern += 1;
    }

    const ascInfo = degToZodiac(asc);
    const mcInfo = degToZodiac(mc);
    if (hasExactBirthTime) {
      elScores[ascInfo.element] += 2.5;
      elScores[mcInfo.element] += 1.0;
      modScores[ascInfo.modality] += 2.5;
      modScores[mcInfo.modality] += 1.0;
      if (ascInfo.polarity === 'Yang') yangScore += 2.5;
      else yinScore += 2.5;
    }

    const totalEl = elScores.Fire + elScores.Earth + elScores.Air + elScores.Water || 1;
    const elements: ElementDistribution = {
      fire: Math.round(elScores.Fire * 100) / 100,
      earth: Math.round(elScores.Earth * 100) / 100,
      air: Math.round(elScores.Air * 100) / 100,
      water: Math.round(elScores.Water * 100) / 100,
      shares: {
        fire: Math.round((elScores.Fire / totalEl) * 10000) / 10000,
        air: Math.round((elScores.Air / totalEl) * 10000) / 10000,
        water: Math.round((elScores.Water / totalEl) * 10000) / 10000,
        earth: Math.round((elScores.Earth / totalEl) * 10000) / 10000,
      },
      dominantElement: Object.entries(elScores).sort((a, b) => b[1] - a[1])[0][0] as ElementType,
      lackingElement:
        (Object.entries(elScores).find(([, val]) => val <= 1.0)?.[0] as ElementType) || null,
    };

    const modalities: ModalityDistribution = {
      cardinal: Math.round(modScores.Cardinal * 100) / 100,
      fixed: Math.round(modScores.Fixed * 100) / 100,
      mutable: Math.round(modScores.Mutable * 100) / 100,
      dominantModality: Object.entries(modScores).sort(
        (a, b) => b[1] - a[1]
      )[0][0] as ModalityType,
    };

    const totalPol = yangScore + yinScore || 1;
    const polarity: PolarityBalance = {
      yang: Math.round(yangScore * 100) / 100,
      yin: Math.round(yinScore * 100) / 100,
      score: Math.round(((yangScore - yinScore) / totalPol) * 1000) / 1000,
      dominantPolarity: yangScore >= yinScore ? 'Yang' : 'Yin',
    };

    const hemispheres: HemisphereBalance = { eastern, western, northern, southern };

    const ascSignMeta = ZODIAC_SIGNS.find((s) => s.name === ascInfo.sign)!;
    const rulerPlanet =
      planetPositions.find((p) => p.name === ascSignMeta.modernRuler) ||
      planetPositions[0];

    const chartRuler: ChartRulerInfo = {
      ascSign: ascInfo.sign,
      traditionalRuler: ascSignMeta.traditionalRuler,
      modernRuler: ascSignMeta.modernRuler,
      rulerSign: rulerPlanet.sign,
      rulerHouse: rulerPlanet.house,
      isRulerRetrograde: rulerPlanet.isRetrograde,
    };

    const signature = `${dStr}|${tStr}|${safeLat.toFixed(4)}|${safeLon.toFixed(4)}|${
      timezone || ''
    }|v2`;

    return {
      signature,
      calculatedAt: new Date().toISOString(),
      zodiacType: 'Tropical',
      houseSystem: 'Placidus',
      ephemerisSource: 'astronomy-engine-jpl',
      hasExactBirthTime,
      dateStr: dStr,
      timeStr: tStr,
      birthDateTimeUtc: dateUtc.toISOString(),
      lat: safeLat,
      lon: safeLon,
      timezone,
      asc,
      mc,
      dsc,
      ic,
      angles: {
        asc: ascInfo,
        mc: mcInfo,
        dsc: degToZodiac(dsc),
        ic: degToZodiac(ic),
      },
      cusps,
      houses,
      planetPositions,
      planetsByKey,
      aspects,
      patterns,
      elements,
      modalities,
      polarity,
      hemispheres,
      isDayChart,
      chartRuler,
    };
  } catch (err) {
    console.warn('[computeNatalChart] Error:', err);
    return null;
  }
}