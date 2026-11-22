import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, T, Section } from '../../components/UI';
import {
  BaZiChart,
  BaZiPillar,
  BaZiViewComplexity,
  WuXingElement,
} from './bazi.types';

const ELEMENT_COLORS: Record<WuXingElement, string> = {
  Wood: '#22C55E',
  Fire: '#EF4444',
  Earth: '#EAB308',
  Metal: '#94A3B8',
  Water: '#3B82F6',
};

interface PillarGridProps {
  chart: BaZiChart;
  colors: any;
  mode?: BaZiViewComplexity;
  title?: string;
}

export function PillarGrid({
  chart,
  colors,
  mode = 'simple',
  title = 'Four Pillars of Destiny (四柱)',
}: PillarGridProps) {
  const columns: (BaZiPillar | null)[] = [
    chart.hourPillar,
    chart.dayPillar,
    chart.monthPillar,
    chart.yearPillar,
  ];

  const columnTitles = ['HOUR', 'DAY (SELF)', 'MONTH', 'YEAR'];

  return (
    <View style={{ gap: 6 }}>
      <Section>{title}</Section>
      <Card style={styles.wrapper}>
        <View style={styles.row}>
          {columns.map((pillar, idx) => {
            const isDayMaster = idx === 1;
            const stemColor = pillar
              ? ELEMENT_COLORS[pillar.stem.element]
              : colors.muted;
            const branchColor = pillar
              ? ELEMENT_COLORS[pillar.branch.element]
              : colors.muted;

            return (
              <View
                key={columnTitles[idx]}
                style={[
                  styles.pillarCol,
                  {
                    backgroundColor: isDayMaster
                      ? colors.purpleSoft
                      : colors.surfaceAlt,
                    borderColor: isDayMaster ? colors.purple : colors.line,
                  },
                ]}
              >
                <T
                  bold
                  size={9}
                  style={{
                    color: isDayMaster ? colors.purple : colors.muted,
                    letterSpacing: 0.7,
                    textAlign: 'center',
                  }}
                >
                  {columnTitles[idx]}
                </T>

                {pillar ? (
                  <>
                    {mode === 'pro' && (
                      <T
                        bold
                        size={8}
                        numberOfLines={1}
                        style={{
                          color: isDayMaster ? colors.purple : colors.gold,
                          textAlign: 'center',
                        }}
                      >
                        {pillar.stemTenGod}
                      </T>
                    )}

                    <View style={styles.charBox}>
                      <T bold size={25} style={{ color: stemColor }}>
                        {pillar.stem.hanzi}
                      </T>
                      <T bold size={11} style={{ color: colors.text }}>
                        {pillar.stem.pinyin}
                      </T>
                      <T size={9} style={{ color: stemColor }}>
                        {pillar.stem.polarity === 'Yang' ? '+' : '−'}{' '}
                        {pillar.stem.element}
                      </T>
                    </View>

                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.line },
                      ]}
                    />

                    <View style={styles.charBox}>
                      <T bold size={25} style={{ color: branchColor }}>
                        {pillar.branch.hanzi}
                      </T>
                      <T bold size={11} style={{ color: colors.text }}>
                        {pillar.branch.animal}
                      </T>
                      <T size={9} style={{ color: branchColor }}>
                        {pillar.branch.pinyin} · {pillar.branch.element}
                      </T>
                    </View>

                    {mode === 'pro' && (
                      <View
                        style={[
                          styles.hiddenBox,
                          { backgroundColor: colors.surface },
                        ]}
                      >
                        <T muted size={7} style={{ letterSpacing: 0.5 }}>
                          HIDDEN
                        </T>
                        <T bold size={10} style={{ color: colors.text }}>
                          {pillar.hiddenStems.map((h) => h.hanzi).join(' ')}
                        </T>
                        <T
                          muted
                          size={7}
                          numberOfLines={1}
                          style={{ textAlign: 'center' }}
                        >
                          {pillar.hiddenTenGods[0]}
                        </T>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.unknownBox}>
                    <T bold size={20} muted>
                      ?
                    </T>
                    <T muted size={10} style={{ textAlign: 'center' }}>
                      Unknown Hour
                    </T>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 12,
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 7,
  },
  pillarCol: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 7,
  },
  charBox: {
    alignItems: 'center',
    gap: 1,
  },
  divider: {
    width: '75%',
    height: 1,
  },
  hiddenBox: {
    width: '92%',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
    marginTop: 2,
  },
  unknownBox: {
    flex: 1,
    minHeight: 132,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
});