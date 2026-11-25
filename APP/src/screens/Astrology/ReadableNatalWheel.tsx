import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G, Line, Text as Label } from 'react-native-svg';
import { T } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { ZODIAC_SIGNS } from './astrology.constants';
import type { NatalChartResults } from './astrology.types';

const center = 180;
const zodiacOuter = 157;
const zodiacInner = 126;
const planetOrbit = 103;
const houseOuter = 81;
const aspectRadius = 61;
const wrap = (deg: number) => ((deg % 360) + 360) % 360;
const angleNames = { asc: 'Ascendant', dsc: 'Descendant', mc: 'Midheaven', ic: 'Imum Coeli' };
const angleKeys = ['asc', 'mc', 'dsc', 'ic'] as const;
const majorAspects = [60, 90, 120, 180];

function project(deg: number, radius: number, origin: number) {
  const theta = (180 - wrap(deg - origin)) * Math.PI / 180;
  return { x: center + radius * Math.cos(theta), y: center + radius * Math.sin(theta) };
}

// Separate the labels along the ring, keeping the marker at the real longitude.
function arrangeLabels<T extends { deg: number }>(items: T[]) {
  const sorted = [...items].sort((a, b) => wrap(a.deg) - wrap(b.deg));
  if (!sorted.length) return [];
  const seam = sorted.reduce((largest, item, i) => {
    const gap = i === sorted.length - 1 ? wrap(sorted[0].deg) + 360 - wrap(item.deg)
      : wrap(sorted[i + 1].deg) - wrap(item.deg);
    return gap > largest.gap ? { gap, index: (i + 1) % sorted.length } : largest;
  }, { gap: 0, index: 0 });
  const ordered = [...sorted.slice(seam.index), ...sorted.slice(0, seam.index)];
  const step = Math.min(15, 350 / ordered.length);
  const start = wrap(ordered[0].deg) - seam.gap / 2;
  const targets = ordered.map((item) => wrap(item.deg - ordered[0].deg) + wrap(ordered[0].deg));
  const labels: number[] = [];
  targets.forEach((deg, i) => {
    const latest = start + 360 - step * (ordered.length - i);
    labels.push(Math.max(i ? labels[i - 1] + step : start, Math.min(deg, latest)));
  });
  const shift = targets.reduce((sum, deg, i) => sum + deg - labels[i], 0) / labels.length;
  const correction = Math.max(start - labels[0], Math.min(shift, start + 360 - step - labels[labels.length - 1]));
  return ordered.map((item, i) => ({ item, labelDeg: labels[i] + correction }));
}

