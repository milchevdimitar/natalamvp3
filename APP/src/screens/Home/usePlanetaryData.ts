import { useState, useEffect, useCallback, useMemo } from 'react';
import { calc } from '../../services/calcApi';
import { PLANET_METADATA } from './home.constants';
import { DetailedPlanetPosition } from './home.types';
import {
  checkRetrograde,
  fetchJPLPlanetPosition,
  getFallbackRawLongitudes,
  getZodiacInfo,
} from './home.calculations';

export function usePlanetaryData() {
  const [loadingNASA, setLoadingNASA] = useState(true);
  const [planetaryPositions, setPlanetaryPositions] = useState<DetailedPlanetPosition[]>([]);

  const loadNASAPlanetaryData = useCallback(async () => {
    setLoadingNASA(true);
    const planetNames = Object.keys(PLANET_METADATA);
    const todayObj = new Date();
    const tomorrowObj = new Date(todayObj.getTime() + 86400000);

    const fallbackLongsToday = getFallbackRawLongitudes(todayObj);
    const fallbackLongsTomorrow = getFallbackRawLongitudes(tomorrowObj);

    try {
      const serverPositions = await calc<DetailedPlanetPosition[]>('sky/planets', { date: todayObj.toISOString() }).catch(() => null);
      if (serverPositions?.length === planetNames.length) {
        setPlanetaryPositions(serverPositions);
        return;
      }
      const [resultsToday, resultsTomorrow] = await Promise.all([
        Promise.all(planetNames.map((name) => fetchJPLPlanetPosition(name, todayObj))),
        Promise.all(planetNames.map((name) => fetchJPLPlanetPosition(name, tomorrowObj))),
      ]);

      const computedPositions: DetailedPlanetPosition[] = planetNames.map((name, idx) => {
        const meta = PLANET_METADATA[name];
        const jplToday = resultsToday[idx];
        const jplTomorrow = resultsTomorrow[idx];

        const isLiveNASA = !!(jplToday && jplTomorrow);
        const longitude = isLiveNASA
          ? jplToday.longitude
          : fallbackLongsToday[name as keyof typeof fallbackLongsToday];
        const tomorrowLong = isLiveNASA
          ? jplTomorrow.longitude
          : fallbackLongsTomorrow[name as keyof typeof fallbackLongsTomorrow];

        const isRetrograde =
          name === 'Sun' || name === 'Moon' ? false : checkRetrograde(longitude, tomorrowLong);
        const zodiacInfo = getZodiacInfo(longitude);
        const degInSign = zodiacInfo.degree;
        const progressPercent = Math.min(100, Math.max(5, (degInSign / 30) * 100));

        return {
          planet: meta.symbol,
          name,
          signName: zodiacInfo.sign,
          degInSign,
          zodiacSymbol: zodiacInfo.symbol,
          progressPercent,
          isRetrograde,
          longitude,
          isLiveNASA,
          meta,
        };
      });

      setPlanetaryPositions(computedPositions);
    } catch (err) {
      console.error('Грешка при зареждане от NASA JPL Horizons Proxy:', err);
    } finally {
      setLoadingNASA(false);
    }
  }, []);

  useEffect(() => {
    loadNASAPlanetaryData();
  }, [loadNASAPlanetaryData]);

  const sunData = useMemo(
    () => planetaryPositions.find((p) => p.name === 'Sun'),
    [planetaryPositions]
  );

  const moonData = useMemo(
    () => planetaryPositions.find((p) => p.name === 'Moon'),
    [planetaryPositions]
  );

  return {
    loadingNASA,
    planetaryPositions,
    sunData,
    moonData,
    reloadPlanetaryData: loadNASAPlanetaryData,
  };
}
