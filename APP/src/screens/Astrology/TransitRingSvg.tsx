import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { TransitAspectItem } from './astrology.types';
import { T } from '../../components/UI';

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function TransitRingSvg({
  transits,
  colors,
  title = 'TRANSIT RING',
}: {
  transits: TransitAspectItem[];
  colors: any;
  title?: string;
}) {
  const size = 230;
  const cx = size / 2;
  const cy = size / 2;
  const topItems = transits.slice(0, 4);

  const ringRadii = [94, 76, 58, 40];

  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ringRadii.map((r, idx) => (
          <Circle
            key={`bg_${idx}`}
            cx={cx}
            cy={cy}
            r={r}
            stroke={colors.line}
            strokeWidth={8}
            fill="none"
            opacity={0.45}
          />
        ))}

        {topItems.map((item, idx) => {
          const r = ringRadii[idx];
          const sweep = Math.max(28, Math.min(340, item.progress * 360));
          const strokeColor =
            item.harmony === 'harmonious'
              ? '#10B981'
              : item.harmony === 'challenging'
              ? '#F59E0B'
              : colors.purple;
          const marker = polarToCartesian(cx, cy, r, sweep);

          return (
            <G key={item.id}>
              <Path
                d={describeArc(cx, cy, r, 0, sweep)}
                stroke={strokeColor}
                strokeWidth={8}
                strokeLinecap="round"
                fill="none"
              />
              <Circle
                cx={marker.x}
                cy={marker.y}
                r={5.5}
                fill="#FFFFFF"
                stroke={strokeColor}
                strokeWidth={2.5}
              />
            </G>
          );
        })}

        <Circle cx={cx} cy={cy} r={24} fill={colors.purpleSoft} />
        <SvgText
          x={cx}
          y={cy - 2}
          fill={colors.purple}
          fontSize="9"
          fontWeight="bold"
          textAnchor="middle"
        >
          {topItems.length} ACTIVE
        </SvgText>
        <SvgText x={cx} y={cy + 9} fill={colors.muted} fontSize="7" textAnchor="middle">
          CYCLES
        </SvgText>
      </Svg>

      <T muted size={10} style={{ letterSpacing: 1.2, marginTop: 4 }}>
        {title} · START → PEAK → COMPLETION
      </T>

      <View style={{ width: '100%', gap: 6, marginTop: 10 }}>
        {topItems.map((item) => {
          const dotColor =
            item.harmony === 'harmonious'
              ? '#10B981'
              : item.harmony === 'challenging'
              ? '#F59E0B'
              : colors.purple;
          return (
            <View
              key={`leg_${item.id}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: dotColor,
                  }}
                />
                <T bold size={12} numberOfLines={1}>
                  {item.transitSymbol} {item.transitPlanet} {item.aspectSymbol} {item.natalPlanet}
                </T>
              </View>
              <T muted size={10}>
                Peak: {item.peakDateStr} ({Math.round(item.progress * 100)}%)
              </T>
            </View>
          );
        })}
      </View>
    </View>
  );
}