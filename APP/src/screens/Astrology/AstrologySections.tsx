import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  MapPin,
  Clock,
  Calendar,
  User,
  Compass,
  Wand2,
  ChevronRight,
  Layers,
} from 'lucide-react-native';
import { Card, T, Section, Pill } from '../../components/UI';
import {
  NatalChartResults,
  PsychologicalInsightBlock,
  ZodiacPosition,
} from './astrology.types';
import { degToZodiac } from './astrology.calculations';
import { DetailSheetModal, TieredSummaryCard } from './AstrologyDetailModal';
import { styles } from './astrology.styles';

export function PrimaryPlacementsRow({
  sunData,
  moonData,
  ascData,
  colors,
}: {
  sunData: ZodiacPosition;
  moonData: ZodiacPosition;
  ascData: ZodiacPosition;
  colors: any;
}) {
  const items = [
    { symbol: '☉', label: 'SUN', data: sunData, color: colors.gold },
    { symbol: '☾', label: 'MOON', data: moonData, color: colors.purple },
    { symbol: ascData.symbol || '↑', label: 'RISING', data: ascData, color: colors.gold },
  ];

  return (
    <View style={styles.placementsRow}>
      {items.map((item) => (
        <Card key={item.label} style={[styles.placementCard, { paddingVertical: 14 }]}>
          <T size={22} style={{ color: item.color }}>
            {item.symbol}
          </T>
          <T muted size={9} style={styles.placementLabel}>
            {item.label}
          </T>
          <T bold size={14}>
            {item.data.sign}
          </T>
          <T muted size={10}>
            {item.data.degFormatted}
          </T>
        </Card>
      ))}
    </View>
  );
}

export function CompactBirthSummaryBar({
  dateStr,
  timeStr,
  cityName,
  chartRuler,
  colors,
  onEditBirthData,
}: {
  dateStr: string;
  timeStr: string;
  cityName: string;
  chartRuler: { modernRuler: string; rulerSign: string; rulerHouse: number };
  colors: any;
  onEditBirthData: () => void;
}) {
  return (
    <Card style={{ padding: 14, borderRadius: 16, gap: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <View style={styles.metaItem}>
            <Calendar size={13} color={colors.muted} />
            <T muted size={11}>
              {dateStr}
            </T>
          </View>
          <View style={styles.metaItem}>
            <Clock size={13} color={colors.muted} />
            <T muted size={11}>
              {timeStr}
            </T>
          </View>
          <View style={styles.metaItem}>
            <MapPin size={13} color={colors.muted} />
            <T muted size={11}>
              {cityName}
            </T>
          </View>
        </View>

        <TouchableOpacity
          onPress={onEditBirthData}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: colors.purpleSoft,
          }}
        >
          <T bold size={11} style={{ color: colors.purple }}>
            Edit
          </T>
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <Compass size={13} color={colors.gold} />
        <T muted size={11}>
          Chart Ruler: <T bold size={11}>{chartRuler.modernRuler}</T> in{' '}
          <T bold size={11}>{chartRuler.rulerSign}</T> · House {chartRuler.rulerHouse}
        </T>
      </View>
    </Card>
  );
}

