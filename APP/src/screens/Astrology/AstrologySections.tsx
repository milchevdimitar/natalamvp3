import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import {
  Sparkles,
  MapPin,
  Clock,
  Calendar,
  User,
  Bookmark,
  Share2,
  Check,
  Compass,
  Layers,
} from 'lucide-react-native';
import { Card, T, Section, Pill } from '../../components/UI';
import {
  NatalChartResults,
  PsychologicalInsightBlock,
  ZodiacPosition,
} from './astrology.types';
import { degToZodiac } from './astrology.calculations';
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
    <>
      <Section>Primary Placements</Section>
      <View style={styles.placementsRow}>
        {items.map((item) => (
          <Card key={item.label} style={styles.placementCard}>
            <T size={20} style={{ color: item.color }}>
              {item.symbol}
            </T>
            <T muted size={9} style={styles.placementLabel}>
              {item.label}
            </T>
            <T bold size={13}>
              {item.data.sign}
            </T>
            <T muted size={10}>
              {item.data.degFormatted}
            </T>
          </Card>
        ))}
      </View>
    </>
  );
}

export function BirthDetailsCard({
  userName,
  dateStr,
  timeStr,
  cityName,
  chartRuler,
  colors,
  onEditBirthData,
}: {
  userName?: string;
  dateStr: string;
  timeStr: string;
  cityName: string;
  chartRuler?: { modernRuler: string; rulerSign: string; rulerHouse: number };
  colors: any;
  onEditBirthData?: () => void;
}) {
  return (
    <Card style={styles.birthDetailsCard}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={styles.birthDetailsTitleRow}>
          <Sparkles size={16} color={colors.purple} />
          <T bold size={14}>
            Birth Details ({userName || 'User'})
          </T>
        </View>
        {onEditBirthData && (
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
        )}
      </View>
      <View style={styles.birthDetailsMetaRow}>
        <View style={styles.metaItem}>
          <Calendar size={14} color={colors.muted} />
          <T muted size={12}>
            {dateStr}
          </T>
        </View>
        <View style={styles.metaItem}>
          <Clock size={14} color={colors.muted} />
          <T muted size={12}>
            {timeStr}
          </T>
        </View>
        <View style={styles.metaItem}>
          <MapPin size={14} color={colors.muted} />
          <T muted size={12}>
            {cityName}
          </T>
        </View>
      </View>
      {chartRuler && (
        <View
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Compass size={13} color={colors.gold} />
          <T muted size={11}>
            Chart Ruler: <T bold size={11}>{chartRuler.modernRuler}</T> in{' '}
            <T bold size={11}>{chartRuler.rulerSign}</T> (House {chartRuler.rulerHouse})
          </T>
        </View>
      )}
    </Card>
  );
}

