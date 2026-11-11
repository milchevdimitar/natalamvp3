// ascendantCalc.ts

/** Изчисляване на градуса на Асцендента спрямо UTC дата и координати */
export function calculateAscendant(utcDate: Date, lat: number, lng: number): number {
  // 1. Julian Date
  const jd = utcDate.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;

  // 2. Greenwich Mean Sidereal Time (GMST)
  let gmst = 280.46061837 + 360.98564736629 * d;
  gmst = ((gmst % 360) + 360) % 360;

  // 3. Local Sidereal Time (LST)
  const lst = (gmst + lng) % 360;
  const lstRad = (lst * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;

  // 4. Осна инклинация на Земята (Obliquity of the Ecliptic ~ 23.44°)
  const epsRad = (23.439291 * Math.PI) / 180;

  // 5. Формула за Асцендент: tan(ASC) = cos(LST) / (-sin(LST)*cos(eps) - tan(lat)*sin(eps))
  const y = Math.cos(lstRad);
  const x = -Math.sin(lstRad) * Math.cos(epsRad) - Math.tan(latRad) * Math.sin(epsRad);

  let ascRad = Math.atan2(y, x);
  let ascDeg = (ascRad * 180) / Math.PI;
  ascDeg = ((ascDeg % 360) + 360) % 360;

  return ascDeg;
}