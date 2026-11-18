import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import {
  Sparkles,
  Clock,
  Orbit,
  Bookmark,
  Check,
  Share2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Zap,
} from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import { NatalChartResults, TransitAspectItem } from './astrology.types';
import {
  buildTimeTravelSnapshot,
  calculateTransitsForDate,
} from './astrology.transits';
import { buildDailyUpdatePackage } from './astrology.insights';
import { TransitRingSvg } from './TransitRingSvg';

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
    setSelectedDate((prev) => new Date(prev.getTime() + days * 86400000));
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
      {/* Модул 5: Time Travel Navigator */}
      <Card style={{ padding: 14, gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={16} color={colors.purple} />
            <T bold size={14}>
              Time Travel & Cosmic Timeline
            </T>
          </View>
          {!isToday && (
            <TouchableOpacity
              onPress={() => setSelectedDate(new Date())}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: colors.purpleSoft,
              }}
            >
              <RefreshCw size={11} color={colors.purple} />
              <T bold size={11} style={{ color: colors.purple }}>
                Today
              </T>
            </TouchableOpacity>
          )}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surfaceAlt,
            borderRadius: 12,
            padding: 8,
          }}
        >
          <TouchableOpacity onPress={() => shiftDate(-1)} style={{ padding: 6 }}>
            <ChevronLeft size={18} color={colors.purple} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <T bold size={16}>
              {timeTravel.dateStr}
            </T>
            <T muted size={10}>
              {isToday
                ? 'СЕГАШЕН МОМЕНТ (LIVE SKY)'
                : selectedDate.getTime() < Date.now()
                ? 'МИНАЛ ПЕРИОД (TIME TRAVEL)'
                : 'БЪДЕЩ ПЕРИОД (TIME TRAVEL)'}
            </T>
          </View>

          <TouchableOpacity onPress={() => shiftDate(1)} style={{ padding: 6 }}>
            <ChevronRight size={18} color={colors.purple} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[
              { label: '-5 г.', days: -1826 },
              { label: '-1 г.', days: -365 },
              { label: '-1 мес.', days: -30 },
              { label: '-7 дни', days: -7 },
              { label: '+7 дни', days: 7 },
              { label: '+1 мес.', days: 30 },
              { label: '+1 г.', days: 365 },
              { label: '+5 г.', days: 1826 },
            ].map((step) => (
              <TouchableOpacity
                key={step.label}
                onPress={() => shiftDate(step.days)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: colors.line,
                }}
              >
                <T bold size={11}>
                  {step.label}
                </T>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Card>

      {/* Модул 3: Daily Updates & Moon Phase */}
      <Section>{isToday ? 'Daily Cosmic Update' : `Cosmic Forecast (${timeTravel.dateStr})`}</Section>
      <Card style={{ padding: 14, gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <T size={22}>{dailyUpdate.moonPhase.symbol}</T>
            <View>
              <T bold size={14}>
                {dailyUpdate.moonPhase.name} in {dailyUpdate.moonPhase.sign}
              </T>
              <T muted size={11}>
                Illumination: {dailyUpdate.moonPhase.illumination}% · Alignment:{' '}
                {dailyUpdate.cosmicScore}%
              </T>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              onPress={() =>
                onSaveDailyInsight(
                  `daily_${dailyUpdate.dateStr}`,
                  `Daily Update (${dailyUpdate.dateStr})`,
                  dailyUpdate.dailyMessage
                )
              }
              style={{
                padding: 7,
                borderRadius: 8,
                backgroundColor: savedIds.has(`daily_${dailyUpdate.dateStr}`)
                  ? colors.purple
                  : colors.surfaceAlt,
              }}
            >
              {savedIds.has(`daily_${dailyUpdate.dateStr}`) ? (
                <Check size={14} color="#FFFFFF" />
              ) : (
                <Bookmark size={14} color={colors.purple} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                onShareText(
                  `Natala Daily (${dailyUpdate.dateStr})`,
                  `${dailyUpdate.dailyMessage}\n\n${dailyUpdate.mindfulGuidance}`
                )
              }
              style={{ padding: 7, borderRadius: 8, backgroundColor: colors.surfaceAlt }}
            >
              <Share2 size={14} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <T size={13} style={{ lineHeight: 19 }}>
          {dailyUpdate.dailyMessage}
        </T>

        <View style={{ gap: 6 }}>
          <View style={{ padding: 10, borderRadius: 10, backgroundColor: colors.surfaceAlt }}>
            <T bold size={11} style={{ color: colors.purple }}>
              Емоционална тема на деня:
            </T>
            <T size={12} style={{ marginTop: 2 }}>
              {dailyUpdate.emotionalTheme}
            </T>
          </View>

          <View style={{ padding: 10, borderRadius: 10, backgroundColor: colors.surfaceAlt }}>
            <T bold size={11} style={{ color: colors.gold }}>
              Активиран личностен процес:
            </T>
            <T size={12} style={{ marginTop: 2 }}>
              {dailyUpdate.activatedProcess}
            </T>
          </View>

          <View style={{ padding: 10, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.12)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={12} color="#F59E0B" />
              <T bold size={11} style={{ color: '#F59E0B' }}>
                Възможно предизвикателство:
              </T>
            </View>
            <T size={12} style={{ marginTop: 2 }}>
              {dailyUpdate.potentialChallenge}
            </T>
          </View>

          <View style={{ padding: 10, borderRadius: 10, backgroundColor: colors.purpleSoft }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Sparkles size={12} color={colors.purple} />
              <T bold size={11} style={{ color: colors.purple }}>
                Насока за осъзнаване:
              </T>
            </View>
            <T size={12} style={{ marginTop: 2 }}>
              {dailyUpdate.mindfulGuidance}
            </T>
          </View>
        </View>
      </Card>

      {/* Модул 4.9: Transit Ring Visualization */}
      <Section>Transit Ring & Active Cycles</Section>
      <Card style={{ padding: 14 }}>
        <TransitRingSvg
          transits={timeTravel.activeTransits}
          colors={colors}
          title={`TRANSIT RING (${timeTravel.dateStr})`}
        />
      </Card>

      {/* Модул 4.1–4.11: Лични, текущи и предстоящи транзити */}
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
              { id: 'upcoming', label: 'Upcoming (+14d)' },
              { id: 'outer', label: 'Outer Cycles' },
            ] as const
          ).map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setTransitFilter(f.id)}
              style={{
                paddingHorizontal: 9,
                paddingVertical: 5,
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
          <Card style={{ padding: 16, alignItems: 'center' }}>
            <T muted size={12}>
              Няма точни транзити в този филтър за {timeTravel.dateStr}.
            </T>
          </Card>
        ) : (
          displayedTransits.map((tr) => {
            const isSaved = savedIds.has(tr.id);
            return (
              <Card key={tr.id} style={{ padding: 14, gap: 8 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Orbit size={14} color={colors.purple} />
                      <T bold size={10} style={{ color: colors.gold }}>
                        {tr.timeframeLabel} · Orb {tr.orb}° · Intensity {tr.intensity}%
                      </T>
                    </View>
                    <T bold size={15} style={{ marginTop: 2 }}>
                      {tr.transitSymbol} {tr.title} {tr.natalSymbol}
                    </T>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => onSaveTransit(tr)}
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
                      onPress={() =>
                        onShareText(
                          tr.title,
                          `Пик: ${tr.peakDateStr}\n${tr.summary}\n${tr.guidance}`
                        )
                      }
                      style={{ padding: 7, borderRadius: 8, backgroundColor: colors.surfaceAlt }}
                    >
                      <Share2 size={14} color={colors.muted} />
                    </TouchableOpacity>
                  </View>
                </View>

                <T size={13} style={{ lineHeight: 19 }}>
                  {tr.summary}
                </T>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: colors.surfaceAlt,
                  }}
                >
                  <T muted size={10}>
                    Начало: {tr.startDateStr}
                  </T>
                  <T bold size={10} style={{ color: colors.purple }}>
                    Пик: {tr.peakDateStr}
                  </T>
                  <T muted size={10}>
                    Край: {tr.endDateStr}
                  </T>
                </View>

                <T size={11} style={{ color: colors.purple }}>
                  <Zap size={11} color={colors.purple} /> {tr.guidance}
                </T>
              </Card>
            );
          })
        )}
      </View>

      {/* Модул 5.4 & 5.5: Житейски цикли */}
      <Section>Life Cycles & Evolutionary Milestones</Section>
      <View style={{ gap: 8 }}>
        {timeTravel.lifeCycles.map((cycle) => (
          <Card key={cycle.id} style={{ padding: 12, gap: 4 }}>
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
                {cycle.ageRange} · {cycle.status.toUpperCase()}
              </T>
            </View>
            <T muted size={12}>
              {cycle.description}
            </T>
          </Card>
        ))}
      </View>
    </View>
  );
}