import { useState, useEffect, useCallback, useMemo } from 'react';
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
      const [resultsToday, resultsTomorrow] = await Promise.all([
        Promise.all(planetNames.map((name) => fetchJPLPlanetPosition(name, todayObj))),
        Promise.all(planetNames.map((name) => fetchJPLPlanetPosition(name, tomorrowObj))),
      ]);

      const computedPositions: DetailedPlanetPosition[] = planetNames.map((name, idx) => {
        const meta = PLANET_METADATA[name];
        const jplToday = resultsToday[idx];
        const jplTomorrow = resultsTomorrow[idx];

        const longitude = jplToday
          ? jplToday.longitude
          : fallbackLongsToday[name as keyof typeof fallbackLongsToday];
        const tomorrowLong = jplTomorrow
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
          isLiveNASA: !!jplToday,
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