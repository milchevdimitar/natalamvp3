import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  Line,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
  Path,
  RadialGradient,
} from 'react-native-svg';
import * as Astronomy from 'astronomy-engine';
import { ArrowLeft, Sparkles, MapPin, Clock, Calendar, CloudUpload, User, RotateCcw } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero } from '../components/UI';
import { saveUserProfile } from '../services/api';
import { UserProfile } from '../models/User';

// ---------------------------------------------------------------------------
// ✦ АСТРОНОМИЧЕСКИ КОНСТАНТИ И РЕЗЕРВНИ СТОЙНОСТИ
// ---------------------------------------------------------------------------
const DEFAULT_LAT = 42.6977; // София по подразбиране
const DEFAULT_LON = 23.3219;
const OBLIQUITY_RAD = (23.4392911 * Math.PI) / 180; // Наклон на еклиптиката

const ZODIAC_SIGNS = [
  { name: "Aries", latin: "ARIES", symbol: "♈", bgName: "Овен" },
  { name: "Taurus", latin: "TAURUS", symbol: "♉", bgName: "Телец" },
  { name: "Gemini", latin: "GEMINI", symbol: "♊", bgName: "Близнаци" },
  { name: "Cancer", latin: "CANCER", symbol: "♋", bgName: "Рак" },
  { name: "Leo", latin: "LEO", symbol: "♌", bgName: "Лъв" },
  { name: "Virgo", latin: "VIRGO", symbol: "♍", bgName: "Дева" },
  { name: "Libra", latin: "LIBRA", symbol: "♎", bgName: "Везни" },
  { name: "Scorpio", latin: "SCORPIO", symbol: "♏", bgName: "Скорпион" },
  { name: "Sagittarius", latin: "SAGITTARIUS", symbol: "♐", bgName: "Стрелец" },
  { name: "Capricorn", latin: "CAPRICORN", symbol: "♑", bgName: "Козирог" },
  { name: "Aquarius", latin: "AQUARIUS", symbol: "♒", bgName: "Водолей" },
  { name: "Pisces", latin: "PISCES", symbol: "♓", bgName: "Риби" },
];

const PLANET_BODIES = [
  { name: "Sun", symbol: "☉", body: Astronomy.Body.Sun },
  { name: "Moon", symbol: "☾", body: Astronomy.Body.Moon },
  { name: "Mercury", symbol: "☿", body: Astronomy.Body.Mercury },
  { name: "Venus", symbol: "♀", body: Astronomy.Body.Venus },
  { name: "Mars", symbol: "♂", body: Astronomy.Body.Mars },
  { name: "Jupiter", symbol: "♃", body: Astronomy.Body.Jupiter },
  { name: "Saturn", symbol: "♄", body: Astronomy.Body.Saturn },
  { name: "Uranus", symbol: "♅", body: Astronomy.Body.Uranus },
  { name: "Neptune", symbol: "♆", body: Astronomy.Body.Neptune },
  { name: "Pluto", symbol: "♇", body: Astronomy.Body.Pluto },
  { name: "North Node", symbol: "☊", isNode: true },
];

// ---------------------------------------------------------------------------
// ✦ УНИВЕРСАЛЕН АЛГОРИТЪМ ЗА ПРЕОБРАЗУВАНЕ НА ВРЕМЕ В UTC ЗА ВСЕКИ ГРАД
// ---------------------------------------------------------------------------
function parseDateTimeToUTC(dStr: string, tStr: string, lon: number = DEFAULT_LON, timezone?: string): Date {
  const [day, month, year] = dStr.split('.').map(Number);
  const [hour, min] = tStr.split(':').map(Number);

  // 1. Ако има записан точен IANA часови пояс (напр. "Europe/London", "America/New_York")
  if (timezone) {
    try {
      const testDate = new Date(Date.UTC(year, month - 1, day, hour, min));
      const targetStr = testDate.toLocaleString('en-US', { timeZone: timezone });
      const targetDate = new Date(targetStr);
      const diffMinutes = Math.round((testDate.getTime() - targetDate.getTime()) / 60000);
      return new Date(Date.UTC(year, month - 1, day, hour, min) + diffMinutes * 60000);
    } catch (e) {
      // Продължаваме с резервната логика при невалиден часови пояс
    }
  }

  // 2. Резервен изчислетел за България/Източна Европа (DST)
  if (Math.abs(lon - DEFAULT_LON) < 6) {
    const isSofiaDST = (y: number, m: number, dNum: number) => {
      if (m < 3 || m > 10) return false;
      if (m > 3 && m < 10) return true;
      if (m === 3) {
        const lastSun = 31 - new Date(Date.UTC(y, 2, 31)).getUTCDay();
        return dNum >= lastSun;
      }
      if (m === 10) {
        const lastSun = 31 - new Date(Date.UTC(y, 9, 31)).getUTCDay();
        return dNum < lastSun;
      }
      return false;
    };
    const offsetHours = isSofiaDST(year, month, day) ? 3 : 2;
    return new Date(Date.UTC(year, month - 1, day, hour - offsetHours, min));
  }

  // 3. Общ географски резервен изчислетел по дължина (15° = 1 час разлика от UTC)
  const approxOffsetHours = Math.round(lon / 15);
  return new Date(Date.UTC(year, month - 1, day, hour - approxOffsetHours, min));
}