export function TieredChartInsightsSection({
  insights,
  aiText,
  isAiLoading,
  onGenerateAi,
  savedIds,
  onSaveInsight,
  onShareText,
  colors,
}: {
  insights: PsychologicalInsightBlock[];
  aiText: string | null;
  isAiLoading: boolean;
  onGenerateAi: () => void;
  savedIds: Set<string>;
  onSaveInsight: (item: PsychologicalInsightBlock) => void;
  onShareText: (title: string, body: string) => void;
  colors: any;
}) {
  const [selectedInsight, setSelectedInsight] = useState<PsychologicalInsightBlock | null>(null);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const visibleList = showAllInsights ? insights : insights.slice(0, 3);

  const handleOpenAi = () => {
    setShowAiModal(true);
    if (!aiText && !isAiLoading) {
      onGenerateAi();
    }
  };

  return (
    <>
      {/* Ниво 1: Компактен AI бутон за дълбок синтез */}
      <TouchableOpacity activeOpacity={0.85} onPress={handleOpenAi}>
        <Card
          style={{
            padding: 15,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.purpleSoft,
            borderWidth: 1,
            borderColor: colors.purple,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: colors.purple,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wand2 size={17} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <T bold size={14} style={{ color: colors.purple }}>
                AI Natal Synthesis
              </T>
              <T muted size={11}>
                Tap for a personalized deep reading of your chart
              </T>
            </View>
          </View>
          <ChevronRight size={18} color={colors.purple} />
        </Card>
      </TouchableOpacity>

      {/* Ниво 1: Изчистени карти с 2-редово резюме */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <Section>Core Insights</Section>
        <TouchableOpacity onPress={() => setShowAllInsights((v) => !v)}>
          <T bold size={11} style={{ color: colors.purple }}>
            {showAllInsights ? 'Show Less' : `See All (${insights.length})`}
          </T>
        </TouchableOpacity>
      </View>

      <View style={{ gap: 10 }}>
        {visibleList.map((item) => (
          <TieredSummaryCard
            key={item.id}
            tag={item.placementTag}
            title={item.title}
            summary={item.body}
            onPressMore={() => setSelectedInsight(item)}
            colors={colors}
          />
        ))}
      </View>

      {/* Ниво 2: Детайлен модал за избрания Insight */}
      <DetailSheetModal
        visible={Boolean(selectedInsight)}
        onClose={() => setSelectedInsight(null)}
        eyebrow={selectedInsight?.placementTag}
        title={selectedInsight?.title || ''}
        colors={colors}
        isSaved={selectedInsight ? savedIds.has(selectedInsight.id) : false}
        onSave={selectedInsight ? () => onSaveInsight(selectedInsight) : undefined}
        onShare={
          selectedInsight
            ? () =>
                onShareText(
                  selectedInsight.title,
                  `${selectedInsight.placementTag}\n\n${selectedInsight.body}\n\nGuidance: ${selectedInsight.actionTip}`
                )
            : undefined
        }
      >
        {selectedInsight && (
          <>
            <T size={14} style={{ lineHeight: 22 }}>
              {selectedInsight.body}
            </T>
            <View
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: colors.purpleSoft,
                gap: 4,
              }}
            >
              <T bold size={11} style={{ color: colors.purple }}>
                PRACTICAL GUIDANCE
              </T>
              <T size={13} style={{ lineHeight: 19 }}>
                {selectedInsight.actionTip}
              </T>
            </View>
          </>
        )}
      </DetailSheetModal>

      {/* Ниво 3: AI Synthesis Modal */}
      <DetailSheetModal
        visible={showAiModal}
        onClose={() => setShowAiModal(false)}
        eyebrow="AI ASTROLOGICAL SYNTHESIS"
        title="Your Chart Blueprint"
        colors={colors}
        onShare={aiText ? () => onShareText('AI Natal Synthesis', aiText) : undefined}
      >
        {isAiLoading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center', gap: 10 }}>
            <ActivityIndicator size="large" color={colors.purple} />
            <T muted size={12}>
              Synthesizing your placements and aspects...
            </T>
          </View>
        ) : (
          <>
            <T size={14} style={{ lineHeight: 22 }}>
              {aiText}
            </T>
            <TouchableOpacity
              onPress={onGenerateAi}
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: colors.purpleSoft,
              }}
            >
              <T bold size={12} style={{ color: colors.purple }}>
                Regenerate Reading
              </T>
            </TouchableOpacity>
          </>
        )}
      </DetailSheetModal>
    </>
  );
}