export function ChartBalanceMatrixCard({
  results,
  colors,
}: {
  results: NatalChartResults;
  colors: any;
}) {
  const elBars = [
    { label: 'Fire 🔥', value: results.elements.shares.fire, color: '#EF4444' },
    { label: 'Earth 🌿', value: results.elements.shares.earth, color: '#10B981' },
    { label: 'Air 💨', value: results.elements.shares.air, color: '#38BDF8' },
    { label: 'Water 💧', value: results.elements.shares.water, color: '#8B5CF6' },
  ];

  return (
    <Card style={{ padding: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Layers size={15} color={colors.purple} />
        <T bold size={14}>
          Elemental, Modality & Polarity Balance
        </T>
      </View>

      <View style={{ gap: 8 }}>
        {elBars.map((item) => {
          const pct = Math.round(item.value * 100);
          return (
            <View key={item.label} style={{ gap: 3 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T size={12}>{item.label}</T>
                <T bold size={12}>
                  {pct}%
                </T>
              </View>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.surfaceAlt,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: item.color,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <T muted size={11}>
          Modality: <T bold size={11}>{results.modalities.dominantModality}</T>
        </T>
        <T muted size={11}>
          Polarity: <T bold size={11}>{results.polarity.dominantPolarity}</T>
        </T>
        <T muted size={11}>
          Focus:{' '}
          <T bold size={11}>
            {results.hemispheres.eastern >= results.hemispheres.western ? 'Self-Driven' : 'Relational'}
          </T>
        </T>
      </View>
    </Card>
  );
}

export function PsychologicalInsightsSection({
  insights,
  savedIds,
  onSaveInsight,
  onShareText,
  colors,
}: {
  insights: PsychologicalInsightBlock[];
  savedIds: Set<string>;
  onSaveInsight: (item: PsychologicalInsightBlock) => void;
  onShareText: (title: string, body: string) => void;
  colors: any;
}) {
  return (
    <>
      <Section>Psychological Interpretations & Insights</Section>
      <View style={{ gap: 10 }}>
        {insights.map((item) => {
          const isSaved = savedIds.has(item.id);
          return (
            <Card key={item.id} style={{ padding: 14, gap: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <T bold size={10} style={{ color: colors.gold }}>
                    {item.placementTag}
                  </T>
                  <T bold size={15} style={{ marginTop: 2 }}>
                    {item.title}
                  </T>
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => onSaveInsight(item)}
                    style={{
                      padding: 7,
                      borderRadius: 8,
                      backgroundColor: isSaved ? colors.purple : colors.surfaceAlt,
                    }}
                  >
                    {isSaved ? (
                      <Check size={14} color="#FFFFFF" />
                    ) : (
                      <Bookmark size={14} color={colors.purple} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onShareText(item.title, `${item.placementTag}\n\n${item.body}`)}
                    style={{
                      padding: 7,
                      borderRadius: 8,
                      backgroundColor: colors.surfaceAlt,
                    }}
                  >
                    <Share2 size={14} color={colors.muted} />
                  </TouchableOpacity>
                </View>
              </View>

              <T size={13} style={{ lineHeight: 19 }}>
                {item.body}
              </T>

              <View
                style={{
                  padding: 9,
                  borderRadius: 8,
                  backgroundColor: colors.purpleSoft,
                }}
              >
                <T size={11} style={{ color: colors.purple }}>
                  💡 {item.actionTip}
                </T>
              </View>
            </Card>
          );
        })}
      </View>
    </>
  );
}

export function PlanetaryPositionsList({
  results,
  ascData,
  colors,
}: {
  results: NatalChartResults;
  ascData: ZodiacPosition;
  colors: any;
}) {
  const [subView, setSubView] = useState<'planets' | 'houses' | 'aspects'>('planets');
  const mcData = degToZodiac(results.mc);

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
        }}
      >
        <Section>Chart Architecture</Section>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(
            [
              { id: 'planets', label: 'Planets' },
              { id: 'houses', label: 'Houses' },
              { id: 'aspects', label: `Aspects (${results.aspects.length})` },
            ] as const
          ).map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSubView(tab.id)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: subView === tab.id ? colors.purple : colors.surfaceAlt,
              }}
            >
              <T
                bold
                size={11}
                style={{ color: subView === tab.id ? '#FFFFFF' : colors.muted }}
              >
                {tab.label}
              </T>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {subView === 'planets' && (
        <View style={styles.positionsList}>
          <Card style={styles.positionCard}>
            <View style={styles.positionRow}>
              <View style={[styles.positionIconBox, { backgroundColor: colors.purpleSoft }]}>
                <T bold size={14} style={{ color: colors.purple }}>
                  ASC
                </T>
              </View>
              <View style={{ flex: 1 }}>
                <T bold size={15}>
                  Ascendant (ASC)
                </T>
                <T muted size={12}>
                  {ascData.sign} {ascData.symbol} · {ascData.degFormatted}
                </T>
              </View>
              <View style={[styles.houseBadge, { backgroundColor: colors.goldSoft }]}>
                <T bold size={10} style={{ color: colors.gold }}>
                  House 1
                </T>
              </View>
            </View>
          </Card>

          <Card style={styles.positionCard}>
            <View style={styles.positionRow}>
              <View style={[styles.positionIconBox, { backgroundColor: colors.purpleSoft }]}>
                <T bold size={14} style={{ color: colors.purple }}>
                  MC
                </T>
              </View>
              <View style={{ flex: 1 }}>
                <T bold size={15}>
                  Midheaven (MC)
                </T>
                <T muted size={12}>
                  {mcData.sign} {mcData.symbol} · {mcData.degFormatted}
                </T>
              </View>
              <View style={[styles.houseBadge, { backgroundColor: colors.purpleSoft }]}>
                <T bold size={10} style={{ color: colors.purple }}>
                  House 10
                </T>
              </View>
            </View>
          </Card>

          {results.planetPositions.map((p, idx) => {
            const pInfo = degToZodiac(p.deg);
            return (
              <Card key={idx} style={styles.positionCard}>
                <View style={styles.positionRow}>
                  <View style={[styles.positionIconBox, { backgroundColor: colors.purpleSoft }]}>
                    <T size={20} style={{ color: colors.purple }}>
                      {p.symbol}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T bold size={15}>
                      {p.name} {p.isRetrograde ? '℞' : ''}
                    </T>
                    <T muted size={12}>
                      {pInfo.sign} {pInfo.symbol} · {pInfo.degFormatted}
                      {p.dignity !== 'Peregrine' ? ` · ${p.dignity}` : ''}
                    </T>
                  </View>
                  <View style={[styles.houseBadge, { backgroundColor: colors.surfaceAlt }]}>
                    <T bold size={10} style={{ color: colors.muted }}>
                      House {p.house}
                    </T>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {subView === 'houses' && (
        <View style={styles.positionsList}>
          {results.houses.map((h) => (
            <Card key={h.house} style={styles.positionCard}>
              <View style={styles.positionRow}>
                <View style={[styles.positionIconBox, { backgroundColor: colors.goldSoft }]}>
                  <T bold size={14} style={{ color: colors.gold }}>
                    {h.house}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T bold size={14}>
                    House {h.house} · {h.sign} {h.symbol} ({h.degFormatted})
                  </T>
                  <T muted size={11}>
                    Ruler: {h.modernRuler}
                    {h.planetsInHouse.length > 0
                      ? ` · Planets: ${h.planetsInHouse.join(', ')}`
                      : ''}
                  </T>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {subView === 'aspects' && (
        <View style={styles.positionsList}>
          {results.patterns.length > 0 && (
            <Card style={{ padding: 12, backgroundColor: colors.purpleSoft, gap: 4 }}>
              <T bold size={12} style={{ color: colors.purple }}>
                Active Chart Configurations:
              </T>
              {results.patterns.map((pat) => (
                <T key={pat.id} size={12}>
                  • <T bold size={12}>{pat.type}</T>: {pat.bodies.join(', ')}
                  {pat.sign ? ` (${pat.sign})` : ''}
                </T>
              ))}
            </Card>
          )}
          {results.aspects.slice(0, 18).map((asp) => (
            <Card key={asp.id} style={styles.positionCard}>
              <View style={styles.positionRow}>
                <View style={[styles.positionIconBox, { backgroundColor: colors.purpleSoft }]}>
                  <T bold size={18} style={{ color: colors.purple }}>
                    {asp.symbol}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T bold size={14}>
                    {asp.body1} {asp.aspectType} {asp.body2}
                  </T>
                  <T muted size={11}>
                    Orb: {asp.orb}° · {asp.isApplying ? 'Applying' : 'Separating'}
                  </T>
                </View>
                <View
                  style={[
                    styles.houseBadge,
                    {
                      backgroundColor:
                        asp.harmony === 'harmonious'
                          ? 'rgba(16,185,129,0.18)'
                          : asp.harmony === 'challenging'
                          ? 'rgba(245,158,11,0.18)'
                          : colors.surfaceAlt,
                    },
                  ]}
                >
                  <T
                    bold
                    size={10}
                    style={{
                      color:
                        asp.harmony === 'harmonious'
                          ? '#10B981'
                          : asp.harmony === 'challenging'
                          ? '#F59E0B'
                          : colors.muted,
                    }}
                  >
                    {asp.harmony}
                  </T>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
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
        No birth date and time found in your profile. Please add them to unlock your full
        Astrology Super-App.
      </T>
      <Pill selected onPress={onGoToProfile}>
        <User size={14} color="#FFFFFF" /> Set Birth Details
      </Pill>
    </Card>
  );
}