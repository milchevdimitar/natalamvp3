import React, { useState } from 'react';
import { View } from 'react-native';
import { Flame, Snowflake, Zap } from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import { BaZiChart, BaZiViewComplexity, WuXingElement } from './bazi.types';
import { BaZiSheetModal, BaZiTierCard } from './BaZiDetailModal';

const ELEMENT_META: {
  key: WuXingElement;
  hanzi: string;
  label: string;
  color: string;
}[] = [
  { key: 'Wood', hanzi: '木', label: 'Wood', color: '#22C55E' },
  { key: 'Fire', hanzi: '火', label: 'Fire', color: '#EF4444' },
  { key: 'Earth', hanzi: '土', label: 'Earth', color: '#EAB308' },
  { key: 'Metal', hanzi: '金', label: 'Metal', color: '#94A3B8' },
  { key: 'Water', hanzi: '水', label: 'Water', color: '#3B82F6' },
];

type DiagnosticSheet =
  | null
  | 'dm'
  | 'elements'
  | 'components'
  | 'tengods'
  | 'supergods'
  | 'bridge'
  | 'temperature'
  | 'qiboost';

export function BaZiTabAnalysis({
  chart,
  mode,
  colors,
}: {
  chart: BaZiChart;
  mode: BaZiViewComplexity;
  colors: any;
}) {
  const [openSheet, setOpenSheet] = useState<DiagnosticSheet>(null);
  const topBoost = chart.qiBoost
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return (
    <View style={{ gap: 12 }}>
      <Section>Personality & Qi Diagnostics</Section>

      {/* Day Master Strength */}
      <BaZiTierCard
        eyebrow="DAY MASTER STRENGTH (日主)"
        badgeText={`${chart.dayMasterStrength.status} · ${chart.dayMasterStrength.score}%`}
        badgeColor={
          chart.dayMasterStrength.status === 'Strong'
            ? '#10B981'
            : chart.dayMasterStrength.status === 'Balanced'
            ? colors.purple
            : colors.gold
        }
        title={chart.dayMaster.title}
        summary={chart.dayMasterStrength.summary}
        onPressMore={() => setOpenSheet('dm')}
        colors={colors}
      />

      {/* Five Element Strength */}
      <BaZiTierCard
        eyebrow="FIVE ELEMENT STRENGTH (五行)"
        badgeText={`Dominant: ${chart.dominantElement}`}
        title="Five Elements Balance"
        summary={ELEMENT_META.map(
          (e) => `${e.label} ${chart.elementPercentages[e.key]}%`
        ).join(' · ')}
        onPressMore={() => setOpenSheet('elements')}
        colors={colors}
      />

      {/* Five Character Components */}
      <BaZiTierCard
        eyebrow="FIVE CHARACTER COMPONENTS"
        badgeText={`Top: ${
          [...chart.fiveComponents].sort((a, b) => b.percentage - a.percentage)[0]?.title
        }`}
        title="Body, Output, Wealth, Power & Intellect"
        summary={chart.fiveComponents
          .map((c) => `${c.key} ${c.percentage}%`)
          .join(' · ')}
        onPressMore={() => setOpenSheet('components')}
        colors={colors}
      />

      {/* Profiles & 10 Gods */}
      <BaZiTierCard
        eyebrow="PROFILES & TEN GODS (十神)"
        badgeText={`${chart.primaryProfile.percentage}% Primary`}
        title={`Main Profile: ${chart.primaryProfile.archetype}`}
        summary={chart.primaryProfile.talentSummary}
        onPressMore={() => setOpenSheet('tengods')}
        colors={colors}
      />

      {/* Supergods & Supertalents */}
      <BaZiTierCard
        eyebrow="SUPERGODS & SUPERTALENTS"
        badgeText={`${chart.supergods.length} Unlocked`}
        badgeColor={colors.gold}
        title={
          chart.supergods.map((s) => s.shortTitle).join(' · ') || 'Balanced Generalist'
        }
        summary={
          chart.supergods[0]?.summary ||
          'Harmonious distribution across multiple talent archetypes.'
        }
        onPressMore={() => setOpenSheet('supergods')}
        colors={colors}
      />

      {/* Talent Bridge */}
      <BaZiTierCard
        eyebrow="TALENT BRIDGE (8 INDICATORS)"
        badgeText="0–100 Matrix"
        title="Ambition, Strategy, Leadership & Flow"
        summary={chart.talentBridge
          .slice(0, 4)
          .map((t) => `${t.label} ${t.score}%`)
          .join(' · ')}
        onPressMore={() => setOpenSheet('bridge')}
        colors={colors}
      />

      {/* Qi Temperature: Warm vs. Cold Qi */}
      <BaZiTierCard
        eyebrow="QI TEMPERATURE (调候)"
        badgeText={chart.qiTemperature.label}
        badgeColor={chart.qiTemperature.score >= 0 ? '#EF4444' : '#3B82F6'}
        title={`Warm ${chart.qiTemperature.warmPercent}% vs. Cold ${chart.qiTemperature.coldPercent}% Qi`}
        summary={chart.qiTemperature.summary}
        onPressMore={() => setOpenSheet('temperature')}
        colors={colors}
      />

      {/* Qi Boost / Useful Elements (0 - 10) */}
      <BaZiTierCard
        eyebrow="QI BOOST / YONG SHEN (0–10)"
        badgeText={`Top: ${topBoost[0]?.element} ${topBoost[0]?.score}/10`}
        badgeColor="#10B981"
        title="Useful Elements Scale (6 Sub-Elements)"
        summary={topBoost
          .map((b) => `${b.element}: ${b.score}/10 (${b.role})`)
          .join(' · ')}
        onPressMore={() => setOpenSheet('qiboost')}
        colors={colors}
      />

      {/* --- TIER 2 DETAIL MODALS --- */}

      {/* Day Master Strength Modal */}
      <BaZiSheetModal
        visible={openSheet === 'dm'}
        onClose={() => setOpenSheet(null)}
        eyebrow={`DAY MASTER · ${chart.dayMasterStrength.statusLabel}`}
        title={chart.dayMaster.title}
        colors={colors}
      >
        <T size={14} style={{ lineHeight: 21 }}>
          {chart.dayMaster.archetype}
        </T>
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.purpleSoft, gap: 4 }}>
          <T bold size={11} style={{ color: colors.purple }}>
            STRENGTH SCORE: {chart.dayMasterStrength.score}% ({chart.dayMasterStrength.status})
          </T>
          <T size={13} style={{ lineHeight: 19 }}>
            {chart.dayMasterStrength.summary}
          </T>
          {mode === 'pro' && (
            <T muted size={11} style={{ marginTop: 4 }}>
              {chart.dayMasterStrength.detailedAnalysis}
            </T>
          )}
        </View>
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt }}>
          <T bold size={11} style={{ color: colors.gold }}>
            STRENGTHS & GUIDANCE
          </T>
          <T size={13} style={{ marginTop: 4, lineHeight: 19 }}>
            {chart.dayMaster.strengths} {chart.dayMaster.balanceAdvice}
          </T>
        </View>
      </BaZiSheetModal>

      {/* Five Elements Modal */}
      <BaZiSheetModal
        visible={openSheet === 'elements'}
        onClose={() => setOpenSheet(null)}
        eyebrow="WU XING DISTRIBUTION"
        title="Five Element Strength"
        colors={colors}
      >
        {ELEMENT_META.map((item) => {
          const pct = chart.elementPercentages[item.key];
          return (
            <View key={item.key} style={{ gap: 5 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={13}>
                  {item.hanzi} {item.label}
                </T>
                <T bold size={13} style={{ color: item.color }}>
                  {pct}%
                </T>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: 99,
                  backgroundColor: colors.surfaceAlt,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${Math.max(5, pct)}%`,
                    height: '100%',
                    backgroundColor: item.color,
                  }}
                />
              </View>
            </View>
          );
        })}
      </BaZiSheetModal>

      {/* Five Components Modal */}
      <BaZiSheetModal
        visible={openSheet === 'components'}
        onClose={() => setOpenSheet(null)}
        eyebrow="STRUCTURAL PERSONALITY BLOCKS"
        title="Five Character Components"
        colors={colors}
      >
        {chart.fiveComponents.map((comp) => (
          <View
            key={comp.key}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceAlt,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={13}>
                {comp.title} · {comp.subtitle}
              </T>
              <T bold size={13} style={{ color: colors.purple }}>
                {comp.percentage}%
              </T>
            </View>
            <T muted size={12} style={{ lineHeight: 18 }}>
              {comp.description}
            </T>
          </View>
        ))}
      </BaZiSheetModal>

      {/* Ten Gods Profiles Modal */}
      <BaZiSheetModal
        visible={openSheet === 'tengods'}
        onClose={() => setOpenSheet(null)}
        eyebrow="YIN & YANG TALENT MANIFESTATIONS"
        title="Profiles & Ten Gods (十神)"
        colors={colors}
      >
        {chart.tenGodProfiles.map((tg) => (
          <View
            key={tg.name}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: tg.isPrimary ? colors.purpleSoft : colors.surfaceAlt,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={13}>
                {tg.archetype} ({tg.name})
              </T>
              <T bold size={12} style={{ color: colors.purple }}>
                {tg.percentage}%
              </T>
            </View>
            <T muted size={11}>
              {tg.pinyinName} · {tg.component}
            </T>
            <T size={12} style={{ lineHeight: 18 }}>
              {tg.talentSummary}
            </T>
          </View>
        ))}
      </BaZiSheetModal>

      {/* Supergods Modal */}
      <BaZiSheetModal
        visible={openSheet === 'supergods'}
        onClose={() => setOpenSheet(null)}
        eyebrow="RARE SYNERGY COMBINATIONS"
        title="Supergods & Supertalents"
        colors={colors}
      >
        {chart.supergods.map((sg) => (
          <View
            key={sg.id}
            style={{
              padding: 13,
              borderRadius: 12,
              backgroundColor: colors.surfaceAlt,
              gap: 5,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={14}>
                {sg.title}
              </T>
              <T bold size={12} style={{ color: colors.gold }}>
                {sg.strength}%
              </T>
            </View>
            <T size={13} style={{ lineHeight: 19 }}>
              {sg.deepDive}
            </T>
          </View>
        ))}
      </BaZiSheetModal>

      {/* Talent Bridge Modal */}
      <BaZiSheetModal
        visible={openSheet === 'bridge'}
        onClose={() => setOpenSheet(null)}
        eyebrow="COMPONENT INTERACTION MATRIX"
        title="Talent Bridge (8 Indicators)"
        colors={colors}
      >
        {chart.talentBridge.map((tb) => (
          <View key={tb.key} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={13}>
                {tb.label}
              </T>
              <T bold size={13} style={{ color: colors.purple }}>
                {tb.score}%
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
                  width: `${tb.score}%`,
                  height: '100%',
                  backgroundColor: colors.purple,
                }}
              />
            </View>
            <T muted size={11}>
              {mode === 'pro' ? `[${tb.formulaHint}] ` : ''}
              {tb.description}
            </T>
          </View>
        ))}
      </BaZiSheetModal>

      {/* Warm vs. Cold Qi Modal */}
      <BaZiSheetModal
        visible={openSheet === 'temperature'}
        onClose={() => setOpenSheet(null)}
        eyebrow="THERMAL QI DYNAMICS"
        title={chart.qiTemperature.headline}
        colors={colors}
      >
        <Card style={{ padding: 14, borderRadius: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Snowflake size={15} color="#3B82F6" />
              <T bold size={13} style={{ color: '#3B82F6' }}>
                Cold Qi {chart.qiTemperature.coldPercent}%
              </T>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Flame size={15} color="#EF4444" />
              <T bold size={13} style={{ color: '#EF4444' }}>
                Warm Qi {chart.qiTemperature.warmPercent}%
              </T>
            </View>
          </View>

          <View
            style={{
              height: 10,
              borderRadius: 99,
              backgroundColor: '#3B82F6',
              overflow: 'hidden',
              flexDirection: 'row',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                width: `${chart.qiTemperature.warmPercent}%`,
                height: '100%',
                backgroundColor: '#EF4444',
              }}
            />
          </View>
        </Card>

        <T size={14} style={{ lineHeight: 21 }}>
          {chart.qiTemperature.summary}
        </T>
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.purpleSoft }}>
          <T size={13} style={{ lineHeight: 19 }}>
            {chart.qiTemperature.detailedAdvice}
          </T>
        </View>
      </BaZiSheetModal>

      {/* Qi Boost / Useful Elements Modal */}
      <BaZiSheetModal
        visible={openSheet === 'qiboost'}
        onClose={() => setOpenSheet(null)}
        eyebrow="YONG SHEN · 0 TO 10 SCALE"
        title="Qi Boost & Useful Elements"
        colors={colors}
      >
        {chart.qiBoost
          .slice()
          .sort((a, b) => b.score - a.score)
          .map((item) => (
            <View
              key={item.element}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.surfaceAlt,
                gap: 5,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Zap size={14} color={item.color} />
                  <T bold size={13}>
                    {item.hanzi} {item.label}
                  </T>
                </View>
                <T bold size={14} style={{ color: item.color }}>
                  {item.score.toFixed(1)} / 10
                </T>
              </View>
              <T bold size={10} style={{ color: colors.purple }}>
                {item.role.toUpperCase()}
              </T>
              <T muted size={12} style={{ lineHeight: 18 }}>
                {item.actionTip}
              </T>
            </View>
          ))}
      </BaZiSheetModal>
    </View>
  );
}