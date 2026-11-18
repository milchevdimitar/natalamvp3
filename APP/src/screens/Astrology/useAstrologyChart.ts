import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Api from '../../services/api';
import { NatalChartResults } from './astrology.types';
import {
  computeNatalChart,
  degToZodiac,
  extractUserBirthDateTime,
  unwrapUserObject,
} from './astrology.calculations';

const STORAGE_CANDIDATE_KEYS = [
  'user',
  'natala_user',
  '@natala_user',
  'userData',
  'auth_user',
  'profile',
];

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
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const lastSyncedSignatureRef = useRef<string | null>(null);
  const hydratedForRef = useRef<string | null>(null);

  useEffect(() => {
    const effectiveUser = unwrapUserObject(user);
    const isWrapped = Boolean(user && effectiveUser && effectiveUser !== user);
    const birthInfo = extractUserBirthDateTime(effectiveUser);

    if (!birthInfo) {
      setResults(null);
      setUserDateInfo(null);

      const identifier =
        effectiveUser?.email || effectiveUser?._id || effectiveUser?.id || 'anonymous';

      if (hydratedForRef.current !== String(identifier)) {
        hydratedForRef.current = String(identifier);

        const hydrateMissingBirthData = async () => {
          setIsSyncing(true);

          try {
            for (const storageKey of STORAGE_CANDIDATE_KEYS) {
              const rawStored = await AsyncStorage.getItem(storageKey);
              if (!rawStored) continue;
              try {
                const parsed = JSON.parse(rawStored);
                const unwrappedStored = unwrapUserObject(parsed);
                if (unwrappedStored && extractUserBirthDateTime(unwrappedStored)) {
                  const merged = { ...effectiveUser, ...unwrappedStored };
                  await setUser(isWrapped ? { ...user, user: merged } : merged);
                  return;
                }
              } catch {
                // Продължаваме към следващия ключ
              }
            }

            const apiAny = Api as Record<string, any>;
            const fetcher =
              apiAny.getUserProfile ||
              apiAny.fetchUserProfile ||
              apiAny.getProfile ||
              apiAny.loadUserProfile ||
              apiAny.fetchProfile;

            if (typeof fetcher === 'function' && identifier !== 'anonymous') {
              const remote = await fetcher(effectiveUser.email || identifier);
              const remoteUser = unwrapUserObject(remote);

              if (remoteUser && extractUserBirthDateTime(remoteUser)) {
                const merged = { ...effectiveUser, ...remoteUser };
                await setUser(isWrapped ? { ...user, user: merged } : merged);
                return;
              }
            }
          } catch (err) {
            console.warn('[useAstrologyChart] Profile hydration failed:', err);
          } finally {
            setIsSyncing(false);
            setIsInitializing(false);
          }
        };

        hydrateMissingBirthData();
      } else {
        setIsInitializing(false);
      }
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
      birthInfo.timezone,
      birthInfo.hasExactBirthTime
    );
    setResults(chartRes);
    setIsInitializing(false);

    if (!chartRes || !(effectiveUser?.email || effectiveUser?._id || effectiveUser?.id)) {
      return;
    }

    if (
      effectiveUser?.natalChart?.signature === chartRes.signature ||
      lastSyncedSignatureRef.current === chartRes.signature
    ) {
      return;
    }

    const syncNatalChart = async () => {
      lastSyncedSignatureRef.current = chartRes.signature;
      setIsSyncing(true);
      setSyncStatus('Syncing full natal chart with MongoDB Atlas...');

      const sunDeg = chartRes.planetsByKey.sun?.deg ?? 0;
      const moonDeg = chartRes.planetsByKey.moon?.deg ?? 0;

      const updatedTargetUser = {
        ...effectiveUser,
        hasExactBirthTime: birthInfo.hasExactBirthTime,
        westernElements: {
          shares: chartRes.elements.shares,
          dominantElement: chartRes.elements.dominantElement,
          lackingElement: chartRes.elements.lackingElement,
          includesAscendant: birthInfo.hasExactBirthTime,
          source: 'weighted_planets',
        },
        polarity: {
          score: chartRes.polarity.score,
          dominantPolarity: chartRes.polarity.dominantPolarity,
          sourceCoverage: 1.0,
          provenance: 'natal_chart_weighted_planets',
        },
        natalChart: {
          sunSign: degToZodiac(sunDeg).sign,
          moonSign: degToZodiac(moonDeg).sign,
          ascendant: degToZodiac(chartRes.asc).sign,
          midheaven: degToZodiac(chartRes.mc).sign,
          descendant: degToZodiac(chartRes.dsc).sign,
          imumCoeli: degToZodiac(chartRes.ic).sign,
          dominantElement: chartRes.elements.dominantElement,
          dominantModality: chartRes.modalities.dominantModality,
          isDayChart: chartRes.isDayChart,
          chartRuler: chartRes.chartRuler,

          signature: chartRes.signature,
          calculatedAt: chartRes.calculatedAt,
          zodiacType: chartRes.zodiacType,
          houseSystem: chartRes.houseSystem,
          ephemerisSource: chartRes.ephemerisSource,
          hasExactBirthTime: chartRes.hasExactBirthTime,
          dateStr: chartRes.dateStr,
          timeStr: chartRes.timeStr,
          birthDateTimeUtc: chartRes.birthDateTimeUtc,
          lat: chartRes.lat,
          lon: chartRes.lon,
          timezone: chartRes.timezone,

          asc: chartRes.asc,
          mc: chartRes.mc,
          dsc: chartRes.dsc,
          ic: chartRes.ic,
          angles: chartRes.angles,
          cusps: chartRes.cusps,
          houses: chartRes.houses,

          planetPositions: chartRes.planetPositions,
          planets: chartRes.planetsByKey,

          aspects: chartRes.aspects,
          patterns: chartRes.patterns,

          elements: chartRes.elements,
          modalities: chartRes.modalities,
          polarity: chartRes.polarity,
          hemispheres: chartRes.hemispheres,
        },
      };

      const updatedStatePayload = isWrapped
        ? { ...user, user: updatedTargetUser }
        : updatedTargetUser;

      try {
        await setUser(updatedStatePayload);
        if (typeof Api.saveUserProfile === 'function') {
          await Api.saveUserProfile(updatedTargetUser);
        }
        setSyncStatus('Full Natal Chart Saved to Cloud!');
      } catch (error) {
        console.warn('Offline mode: Full chart saved locally.', error);
        setSyncStatus('Saved locally on device.');
      } finally {
        setIsSyncing(false);
      }
    };

    syncNatalChart();
  }, [
    user,
    user?.user,
    user?.profile,
    user?.birthdate,
    user?.birthDate,
    user?.dateOfBirth,
    user?.dob,
    user?.birth_date,
    user?.birthday,
    user?.birthTime,
    user?.timeOfBirth,
    user?.birthCity,
    user?.birthLocation,
    user?.email,
  ]);

  return { results, userDateInfo, isInitializing, isSyncing, syncStatus };
}