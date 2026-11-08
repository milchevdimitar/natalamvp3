import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import * as Astronomy from 'astronomy-engine';
import { ArrowLeft, Sparkles, MapPin, Clock, Calendar } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero } from '../components/UI';

const SOFIA_LAT = 42.6977;
const SOFIA_LON = 23.3219;

const ZODIAC_SIGNS = [
  { name: "Овен", latin: "ARIES", symbol: "♈" },
  { name: "Телец", latin: "TAURUS", symbol: "♉" },
  { name: "Близнаци", latin: "GEMINI", symbol: "♊" },
  { name: "Рак", latin: "CANCER", symbol: "♋" },
  { name: "Лъв", latin: "LEO", symbol: "♌" },
  { name: "Дева", latin: "VIRGO", symbol: "♍" },
  { name: "Везни", latin: "LIBRA", symbol: "♎" },
  { name: "Скорпион", latin: "SCORPIO", symbol: "♏" },
  { name: "Стрелец", latin: "SAGITTARIUS", symbol: "♐" },
  { name: "Козирог", latin: "CAPRICORN", symbol: "♑" },
  { name: "Водолей", latin: "AQUARIUS", symbol: "♒" },
  { name: "Риби", latin: "PISCES", symbol: "♓" },
];

const PLANET_BODIES = [
  { name: "Слънце", symbol: "☉", body: Astronomy.Body.Sun },
  { name: "Луна", symbol: "☾", body: Astronomy.Body.Moon },
  { name: "Меркурий", symbol: "☿", body: Astronomy.Body.Mercury },
  { name: "Венера", symbol: "♀", body: Astronomy.Body.Venus },
  { name: "Марс", symbol: "♂", body: Astronomy.Body.Mars },
  { name: "Юпитер", symbol: "♃", body: Astronomy.Body.Jupiter },
  { name: "Сатурн", symbol: "♄", body: Astronomy.Body.Saturn },
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

export default function Astrology() {
  const { colors, setPage } = useApp();
  const [dateStr, setDateStr] = useState("15.06.2000");
  const [timeStr, setTimeStr] = useState("14:30");
  const [results, setResults] = useState<any>(() => {
    // Начални данни при зареждане
    return computeChartData("15.06.2000", "14:30");
  });

  function computeChartData(dStr: string, tStr: string) {
    try {
      const [day, month, year] = dStr.split('.').map(Number);
      const [hour, minute] = tStr.split(':').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day, hour - 3, minute));

      const { cusps, asc, mc } = calculateHouses(date);
      const planetPositions: any[] = [];

      PLANET_BODIES.forEach(({ name, symbol, body }) => {
        const equVector = Astronomy.Equator(
          body,
          date,
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
  }

  const handleCalculate = () => {
    const res = computeChartData(dateStr, timeStr);
    if (res) {
      setResults(res);
    } else {
      alert("Невалиден формат на датата или часа!");
    }
  };

  const sunData = results ? degToZodiac(results.planetPositions.find((p: any) => p.name === "Слънце")?.deg || 0) : null;
  const moonData = results ? degToZodiac(results.planetPositions.find((p: any) => p.name === "Луна")?.deg || 0) : null;
  const ascData = results ? degToZodiac(results.asc) : null;

  return (
    <>
      <TouchableOpacity
        onPress={() => setPage('explore')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
      >
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Назад към Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="NATALA CELESTIAL ENGINE"
        first="Вашата"
        accent="Натална Карта."
        description="Въведете рождени данни за прецизен астрономически изчислителен анализ."
      />

      {/* Форма за въвеждане */}
      <Card style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <T muted size={11} style={{ marginBottom: 4 }}>
              ДАТА (ДД.ММ.ГГГГ)
            </T>
            <View style={{ height: 44, backgroundColor: colors.surfaceAlt, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 12 }}>
              <TextInput
                style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}
                value={dateStr}
                onChangeText={setDateStr}
                placeholder="15.06.2000"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <T muted size={11} style={{ marginBottom: 4 }}>
              ЧАС (ЧЧ:ММ)
            </T>
            <View style={{ height: 44, backgroundColor: colors.surfaceAlt, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 12 }}>
              <TextInput
                style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}
                value={timeStr}
                onChangeText={setTimeStr}
                placeholder="14:30"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>
        </View>

        <Pill onPress={handleCalculate} selected>
          ✦ Изчисли Натална Карта
        </Pill>
      </Card>

      {results && (
        <>
          {/* Top Placements Highlight (Слънце, Луна, Асцендент) */}
          <Section>Основни Аспекти</Section>
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

          {/* Графика на Наталното Колело */}
          <Section>Астрономическа Графика</Section>
          <Card style={{ alignItems: 'center', paddingVertical: 20, marginBottom: 20 }}>
            <NatalChartSvg results={results} colors={colors} />
          </Card>

          {/* Данни за раждането */}
          <Card style={{ marginBottom: 20, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color={colors.purple} />
              <T bold size={14}>Детайли на раждане</T>
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
                <T muted size={12}>София, България (UTC+3)</T>
              </View>
            </View>
          </Card>

          {/* Позиции на Планетите - Placeholders */}
          <Section>Планетарни Позиции</Section>
          <View style={{ gap: 10, marginBottom: 40 }}>
            {/* Асцендент Placeholder */}
            <Card style={{ paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.purpleSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <T bold size={14} style={{ color: colors.purple }}>ASC</T>
                </View>
                <View style={{ flex: 1 }}>
                  <T bold size={15}>Асцендент (ASC)</T>
                  <T muted size={12}>{ascData?.sign} {ascData?.symbol} · {ascData?.degFormatted}</T>
                </View>
                <View style={{ backgroundColor: colors.goldSoft, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <T bold size={10} style={{ color: colors.gold }}>Дом 1</T>
                </View>
              </View>
            </Card>

            {/* Зенит MC Placeholder */}
            {(() => {
              const mcData = degToZodiac(results.mc);
              return (
                <Card style={{ paddingVertical: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.purpleSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <T bold size={14} style={{ color: colors.purple }}>MC</T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T bold size={15}>Зенит (MC)</T>
                      <T muted size={12}>{mcData.sign} {mcData.symbol} · {mcData.degFormatted}</T>
                    </View>
                    <View style={{ backgroundColor: colors.purpleSoft, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <T bold size={10} style={{ color: colors.purple }}>Дом 10</T>
                    </View>
                  </View>
                </Card>
              );
            })()}

            {/* Списък Планети Placeholders */}
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
                      <T bold size={10} style={{ color: colors.muted }}>Дом {p.house}</T>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        </>
      )}
    </>
  );
}

// Компонент за изчертаване на графиката с SVG
function NatalChartSvg({ results, colors }: { results: any; colors: any }) {
  const size = Math.min(Dimensions.get('window').width - 64, 330);
  const center = size / 2;

  const outerRadius = size * 0.46;
  const zodiacRingInner = outerRadius * 0.78;
  const houseInnerRadius = zodiacRingInner * 0.45;

  const toRad = (deg: number) => ((deg - results.asc + 180) % 360) * (Math.PI / 180);

  // Изчисляване на точки за аспектни линии между планетите
  const planetPoints = results.planetPositions.map((p: any) => {
    const angle = toRad(p.deg);
    return {
      x: center + houseInnerRadius * Math.cos(angle),
      y: center + houseInnerRadius * Math.sin(angle),
      deg: p.deg,
      name: p.name,
    };
  });

  const aspectLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let i = 0; i < planetPoints.length; i++) {
    for (let j = i + 1; j < planetPoints.length; j++) {
      const diff = Math.abs(planetPoints[i].deg - planetPoints[j].deg) % 360;
      const angleDiff = diff > 180 ? 360 - diff : diff;
      // Рисуваме линии за основните аспекти (Conjunction, Sextile, Square, Trine, Opposition)
      if (
        Math.abs(angleDiff - 60) < 6 ||
        Math.abs(angleDiff - 90) < 6 ||
        Math.abs(angleDiff - 120) < 6 ||
        Math.abs(angleDiff - 180) < 6
      ) {
        aspectLines.push({
          x1: planetPoints[i].x,
          y1: planetPoints[i].y,
          x2: planetPoints[j].x,
          y2: planetPoints[j].y,
        });
      }
    }
  }

  return (
    <Svg width={size} height={size}>
      {/* Външна концентрична рамка */}
      <Circle cx={center} cy={center} r={outerRadius} stroke={colors.line} strokeWidth="1.5" fill="none" />
      <Circle cx={center} cy={center} r={zodiacRingInner} stroke={colors.line} strokeWidth="1.5" fill="none" />
      <Circle cx={center} cy={center} r={houseInnerRadius} stroke={colors.line} strokeWidth="1" strokeDasharray="3,3" fill="none" />

      {/* Зодиакални сектори (12 знака) */}
      {ZODIAC_SIGNS.map((sign, idx) => {
        const startDeg = idx * 30;
        const midDeg = startDeg + 15;
        const startRad = toRad(startDeg);
        const midRad = toRad(midDeg);

        const xLine1 = center + outerRadius * Math.cos(startRad);
        const yLine1 = center + outerRadius * Math.sin(startRad);
        const xLine2 = center + zodiacRingInner * Math.cos(startRad);
        const yLine2 = center + zodiacRingInner * Math.sin(startRad);

        const labelRadius = (outerRadius + zodiacRingInner) / 2;
        const tx = center + labelRadius * Math.cos(midRad);
        const ty = center + labelRadius * Math.sin(midRad);

        return (
          <G key={sign.latin}>
            {/* Делителна линия между зодиите */}
            <Line x1={xLine1} y1={yLine1} x2={xLine2} y2={yLine2} stroke={colors.line} strokeWidth="1" />
            {/* Латинско име на зодията по периферията */}
            <SvgText
              x={tx}
              y={ty}
              fill={colors.text}
              fontSize="7.5"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {sign.latin}
            </SvgText>
          </G>
        );
      })}

      {/* Линии на Домовете и техните номера */}
      {results.cusps.slice(1).map((cuspDeg: number, idx: number) => {
        const rad = toRad(cuspDeg);
        const x1 = center + zodiacRingInner * Math.cos(rad);
        const y1 = center + zodiacRingInner * Math.sin(rad);

        const houseNumRad = toRad(cuspDeg + 15);
        const numR = houseInnerRadius * 0.7;
        const hx = center + numR * Math.cos(houseNumRad);
        const hy = center + numR * Math.sin(houseNumRad);

        return (
          <G key={`house-${idx}`}>
            <Line x1={center} y1={center} x2={x1} y2={y1} stroke={colors.line} strokeWidth="0.8" opacity={0.6} />
            <SvgText
              x={hx}
              y={hy}
              fill={colors.muted}
              fontSize="8"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {idx + 1}
            </SvgText>
          </G>
        );
      })}

      {/* Аспектни геометрични линии вътре в наталното колело */}
      {aspectLines.map((line, idx) => (
        <Line
          key={`aspect-${idx}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={idx % 2 === 0 ? colors.purple : colors.gold}
          strokeWidth="0.8"
          opacity={0.45}
        />
      ))}

      {/* Планети и техни маркери */}
      {results.planetPositions.map((p: any, idx: number) => {
        const rad = toRad(p.deg);
        const pR = (zodiacRingInner + houseInnerRadius) / 2;
        const px = center + pR * Math.cos(rad);
        const py = center + pR * Math.sin(rad);

        const tickX1 = center + zodiacRingInner * Math.cos(rad);
        const tickY1 = center + zodiacRingInner * Math.sin(rad);
        const tickX2 = center + (zodiacRingInner - 5) * Math.cos(rad);
        const tickY2 = center + (zodiacRingInner - 5) * Math.sin(rad);

        return (
          <G key={`planet-symbol-${idx}`}>
            <Line x1={tickX1} y1={tickY1} x2={tickX2} y2={tickY2} stroke={colors.purple} strokeWidth="1.5" />
            <Circle cx={px} cy={py} r="3" fill={colors.purple} />
            <SvgText
              x={px}
              y={py - 6}
              fill={colors.text}
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              {p.symbol}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}