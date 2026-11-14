import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ZODIAC_SIGNS } from './astrology.constants';
import { AspectLine, ChartViewMode, NatalChartResults } from './astrology.types';

interface NatalChartWheelProps {
  results: NatalChartResults;
  colors: any;
  size?: number;
  variant?: ChartViewMode;
}

export function NatalChartWheel({
  results,
  colors,
  size = Math.min(Dimensions.get('window').width - 48, 340),
  variant = '2D',
}: NatalChartWheelProps) {
  const is3D = variant === '3D';
  const center = size / 2;

  const outerRadius = size * 0.47;
  const zodiacInnerRadius = outerRadius * 0.77;
  const houseInnerRadius = zodiacInnerRadius * 0.48;
  const coreRadius = houseInnerRadius * 0.28;

  const toRad = (deg: number) => ((deg - results.asc + 180) % 360) * (Math.PI / 180);

  const { planetPoints, aspectLines } = useMemo(() => {
    const planetOrbitR = (zodiacInnerRadius + houseInnerRadius) / 2;

    const points = results.planetPositions.map((p) => {
      const angle = toRad(p.deg);
      return {
        x: center + planetOrbitR * Math.cos(angle),
        y: center + planetOrbitR * Math.sin(angle),
        innerX: center + houseInnerRadius * Math.cos(angle),
        innerY: center + houseInnerRadius * Math.sin(angle),
        outerX: center + zodiacInnerRadius * Math.cos(angle),
        outerY: center + zodiacInnerRadius * Math.sin(angle),
        deg: p.deg,
        symbol: p.symbol,
      };
    });

    const lines: AspectLine[] = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const diff = Math.abs(points[i].deg - points[j].deg) % 360;
        const angleDiff = diff > 180 ? 360 - diff : diff;

        if (Math.abs(angleDiff - 120) < 6 || Math.abs(angleDiff - 60) < 5) {
          lines.push({
            x1: points[i].innerX,
            y1: points[i].innerY,
            x2: points[j].innerX,
            y2: points[j].innerY,
            color: colors.purple,
            isMajor: false,
          });
        } else if (Math.abs(angleDiff - 90) < 6 || Math.abs(angleDiff - 180) < 6) {
          lines.push({
            x1: points[i].innerX,
            y1: points[i].innerY,
            x2: points[j].innerX,
            y2: points[j].innerY,
            color: colors.gold,
            isMajor: true,
          });
        }
      }
    }

    return { planetPoints: points, aspectLines: lines };
  }, [results, center, zodiacInnerRadius, houseInnerRadius, colors]);

  const ascRad = toRad(results.asc);
  const dscRad = toRad(results.asc + 180);
  const mcRad = toRad(results.mc);
  const icRad = toRad(results.mc + 180);
  const gradientId = is3D ? 'chartGlowFlat' : 'chartGlow2D';

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="chartGlow2D" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.purple} stopOpacity="0.12" />
          <Stop offset="100%" stopColor={colors.gold} stopOpacity="0.04" />
        </LinearGradient>
        <LinearGradient id="chartGlowFlat" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.purple} stopOpacity="0.25" />
          <Stop offset="50%" stopColor="#1E1638" stopOpacity="0.8" />
          <Stop offset="100%" stopColor={colors.gold} stopOpacity="0.15" />
        </LinearGradient>
      </Defs>

      <Circle
        cx={center}
        cy={center}
        r={outerRadius}
        fill={`url(#${gradientId})`}
        stroke={is3D ? colors.gold : colors.purple}
        strokeWidth={is3D ? '2' : '1.8'}
      />
      <Circle cx={center} cy={center} r={zodiacInnerRadius} stroke={colors.line} strokeWidth="1.5" fill="none" />
      <Circle cx={center} cy={center} r={houseInnerRadius} stroke={colors.line} strokeWidth="1.2" strokeDasharray="4,4" fill="none" />
      <Circle
        cx={center}
        cy={center}
        r={coreRadius}
        stroke={colors.purple}
        strokeWidth={is3D ? '1.5' : '1'}
        strokeDasharray="2,2"
        fill={colors.purpleSoft}
        opacity={is3D ? 0.8 : 0.6}
      />

      {ZODIAC_SIGNS.map((sign, idx) => {
        const startRad = toRad(idx * 30);
        const midRad = toRad(idx * 30 + 15);
        const labelRadius = (outerRadius + zodiacInnerRadius) / 2;

        return (
          <G key={`zodiac-${sign.latin}`}>
            <Line
              x1={center + outerRadius * Math.cos(startRad)}
              y1={center + outerRadius * Math.sin(startRad)}
              x2={center + zodiacInnerRadius * Math.cos(startRad)}
              y2={center + zodiacInnerRadius * Math.sin(startRad)}
              stroke={colors.line}
              strokeWidth="1"
              opacity={0.7}
            />
            <SvgText
              x={center + labelRadius * Math.cos(midRad)}
              y={center + labelRadius * Math.sin(midRad) + 1}
              fill={idx % 2 === 0 ? colors.purple : colors.gold}
              fontSize={is3D ? '13' : '12'}
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {sign.symbol}
            </SvgText>
          </G>
        );
      })}

      {results.cusps.slice(1).map((cuspDeg, idx) => {
        const rad = toRad(cuspDeg);
        const houseNumRad = toRad(cuspDeg + 15);
        const numR = houseInnerRadius * 0.72;

        return (
          <G key={`house-cusp-${idx}`}>
            <Line
              x1={center}
              y1={center}
              x2={center + zodiacInnerRadius * Math.cos(rad)}
              y2={center + zodiacInnerRadius * Math.sin(rad)}
              stroke={colors.line}
              strokeWidth="0.8"
              opacity={is3D ? 0.5 : 0.45}
            />
            <SvgText
              x={center + numR * Math.cos(houseNumRad)}
              y={center + numR * Math.sin(houseNumRad)}
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
          strokeWidth={line.isMajor ? (is3D ? '1.4' : '1.2') : is3D ? '0.9' : '0.8'}
          opacity={line.isMajor ? (is3D ? 0.75 : 0.65) : is3D ? 0.45 : 0.4}
        />
      ))}

      <Line
        x1={center + outerRadius * Math.cos(ascRad)}
        y1={center + outerRadius * Math.sin(ascRad)}
        x2={center + outerRadius * Math.cos(dscRad)}
        y2={center + outerRadius * Math.sin(dscRad)}
        stroke={colors.purple}
        strokeWidth={is3D ? '2.2' : '2'}
      />
      <Line
        x1={center + outerRadius * Math.cos(mcRad)}
        y1={center + outerRadius * Math.sin(mcRad)}
        x2={center + outerRadius * Math.cos(icRad)}
        y2={center + outerRadius * Math.sin(icRad)}
        stroke={colors.gold}
        strokeWidth={is3D ? '2' : '1.8'}
        strokeDasharray="5,3"
      />

      {[
        { label: 'ASC', rad: ascRad, color: colors.purple },
        { label: 'MC', rad: mcRad, color: colors.gold },
      ].map(({ label, rad, color }) => (
        <G key={label}>
          <Circle cx={center + outerRadius * Math.cos(rad)} cy={center + outerRadius * Math.sin(rad)} r="4" fill={color} />
          <SvgText
            x={center + (outerRadius - 14) * Math.cos(rad)}
            y={center + (outerRadius - 14) * Math.sin(rad)}
            fill={color}
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {label}
          </SvgText>
        </G>
      ))}

      {planetPoints.map((p, idx) => (
        <G key={`planet-${idx}`}>
          <Line
            x1={p.outerX}
            y1={p.outerY}
            x2={p.innerX}
            y2={p.innerY}
            stroke={colors.purple}
            strokeWidth="1"
            opacity={is3D ? 0.6 : 0.5}
          />
          <Circle
            cx={p.x}
            cy={p.y}
            r={is3D ? '10' : '9'}
            fill={colors.surface}
            stroke={colors.purple}
            strokeWidth={is3D ? '1.5' : '1.2'}
          />
          <SvgText
            x={p.x}
            y={p.y + 1}
            fill={colors.text}
            fontSize={is3D ? '11' : '10'}
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {p.symbol}
          </SvgText>
        </G>
      ))}

      <Circle cx={center} cy={center} r={is3D ? '4' : '3'} fill={colors.gold} />
    </Svg>
  );
}