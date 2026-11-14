export interface CityLocation {
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
  region?: string;
}

export async function searchCities(query: string): Promise<CityLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const isCyrillic = /[а-яА-ЯёЁ]/.test(trimmed);
  const lang = isCyrillic ? 'bg' : 'en';

  // 1. Основен източник: Open-Meteo Geocoding API (връща и timezone)
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=15&language=${lang}&format=json`;

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map((item: any) => ({
          name: item.name,
          country: item.country || item.country_code || '',
          lat: Number(item.latitude),
          lng: Number(item.longitude),
          timezone: item.timezone || 'UTC',
          region: item.admin1 || undefined,
        }));
      }
    }
  } catch (error) {
    console.warn('Open-Meteo geocoding error, switching to fallback:', error);
  }

  // 2. Резервен източник: OpenStreetMap Nominatim API
  try {
    const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}&format=json&addressdetails=1&limit=10`;

    const fallbackRes = await fetch(fallbackUrl, {
      headers: {
        'Accept-Language': isCyrillic ? 'bg,en' : 'en',
        'User-Agent': 'NatalaApp/1.0',
      },
    });

    if (fallbackRes.ok) {
      const items = await fallbackRes.json();
      if (Array.isArray(items)) {
        return items.map((item: any) => ({
          name: item.name || item.display_name?.split(',')[0] || trimmed,
          country: item.address?.country || '',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          timezone: 'UTC',
          region: item.address?.state || item.address?.city || undefined,
        }));
      }
    }
  } catch (fallbackError) {
    console.error('Fallback geocoding error:', fallbackError);
  }

  return [];
}