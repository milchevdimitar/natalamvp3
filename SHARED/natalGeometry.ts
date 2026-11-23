export const NATAL_CALCULATION_VERSION = 'v3';
export const NATAL_SIGNATURE_SUFFIX = '|' + NATAL_CALCULATION_VERSION;

const radians = Math.PI / 180;
export const normalizeDegrees = (value: number) => ((value % 360) + 360) % 360;

// Resolve the civil time by testing the offsets around it, then round-trip each candidate.
// During a fall-back overlap, use the earlier instant. A spring-forward gap has no instant.
export function resolveCivilTime(wall: Date, timezone: string): Date {
  if (!Number.isFinite(wall.getTime())) return new Date(NaN);
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone, hourCycle: 'h23', year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const civilMillis = (instant: number) => {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(({ type, value }) => [type, Number(value)]));
      return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour % 24, parts.minute, parts.second);
    };
    const target = wall.getTime();
    const day = 86400000;
    const offsets = new Set([target - day, target, target + day].map((sample) => civilMillis(sample) - sample));
    const valid = [...offsets].map((offset) => target - offset).filter((candidate) => civilMillis(candidate) === target);
    return new Date(valid.length ? Math.min(...valid) : NaN);
  } catch {
    return new Date(NaN);
  }
}

function isOrdered(cusps: number[]) {
  const spans = cusps.slice(1).map((value, i) => normalizeDegrees(cusps[i === 11 ? 1 : i + 2] - value));
  return spans.every((span) => Number.isFinite(span) && span > 1e-9) &&
    Math.abs(spans.reduce((total, span) => total + span, 0) - 360) < 1e-7;
}

export function houseForLongitude(longitude: number, cusps: number[]): number {
  if (!Number.isFinite(longitude) || cusps.length !== 13) throw new RangeError('Invalid planet or house cusps');
  const angle = normalizeDegrees(longitude - cusps[1]);
  for (let house = 12; house > 0; house--) {
    if (angle >= normalizeDegrees(cusps[house] - cusps[1])) return house;
  }
  throw new RangeError('Could not place planet in a house');
}

export function calculateHouses(armc: number, latitude: number, obliquity: number) {
  if (!Number.isFinite(latitude) || Math.abs(latitude) >= 90) throw new RangeError('Houses are undefined at the poles');
  const ra = armc * radians;
  const eps = obliquity * radians;
  const tanLatitude = Math.tan(latitude * radians);
  const eclipticLongitude = (rightAscension: number) =>
    normalizeDegrees(Math.atan2(Math.sin(rightAscension) / Math.cos(eps), Math.cos(rightAscension)) / radians);
  const mc = eclipticLongitude(ra);
  let asc = normalizeDegrees(Math.atan2(
    Math.cos(ra),
    -Math.sin(ra) * Math.cos(eps) - tanLatitude * Math.sin(eps),
  ) / radians);
  const opposite = (degree: number) => normalizeDegrees(degree + 180);
  const ic = opposite(mc);

  const placidus = (fraction: number, belowHorizon: boolean) => {
    let lo = 0;
    let hi = Math.PI;
    for (let i = 0; i < 45; i++) {
      const delta = (lo + hi) / 2;
      const tanDeclination = Math.sin(ra + delta) * Math.tan(eps);
      const dayArc = Math.acos(-tanLatitude * tanDeclination);
      const target = belowHorizon ? dayArc + fraction * (Math.PI - dayArc) : fraction * dayArc;
      if (delta < target) lo = delta;
      else hi = delta;
    }
    return eclipticLongitude(ra + (lo + hi) / 2);
  };

  const pack = (cusp2: number, cusp3: number, cusp11: number, cusp12: number) => [
    0, asc, cusp2, cusp3, ic, opposite(cusp11), opposite(cusp12),
    opposite(asc), opposite(cusp2), opposite(cusp3), mc, cusp11, cusp12,
  ];
  if (Math.abs(latitude) < 90 - obliquity) {
    const cusps = pack(placidus(1 / 3, true), placidus(2 / 3, true), placidus(1 / 3, false), placidus(2 / 3, false));
    if (isOrdered(cusps)) return { cusps, asc, mc, dsc: opposite(asc), ic, houseSystem: 'Placidus' as const };
  }

  // At polar latitudes the horizon intersection reverses in some sidereal quadrants.
  if (normalizeDegrees(asc - mc) > 180) asc = opposite(asc);
  const arc = (start: number, end: number, fraction: number) =>
    normalizeDegrees(start + normalizeDegrees(end - start) * fraction);
  const cusps = pack(arc(asc, ic, 1 / 3), arc(asc, ic, 2 / 3), arc(mc, asc, 1 / 3), arc(mc, asc, 2 / 3));
  if (!isOrdered(cusps)) throw new RangeError('Could not calculate twelve ordered house cusps');
  return { cusps, asc, mc, dsc: opposite(asc), ic, houseSystem: 'Porphyry' as const };
}

// Mean lunar apogee, projected from the inclined mean lunar orbit onto the ecliptic.
export function meanLunarApogee(ttDays: number, nutationLongitude: number): number {
  const t = ttDays / 36525;
  const longitude = 218.3164477 + t * (481267.88123421 + t * (-0.0015786 + t * (1 / 538841 - t / 65194000)));
  const anomaly = 134.9633964 + t * (477198.8675055 + t * (0.0087414 + t * (1 / 69699 - t / 14712000)));
  const node = 125.0445479 + t * (-1934.1362891 + t * (0.0020754 + t * (1 / 467441 - t / 60616000)));
  const fromNode = normalizeDegrees(longitude - anomaly + 180 - node) * radians;
  const projected = Math.atan2(Math.sin(fromNode) * Math.cos(5.145 * radians), Math.cos(fromNode)) / radians;
  return normalizeDegrees(node + projected + nutationLongitude);
}
