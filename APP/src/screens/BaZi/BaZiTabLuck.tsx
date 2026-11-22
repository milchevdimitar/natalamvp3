import React, { useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Maximize2, Sparkles, TrendingUp } from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import { BaZiChart, BaZiViewComplexity, LuckPillarItem } from './bazi.types';
import { BaZiSheetModal, BaZiTierCard } from './BaZiDetailModal';

export function BaZiTabLuck({
  chart,
  mode,
  colors,
}: {
  chart: BaZiChart;
  mode: BaZiViewComplexity;
  colors: any;
}) {
  const { width, height } = useWindowDimensions();
  const isDeviceLandscape = width > height;

  const defaultSelected = useMemo(
    () => chart.luckPillars.find((lp) => lp.isCurrent) || chart.luckPillars[0],
    [chart.luckPillars]
  );

  const [selectedIndex, setSelectedIndex] = useState<number>(defaultSelected?.index || 0);
  const [forceLandscapeView, setForceLandscapeView] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showDynamicBridgeModal, setShowDynamicBridgeModal] = useState<boolean>(false);

  const activePillar: LuckPillarItem =
    chart.luckPillars[selectedIndex] || chart.luckPillars[0];

  const isLandscapeLayout = isDeviceLandscape || forceLandscapeView;

  return (
    <View style={{ gap: 14 }}>
      {/* Header with Landscape View Toggle */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Section>10-Year Luck Pillars (大运)</Section>
        <TouchableOpacity
          onPress={() => setForceLandscapeView((v) => !v)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 9,
            backgroundColor: isLandscapeLayout ? colors.purple : colors.surfaceAlt,
          }}
        >
          <Maximize2 size={12} color={isLandscapeLayout ? '#FFFFFF' : colors.purple} />
          <T
            bold
            size={11}
            style={{ color: isLandscapeLayout ? '#FFFFFF' : colors.purple }}
          >
            {isLandscapeLayout ? 'Landscape Grid ✓' : 'Landscape View'}
          </T>
        </TouchableOpacity>
      </View>

      {/* Luck Pillars in Landscape Grid or Horizontal Scroll */}
      <Card style={{ padding: 12, borderRadius: 16 }}>
        {isLandscapeLayout ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {chart.luckPillars.map((lp) => {
              const selected = lp.index === activePillar.index;
              return (
                <TouchableOpacity
                  key={lp.index}
                  onPress={() => setSelectedIndex(lp.index)}
                  style={{
                    width: '23.4%',
                    paddingVertical: 10,
                    paddingHorizontal: 4,
                    borderRadius: 12,
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: selected
                      ? colors.purpleSoft
                      : colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: selected
                      ? colors.purple
                      : lp.isCurrent
                      ? colors.gold
                      : colors.line,
                  }}
                >
                  <T
                    bold
                    size={9}
                    style={{ color: lp.isCurrent ? colors.gold : colors.muted }}
                  >
                    {lp.startAge}–{lp.endAge}y
                  </T>
                  <T bold size={18}>
                    {lp.stem.hanzi}
                    {lp.branch.hanzi}
                  </T>
                  <T bold size={9} numberOfLines={1}>
                    {lp.stem.pinyin}-{lp.branch.pinyin}
                  </T>
                  <T muted size={8}>
                    {lp.startYear}
                  </T>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {chart.luckPillars.map((lp) => {
                const selected = lp.index === activePillar.index;
                return (
                  <TouchableOpacity
                    key={lp.index}
                    onPress={() => setSelectedIndex(lp.index)}
                    style={{
                      width: 82,
                      paddingVertical: 11,
                      paddingHorizontal: 6,
                      borderRadius: 14,
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: selected
                        ? colors.purpleSoft
                        : colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: selected
                        ? colors.purple
                        : lp.isCurrent
                        ? colors.gold
                        : colors.line,
                    }}
                  >
                    <T
                      bold
                      size={9}
                      style={{ color: lp.isCurrent ? colors.gold : colors.muted }}
                    >
                      {lp.isCurrent ? 'NOW · ' : ''}
                      {lp.startAge}–{lp.endAge}
                    </T>
                    <T bold size={21}>
                      {lp.stem.hanzi}
                    </T>
                    <T bold size={21}>
                      {lp.branch.hanzi}
                    </T>
                    <T bold size={10}>
                      {lp.stem.pinyin}-{lp.branch.pinyin}
                    </T>
                    <T muted size={9}>
                      {lp.startYear}
                    </T>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </Card>

      {/* Tier 1: Detailed Luck Pillar Forecast */}
      <BaZiTierCard
        eyebrow={`DECADE FORECAST (${activePillar.startYear}–${activePillar.endYear})`}
        badgeText={activePillar.isCurrent ? 'Active Decade' : `Ages ${activePillar.startAge}–${activePillar.endAge}`}
        badgeColor={activePillar.isCurrent ? '#10B981' : colors.purple}
        title={activePillar.headline}
        summary={activePillar.summary}
        onPressMore={() => setShowDetailModal(true)}
        colors={colors}
      />

      {/* Tier 1: Dynamic Talent Bridge for Selected Decade */}
      <BaZiTierCard
        eyebrow="DYNAMIC TALENT BRIDGE"
        badgeText="Decade Shift"
        title={`Talent Bridge in ${activePillar.stem.pinyin}-${activePillar.branch.pinyin} Cycle`}
        summary={activePillar.dynamicTalentBridge
          .slice(0, 3)
          .map((m) => `${m.label} ${m.score}% (${m.delta >= 0 ? `+${m.delta}` : m.delta}%)`)
          .join(' · ')}
        onPressMore={() => setShowDynamicBridgeModal(true)}
        colors={colors}
      />

      {/* Tier 2: Luck Pillar Forecast Modal */}
      <BaZiSheetModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        eyebrow={`AGES ${activePillar.startAge}–${activePillar.endAge} (${activePillar.startYear}–${activePillar.endYear})`}
        title={activePillar.headline}
        colors={colors}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} color={colors.gold} />
          <T bold size={13}>
            Stem: {activePillar.stemTenGod} · Branch: {activePillar.branchTenGod}
          </T>
        </View>
        <T size={14} style={{ lineHeight: 22 }}>
          {activePillar.detailedForecast}
        </T>
        {mode === 'pro' && (
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt }}>
            <T bold size={11} style={{ color: colors.purple }}>
              PRO CYCLE INTERACTION
            </T>
            <T muted size={12} style={{ marginTop: 4, lineHeight: 18 }}>
              Decade Pillar {activePillar.stem.hanzi}
              {activePillar.branch.hanzi} interacts with your Month Pillar{' '}
              {chart.monthPillar.stem.hanzi}
              {chart.monthPillar.branch.hanzi} and Day Master {chart.dayMaster.stem.hanzi}.
            </T>
          </View>
        )}
      </BaZiSheetModal>

      {/* Tier 2: Dynamic Talent Bridge Modal */}
      <BaZiSheetModal
        visible={showDynamicBridgeModal}
        onClose={() => setShowDynamicBridgeModal(false)}
        eyebrow={`DYNAMIC TALENT BRIDGE · ${activePillar.startAge}–${activePillar.endAge}Y`}
        title="Decade Talent Shifts vs. Natal Chart"
        colors={colors}
      >
        {activePillar.dynamicTalentBridge.map((m) => (
          <View key={m.key} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <TrendingUp size={13} color={colors.purple} />
                <T bold size={13}>
                  {m.label}
                </T>
              </View>
              <T bold size={12} style={{ color: m.delta > 0 ? '#10B981' : colors.purple }}>
                {m.score}% ({m.delta >= 0 ? `+${m.delta}%` : `${m.delta}%`})
              </T>
            </View>
            <View
              style={{
                height: 7,
                borderRadius: 99,
                backgroundColor: colors.surfaceAlt,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${m.score}%`,
                  height: '100%',
                  backgroundColor: m.delta > 0 ? '#10B981' : colors.purple,
                }}
              />
            </View>
          </View>
        ))}
      </BaZiSheetModal>
    </View>
  );
}