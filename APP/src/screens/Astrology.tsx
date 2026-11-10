import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Astronomy from 'astronomy-engine';
import { ArrowLeft, Sparkles, MapPin, Clock, Calendar, CloudUpload, User } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero } from '../components/UI';
import { saveUserProfile } from '../services/api';
import { UserProfile } from '../models/User';

const SOFIA_LAT = 42.6977;
const SOFIA_LON = 23.3219;

const ZODIAC_SIGNS = [
  { name: "Aries", latin: "ARIES", symbol: "♈" },
  { name: "Taurus", latin: "TAURUS", symbol: "♉" },
  { name: "Gemini", latin: "GEMINI", symbol: "♊" },
  { name: "Cancer", latin: "CANCER", symbol: "♋" },
  { name: "Leo", latin: "LEO", symbol: "♌" },
  { name: "Virgo", latin: "VIRGO", symbol: "♍" },
  { name: "Libra", latin: "LIBRA", symbol: "♎" },
  { name: "Scorpio", latin: "SCORPIO", symbol: "♏" },
  { name: "Sagittarius", latin: "SAGITTARIUS", symbol: "♐" },
  { name: "Capricorn", latin: "CAPRICORN", symbol: "♑" },
  { name: "Aquarius", latin: "AQUARIUS", symbol: "♒" },
  { name: "Pisces", latin: "PISCES", symbol: "♓" },
];

const PLANET_BODIES = [
  { name: "Sun", symbol: "☉", body: Astronomy.Body.Sun },
  { name: "Moon", symbol: "☾", body: Astronomy.Body.Moon },
  { name: "Mercury", symbol: "☿", body: Astronomy.Body.Mercury },
  { name: "Venus", symbol: "♀", body: Astronomy.Body.Venus },
  { name: "Mars", symbol: "♂", body: Astronomy.Body.Mars },
  { name: "Jupiter", symbol: "♃", body: Astronomy.Body.Jupiter },
  { name: "Saturn", symbol: "♄", body: Astronomy.Body.Saturn },
];

const degToZodiac = (deg: number) => {
  const normalized = (deg % 360 + 360) % 360;
  const signIdx = Math.floor(normalized / 30);
  const signDeg = normalized % 30;
  const degInt = Math.floor(signDeg);
  const minInt = Math.floor((signDeg - degInt) * 60);
  return {
    degFormatted: `${String(degInt).padStart(2, '0')}° ${String(minInt).padStart(2, '0')}'`,
    sign: ZODIAC_SIGNS[signIdx].name,
    latinSign: ZODIAC_SIGNS[signIdx].latin,
    symbol: ZODIAC_SIGNS[signIdx].symbol,
  };
};

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

const calculateHouses = (date: Date) => {
  const siderealTime = Astronomy.SiderealTime(date);
  const ramc = (siderealTime * 15 + SOFIA_LON) % 360;
  const ascRad = Math.atan2(
    Math.cos((ramc * Math.PI) / 180),
    -Math.sin((ramc * Math.PI) / 180) * Math.cos((SOFIA_LAT * Math.PI) / 180) -
      Math.tan((SOFIA_LAT * Math.PI) / 180) * Math.sin((SOFIA_LAT * Math.PI) / 180)
  );
  let asc = ((ascRad * 180) / Math.PI + 360) % 360;

  const cusps = [0];
  for (let i = 0; i < 12; i++) {
    cusps.push((asc + i * 30) % 360);
  }
  const mc = (asc + 270) % 360;
  return { cusps, asc, mc };
};

const getUserBirthDateTime = (user: any): { date: Date; dStr: string; tStr: string } | null => {
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
  const [userDateInfo, setUserDateInfo] = useState<{ dStr: string; tStr: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const computeChartData = (dateObj: Date, dStr: string, tStr: string) => {
    try {
      const { cusps, asc, mc } = calculateHouses(dateObj);
      const planetPositions: any[] = [];

      PLANET_BODIES.forEach(({ name, symbol, body }) => {
        const equVector = Astronomy.Equator(
          body,
          dateObj,
          new Astronomy.Observer(SOFIA_LAT, SOFIA_LON, 0),
          true,
          true
        );
        const ecliptic = Astronomy.Ecliptic(equVector.vec);
        const lon = (ecliptic.elon + 360) % 360;
        const house = getHouseForPlanet(lon, cusps);
        planetPositions.push({ name, symbol, deg: lon, house });
      });

      return { asc, mc, cusps, planetPositions, dateStr: dStr, timeStr: tStr };
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

    setUserDateInfo({ dStr: birthInfo.dStr, tStr: birthInfo.tStr });

    const chartRes = computeChartData(birthInfo.date, birthInfo.dStr, birthInfo.tStr);
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
          setSyncStatus('Natal chart saved to database!');
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
        description="Astronomical calculation and precision analysis of your natal chart."
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

          {/* Astronomical Chart Graphic */}
          <Section>Astronomical Chart</Section>
          <Card style={{ alignItems: 'center', paddingVertical: 20, marginBottom: 20 }}>
            <NatalChartSvg results={results} colors={colors} />
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
                <T muted size={12}>{user?.birthCity?.name || 'Sofia'}, {user?.birthCity?.country || 'Bulgaria'}</T>
              </View>
            </View>
          </Card>

          {/* Planetary Positions List */}
          <Section>Planetary Positions</Section>
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

            {/* Planets */}
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
        aspectColor = colors.purple; // Trine / Sextile
      } else if (Math.abs(angleDiff - 90) < 6 || Math.abs(angleDiff - 180) < 6) {
        aspectColor = colors.gold; // Square / Opposition
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
        <LinearGradient id="chartGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.purple} stopOpacity="0.12" />
          <Stop offset="100%" stopColor={colors.gold} stopOpacity="0.04" />
        </LinearGradient>
      </Defs>

      {/* Background Rings */}
      <Circle cx={center} cy={center} r={outerRadius} fill="url(#chartGlow)" stroke={colors.purple} strokeWidth="1.8" />
      <Circle cx={center} cy={center} r={zodiacInnerRadius} stroke={colors.line} strokeWidth="1.5" fill="none" />
      <Circle cx={center} cy={center} r={houseInnerRadius} stroke={colors.line} strokeWidth="1.2" strokeDasharray="4,4" fill="none" />
      <Circle cx={center} cy={center} r={coreRadius} stroke={colors.purple} strokeWidth="1" strokeDasharray="2,2" fill={colors.purpleSoft} opacity={0.6} />

      {/* Zodiac Sectors & Symbols */}
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

      {/* House Cusps */}
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

      {/* Aspect Lines */}
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

      {/* ASC - DSC & MC - IC Axes */}
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

      {/* ASC / MC Markers */}
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

      {/* Planetary Markers */}
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

      {/* Chart Center */}
      <Circle cx={center} cy={center} r="3" fill={colors.gold} />
    </Svg>
  );
}