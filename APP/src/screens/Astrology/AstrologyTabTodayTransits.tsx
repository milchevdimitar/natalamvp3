import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import {
  Clock,
  Bookmark,
  Check,
  Share2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wand2,
} from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import { NatalChartResults, TransitAspectItem } from './astrology.types';
import {
  buildTimeTravelSnapshot,
  calculateTransitsForDate,
} from './astrology.transits';
import { buildDailyUpdatePackage } from './astrology.insights';
import { requestAstrologyAI } from './astrology.ai';
import { TransitRingSvg } from './TransitRingSvg';
import { DetailSheetModal, TieredSummaryCard } from './AstrologyDetailModal';

export function AstrologyTabTodayTransits({
  results,
  colors,
  savedIds,
  onSaveTransit,
  onSaveDailyInsight,
  onShareText,
}: {
  results: NatalChartResults;
  colors: any;
  savedIds: Set<string>;
  onSaveTransit: (t: TransitAspectItem) => void;
  onSaveDailyInsight: (id: string, title: string, subtitle: string) => void;
  onShareText: (title: string, body: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [transitFilter, setTransitFilter] = useState<'all' | 'upcoming' | 'outer'>('all');

  const [selectedTransit, setSelectedTransit] = useState<TransitAspectItem | null>(null);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showCyclesModal, setShowCyclesModal] = useState(false);

  const [aiCoachingText, setAiCoachingText] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isToday = useMemo(() => {
    const now = new Date();
    return (
      selectedDate.getUTCFullYear() === now.getUTCFullYear() &&
      selectedDate.getUTCMonth() === now.getUTCMonth() &&
      selectedDate.getUTCDate() === now.getUTCDate()
    );
  }, [selectedDate]);

  const timeTravel = useMemo(
    () => buildTimeTravelSnapshot(results, selectedDate),
    [results, selectedDate]
  );

  const upcomingPreviewTransits = useMemo(() => {
    const plus14d = new Date(selectedDate.getTime() + 14 * 86400000);
    return calculateTransitsForDate(results, plus14d).slice(0, 6);
  }, [results, selectedDate]);

  const dailyUpdate = useMemo(
    () => buildDailyUpdatePackage(results, timeTravel.activeTransits, selectedDate),
    [results, timeTravel.activeTransits, selectedDate]
  );

  const shiftDate = (days: number) => {
    setAiCoachingText(null);
    setSelectedDate((prev) => new Date(prev.getTime() + days * 86400000));
  };

  const handleGenerateAiTransitCoaching = async () => {
    setIsAiLoading(true);
    const res = await requestAstrologyAI('transit_guidance', results, {
      dateStr: timeTravel.dateStr,
      transits: timeTravel.activeTransits,
    });
    setAiCoachingText(res.text);
    setIsAiLoading(false);
  };

  const displayedTransits = useMemo(() => {
    if (transitFilter === 'upcoming') return upcomingPreviewTransits;
    if (transitFilter === 'outer') {
      return timeTravel.activeTransits.filter((t) => t.timeframeLabel === 'Deep Outer Cycle');
    }
    return timeTravel.activeTransits;
  }, [transitFilter, timeTravel.activeTransits, upcomingPreviewTransits]);

  return (
    <View style={{ gap: 14 }}>
      {/* Ниво 1: Компактен Time Travel контролер */}
      <Card style={{ padding: 12, borderRadius: 16, gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TouchableOpacity onPress={() => shiftDate(-1)} style={{ padding: 6 }}>
            <ChevronLeft size={18} color={colors.purple} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Clock size={13} color={colors.purple} />
              <T bold size={15}>
                {timeTravel.dateStr}
              </T>
            </View>
            <T muted size={10}>
              {isToday ? 'TODAY · LIVE SKY' : 'TIME TRAVEL SNAPSHOT'}
            </T>
          </View>

          <TouchableOpacity onPress={() => shiftDate(1)} style={{ padding: 6 }}>
            <ChevronRight size={18} color={colors.purple} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[
              { label: '-1 yr', days: -365 },
              { label: '-1 mo', days: -30 },
              { label: '-7 d', days: -7 },
              ...(isToday ? [] : [{ label: 'Today', days: 0 }]),
              { label: '+7 d', days: 7 },
              { label: '+1 mo', days: 30 },
              { label: '+1 yr', days: 365 },
            ].map((step) => (
              <TouchableOpacity
                key={step.label}
                onPress={() => {
                  if (step.days === 0) {
                    setAiCoachingText(null);
                    setSelectedDate(new Date());
                  } else {
                    shiftDate(step.days);
                  }
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: step.days === 0 ? colors.purple : colors.surfaceAlt,
                }}
              >
                <T
                  bold
                  size={11}
                  style={{ color: step.days === 0 ? '#FFFFFF' : colors.muted }}
                >
                  {step.label}
                </T>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Card>

      {/* Ниво 1: Кратък Daily Focus с бутон More към целия разбор */}
      <TieredSummaryCard
        tag={`${dailyUpdate.moonPhase.symbol} ${dailyUpdate.moonPhase.name} in ${dailyUpdate.moonPhase.sign}`}
        badgeText={`${dailyUpdate.cosmicScore}% Alignment`}
        title={isToday ? "Today's Cosmic Pulse" : `Forecast for ${timeTravel.dateStr}`}
        summary={dailyUpdate.dailyMessage}
        onPressMore={() => {
          setShowDailyModal(true);
          if (!aiCoachingText && !isAiLoading) {
            handleGenerateAiTransitCoaching();
          }
        }}
        colors={colors}
      />

      {/* Ниво 1: Transit Ring */}
      <Card style={{ padding: 14, borderRadius: 16 }}>
        <TransitRingSvg
          transits={timeTravel.activeTransits}
          colors={colors}
          title={`TRANSIT RING · ${timeTravel.dateStr}`}
        />
      </Card>

      {/* Ниво 1: Изчистен списък с активни транзити */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Section>Personal Transits</Section>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(
            [
              { id: 'all', label: `Active (${timeTravel.activeTransits.length})` },
              { id: 'upcoming', label: '+14d' },
              { id: 'outer', label: 'Outer' },
            ] as const
          ).map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setTransitFilter(f.id)}
              style={{
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: transitFilter === f.id ? colors.purple : colors.surfaceAlt,
              }}
            >
              <T
                bold
                size={10}
                style={{ color: transitFilter === f.id ? '#FFFFFF' : colors.muted }}
              >
                {f.label}
              </T>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        {displayedTransits.length === 0 ? (
          <Card style={{ padding: 16, alignItems: 'center', borderRadius: 16 }}>
            <T muted size={12}>
              No exact transits in this filter for {timeTravel.dateStr}.
            </T>
          </Card>
        ) : (
          displayedTransits.map((tr) => (
            <TieredSummaryCard
              key={tr.id}
              tag={`${tr.timeframeLabel} · Peak ${tr.peakDateStr}`}
              badgeText={`${tr.intensity}%`}
              title={`${tr.transitSymbol} ${tr.title}`}
              summary={tr.summary}
              onPressMore={() => setSelectedTransit(tr)}
              colors={colors}
            />
          ))
        )}
      </View>

      {/* Ниво 1: Компактен вход към Life Cycles */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => setShowCyclesModal(true)}>
        <Card
          style={{
            padding: 15,
            borderRadius: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <T bold size={14}>
              Life Cycles & Milestones
            </T>
            <T muted size={11}>
              Saturn Return, Nodal Axis & major evolutionary chapters
            </T>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Card>
      </TouchableOpacity>

      {/* Ниво 2/3: Модал за Daily Breakdown + AI Coach */}
      <DetailSheetModal
        visible={showDailyModal}
        onClose={() => setShowDailyModal(false)}
        eyebrow={`${dailyUpdate.moonPhase.symbol} ${dailyUpdate.moonPhase.name} · ${timeTravel.dateStr}`}
        title="Daily Cosmic Breakdown"
        colors={colors}
        isSaved={savedIds.has(`daily_${dailyUpdate.dateStr}`)}
        onSave={() =>
          onSaveDailyInsight(
            `daily_${dailyUpdate.dateStr}`,
            `Daily Update (${dailyUpdate.dateStr})`,
            dailyUpdate.dailyMessage
          )
        }
        onShare={() =>
          onShareText(
            `Natala Daily (${dailyUpdate.dateStr})`,
            `${dailyUpdate.dailyMessage}\n\n${dailyUpdate.mindfulGuidance}`
          )
        }
      >
        <T size={14} style={{ lineHeight: 21 }}>
          {dailyUpdate.dailyMessage}
        </T>

        <View
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.purpleSoft,
            gap: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Wand2 size={14} color={colors.purple} />
            <T bold size={12} style={{ color: colors.purple }}>
              AI Transit Coach
            </T>
          </View>
          {isAiLoading ? (
            <ActivityIndicator size="small" color={colors.purple} />
          ) : (
            <T size={13} style={{ lineHeight: 19 }}>
              {aiCoachingText}
            </T>
          )}
        </View>

        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt }}>
          <T bold size={11} style={{ color: colors.purple }}>
            EMOTIONAL THEME
          </T>
          <T size={13} style={{ marginTop: 3, lineHeight: 19 }}>
            {dailyUpdate.emotionalTheme}
          </T>
        </View>

        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt }}>
          <T bold size={11} style={{ color: colors.gold }}>
            POTENTIAL CHALLENGE
          </T>
          <T size={13} style={{ marginTop: 3, lineHeight: 19 }}>
            {dailyUpdate.potentialChallenge}
          </T>
        </View>

        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt }}>
          <T bold size={11} style={{ color: colors.purple }}>
            MINDFUL GUIDANCE
          </T>
          <T size={13} style={{ marginTop: 3, lineHeight: 19 }}>
            {dailyUpdate.mindfulGuidance}
          </T>
        </View>
      </DetailSheetModal>

      {/* Ниво 2: Модал за избран транзит */}
      <DetailSheetModal
        visible={Boolean(selectedTransit)}
        onClose={() => setSelectedTransit(null)}
        eyebrow={
          selectedTransit
            ? `${selectedTransit.timeframeLabel} · Orb ${selectedTransit.orb}°`
            : undefined
        }
        title={
          selectedTransit
            ? `${selectedTransit.transitSymbol} ${selectedTransit.title}`
            : ''
        }
        colors={colors}
        isSaved={selectedTransit ? savedIds.has(selectedTransit.id) : false}
        onSave={selectedTransit ? () => onSaveTransit(selectedTransit) : undefined}
        onShare={
          selectedTransit
            ? () =>
                onShareText(
                  selectedTransit.title,
                  `Peak: ${selectedTransit.peakDateStr}\n\n${selectedTransit.summary}\n\n${selectedTransit.guidance}`
                )
            : undefined
        }
      >
        {selectedTransit && (
          <>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <View>
                <T muted size={10}>
                  START
                </T>
                <T bold size={12}>
                  {selectedTransit.startDateStr}
                </T>
              </View>
              <View>
                <T muted size={10}>
                  EXACT PEAK
                </T>
                <T bold size={12} style={{ color: colors.purple }}>
                  {selectedTransit.peakDateStr}
                </T>
              </View>
              <View>
                <T muted size={10}>
                  COMPLETION
                </T>
                <T bold size={12}>
                  {selectedTransit.endDateStr}
                </T>
              </View>
            </View>

            <T size={14} style={{ lineHeight: 22 }}>
              {selectedTransit.summary}
            </T>

            <View
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.purpleSoft,
                gap: 4,
              }}
            >
              <T bold size={11} style={{ color: colors.purple }}>
                HOW TO NAVIGATE
              </T>
              <T size={13} style={{ lineHeight: 19 }}>
                {selectedTransit.guidance}
              </T>
            </View>
          </>
        )}
      </DetailSheetModal>

      {/* Ниво 2: Модал за Life Cycles */}
      <DetailSheetModal
        visible={showCyclesModal}
        onClose={() => setShowCyclesModal(false)}
        eyebrow="EVOLUTIONARY TIMELINE"
        title="Life Cycles & Milestones"
        colors={colors}
      >
        {timeTravel.lifeCycles.map((cycle) => (
          <View
            key={cycle.id}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceAlt,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={13} style={{ flex: 1 }}>
                {cycle.title}
              </T>
              <T
                bold
                size={10}
                style={{
                  color:
                    cycle.status === 'active'
                      ? '#10B981'
                      : cycle.status === 'completed'
                      ? colors.muted
                      : colors.gold,
                }}
              >
                {cycle.ageRange}
              </T>
            </View>
            <T muted size={12} style={{ lineHeight: 18 }}>
              {cycle.description}
            </T>
          </View>
        ))}
      </DetailSheetModal>
    </View>
  );
}