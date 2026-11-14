import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, T, Section } from '../../components/UI';
import { BaZiChart, WuXingElement } from './bazi.types';

const ELEMENT_META: {
  key: WuXingElement;
  hanzi: string;
  label: string;
  color: string;
}[] = [
  { key: 'Wood', hanzi: '木', label: 'Wood · Growth', color: '#22C55E' },
  { key: 'Fire', hanzi: '火', label: 'Fire · Passion', color: '#EF4444' },
  { key: 'Earth', hanzi: '土', label: 'Earth · Stability', color: '#EAB308' },
  { key: 'Metal', hanzi: '金', label: 'Metal · Clarity', color: '#94A3B8' },
  { key: 'Water', hanzi: '水', label: 'Water · Wisdom', color: '#3B82F6' },
];

interface ElementsBalanceCardProps {
  chart: BaZiChart;
  colors: any;
}

export function ElementsBalanceCard({ chart, colors }: ElementsBalanceCardProps) {
  const { dayMaster, elementPercentages, dominantElement, weakestElement } = chart;

  return (
    <>
      <Section>Day Master · 日主</Section>
      <Card style={styles.card}>
        <View style={styles.dmHeader}>
          <View
            style={[
              styles.hanziBadge,
              { backgroundColor: colors.purpleSoft, borderColor: colors.purple },
            ]}
          >
            <T bold size={26} style={{ color: colors.purple }}>
              {dayMaster.stem.hanzi}
            </T>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T bold size={16}>
              {dayMaster.title}
            </T>
            <T muted size={12}>
              Chinese Zodiac: {chart.zodiacAnimal} · Core Element:{' '}
              {dayMaster.stem.polarity} {dayMaster.stem.element}
            </T>
          </View>
        </View>

        <T size={13} style={{ lineHeight: 20 }}>
          {dayMaster.archetype}
        </T>

        <View style={[styles.tipBox, { backgroundColor: colors.surfaceAlt }]}>
          <T bold size={11} style={{ color: colors.gold }}>
            KEY STRENGTHS
          </T>
          <T muted size={12} style={{ lineHeight: 18 }}>
            {dayMaster.strengths}
          </T>
        </View>

        <View style={[styles.tipBox, { backgroundColor: colors.surfaceAlt }]}>
          <T bold size={11} style={{ color: colors.purple }}>
            HARMONY & USEFUL ELEMENT ({weakestElement.toUpperCase()})
          </T>
          <T muted size={12} style={{ lineHeight: 18 }}>
            {dayMaster.balanceAdvice}
          </T>
        </View>
      </Card>

      <Section>Five Elements Balance (五行 Wu Xing)</Section>
      <Card style={styles.card}>
        {ELEMENT_META.map((item) => {
          const pct = elementPercentages[item.key] || 0;
          return (
            <View key={item.key} style={styles.barBlock}>
              <View style={styles.barHeader}>
                <T bold size={12}>
                  {item.hanzi} {item.label}
                </T>
                <T bold size={12} style={{ color: item.color }}>
                  {pct}%
                </T>
              </View>
              <View
                style={[
                  styles.track,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(4, Math.min(100, pct))}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}

        <T muted size={11} style={{ marginTop: 4 }}>
          Dominant: {dominantElement} · Balancing Element to cultivate: {weakestElement}
        </T>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    gap: 12,
  },
  dmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hanziBadge: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBox: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  barBlock: {
    gap: 5,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 99,
  },
});