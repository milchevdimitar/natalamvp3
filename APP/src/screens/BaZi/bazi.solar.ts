import { CityPreset, TrueSolarTimeResult } from './bazi.types';

export const CITY_PRESETS: CityPreset[] = [
  { name: 'Sofia', country: 'Bulgaria', longitude: 23.32, tzOffsetHours: 2 },
  { name: 'Plovdiv', country: 'Bulgaria', longitude: 24.75, tzOffsetHours: 2 },
  { name: 'Varna', country: 'Bulgaria', longitude: 27.91, tzOffsetHours: 2 },
  { name: 'Burgas', country: 'Bulgaria', longitude: 27.47, tzOffsetHours: 2 },
  { name: 'London', country: 'UK', longitude: -0.12, tzOffsetHours: 0 },
  { name: 'Berlin', country: 'Germany', longitude: 13.4, tzOffsetHours: 1 },
  { name: 'New York', country: 'USA', longitude: -74.0, tzOffsetHours: -5 },
  { name: 'Tokyo', country: 'Japan', longitude: 139.69, tzOffsetHours: 9 },
];

export const SHICHEN_LABELS: { branchIndex: number; label: string; range: string }[] = [
  { branchIndex: 0, label: 'Zi · Rat (子)', range: '23:00–00:59' },
  { branchIndex: 1, label: 'Chou · Ox (丑)', range: '01:00–02:59' },
  { branchIndex: 2, label: 'Yin · Tiger (寅)', range: '03:00–04:59' },
  { branchIndex: 3, label: 'Mao · Rabbit (卯)', range: '05:00–06:59' },
  { branchIndex: 4, label: 'Chen · Dragon (辰)', range: '07:00–08:59' },
  { branchIndex: 5, label: 'Si · Snake (巳)', range: '09:00–10:59' },
  { branchIndex: 6, label: 'Wu · Horse (午)', range: '11:00–12:59' },
  { branchIndex: 7, label: 'Wei · Goat (未)', range: '13:00–14:59' },
  { branchIndex: 8, label: 'Shen · Monkey (申)', range: '15:00–16:59' },
  { branchIndex: 9, label: 'You · Rooster (酉)', range: '17:00–18:59' },
  { branchIndex: 10, label: 'Xu · Dog (戌)', range: '19:00–20:59' },
  { branchIndex: 11, label: 'Hai · Pig (亥)', range: '21:00–22:59' },
];

export function hourToShichenBranchIndex(hour: number): number {
  return Math.floor((hour + 1) / 2) % 12;
}

export function findCityPreset(cityName?: string): CityPreset {
  if (!cityName) return CITY_PRESETS[0];
  const lower = cityName.trim().toLowerCase();
  const found = CITY_PRESETS.find(
    (c) => lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower)
  );
  return found || CITY_PRESETS[0];
}

// Astronomical Equation of Time (in minutes) for a given day of the year
function computeEquationOfTimeMinutes(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 0);
  const current = Date.UTC(year, month - 1, day);
  const dayOfYear = Math.floor((current - start) / 86400000);
  const b = ((2 * Math.PI) / 365) * (dayOfYear - 81);
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

export function convertLocalToTrueSolarTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  city: CityPreset
): TrueSolarTimeResult {
  const standardMeridian = city.tzOffsetHours * 15;
  const longitudeOffsetMinutes = (city.longitude - standardMeridian) * 4;
  const eotMinutes = computeEquationOfTimeMinutes(year, month, day);
  const totalOffsetMinutes = Math.round(longitudeOffsetMinutes + eotMinutes);

  const localMs = Date.UTC(year, month - 1, day, hour, minute);
  const solarDate = new Date(localMs + totalOffsetMinutes * 60000);

  const solarYear = solarDate.getUTCFullYear();
  const solarMonth = solarDate.getUTCMonth() + 1;
  const solarDay = solarDate.getUTCDate();
  const solarHour = solarDate.getUTCHours();
  const solarMinute = solarDate.getUTCMinutes();

  const shichenBranchIndex = hourToShichenBranchIndex(solarHour);
  const shichen = SHICHEN_LABELS[shichenBranchIndex];

  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    localTimeStr: `${pad(hour)}:${pad(minute)}`,
    solarTimeStr: `${pad(solarHour)}:${pad(solarMinute)}`,
    solarDateStr: `${pad(solarDay)}.${pad(solarMonth)}.${solarYear}`,
    totalOffsetMinutes,
    longitudeOffsetMinutes: Math.round(longitudeOffsetMinutes),
    eotMinutes: Math.round(eotMinutes),
    city,
    solarYear,
    solarMonth,
    solarDay,
    solarHour,
    solarMinute,
    shichenBranchIndex,
    shichenLabel: shichen ? `${shichen.label} (${shichen.range})` : '',
  };
}