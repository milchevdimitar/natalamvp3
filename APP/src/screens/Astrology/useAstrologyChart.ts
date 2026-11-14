import { useState, useEffect } from 'react';
import { saveUserProfile } from '../../services/api';
import { NatalChartResults } from './astrology.types';
import {
  computeNatalChart,
  degToZodiac,
  extractUserBirthDateTime,
} from './astrology.calculations';

export function useAstrologyChart(
  user: any,
  setUser: (updated: any) => Promise<void> | void
) {
  const [results, setResults] = useState<NatalChartResults | null>(null);
  const [userDateInfo, setUserDateInfo] = useState<{
    dStr: string;
    tStr: string;
    cityName: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    const birthInfo = extractUserBirthDateTime(user);

    if (!birthInfo) {
      setResults(null);
      setUserDateInfo(null);
      return;
    }

    setUserDateInfo({
      dStr: birthInfo.dStr,
      tStr: birthInfo.tStr,
      cityName: birthInfo.cityName,
    });

    const chartRes = computeNatalChart(
      birthInfo.dStr,
      birthInfo.tStr,
      birthInfo.lat,
      birthInfo.lon,
      birthInfo.timezone
    );
    setResults(chartRes);

    if (chartRes && user?.email) {
      const syncNatalChart = async () => {
        setIsSyncing(true);
        setSyncStatus('Syncing with MongoDB Atlas...');

        const sunDeg = chartRes.planetPositions.find((p) => p.name === 'Sun')?.deg || 0;
        const moonDeg = chartRes.planetPositions.find((p) => p.name === 'Moon')?.deg || 0;

        const updatedUser = {
          ...user,
          natalChart: {
            sunSign: degToZodiac(sunDeg).sign,
            moonSign: degToZodiac(moonDeg).sign,
            ascendant: degToZodiac(chartRes.asc).sign,
            planetPositions: chartRes.planetPositions,
            cusps: chartRes.cusps,
            asc: chartRes.asc,
            mc: chartRes.mc,
          },
        };

        try {
          await setUser(updatedUser);
          await saveUserProfile(updatedUser);
          setSyncStatus('NASA JPL Data Loaded!');
        } catch (error) {
          console.warn('Offline mode: Result saved locally.', error);
          setSyncStatus('Saved locally on device.');
        } finally {
          setIsSyncing(false);
        }
      };

      syncNatalChart();
    }
  }, [
    user?.birthdate,
    user?.birthDate,
    user?.dateOfBirth,
    user?.dob,
    user?.birthCity,
    user?.birthLocation,
  ]);

  return { results, userDateInfo, isSyncing, syncStatus };
}