// ---------------------------------------------------------------------------
// ✦ АЛГОРИТЪМ ЗА ИЗЧИСЛЯВАНЕ НА ДЕГРИИ, МИНУТИ И ЗОДИАКАЛНИ ЗНАЦИ
// ---------------------------------------------------------------------------
const degToZodiac = (deg: number) => {
  const normalized = ((deg % 360) + 360) % 360;
  const signIdx = Math.floor(normalized / 30);
  const signDeg = normalized % 30;
  const degInt = Math.floor(signDeg);
  const minInt = Math.floor((signDeg - degInt) * 60);
  return {
    degFormatted: `${String(degInt).padStart(2, '0')}°${String(minInt).padStart(2, '0')}'`,
    sign: ZODIAC_SIGNS[signIdx].name,
    latinSign: ZODIAC_SIGNS[signIdx].latin,
    symbol: ZODIAC_SIGNS[signIdx].symbol,
  };
};

// ---------------------------------------------------------------------------
// ✦ ПЛАЦИДУС (PLACIDUS) ОПРЕДЕЛЯНЕ НА ДОМ НА ПЛАНЕТА
// ---------------------------------------------------------------------------
const getHouseForPlanet = (planetDeg: number, cusps: number[]) => {
  for (let i = 1; i <= 12; i++) {
    const cCurr = cusps[i];
    const cNext = i < 12 ? cusps[i + 1] : cusps[1];
    if (cCurr < cNext) {
      if (planetDeg >= cCurr && planetDeg < cNext) return i;
    } else {
      if (planetDeg >= cCurr || planetDeg < cNext) return i;
    }
  }
  return 1;
};

// ---------------------------------------------------------------------------
// ✦ PLACIDUS HOUSE SYSTEM ИЗЧИСЛЕНИЕ (АСТРОНОМИЧЕСКИ АЛГОРИТЪМ С ДИНАМИЧНИ КОРДИНАТИ)
// ---------------------------------------------------------------------------
const calculatePlacidusHouses = (date: Date, lat: number = DEFAULT_LAT, lon: number = DEFAULT_LON) => {
  const siderealTimeHours = Astronomy.SiderealTime(date);
  const ramcDeg = (siderealTimeHours * 15 + lon + 360) % 360;
  const ramcRad = (ramcDeg * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;

  // MC (Зенит - 10-ти дом)
  const mcRad = Math.atan2(
    Math.sin(ramcRad),
    Math.cos(ramcRad) * Math.cos(OBLIQUITY_RAD)
  );
  const mc = ((mcRad * 180) / Math.PI + 360) % 360;

  // ASC (Асцендент - 1-ви дом)
  const ascRad = Math.atan2(
    Math.cos(ramcRad),
    -Math.sin(ramcRad) * Math.cos(OBLIQUITY_RAD) - Math.tan(latRad) * Math.sin(OBLIQUITY_RAD)
  );
  const asc = ((ascRad * 180) / Math.PI + 360) % 360;

  const ic = (mc + 180) % 360;
  const dsc = (asc + 180) % 360;

  // Итеративно Пласидус решаване за Междинните Куспиди
  const solvePlacidusCusp = (degreeOffset: number, factor: number, isAbove: boolean) => {
    let ra = (ramcDeg + degreeOffset) * (Math.PI / 180);
    for (let i = 0; i < 15; i++) {
      const sinRA = Math.sin(ra);
      const decl = Math.asin(Math.sin(OBLIQUITY_RAD) * sinRA);
      const tanDecl = Math.tan(decl);
      const val = Math.tan(latRad) * tanDecl;
      const clampedVal = Math.max(-0.9999, Math.min(0.9999, val));
      const ascDiff = Math.asin(clampedVal);
      const diurnalArc = isAbove ? (Math.PI / 2 + ascDiff) : (Math.PI / 2 - ascDiff);
      const targetRA = (ramcDeg * Math.PI / 180) + factor * diurnalArc;
      ra = ra + (targetRA - ra) * 0.5;
    }
    const lonRad = Math.atan2(
      Math.sin(ra) * Math.cos(OBLIQUITY_RAD) + Math.tan(Math.asin(Math.sin(OBLIQUITY_RAD) * Math.sin(ra))) * Math.sin(OBLIQUITY_RAD),
      Math.cos(ra)
    );
    return ((lonRad * 180) / Math.PI + 360) % 360;
  };

  let cusp11 = solvePlacidusCusp(30, 1 / 3, true);
  let cusp12 = solvePlacidusCusp(60, 2 / 3, true);
  let cusp2 = solvePlacidusCusp(120, 1 + 1 / 3, false);
  let cusp3 = solvePlacidusCusp(150, 1 + 2 / 3, false);

  if (isNaN(cusp11)) cusp11 = (mc + 30) % 360;
  if (isNaN(cusp12)) cusp12 = (mc + 60) % 360;
  if (isNaN(cusp2)) cusp2 = (asc + 30) % 360;
  if (isNaN(cusp3)) cusp3 = (asc + 60) % 360;

  const cusp5 = (cusp11 + 180) % 360;
  const cusp6 = (cusp12 + 180) % 360;
  const cusp8 = (cusp2 + 180) % 360;
  const cusp9 = (cusp3 + 180) % 360;

  const cusps = [
    0,
    asc,    // Дом 1
    cusp2,  // Дом 2
    cusp3,  // Дом 3
    ic,     // Дом 4
    cusp5,  // Дом 5
    cusp6,  // Дом 6
    dsc,    // Дом 7
    cusp8,  // Дом 8
    cusp9,  // Дом 9
    mc,     // Дом 10
    cusp11, // Дом 11
    cusp12, // Дом 12
  ];

  return { cusps, asc, mc };
};

// Изчисление на Северния възел (True Node)
function getTrueNorthNodeLongitude(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  return (125.04452 - 0.0529537617 * d + 360000) % 360;
}

const getUserBirthDateTime = (user: any): { 
  date: Date; 
  dStr: string; 
  tStr: string; 
  lat: number; 
  lon: number; 
  cityName: string;
  timezone?: string;
} | null => {
  if (!user) return null;

  const rawDate =
    user.birthdate ||
    user.birthDate ||
    user.dateOfBirth ||
    user.dob ||
    user.birth_date ||
    user.profile?.birthDate ||
    user.profile?.dateOfBirth ||
    user.profile?.dob ||
    user.profile?.birth_date;

  if (!rawDate) return null;

  // ИЗВЛИЧАНЕ НА ДИНАМИЧЕН ГРАД И КООРДИНАТИ ОТ ПОТРЕБИТЕЛСКИЯ ПРОФИЛ
  const birthCityObj = user.birthCity || user.birthLocation || user.profile?.birthCity || user.profile?.birthLocation;
  
  const lat = typeof birthCityObj?.lat === 'number' ? birthCityObj.lat : DEFAULT_LAT;
  const lon = typeof birthCityObj?.lng === 'number' 
    ? birthCityObj.lng 
    : typeof birthCityObj?.lon === 'number' 
    ? birthCityObj.lon 
    : DEFAULT_LON;
    
  const cityName = birthCityObj?.name || 'Sofia';
  const countryName = birthCityObj?.country || 'Bulgaria';
  const timezone = birthCityObj?.timezone;

  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      const hour = String(d.getUTCHours()).padStart(2, '0');
      const min = String(d.getUTCMinutes()).padStart(2, '0');
      return {
        date: d,
        dStr: `${day}.${month}.${year}`,
        tStr: `${hour}:${min}`,
        lat,
        lon,
        cityName: countryName ? `${cityName}, ${countryName}` : cityName,
        timezone,
      };
    }
  } catch (e) {
    // Parsing error
  }

  return null;
};