export function ReadableNatalWheel({ results, focusKeys }: { results: NatalChartResults; focusKeys?: string[] }) {
  const { colors } = useApp();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 58, 400);
  const [showPositions, setShowPositions] = useState(false);
  const [inspected, setInspected] = useState<string>();
  const [followFocus, setFollowFocus] = useState(true);
  useEffect(() => {
    setFollowFocus(true);
  }, [focusKeys]);
  const activeKeys = followFocus && focusKeys?.length ? focusKeys : inspected ? [inspected] : [];
  const selected = activeKeys[0];
  const exact = results.hasExactBirthTime;
  const origin = exact ? results.asc : 0;
  const point = (deg: number, r: number) => project(deg, r, origin);
  const positions = results.planetPositions.filter((p) => exact || p.key !== 'partOfFortune');
  const houses = exact ? results.houses : [];
  const angles = exact ? angleKeys.map((key) => ({ key, ...results.angles[key] })) : [];
  const selectedPlanet = positions.find((p) => p.key === selected);
  const selectedAngle = angles.find((a) => a.key === selected);
  const selectedHouse = houses.find((h) => `house-${h.house}` === selected);
  const selectedSign = ZODIAC_SIGNS.find((s) => s.latin === selected);
  const toggle = (key: string) => {
    setInspected(activeKeys.length === 1 && activeKeys.includes(key) ? undefined : key);
    setFollowFocus(false);
  };

  function line(key: string, a: ReturnType<typeof point>, b: ReturnType<typeof point>, color: string, weight: number, opacity = 1) {
    return <Line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={weight} opacity={opacity} />;
  }

  function badge(key: string, label: string, at: ReturnType<typeof point>, radius: number, color: string, fontSize = 11) {
    return <G key={key} onPress={() => toggle(key)}>
      <Circle cx={at.x} cy={at.y} r={radius} fill={activeKeys.includes(key) ? colors.purpleSoft : colors.surface}
        fillOpacity={activeKeys.includes(key) ? 1 : 0.94} stroke={color} strokeOpacity={activeKeys.includes(key) ? 1 : 0.55} />
      <Label x={at.x} y={at.y + fontSize * 0.34} textAnchor="middle" fontSize={fontSize}
        fontWeight="700" fill={colors.text}>{label}</Label>
    </G>;
  }

  const selectedPair = activeKeys.length === 2
    ? results.aspects.find((a) => activeKeys.includes(a.body1Key) && activeKeys.includes(a.body2Key))
    : undefined;
  const focused = selectedPair ? [selectedPair.body1, selectedPair.aspectType, selectedPair.body2].join(' · ')
    : selectedPlanet?.name ?? (selectedAngle && angleNames[selectedAngle.key])
    ?? (selectedHouse && `House ${selectedHouse.house}`) ?? selectedSign?.name;
  const detail = selectedPair ? selectedPair.orb.toFixed(2) + "° orb · " + (selectedPair.isApplying ? "Applying" : "Separating") : selectedPlanet ? `${selectedPlanet.sign} ${selectedPlanet.degFormatted}${exact ? ` · House ${selectedPlanet.house}` : ''}${selectedPlanet.isRetrograde ? ' · Retrograde' : ''}`
    : selectedAngle ? `${selectedAngle.sign} ${selectedAngle.degFormatted}`
      : selectedHouse ? `Cusp in ${selectedHouse.sign} ${selectedHouse.degFormatted}${selectedHouse.planetsInHouse.length ? ` · ${selectedHouse.planetsInHouse.join(', ')}` : ''}`
        : selectedSign ? `${selectedSign.element} · ${selectedSign.modality} · Ruler ${selectedSign.traditionalRuler}` : undefined;

  return (
    <View style={styles.container}>
      <View style={[styles.toolbar, { borderColor: colors.line }]}>
        {['Wheel', 'Positions'].map((mode, i) => (
          <Pressable key={mode} accessibilityRole="button" accessibilityState={{ selected: showPositions === Boolean(i) }}
            onPress={() => setShowPositions(Boolean(i))}
            style={[styles.tab, showPositions === Boolean(i) && { backgroundColor: colors.purpleSoft }]}>
            <T bold size={12}>{mode}</T>
          </Pressable>
        ))}
      </View>
      <T size={11} muted>{exact ? `${results.zodiacType} · ${results.houseSystem}` : `${results.zodiacType} · Birth time unknown`}</T>
      {showPositions ? (
        <View style={styles.positions}>
          {positions.map((planet) => (
            <Pressable key={planet.key} accessibilityRole="button" accessibilityState={{ selected: activeKeys.includes(planet.key) }}
              onPress={() => toggle(planet.key)} style={[styles.row, { borderColor: colors.line }, activeKeys.includes(planet.key) && { backgroundColor: colors.purpleSoft }]}>
              <T bold size={12} style={styles.name}>{planet.name}</T>
              <T size={12} style={styles.coordinate}>{planet.sign} {planet.degFormatted}{planet.isRetrograde ? ' Rx' : ''}</T>
              {exact && <T size={11} muted style={styles.house}>H{planet.house}</T>}
            </Pressable>
          ))}
          {exact && <View style={styles.cusps}>
            {angles.map((a) => ({ key: String(a.key), label: a.key.toUpperCase(), sign: a.sign, degrees: a.degFormatted }))
              .concat(houses.map((h) => ({ key: `house-${h.house}`, label: `H${h.house}`, sign: h.sign, degrees: h.degFormatted })))
              .map(({ key, label, sign, degrees }) => (
                <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: selected === key }}
                  onPress={() => toggle(key)} style={[styles.cell, selected === key && { backgroundColor: colors.purpleSoft }]}>
                  <T size={11}><T bold size={11}>{label} </T>{sign} {degrees}</T>
                </Pressable>
              ))}
          </View>}
        </View>
      ) : (
        <Svg width={size} height={size} viewBox="0 0 360 360">
          <Circle cx={center} cy={center} r={zodiacOuter} fill={colors.surface} fillOpacity={0.72} />
          {[zodiacOuter, zodiacInner, houseOuter, aspectRadius].map((r) =>
            <Circle key={r} cx={center} cy={center} r={r} fill="none" stroke={colors.purple} strokeWidth={r === zodiacOuter ? 1.5 : 1} strokeOpacity={0.52} />)}
          {Array.from({ length: 72 }, (_, i) => i * 5).map((deg) =>
            line(`tick-${deg}`, point(deg, zodiacInner), point(deg, deg % 30 === 0 ? zodiacOuter : zodiacInner + (deg % 10 === 0 ? 6 : 3)),
              colors.purple, deg % 30 === 0 ? 1.2 : 0.8, 0.65))}
          {houses.map((h) => line(`cusp-${h.house}`, point(h.cuspDeg, aspectRadius), point(h.cuspDeg, zodiacInner),
            colors.muted, selectedHouse === h ? 2 : 0.85, selectedHouse === h ? 1 : 0.5))}
          {angles.map((a) => line(a.key, point(a.deg, houseOuter), point(a.deg, zodiacOuter + 5), colors.gold, 1.15, 0.75))}
          {results.aspects.filter((a) => majorAspects.includes(a.exactAngle) || (activeKeys.length === 2 && activeKeys.includes(a.body1Key) && activeKeys.includes(a.body2Key))).map((a) => {
            const first = positions.find((p) => p.key === a.body1Key);
            const second = positions.find((p) => p.key === a.body2Key);
            if (!first || !second) return null;
            const focusedAspect = activeKeys.length === 2 ? activeKeys.includes(first.key) && activeKeys.includes(second.key) : first === selectedPlanet || second === selectedPlanet;
            return line(a.id, point(first.deg, aspectRadius), point(second.deg, aspectRadius),
              a.harmony === 'challenging' ? '#fa8e99' : '#80baff', focusedAspect ? 1.7 : 0.9, focusedAspect ? 0.95 : selectedPlanet ? 0.12 : 0.5);
          })}
          {houses.map((house, i) => {
            const next = houses[(i + 1) % houses.length];
            const midpoint = house.cuspDeg + wrap(next.cuspDeg - house.cuspDeg) / 2;
            return badge(`house-${house.house}`, String(house.house), point(midpoint, 71), 9, colors.line);
          })}
          {ZODIAC_SIGNS.map((sign, i) => badge(sign.latin, sign.name.slice(0, 3), point(i * 30 + 15, 142), 13, colors.line))}
          {angles.map((a) => badge(a.key, a.key.toUpperCase(), point(a.deg, 167), 11, colors.gold, 9))}
          {arrangeLabels(positions).map(({ item, labelDeg }) => {
            const at = point(labelDeg, planetOrbit);
            const marker = point(item.deg, zodiacInner);
            return <G key={item.key}>
              {line('leader', marker, at, colors.gold, 1, 0.8)}
              <Circle cx={marker.x} cy={marker.y} r={2} fill={colors.gold} />
              {badge(item.key, item.symbol, at, 12, colors.purple, 15)}
            </G>;
          })}
        </Svg>
      )}
      <View style={styles.detail} accessibilityLiveRegion="polite">
        {focused && <T bold size={13}>{focused}</T>}
        <T muted size={12}>{detail ?? (showPositions ? 'H = House · Rx = Retrograde' : 'Tap a planet, sign, house or angle to inspect it.')}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', gap: 5 },
  toolbar: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 3 },
  tab: { borderRadius: 10, paddingHorizontal: 17, paddingVertical: 6 },
  positions: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2, paddingHorizontal: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  name: { flex: 1 },
  coordinate: { textAlign: 'right' },
  house: { width: 30, textAlign: 'right' },
  cusps: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  cell: { width: '50%', paddingVertical: 1 },
  detail: { alignItems: 'center', minHeight: 22 },
});
