import * as Astronomy from 'astronomy-engine';
import {
  DEFAULT_LAT,
  DEFAULT_LON,
  OBLIQUITY_RAD,
  PLANET_BODIES,
  ZODIAC_SIGNS,
} from './astrology.constants';
import {
  NatalChartResults,
  PlanetPosition,
  UserBirthDateTime,
  ZodiacPosition,
} from './astrology.types';

export function parseDateTimeToUTC(
  dStr: string,
  tStr: string,
  lon: number = DEFAULT_LON,
  timezone?: string
): Date {
  const [day, month, year] = dStr.split('.').map(Number);
  const [hour, min] = tStr.split(':').map(Number);

  if (timezone) {
    try {
      const testDate = new Date(Date.UTC(year, month - 1, day, hour, min));
      const targetStr = testDate.toLocaleString('en-US', { timeZone: timezone });
      const targetDate = new Date(targetStr);
      const diffMinutes = Math.round((testDate.getTime() - targetDate.getTime()) / 60000);
      return new Date(Date.UTC(year, month - 1, day, hour, min) + diffMinutes * 60000);
    } catch {
      // Продължаваме с резервната логика при невалиден часови пояс
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
    const offsetHours = isSofiaDST(year, month, day) ? 3 : 2;
    return new Date(Date.UTC(year, month - 1, day, hour - offsetHours, min));
  }

  const approxOffsetHours = Math.round(lon / 15);
  return new Date(Date.UTC(year, month - 1, day, hour - approxOffsetHours, min));
}

export function degToZodiac(deg: number): ZodiacPosition {
  const normalized = ((deg % 360) + 360) % 360;
  const signIdx = Math.floor(normalized / 30);
  const signDeg = normalized % 30;
  const degInt = Math.floor(signDeg);
  const minInt = Math.floor((signDeg - degInt) * 60);

  return {
    degFormatted: `${String(degInt).padStart(2, '0')}°${String(minInt).padStart(2, '0')}'`,
    sign: ZODIAC_SIGNS[signIdx].name,
    latinSign: ZODIAC_SIGNS[signIdx].latin,
    symbol: ZODIAC_SIGNS[signIdx].symbol,
  };
}

export function getHouseForPlanet(planetDeg: number, cusps: number[]): number {
  for (let i = 1; i <= 12; i++) {
    const cCurr = cusps[i];
    const cNext = i < 12 ? cusps[i + 1] : cusps[1];
    if (cCurr < cNext) {
      if (planetDeg >= cCurr && planetDeg < cNext) return i;
    } else if (planetDeg >= cCurr || planetDeg < cNext) {
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

  return { cusps, asc, mc };
}

export function getTrueNorthNodeLongitude(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  return (125.04452 - 0.0529537617 * d + 360000) % 360;
}

export function extractUserBirthDateTime(user: any): UserBirthDateTime | null {
  if (!user) return null;

  const rawDate =
    user.birthdate ||
    user.birthDate ||
    user.dateOfBirth ||
    user.dob ||
    user.birth_date ||
    user.profile?.birthDate ||
    user.profile?.dateOfBirth ||
    user.profile?.dob ||
    user.profile?.birth_date;

  if (!rawDate) return null;

  const birthCityObj =
    user.birthCity ||
    user.birthLocation ||
    user.profile?.birthCity ||
    user.profile?.birthLocation;

  const lat = typeof birthCityObj?.lat === 'number' ? birthCityObj.lat : DEFAULT_LAT;
  const lon =
    typeof birthCityObj?.lng === 'number'
      ? birthCityObj.lng
      : typeof birthCityObj?.lon === 'number'
      ? birthCityObj.lon
      : DEFAULT_LON;

  const cityName = birthCityObj?.name || 'Sofia';
  const countryName = birthCityObj?.country || 'Bulgaria';

  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return {
        date: d,
        dStr: `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(
          2,
          '0'
        )}.${d.getUTCFullYear()}`,
        tStr: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(
          2,
          '0'
        )}`,
        lat,
        lon,
        cityName: countryName ? `${cityName}, ${countryName}` : cityName,
        timezone: birthCityObj?.timezone,
      };
    }
  } catch {
    // Грешка при парсване
  }

  return null;
}

export function computeNatalChart(
  dStr: string,
  tStr: string,
  lat: number,
  lon: number,
  timezone?: string
): NatalChartResults | null {
  try {
    const dateUtc = parseDateTimeToUTC(dStr, tStr, lon, timezone);
    const { cusps, asc, mc } = calculatePlacidusHouses(dateUtc, lat, lon);

    const planetPositions: PlanetPosition[] = PLANET_BODIES.map(({ name, symbol, body, isNode }) => {
      let planetLon = 0;
      if (isNode) {
        planetLon = getTrueNorthNodeLongitude(dateUtc);
      } else if (body) {
        const geoVector = Astronomy.GeoVector(body, dateUtc, true);
        const ecliptic = Astronomy.Ecliptic(geoVector);
        planetLon = (ecliptic.elon + 360) % 360;
      }

      return {
        name,
        symbol,
        deg: planetLon,
        house: getHouseForPlanet(planetLon, cusps),
      };
    });

    return { asc, mc, cusps, planetPositions, dateStr: dStr, timeStr: tStr, lat, lon };
  } catch {
    return null;
  }
}