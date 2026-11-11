// src/services/locationService.ts

export interface CityLocation {
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

/** Търсене на градове по целия свят (OpenStreetMap Nominatim) */
export async function searchCities(query: string): Promise<CityLocation[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query.trim()
    )}&addressdetails=1&limit=5`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NatalaAstrologyApp/1.0',
      },
    });

    if (!response.ok) return [];
    const data = await response.json();

    return data.map((item: any) => {
      const city =
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.municipality ||
        item.display_name.split(',')[0];

      const country = item.address?.country || '';
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);

      return {
        name: city,
        country,
        lat,
        lng,
        timezone: getTimezoneFromCoords(lat, lng),
      };
    });
  } catch (error) {
    console.error('City search error:', error);
    return [];
  }
}

function getTimezoneFromCoords(lat: number, lng: number): string {
  if (lat > 35 && lat < 70 && lng > 10 && lng < 40) return 'Europe/Sofia';
  if (lng < -50) return 'America/New_York';
  if (lng > 100) return 'Asia/Tokyo';
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}