import { API_BASE_URL } from './apiBase';
import * as CSC from 'country-state-city';

export interface CityLocation {
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
  region?: string;
}

interface NormalizedCity {
  name: string;
  countryCode: string;
  stateCode: string;
  latitude: string | number;
  longitude: string | number;
}

const Country = CSC.Country || (CSC as any).default?.Country;
const State = CSC.State || (CSC as any).default?.State;
const City = CSC.City || (CSC as any).default?.City;

let countryMap: Map<
  string,
  { name: string; timezones: Array<{ zoneName: string; gmtOffset: number }> }
> | null = null;
let stateMap: Map<string, string> | null = null;

function ensureMapsLoaded() {
  if (countryMap && stateMap) return;
  if (!Country || !State) {
    throw new Error('country-state-city module is not loaded');
  }

  const cMap = new Map<
    string,
    { name: string; timezones: Array<{ zoneName: string; gmtOffset: number }> }
  >();

  const allCountries =
    typeof Country.getAllCountries === 'function'
      ? Country.getAllCountries()
      : [];

  for (const c of allCountries || []) {
    if (!c || typeof c !== 'object' || !c.isoCode || typeof c.name !== 'string') {
      continue;
    }
    cMap.set(c.isoCode, {
      name: c.name,
      timezones: Array.isArray(c.timezones) ? c.timezones : [],
    });
  }
  countryMap = cMap;

  const sMap = new Map<string, string>();
  const allStates =
    typeof State.getAllStates === 'function' ? State.getAllStates() : [];

  for (const s of allStates || []) {
    if (
      !s ||
      typeof s !== 'object' ||
      !s.countryCode ||
      !s.isoCode ||
      typeof s.name !== 'string'
    ) {
      continue;
    }
    sMap.set(`${s.countryCode}-${s.isoCode}`, s.name);
  }
  stateMap = sMap;
}

function resolveTimezoneFromCountry(
  timezones: Array<{ zoneName: string; gmtOffset: number }>,
  lng: number
): string {
  if (!timezones || timezones.length === 0) return 'UTC';
  if (timezones.length === 1) return timezones[0]?.zoneName || 'UTC';

  const targetOffsetSec = Math.round(lng / 15) * 3600;
  let bestZone = timezones[0]?.zoneName || 'UTC';
  let smallestDiff = Infinity;

  for (const tz of timezones) {
    if (!tz || typeof tz !== 'object') continue;
    const diff = Math.abs((tz.gmtOffset ?? 0) - targetOffsetSec);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      bestZone = tz.zoneName || bestZone;
    }
  }

  return bestZone;
}

function normalizeCityRecord(raw: any): NormalizedCity | null {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    if (typeof raw[0] !== 'string') return null;
    return {
      name: raw[0],
      countryCode: String(raw[1] || ''),
      stateCode: String(raw[2] || ''),
      latitude: raw[3],
      longitude: raw[4],
    };
  }

  if (typeof raw === 'object' && typeof raw.name === 'string') {
    return {
      name: raw.name,
      countryCode: String(raw.countryCode || ''),
      stateCode: String(raw.stateCode || ''),
      latitude: raw.latitude,
      longitude: raw.longitude,
    };
  }

  return null;
}

export async function searchCities(query: string): Promise<CityLocation[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  // 1. Offline search across all world cities via country-state-city
  try {
    ensureMapsLoaded();
    const allCities =
      typeof City?.getAllCities === 'function' ? City.getAllCities() : [];

    if (Array.isArray(allCities) && allCities.length > 0 && countryMap && stateMap) {
      const exactMatches: NormalizedCity[] = [];
      const prefixMatches: NormalizedCity[] = [];
      const partialMatches: NormalizedCity[] = [];

      for (let i = 0; i < allCities.length; i++) {
        const item = normalizeCityRecord(allCities[i]);
        if (!item) continue;

        const lower = item.name.toLowerCase();

        if (lower === trimmed) {
          exactMatches.push(item);
        } else if (prefixMatches.length < 25 && lower.startsWith(trimmed)) {
          prefixMatches.push(item);
        } else if (partialMatches.length < 25 && lower.includes(trimmed)) {
          partialMatches.push(item);
        }
      }

      const combined = [...exactMatches, ...prefixMatches, ...partialMatches].slice(
        0,
        25
      );

      return combined
        .map((item) => {
          const lat = Number(item.latitude);
          const lng = Number(item.longitude);
          if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

          const countryInfo = countryMap!.get(item.countryCode);
          const countryName = countryInfo?.name || item.countryCode || 'Unknown';
          const timezone = resolveTimezoneFromCountry(
            countryInfo?.timezones || [],
            lng
          );
          const regionName = stateMap!.get(
            `${item.countryCode}-${item.stateCode}`
          );

          return {
            name: item.name,
            country: countryName,
            lat,
            lng,
            timezone,
            ...(regionName ? { region: regionName } : {}),
          };
        })
        .filter(Boolean) as CityLocation[];
    }
  } catch (err) {
    console.warn('Offline city search unavailable, falling back to API:', err);
  }

  // 2. Fallback to Open-Meteo Geocoding API
  const res = await fetch(
    `${API_BASE_URL}/locations/search?name=${encodeURIComponent(
      trimmed
    )}`
  );
  if (!res.ok) {
    throw new Error(`Geocoding request failed (${res.status})`);
  }
  const data = await res.json();
  if (!Array.isArray(data.results)) return [];

  return data.results.map((item: any) => ({
    name: item.name,
    country: item.country || item.country_code || '',
    lat: Number(item.latitude),
    lng: Number(item.longitude),
    timezone: item.timezone || 'UTC',
    region: item.admin1 || undefined,
  }));
}