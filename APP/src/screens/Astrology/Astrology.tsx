import { ExploreSystemHeader } from '../ExploreSystemHeader';
import React, { useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { CloudUpload, Compass, Orbit, Sparkles, Heart, BookOpen } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { saveUserProfile } from '../../services/api';
import { Card, T, Section, Hero } from '../../components/UI';
import {
  AstrologyAppTab,
  BondProfileInput,
  ChartViewMode,
  CollectionCategory,
  PatternAnalysisItem,
  PsychologicalInsightBlock,
  TransitAspectItem,
  UserCollectionGroup,
} from './astrology.types';
import { degToZodiac, unwrapUserObject } from './astrology.calculations';
import { useAstrologyChart } from './useAstrologyChart';
import { buildPersonalPsychologicalInsights } from './astrology.insights';
import { requestAstrologyAI } from './astrology.ai';
import { NatalChartWheel } from './NatalChartWheel';
import { NatalChart3DDome } from './NatalChart3DDome';
import {
  PrimaryPlacementsRow,
  CompactBirthSummaryBar,
  TieredChartInsightsSection,
  ChartTechnicalDrawerTrigger,
  MissingBirthDateEmptyState,
} from './AstrologySections';
import { AstrologyTabTodayTransits } from './AstrologyTabTodayTransits';
import { AstrologyTabPatterns } from './AstrologyTabPatterns';
import { AstrologyTabBonds } from './AstrologyTabBonds';
import { AstrologyTabUniverse } from './AstrologyTabUniverse';
import { styles } from './astrology.styles';

const DEFAULT_COLLECTIONS: UserCollectionGroup[] = [
  { title: 'Personal Insights', category: 'insights', items: [] },
  { title: 'Transit Collections', category: 'transits', items: [] },
  { title: 'Life Patterns', category: 'patterns', items: [] },
  { title: 'Saved Bonds', category: 'bonds', items: [] },
  { title: 'Content Library', category: 'library', items: [] },
  { title: 'Audio & Moon Journeys', category: 'audio', items: [] },
  { title: 'Astrology Classes', category: 'classes', items: [] },
];

export default function Astrology() {
  const { colors, setPage, user, setUser } = useApp();
  const [activeTab, setActiveTab] = useState<AstrologyAppTab>('chart');
  const [viewMode, setViewMode] = useState<ChartViewMode>('2D');

  const [aiChartText, setAiChartText] = useState<string | null>(null);
  const [isAiChartLoading, setIsAiChartLoading] = useState(false);

  const { results, userDateInfo, isInitializing, isSyncing, syncStatus } = useAstrologyChart(
    user,
    setUser
  );

  const effectiveUser = useMemo(() => unwrapUserObject(user) || {}, [user]);
  const isWrapped = Boolean(user && effectiveUser && effectiveUser !== user);

  const sunData = results
    ? degToZodiac(results.planetPositions.find((p) => p.name === 'Sun')?.deg || 0)
    : null;
  const moonData = results
    ? degToZodiac(results.planetPositions.find((p) => p.name === 'Moon')?.deg || 0)
    : null;
  const ascData = results ? degToZodiac(results.asc) : null;

  const psychologicalInsights = useMemo(
    () => (results ? buildPersonalPsychologicalInsights(results) : []),
    [results]
  );

  const collections: UserCollectionGroup[] = useMemo(() => {
    const existing: UserCollectionGroup[] = Array.isArray(effectiveUser.collections)
      ? effectiveUser.collections
      : [];
    return DEFAULT_COLLECTIONS.map((def) => {
      const found = existing.find((c) => c.category === def.category);
      return found ? { ...def, ...found, items: found.items || [] } : def;
    });
  }, [effectiveUser.collections]);

  const savedIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of collections) {
      for (const it of c.items) {
        set.add(it.itemId);
      }
    }
    return set;
  }, [collections]);

  const customFriends: BondProfileInput[] = useMemo(() => {
    const raw = Array.isArray(effectiveUser.customFriends) ? effectiveUser.customFriends : [];
    return raw.map((cf: any, idx: number) => ({
      id: String(cf._id || cf.id || `cf_${idx}`),
      name: cf.name || 'Friend',
      relationshipType: cf.relationshipType || 'friend',
      birthdate:
        typeof cf.birthdate === 'string'
          ? cf.birthdate.split('T')[0]
          : cf.birthdate instanceof Date
          ? cf.birthdate.toISOString().split('T')[0]
          : '1995-06-15',
      birthTime: cf.birthTime,
      birthCity: cf.birthCity,
      bio: cf.notes,
    }));
  }, [effectiveUser.customFriends]);

  const persistUserPatch = async (patch: Record<string, any>) => {
    const merged = { ...effectiveUser, ...patch };
    const nextPayload = isWrapped ? { ...user, user: merged } : merged;
    await setUser(nextPayload);
    if (merged.email) {
      try {
        await saveUserProfile(merged);
      } catch {
        // Offline fallback
      }
    }
  };

  const toggleCollectionItem = async (
    category: CollectionCategory,
    itemId: string,
    title: string,
    subtitle: string
  ) => {
    const updatedCollections = collections.map((col) => {
      if (col.category !== category) return col;
      const exists = col.items.some((i) => i.itemId === itemId);
      const nextItems = exists
        ? col.items.filter((i) => i.itemId !== itemId)
        : [
            {
              itemId,
              itemType: category,
              title,
              subtitle,
              savedAt: new Date().toISOString(),
            },
            ...col.items,
          ];
      return { ...col, items: nextItems };
    });

    await persistUserPatch({ collections: updatedCollections });
  };

  const handleRemoveCollectionItem = async (category: string, itemId: string) => {
    const updatedCollections = collections.map((col) =>
      col.category === category
        ? { ...col, items: col.items.filter((i) => i.itemId !== itemId) }
        : col
    );
    await persistUserPatch({ collections: updatedCollections });
  };

  const handleAddCustomFriend = async (friend: BondProfileInput) => {
    const existingRaw = Array.isArray(effectiveUser.customFriends)
      ? effectiveUser.customFriends
      : [];
    const nextCustomFriends = [
      ...existingRaw,
      {
        name: friend.name,
        relationshipType: friend.relationshipType,
        birthdate: friend.birthdate,
        birthTime: friend.birthTime,
        hasExactBirthTime: Boolean(friend.birthTime),
        birthCity: friend.birthCity || { name: 'Sofia', country: 'Bulgaria' },
        notes: friend.bio || '',
      },
    ];
    await persistUserPatch({ customFriends: nextCustomFriends });
  };

  const handleGenerateAiChart = async () => {
    if (!results) return;
    setIsAiChartLoading(true);
    const res = await requestAstrologyAI('chart_synthesis', results);
    setAiChartText(res.text);
    setIsAiChartLoading(false);
  };

  const handleShareText = async (title: string, body: string) => {
    try {
      await Share.share({
        title,
        message: `✨ ${title}\n\n${body}\n\n— Natala Astrology Studio`,
      });
    } catch {
      // Dismissed
    }
  };

  return (
    <>
      <ExploreSystemHeader route="astrology" />

      <Hero
        eyebrow="NATALA ASTROLOGY STUDIO"
        first="Your"
        accent="Cosmic Blueprint."
        description="Start simple, tap any card to explore deeper layers."
      />

      {syncStatus && (
        <View style={[styles.syncBanner, { backgroundColor: colors.purpleSoft }]}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.purple} />
          ) : (
            <CloudUpload size={16} color={colors.purple} />
          )}
          <T size={12} style={{ color: colors.purple }}>
            {syncStatus}
          </T>
        </View>
      )}

      {results && (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surfaceAlt,
            borderRadius: 14,
            padding: 4,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          {(
            [
              { id: 'chart', label: 'Chart', Icon: Compass },
              { id: 'today', label: 'Transits', Icon: Orbit },
              { id: 'patterns', label: 'Patterns', Icon: Sparkles },
              { id: 'bonds', label: 'Bonds', Icon: Heart },
              { id: 'universe', label: 'Universe', Icon: BookOpen },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <TouchableOpacity
                key={id}
                onPress={() => setActiveTab(id)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  backgroundColor: active ? colors.action : 'transparent',
                }}
              >
                <Icon size={14} color={active ? '#FFFFFF' : colors.muted} />
                <T bold size={10} style={{ color: active ? '#FFFFFF' : colors.muted }}>
                  {label}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {results && sunData && moonData && ascData ? (
        <View style={{ gap: 14 }}>
          {activeTab === 'chart' && (
            <>
              <PrimaryPlacementsRow
                sunData={sunData}
                moonData={moonData}
                ascData={ascData}
                colors={colors}
              />

              <View style={styles.chartSectionHeader}>
                <Section>Natal Wheel</Section>

                <View
                  style={[
                    styles.switchContainer,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.line },
                  ]}
                >
                  {(['2D', '3D'] as ChartViewMode[]).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setViewMode(mode)}
                      activeOpacity={0.8}
                      style={[
                        styles.switchBtn,
                        viewMode === mode && { backgroundColor: colors.action },
                      ]}
                    >
                      <T
                        bold
                        size={11}
                        style={{ color: viewMode === mode ? '#FFFFFF' : colors.muted }}
                      >
                        {mode === '2D' ? '2D Flat' : '3D Dome'}
                      </T>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Card style={styles.chartCard}>
                {viewMode === '2D' ? (
                  <NatalChartWheel results={results} colors={colors} variant="2D" />
                ) : (
                  <NatalChart3DDome results={results} colors={colors} />
                )}
              </Card>

              <CompactBirthSummaryBar
                dateStr={results.dateStr}
                timeStr={results.timeStr}
                cityName={userDateInfo?.cityName || 'Sofia, Bulgaria'}
                chartRuler={results.chartRuler}
                colors={colors}
                onEditBirthData={() => setPage('profile')}
              />

              <TieredChartInsightsSection
                insights={psychologicalInsights}
                aiText={aiChartText}
                isAiLoading={isAiChartLoading}
                onGenerateAi={handleGenerateAiChart}
                savedIds={savedIds}
                onSaveInsight={(item: PsychologicalInsightBlock) =>
                  toggleCollectionItem('insights', item.id, item.title, item.placementTag)
                }
                onShareText={handleShareText}
                colors={colors}
              />

              <ChartTechnicalDrawerTrigger
                results={results}
                ascData={ascData}
                colors={colors}
              />
            </>
          )}

          {activeTab === 'today' && (
            <AstrologyTabTodayTransits
              results={results}
              colors={colors}
              savedIds={savedIds}
              onSaveTransit={(tr: TransitAspectItem) =>
                toggleCollectionItem('transits', tr.id, tr.title, `Peak: ${tr.peakDateStr}`)
              }
              onSaveDailyInsight={(id, title, subtitle) =>
                toggleCollectionItem('insights', id, title, subtitle)
              }
              onShareText={handleShareText}
            />
          )}

          {activeTab === 'patterns' && (
            <AstrologyTabPatterns
              results={results}
              colors={colors}
              collections={collections}
              savedIds={savedIds}
              onSavePattern={(pat: PatternAnalysisItem) =>
                toggleCollectionItem('patterns', pat.id, pat.title, pat.placementBasis)
              }
              onRemoveCollectionItem={handleRemoveCollectionItem}
              onShareText={handleShareText}
            />
          )}

          {activeTab === 'bonds' && (
            <AstrologyTabBonds
              results={results}
              userName={effectiveUser.name || 'You'}
              customFriends={customFriends}
              colors={colors}
              savedIds={savedIds}
              onAddCustomFriend={handleAddCustomFriend}
              onSaveBondInsight={(id, title, subtitle) =>
                toggleCollectionItem('bonds', id, title, subtitle)
              }
              onShareText={handleShareText}
              onOpenPeopleOrChat={(target) => setPage(target)}
            />
          )}

          {activeTab === 'universe' && (
            <AstrologyTabUniverse
              results={results}
              userName={effectiveUser.name || 'You'}
              colors={colors}
              savedIds={savedIds}
              onSaveUniverseItem={(category, id, title, subtitle) =>
                toggleCollectionItem(category, id, title, subtitle)
              }
            />
          )}
        </View>
      ) : isInitializing || isSyncing ? (
        <Card style={styles.emptyCard}>
          <ActivityIndicator size="large" color={colors.purple} />
          <T bold size={15}>
            Loading Birth Chart...
          </T>
        </Card>
      ) : (
        <MissingBirthDateEmptyState colors={colors} onGoToProfile={() => setPage('profile')} />
      )}

    </>
  );
}