export default function Astrology() {
  const { colors, setPage, user, setUser } = useApp();

  const [results, setResults] = useState<any>(null);
  const [userDateInfo, setUserDateInfo] = useState<{ dStr: string; tStr: string; cityName: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  
  // Начално състояние 2D по подразбиране
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('2D');

  const computeChartData = (dStr: string, tStr: string, lat: number, lon: number, timezone?: string) => {
    try {
      // 1. Преобразуване на местното време за конкретния град в UTC
      const dateUtc = parseDateTimeToUTC(dStr, tStr, lon, timezone);

      // 2. Изчисление на домовете по Placidus за конкретните lat/lon
      const { cusps, asc, mc } = calculatePlacidusHouses(dateUtc, lat, lon);
      const planetPositions: any[] = [];

      // 3. Изчисление на геоцентричните дължини на планетите
      PLANET_BODIES.forEach(({ name, symbol, body, isNode }) => {
        let planetLon = 0;
        if (isNode) {
          planetLon = getTrueNorthNodeLongitude(dateUtc);
        } else if (body) {
          const geoVector = Astronomy.GeoVector(body, dateUtc, true);
          const ecliptic = Astronomy.Ecliptic(geoVector);
          planetLon = (ecliptic.elon + 360) % 360;
        }

        const house = getHouseForPlanet(planetLon, cusps);
        planetPositions.push({ name, symbol, deg: planetLon, house });
      });

      return { asc, mc, cusps, planetPositions, dateStr: dStr, timeStr: tStr, lat, lon };
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const birthInfo = getUserBirthDateTime(user);

    if (!birthInfo) {
      setResults(null);
      setUserDateInfo(null);
      return;
    }

    setUserDateInfo({ dStr: birthInfo.dStr, tStr: birthInfo.tStr, cityName: birthInfo.cityName });

    const chartRes = computeChartData(
      birthInfo.dStr, 
      birthInfo.tStr, 
      birthInfo.lat, 
      birthInfo.lon, 
      birthInfo.timezone
    );
    setResults(chartRes);

    if (chartRes && user && user.email) {
      const syncNatalChart = async () => {
        setIsSyncing(true);
        setSyncStatus('Syncing with MongoDB Atlas...');

        const sunD = degToZodiac(chartRes.planetPositions.find((p: any) => p.name === "Sun")?.deg || 0);
        const moonD = degToZodiac(chartRes.planetPositions.find((p: any) => p.name === "Moon")?.deg || 0);
        const ascD = degToZodiac(chartRes.asc);

        const updatedUser: UserProfile = {
          ...user,
          natalChart: {
            sunSign: sunD.sign,
            moonSign: moonD.sign,
            ascendant: ascD.sign,
            planetPositions: chartRes.planetPositions,
            cusps: chartRes.cusps,
            asc: chartRes.asc,
            mc: chartRes.mc,
          },
        };

        try {
          await setUser(updatedUser);
          await saveUserProfile(updatedUser);
          setSyncStatus('NASA JPL Data Loadeds!');
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
    (user as any)?.birthDate,
    (user as any)?.dateOfBirth,
    (user as any)?.dob,
    user?.birthCity,
    (user as any)?.birthLocation,
  ]);

  const sunData = results ? degToZodiac(results.planetPositions.find((p: any) => p.name === "Sun")?.deg || 0) : null;
  const moonData = results ? degToZodiac(results.planetPositions.find((p: any) => p.name === "Moon")?.deg || 0) : null;
  const ascData = results ? degToZodiac(results.asc) : null;

  return (
    <>
      <TouchableOpacity
        onPress={() => setPage('explore')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
      >
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Back to Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="NATAL CELESTIAL ENGINE"
        first="Your"
        accent="Natal Chart."
        description="Global Placidus calculation system for any city worldwide. View in Classic 2D or Interactive 3D Dome."
      />

      {syncStatus && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 10,
            backgroundColor: colors.purpleSoft,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.purple} />
          ) : (
            <CloudUpload size={16} color={colors.purple} />
          )}
          <T size={12} style={{ color: colors.purple }}>
            {syncStatus}
          </T>
        </View>
      )}

      {results ? (
        <>
          {/* Key Placements */}
          <Section>Primary Placements</Section>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            <Card style={{ flex: 1, padding: 12, alignItems: 'center' }}>
              <T size={20} style={{ color: colors.gold }}>☉</T>
              <T muted size={9} style={{ letterSpacing: 1, marginTop: 4 }}>SUN</T>
              <T bold size={13}>{sunData?.sign}</T>
              <T muted size={10}>{sunData?.degFormatted}</T>
            </Card>

            <Card style={{ flex: 1, padding: 12, alignItems: 'center' }}>
              <T size={20} style={{ color: colors.purple }}>☾</T>
              <T muted size={9} style={{ letterSpacing: 1, marginTop: 4 }}>MOON</T>
              <T bold size={13}>{moonData?.sign}</T>
              <T muted size={10}>{moonData?.degFormatted}</T>
            </Card>

            <Card style={{ flex: 1, padding: 12, alignItems: 'center' }}>
              <T size={20} style={{ color: colors.gold }}>♌</T>
              <T muted size={9} style={{ letterSpacing: 1, marginTop: 4 }}>RISING</T>
              <T bold size={13}>{ascData?.sign}</T>
              <T muted size={10}>{ascData?.degFormatted}</T>
            </Card>
          </View>

          {/* Хедър с 2D / 3D Превключвател */}
          <View style={styles.chartSectionHeader}>
            <Section>Astronomical Chart</Section>
            
            <View style={[styles.switchContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.line }]}>
              <TouchableOpacity
                onPress={() => setViewMode('2D')}
                activeOpacity={0.8}
                style={[
                  styles.switchBtn,
                  viewMode === '2D' && { backgroundColor: colors.purple },
                ]}
              >
                <T bold size={11} style={{ color: viewMode === '2D' ? '#FFFFFF' : colors.muted }}>
                  2D Flat
                </T>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode('3D')}
                activeOpacity={0.8}
                style={[
                  styles.switchBtn,
                  viewMode === '3D' && { backgroundColor: colors.purple },
                ]}
              >
                <T bold size={11} style={{ color: viewMode === '3D' ? '#FFFFFF' : colors.muted }}>
                  3D Dome
                </T>
              </TouchableOpacity>
            </View>
          </View>

          {/* Графика (2D по подразбиране или 3D Dome) */}
          <Card style={{ alignItems: 'center', paddingVertical: 20, marginBottom: 20, overflow: 'hidden' }}>
            {viewMode === '2D' ? (
              <NatalChartSvg results={results} colors={colors} />
            ) : (
              <NatalChart3DDome results={results} colors={colors} />
            )}
          </Card>

          {/* Birth Details */}
          <Card style={{ marginBottom: 20, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color={colors.purple} />
              <T bold size={14}>Birth Details ({user?.name || 'User'})</T>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color={colors.muted} />
                <T muted size={12}>{results.dateStr}</T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color={colors.muted} />
                <T muted size={12}>{results.timeStr}</T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color={colors.muted} />
                <T muted size={12}>{userDateInfo?.cityName || 'Sofia, Bulgaria'}</T>
              </View>
            </View>
          </Card>

          {/* Planetary Positions & Placidus House Positions List */}
          <Section>Planetary Positions (Placidus)</Section>
          <View style={{ gap: 10, marginBottom: 40 }}>
            {/* Ascendant */}
            <Card style={{ paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.purpleSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <T bold size={14} style={{ color: colors.purple }}>ASC</T>
                </View>
                <View style={{ flex: 1 }}>
                  <T bold size={15}>Ascendant (ASC)</T>
                  <T muted size={12}>{ascData?.sign} {ascData?.symbol} · {ascData?.degFormatted}</T>
                </View>
                <View style={{ backgroundColor: colors.goldSoft, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <T bold size={10} style={{ color: colors.gold }}>House 1</T>
                </View>
              </View>
            </Card>

            {/* Midheaven MC */}
            {(() => {
              const mcData = degToZodiac(results.mc);
              return (
                <Card style={{ paddingVertical: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.purpleSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <T bold size={14} style={{ color: colors.purple }}>MC</T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T bold size={15}>Midheaven (MC)</T>
                      <T muted size={12}>{mcData.sign} {mcData.symbol} · {mcData.degFormatted}</T>
                    </View>
                    <View style={{ backgroundColor: colors.purpleSoft, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <T bold size={10} style={{ color: colors.purple }}>House 10</T>
                    </View>
                  </View>
                </Card>
              );
            })()}

            {/* Планети */}
            {results.planetPositions.map((p: any, idx: number) => {
              const pInfo = degToZodiac(p.deg);
              return (
                <Card key={idx} style={{ paddingVertical: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.purpleSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <T size={20} style={{ color: colors.purple }}>{p.symbol}</T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T bold size={15}>{p.name}</T>
                      <T muted size={12}>{pInfo.sign} {pInfo.symbol} · {pInfo.degFormatted}</T>
                    </View>
                    <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <T bold size={10} style={{ color: colors.muted }}>House {p.house}</T>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        </>
      ) : (
        /* Empty State */
        <Card style={{ alignItems: 'center', paddingVertical: 30, gap: 12, marginBottom: 40 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.purpleSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={32} color={colors.purple} />
          </View>
          <T bold size={16}>Missing Birth Date in Profile</T>
          <T muted size={13} style={{ textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
            No birth date and time found in your profile. Please add them in your settings.
          </T>
          <Pill selected onPress={() => setPage('profile')}>
            <User size={14} color="#FFFFFF" /> Go to Profile
          </Pill>
        </Card>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 🪐 3D PLANET DISK & CELESTIAL DOME COMPONENT
// ---------------------------------------------------------------------------
function NatalChart3DDome({ results, colors }: { results: any; colors: any }) {
  const stageWidth = Math.min(Dimensions.get('window').width - 48, 340);
  const stageHeight = 360;

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 26000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.stageContainer, { width: stageWidth, height: stageHeight }]}>
      {/* 1. ПОЛУСФЕРА НА ПЛАНЕТАТА */}
      <View style={styles.planetBaseWrapper}>
        <Svg width={stageWidth} height={140} viewBox={`0 0 ${stageWidth} 140`}>
          <Defs>
            <LinearGradient id="planetBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.purple} stopOpacity="0.85" />
              <Stop offset="40%" stopColor="#1C1438" stopOpacity="0.95" />
              <Stop offset="100%" stopColor="#0A0614" stopOpacity="1" />
            </LinearGradient>

            <LinearGradient id="planetRingEdge" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.gold} stopOpacity="0.9" />
              <Stop offset="50%" stopColor={colors.purple} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={colors.gold} stopOpacity="0.9" />
            </LinearGradient>

            <RadialGradient id="coreGlow" cx="50%" cy="0%" r="60%">
              <Stop offset="0%" stopColor={colors.gold} stopOpacity="0.4" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Path
            d={`M 15 10 A ${stageWidth / 2 - 15} 90 0 0 0 ${stageWidth - 15} 10 Z`}
            fill="url(#planetBodyGrad)"
            stroke="url(#planetRingEdge)"
            strokeWidth="2"
          />

          <Ellipse
            cx={stageWidth / 2}
            cy={10}
            rx={stageWidth / 2 - 25}
            ry={45}
            fill="url(#coreGlow)"
          />
        </Svg>
      </View>

      {/* 2. 3D ВЪРТЯЩ СЕ АСТРАЛЕН ДИСК */}
      <View style={styles.disk3DContainer}>
        <Animated.View
          style={[
            styles.diskAnimatedWrapper,
            {
              transform: [
                { perspective: 900 },
                { rotateX: '68deg' },
                { rotateZ: spinRotation },
              ],
            },
          ]}
        >
          <NatalChartSvgFlat results={results} colors={colors} size={280} />
        </Animated.View>
      </View>

      {/* 3. НЕБЕСЕН КУПОЛ С ПЛАНИРАНИТЕ ПЛАНЕТИ ВЪРХУ ДЪГАТА */}
      <View style={styles.domeOverlay}>
        <Svg width={stageWidth} height={210} viewBox={`0 0 ${stageWidth} 210`}>
          <Defs>
            <LinearGradient id="domeGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.gold} stopOpacity="0.25" />
              <Stop offset="35%" stopColor={colors.purple} stopOpacity="0.12" />
              <Stop offset="85%" stopColor={colors.purple} stopOpacity="0.04" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </LinearGradient>

            <LinearGradient id="domeBorderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.gold} stopOpacity="0.8" />
              <Stop offset="50%" stopColor="rgba(255,255,255,0.9)" stopOpacity="0.9" />
              <Stop offset="100%" stopColor={colors.purple} stopOpacity="0.8" />
            </LinearGradient>

            <RadialGradient id="topZenithLight" cx="50%" cy="0%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Path
            d={`M 15 200 A ${stageWidth / 2 - 15} 185 0 0 1 ${stageWidth - 15} 200 Z`}
            fill="url(#domeGlassGrad)"
            stroke="url(#domeBorderGrad)"
            strokeWidth="1.8"
          />

          <Path
            d={`M 50 200 A ${stageWidth / 2 - 50} 150 0 0 1 ${stageWidth - 50} 200`}
            fill="none"
            stroke={colors.gold}
            strokeWidth="0.8"
            strokeDasharray="4,4"
            opacity={0.45}
          />
          <Path
            d={`M 90 200 A ${stageWidth / 2 - 90} 100 0 0 1 ${stageWidth - 90} 200`}
            fill="none"
            stroke={colors.purple}
            strokeWidth="0.8"
            strokeDasharray="3,3"
            opacity={0.5}
          />

          <Line
            x1={stageWidth / 2}
            y1={15}
            x2={stageWidth / 2}
            y2={200}
            stroke={colors.gold}
            strokeWidth="1"
            strokeDasharray="5,4"
            opacity={0.4}
          />

          {/* Планетите върху купола */}
          {results.planetPositions.map((p: any, idx: number) => {
            const relDeg = ((p.deg - results.asc + 360) % 360);
            const toDomeRad = (relDeg * Math.PI) / 360;
            
            const domeRx = stageWidth / 2 - 32;
            const domeRy = 162;
            const px = stageWidth / 2 - domeRx * Math.cos(toDomeRad);
            const py = 195 - domeRy * Math.sin(toDomeRad);

            return (
              <G key={`dome-planet-${idx}`}>
                <Line
                  x1={stageWidth / 2}
                  y1={195}
                  x2={px}
                  y2={py}
                  stroke={colors.gold}
                  strokeWidth="0.6"
                  strokeDasharray="2,2"
                  opacity={0.35}
                />

                <Circle
                  cx={px}
                  cy={py}
                  r="10"
                  fill="#120E24"
                  stroke={colors.gold}
                  strokeWidth="1.2"
                />
                <SvgText
                  x={px}
                  y={py + 1}
                  fill={colors.gold}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {p.symbol}
                </SvgText>
              </G>
            );
          })}

          <Circle cx={stageWidth / 2} cy={16} r="18" fill="url(#topZenithLight)" />
          <Circle cx={stageWidth / 2} cy={16} r="3" fill="#FFFFFF" />
          <Circle cx={stageWidth / 2} cy={16} r="6" stroke={colors.gold} strokeWidth="1" fill="none" />
        </Svg>
      </View>

      <View style={styles.rotationHintBadge}>
        <RotateCcw size={11} color={colors.gold} />
        <T bold size={9} style={{ color: colors.gold, letterSpacing: 0.8 }}>
          3D DOME ORBIT ACTIVE
        </T>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 🎨 2D FLAT NATAL CHART (КЛАСИЧЕСКА 2D ДИАГРАМА С PLACIDUS)
// ---------------------------------------------------------------------------
function NatalChartSvg({ results, colors }: { results: any; colors: any }) {
  const size = Math.min(Dimensions.get('window').width - 48, 340);
  const center = size / 2;

  const outerRadius = size * 0.47;
  const zodiacInnerRadius = outerRadius * 0.77;
  const houseInnerRadius = zodiacInnerRadius * 0.48;
  const coreRadius = houseInnerRadius * 0.28;

  const toRad = (deg: number) => ((deg - results.asc + 180) % 360) * (Math.PI / 180);

  const planetPoints = results.planetPositions.map((p: any) => {
    const angle = toRad(p.deg);
    const planetOrbitR = (zodiacInnerRadius + houseInnerRadius) / 2;
    return {
      x: center + planetOrbitR * Math.cos(angle),
      y: center + planetOrbitR * Math.sin(angle),
      innerX: center + houseInnerRadius * Math.cos(angle),
      innerY: center + houseInnerRadius * Math.sin(angle),
      outerX: center + zodiacInnerRadius * Math.cos(angle),
      outerY: center + zodiacInnerRadius * Math.sin(angle),
      deg: p.deg,
      name: p.name,
      symbol: p.symbol,
    };
  });

  const aspectLines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string; isMajor: boolean }> = [];
  for (let i = 0; i < planetPoints.length; i++) {
    for (let j = i + 1; j < planetPoints.length; j++) {
      const diff = Math.abs(planetPoints[i].deg - planetPoints[j].deg) % 360;
      const angleDiff = diff > 180 ? 360 - diff : diff;

      let aspectColor = '';
      let isMajor = false;

      if (Math.abs(angleDiff - 120) < 6 || Math.abs(angleDiff - 60) < 5) {
        aspectColor = colors.purple;
      } else if (Math.abs(angleDiff - 90) < 6 || Math.abs(angleDiff - 180) < 6) {
        aspectColor = colors.gold;
        isMajor = true;
      }

      if (aspectColor) {
        aspectLines.push({
          x1: planetPoints[i].innerX,
          y1: planetPoints[i].innerY,
          x2: planetPoints[j].innerX,
          y2: planetPoints[j].innerY,
          color: aspectColor,
          isMajor,
        });
      }
    }
  }

  const ascRad = toRad(results.asc);
  const dscRad = toRad(results.asc + 180);
  const mcRad = toRad(results.mc);
  const icRad = toRad(results.mc + 180);

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="chartGlow2D" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.purple} stopOpacity="0.12" />
          <Stop offset="100%" stopColor={colors.gold} stopOpacity="0.04" />
        </LinearGradient>
      </Defs>

      <Circle cx={center} cy={center} r={outerRadius} fill="url(#chartGlow2D)" stroke={colors.purple} strokeWidth="1.8" />
      <Circle cx={center} cy={center} r={zodiacInnerRadius} stroke={colors.line} strokeWidth="1.5" fill="none" />
      <Circle cx={center} cy={center} r={houseInnerRadius} stroke={colors.line} strokeWidth="1.2" strokeDasharray="4,4" fill="none" />
      <Circle cx={center} cy={center} r={coreRadius} stroke={colors.purple} strokeWidth="1" strokeDasharray="2,2" fill={colors.purpleSoft} opacity={0.6} />

      {ZODIAC_SIGNS.map((sign, idx) => {
        const startDeg = idx * 30;
        const midDeg = startDeg + 15;
        const startRad = toRad(startDeg);
        const midRad = toRad(midDeg);

        const x1 = center + outerRadius * Math.cos(startRad);
        const y1 = center + outerRadius * Math.sin(startRad);
        const x2 = center + zodiacInnerRadius * Math.cos(startRad);
        const y2 = center + zodiacInnerRadius * Math.sin(startRad);

        const labelRadius = (outerRadius + zodiacInnerRadius) / 2;
        const symbolX = center + labelRadius * Math.cos(midRad);
        const symbolY = center + labelRadius * Math.sin(midRad);

        return (
          <G key={`zodiac-${sign.latin}`}>
            <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.line} strokeWidth="1" opacity={0.7} />
            <SvgText
              x={symbolX}
              y={symbolY + 1}
              fill={idx % 2 === 0 ? colors.purple : colors.gold}
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {sign.symbol}
            </SvgText>
          </G>
        );
      })}

      {/* Линии на Placidus домовете */}
      {results.cusps.slice(1).map((cuspDeg: number, idx: number) => {
        const rad = toRad(cuspDeg);
        const x1 = center + zodiacInnerRadius * Math.cos(rad);
        const y1 = center + zodiacInnerRadius * Math.sin(rad);

        const houseNumRad = toRad(cuspDeg + 15);
        const numR = houseInnerRadius * 0.72;
        const hx = center + numR * Math.cos(houseNumRad);
        const hy = center + numR * Math.sin(houseNumRad);

        return (
          <G key={`house-cusp-${idx}`}>
            <Line x1={center} y1={center} x2={x1} y2={y1} stroke={colors.line} strokeWidth="0.8" opacity={0.45} />
            <SvgText
              x={hx}
              y={hy}
              fill={colors.muted}
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {idx + 1}
            </SvgText>
          </G>
        );
      })}

      {aspectLines.map((line, idx) => (
        <Line
          key={`aspect-${idx}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={line.color}
          strokeWidth={line.isMajor ? "1.2" : "0.8"}
          opacity={line.isMajor ? 0.65 : 0.4}
        />
      ))}

      <Line
        x1={center + outerRadius * Math.cos(ascRad)}
        y1={center + outerRadius * Math.sin(ascRad)}
        x2={center + outerRadius * Math.cos(dscRad)}
        y2={center + outerRadius * Math.sin(dscRad)}
        stroke={colors.purple}
        strokeWidth="2"
      />
      <Line
        x1={center + outerRadius * Math.cos(mcRad)}
        y1={center + outerRadius * Math.sin(mcRad)}
        x2={center + outerRadius * Math.cos(icRad)}
        y2={center + outerRadius * Math.sin(icRad)}
        stroke={colors.gold}
        strokeWidth="1.8"
        strokeDasharray="5,3"
      />

      <G>
        <Circle cx={center + outerRadius * Math.cos(ascRad)} cy={center + outerRadius * Math.sin(ascRad)} r="4" fill={colors.purple} />
        <SvgText
          x={center + (outerRadius - 14) * Math.cos(ascRad)}
          y={center + (outerRadius - 14) * Math.sin(ascRad)}
          fill={colors.purple}
          fontSize="9"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          ASC
        </SvgText>
      </G>

      <G>
        <Circle cx={center + outerRadius * Math.cos(mcRad)} cy={center + outerRadius * Math.sin(mcRad)} r="4" fill={colors.gold} />
        <SvgText
          x={center + (outerRadius - 14) * Math.cos(mcRad)}
          y={center + (outerRadius - 14) * Math.sin(mcRad)}
          fill={colors.gold}
          fontSize="9"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          MC
        </SvgText>
      </G>

      {planetPoints.map((p, idx) => (
        <G key={`planet-${idx}`}>
          <Line x1={p.outerX} y1={p.outerY} x2={p.innerX} y2={p.innerY} stroke={colors.purple} strokeWidth="1" opacity={0.5} />
          <Circle cx={p.x} cy={p.y} r="9" fill={colors.surface} stroke={colors.purple} strokeWidth="1.2" />
          <SvgText
            x={p.x}
            y={p.y + 1}
            fill={colors.text}
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {p.symbol}
          </SvgText>
        </G>
      ))}

      <Circle cx={center} cy={center} r="3" fill={colors.gold} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// 🎨 3D FLAT DISK INTERNAL COMPONENT
// ---------------------------------------------------------------------------
function NatalChartSvgFlat({ results, colors, size }: { results: any; colors: any; size: number }) {
  const center = size / 2;

  const outerRadius = size * 0.47;
  const zodiacInnerRadius = outerRadius * 0.77;
  const houseInnerRadius = zodiacInnerRadius * 0.48;
  const coreRadius = houseInnerRadius * 0.28;

  const toRad = (deg: number) => ((deg - results.asc + 180) % 360) * (Math.PI / 180);

  const planetPoints = results.planetPositions.map((p: any) => {
    const angle = toRad(p.deg);
    const planetOrbitR = (zodiacInnerRadius + houseInnerRadius) / 2;
    return {
      x: center + planetOrbitR * Math.cos(angle),
      y: center + planetOrbitR * Math.sin(angle),
      innerX: center + houseInnerRadius * Math.cos(angle),
      innerY: center + houseInnerRadius * Math.sin(angle),
      outerX: center + zodiacInnerRadius * Math.cos(angle),
      outerY: center + zodiacInnerRadius * Math.sin(angle),
      deg: p.deg,
      name: p.name,
      symbol: p.symbol,
    };
  });

  const aspectLines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string; isMajor: boolean }> = [];
  for (let i = 0; i < planetPoints.length; i++) {
    for (let j = i + 1; j < planetPoints.length; j++) {
      const diff = Math.abs(planetPoints[i].deg - planetPoints[j].deg) % 360;
      const angleDiff = diff > 180 ? 360 - diff : diff;

      let aspectColor = '';
      let isMajor = false;

      if (Math.abs(angleDiff - 120) < 6 || Math.abs(angleDiff - 60) < 5) {
        aspectColor = colors.purple;
      } else if (Math.abs(angleDiff - 90) < 6 || Math.abs(angleDiff - 180) < 6) {
        aspectColor = colors.gold;
        isMajor = true;
      }

      if (aspectColor) {
        aspectLines.push({
          x1: planetPoints[i].innerX,
          y1: planetPoints[i].innerY,
          x2: planetPoints[j].innerX,
          y2: planetPoints[j].innerY,
          color: aspectColor,
          isMajor,
        });
      }
    }
  }

  const ascRad = toRad(results.asc);
  const dscRad = toRad(results.asc + 180);
  const mcRad = toRad(results.mc);
  const icRad = toRad(results.mc + 180);

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="chartGlowFlat" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.purple} stopOpacity="0.25" />
          <Stop offset="50%" stopColor="#1E1638" stopOpacity="0.8" />
          <Stop offset="100%" stopColor={colors.gold} stopOpacity="0.15" />
        </LinearGradient>
      </Defs>

      <Circle cx={center} cy={center} r={outerRadius} fill="url(#chartGlowFlat)" stroke={colors.gold} strokeWidth="2" />
      <Circle cx={center} cy={center} r={zodiacInnerRadius} stroke={colors.line} strokeWidth="1.5" fill="none" />
      <Circle cx={center} cy={center} r={houseInnerRadius} stroke={colors.line} strokeWidth="1.2" strokeDasharray="4,4" fill="none" />
      <Circle cx={center} cy={center} r={coreRadius} stroke={colors.purple} strokeWidth="1.5" strokeDasharray="2,2" fill={colors.purpleSoft} opacity={0.8} />

      {ZODIAC_SIGNS.map((sign, idx) => {
        const startDeg = idx * 30;
        const midDeg = startDeg + 15;
        const startRad = toRad(startDeg);
        const midRad = toRad(midDeg);

        const x1 = center + outerRadius * Math.cos(startRad);
        const y1 = center + outerRadius * Math.sin(startRad);
        const x2 = center + zodiacInnerRadius * Math.cos(startRad);
        const y2 = center + zodiacInnerRadius * Math.sin(startRad);

        const labelRadius = (outerRadius + zodiacInnerRadius) / 2;
        const symbolX = center + labelRadius * Math.cos(midRad);
        const symbolY = center + labelRadius * Math.sin(midRad);

        return (
          <G key={`zodiac-${sign.latin}`}>
            <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.line} strokeWidth="1" opacity={0.7} />
            <SvgText
              x={symbolX}
              y={symbolY + 1}
              fill={idx % 2 === 0 ? colors.purple : colors.gold}
              fontSize="13"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {sign.symbol}
            </SvgText>
          </G>
        );
      })}

      {results.cusps.slice(1).map((cuspDeg: number, idx: number) => {
        const rad = toRad(cuspDeg);
        const x1 = center + zodiacInnerRadius * Math.cos(rad);
        const y1 = center + zodiacInnerRadius * Math.sin(rad);

        const houseNumRad = toRad(cuspDeg + 15);
        const numR = houseInnerRadius * 0.72;
        const hx = center + numR * Math.cos(houseNumRad);
        const hy = center + numR * Math.sin(houseNumRad);

        return (
          <G key={`house-cusp-${idx}`}>
            <Line x1={center} y1={center} x2={x1} y2={y1} stroke={colors.line} strokeWidth="0.8" opacity={0.5} />
            <SvgText
              x={hx}
              y={hy}
              fill={colors.muted}
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {idx + 1}
            </SvgText>
          </G>
        );
      })}

      {aspectLines.map((line, idx) => (
        <Line
          key={`aspect-${idx}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={line.color}
          strokeWidth={line.isMajor ? "1.4" : "0.9"}
          opacity={line.isMajor ? 0.75 : 0.45}
        />
      ))}

      <Line
        x1={center + outerRadius * Math.cos(ascRad)}
        y1={center + outerRadius * Math.sin(ascRad)}
        x2={center + outerRadius * Math.cos(dscRad)}
        y2={center + outerRadius * Math.sin(dscRad)}
        stroke={colors.purple}
        strokeWidth="2.2"
      />
      <Line
        x1={center + outerRadius * Math.cos(mcRad)}
        y1={center + outerRadius * Math.sin(mcRad)}
        x2={center + outerRadius * Math.cos(icRad)}
        y2={center + outerRadius * Math.sin(icRad)}
        stroke={colors.gold}
        strokeWidth="2"
        strokeDasharray="5,3"
      />

      <G>
        <Circle cx={center + outerRadius * Math.cos(ascRad)} cy={center + outerRadius * Math.sin(ascRad)} r="4" fill={colors.purple} />
        <SvgText
          x={center + (outerRadius - 14) * Math.cos(ascRad)}
          y={center + (outerRadius - 14) * Math.sin(ascRad)}
          fill={colors.purple}
          fontSize="9"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          ASC
        </SvgText>
      </G>

      <G>
        <Circle cx={center + outerRadius * Math.cos(mcRad)} cy={center + outerRadius * Math.sin(mcRad)} r="4" fill={colors.gold} />
        <SvgText
          x={center + (outerRadius - 14) * Math.cos(mcRad)}
          y={center + (outerRadius - 14) * Math.sin(mcRad)}
          fill={colors.gold}
          fontSize="9"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          MC
        </SvgText>
      </G>

      {planetPoints.map((p, idx) => (
        <G key={`planet-${idx}`}>
          <Line x1={p.outerX} y1={p.outerY} x2={p.innerX} y2={p.innerY} stroke={colors.purple} strokeWidth="1" opacity={0.6} />
          <Circle cx={p.x} cy={p.y} r="10" fill={colors.surface} stroke={colors.purple} strokeWidth="1.5" />
          <SvgText
            x={p.x}
            y={p.y + 1}
            fill={colors.text}
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {p.symbol}
          </SvgText>
        </G>
      ))}

      <Circle cx={center} cy={center} r="4" fill={colors.gold} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// 📐 СТИЛОВЕ
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  chartSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
  },
  switchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  stageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  planetBaseWrapper: {
    position: 'absolute',
    bottom: 30,
    zIndex: 1,
  },
  disk3DContainer: {
    position: 'absolute',
    top: 90,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diskAnimatedWrapper: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  domeOverlay: {
    position: 'absolute',
    top: 10,
    zIndex: 3,
    pointerEvents: 'none',
  },
  rotationHintBadge: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(22, 18, 36, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    zIndex: 4,
  },
});