export function ChartTechnicalDrawerTrigger({
  results,
  ascData,
  colors,
}: {
  results: NatalChartResults;
  ascData: ZodiacPosition;
  colors: any;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'planets' | 'houses' | 'aspects' | 'balance'>('planets');
  const mcData = degToZodiac(results.mc);

  const elBars = [
    { label: 'Fire', value: results.elements.shares.fire, color: '#EF4444' },
    { label: 'Earth', value: results.elements.shares.earth, color: '#10B981' },
    { label: 'Air', value: results.elements.shares.air, color: '#38BDF8' },
    { label: 'Water', value: results.elements.shares.water, color: '#8B5CF6' },
  ];

  return (
    <>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(true)}>
        <Card
          style={{
            padding: 15,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Layers size={18} color={colors.purple} />
            <View>
              <T bold size={14}>
                Planets, Houses & Aspects
              </T>
              <T muted size={11}>
                {results.planetPositions.length} bodies · 12 Placidus houses ·{' '}
                {results.aspects.length} aspects
              </T>
            </View>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Card>
      </TouchableOpacity>

      <DetailSheetModal
        visible={open}
        onClose={() => setOpen(false)}
        eyebrow="TECHNICAL CHART DATA"
        title="Planets, Houses & Balance"
        colors={colors}
      >
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(
            [
              { id: 'planets', label: 'Planets' },
              { id: 'houses', label: 'Houses' },
              { id: 'aspects', label: 'Aspects' },
              { id: 'balance', label: 'Balance' },
            ] as const
          ).map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: 9,
                alignItems: 'center',
                backgroundColor: tab === t.id ? colors.purple : colors.surfaceAlt,
              }}
            >
              <T
                bold
                size={11}
                style={{ color: tab === t.id ? '#FFFFFF' : colors.muted }}
              >
                {t.label}
              </T>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'planets' && (
          <View style={{ gap: 8 }}>
            {[
              {
                symbol: 'ASC',
                name: 'Ascendant',
                sign: ascData.sign,
                deg: ascData.degFormatted,
                house: 1,
                extra: '',
              },
              {
                symbol: 'MC',
                name: 'Midheaven',
                sign: mcData.sign,
                deg: mcData.degFormatted,
                house: 10,
                extra: '',
              },
              ...results.planetPositions.map((p) => {
                const z = degToZodiac(p.deg);
                return {
                  symbol: p.symbol,
                  name: `${p.name}${p.isRetrograde ? ' ℞' : ''}`,
                  sign: z.sign,
                  deg: z.degFormatted,
                  house: p.house,
                  extra: p.dignity !== 'Peregrine' ? p.dignity : '',
                };
              }),
            ].map((row, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceAlt,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <T bold size={15} style={{ color: colors.purple, width: 32 }}>
                    {row.symbol}
                  </T>
                  <View>
                    <T bold size={13}>
                      {row.name}
                    </T>
                    <T muted size={11}>
                      {row.sign} · {row.deg} {row.extra ? `· ${row.extra}` : ''}
                    </T>
                  </View>
                </View>
                <T bold size={11} style={{ color: colors.muted }}>
                  House {row.house}
                </T>
              </View>
            ))}
          </View>
        )}

        {tab === 'houses' && (
          <View style={{ gap: 8 }}>
            {results.houses.map((h) => (
              <View
                key={h.house}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceAlt,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <T bold size={13}>
                  House {h.house} · {h.sign} {h.symbol}
                </T>
                <T muted size={11}>
                  {h.degFormatted} · Ruler: {h.modernRuler}
                </T>
              </View>
            ))}
          </View>
        )}

        {tab === 'aspects' && (
          <View style={{ gap: 8 }}>
            {results.aspects.slice(0, 20).map((asp) => (
              <View
                key={asp.id}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceAlt,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <T bold size={13}>
                  {asp.body1} {asp.symbol} {asp.body2}
                </T>
                <T muted size={11}>
                  {asp.aspectType} ({asp.orb}°)
                </T>
              </View>
            ))}
          </View>
        )}

        {tab === 'balance' && (
          <View style={{ gap: 10 }}>
            {elBars.map((item) => {
              const pct = Math.round(item.value * 100);
              return (
                <View key={item.label} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T bold size={12}>
                      {item.label}
                    </T>
                    <T bold size={12}>
                      {pct}%
                    </T>
                  </View>
                  <View
                    style={{
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: colors.surfaceAlt,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: item.color,
                      }}
                    />
                  </View>
                </View>
              );
            })}
            <T muted size={12} style={{ marginTop: 4 }}>
              Dominant Modality: <T bold size={12}>{results.modalities.dominantModality}</T> ·
              Polarity: <T bold size={12}>{results.polarity.dominantPolarity}</T>
            </T>
          </View>
        )}
      </DetailSheetModal>
    </>
  );
}

export function MissingBirthDateEmptyState({
  colors,
  onGoToProfile,
}: {
  colors: any;
  onGoToProfile: () => void;
}) {
  return (
    <Card style={styles.emptyCard}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.purpleSoft }]}>
        <Calendar size={32} color={colors.purple} />
      </View>
      <T bold size={16}>
        Missing Birth Date in Profile
      </T>
      <T muted size={13} style={styles.emptyDescription}>
        Add your birth date, time, and city to unlock your personal Astrology Studio.
      </T>
      <Pill selected onPress={onGoToProfile}>
        <User size={14} color="#FFFFFF" /> Set Birth Details
      </Pill>
    </Card>
  );
}