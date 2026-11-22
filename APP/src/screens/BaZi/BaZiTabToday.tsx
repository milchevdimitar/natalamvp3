import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Clock, RefreshCw, Sparkles } from 'lucide-react-native';
import { Card, T } from '../../components/UI';
import { BaZiChart, BaZiViewComplexity, CityPreset } from './bazi.types';
import { calculateBaZiChart, getTenGod } from './bazi.calculator';
import { convertLocalToTrueSolarTime } from './bazi.solar';
import { PillarGrid } from './PillarGrid';
import { BaZiSheetModal, BaZiTierCard } from './BaZiDetailModal';

export function BaZiTabToday({
  natalChart,
  city,
  mode,
  colors,
}: {
  natalChart: BaZiChart;
  city: CityPreset;
  mode: BaZiViewComplexity;
  colors: any;
}) {
  const [nowTick, setNowTick] = useState<Date>(() => new Date());
  const [dayOffset, setDayOffset] = useState<number>(0); // -3 .. +3
  const [showEnergyModal, setShowEnergyModal] = useState(false);

  // Automatic real-time clock tick every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const targetDate = useMemo(() => {
    return new Date(nowTick.getTime() + dayOffset * 86400000);
  }, [nowTick, dayOffset]);

  const solarNow = useMemo(() => {
    return convertLocalToTrueSolarTime(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      targetDate.getDate(),
      targetDate.getHours(),
      targetDate.getMinutes(),
      city
    );
  }, [targetDate, city]);

  const liveChart = useMemo(() => {
    return calculateBaZiChart(
      solarNow.solarYear,
      solarNow.solarMonth,
      solarNow.solarDay,
      solarNow.shichenBranchIndex,
      natalChart.gender
    );
  }, [solarNow, natalChart.gender]);

  const dayStemRelation = useMemo(
    () => getTenGod(natalChart.dayMaster.stem, liveChart.dayPillar.stem),
    [natalChart.dayMaster.stem, liveChart.dayPillar.stem]
  );

  const hourStemRelation = useMemo(() => {
    if (!liveChart.hourPillar) return 'Neutral';
    return getTenGod(natalChart.dayMaster.stem, liveChart.hourPillar.stem);
  }, [natalChart.dayMaster.stem, liveChart.hourPillar]);

  const isUsefulDay = natalChart.qiBoost
    .slice(0, 2)
    .some((b) => b.element.includes(liveChart.dayPillar.stem.element));

  return (
    <View style={{ gap: 14 }}>
      {/* Tier 1: Live clock + Fast Chart Browsing (-3d .. +3d) */}
      <Card style={{ padding: 14, borderRadius: 16, gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color={dayOffset === 0 ? '#10B981' : colors.purple} />
            <T bold size={13}>
              {solarNow.solarDateStr} · {solarNow.solarTimeStr} TST
            </T>
          </View>

          {dayOffset !== 0 ? (
            <TouchableOpacity
              onPress={() => setDayOffset(0)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: colors.purpleSoft,
              }}
            >
              <RefreshCw size={11} color={colors.purple} />
              <T bold size={10} style={{ color: colors.purple }}>
                Live Now
              </T>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                backgroundColor: 'rgba(16, 185, 129, 0.14)',
              }}
            >
              <T bold size={10} style={{ color: '#10B981' }}>
                LIVE REAL-TIME
              </T>
            </View>
          )}
        </View>

        <T muted size={11}>
          Active Shichen: <T bold size={11}>{solarNow.shichenLabel}</T> · Local{' '}
          {solarNow.localTimeStr} ({solarNow.totalOffsetMinutes >= 0 ? '+' : ''}
          {solarNow.totalOffsetMinutes}m solar)
        </T>

        {/* Fast Chart Browsing ±3 Days */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
              const active = dayOffset === offset;
              const label =
                offset === 0 ? 'Today' : offset > 0 ? `+${offset}d` : `${offset}d`;
              return (
                <TouchableOpacity
                  key={offset}
                  onPress={() => setDayOffset(offset)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 9,
                    backgroundColor: active ? colors.purple : colors.surfaceAlt,
                  }}
                >
                  <T
                    bold
                    size={11}
                    style={{ color: active ? '#FFFFFF' : colors.muted }}
                  >
                    {label}
                  </T>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Card>

      {/* Tier 1: Dynamic Live Energy Chart */}
      <PillarGrid
        chart={liveChart}
        colors={colors}
        mode={mode}
        title={
          dayOffset === 0
            ? 'Dynamic Live Energy Chart (Current Moment)'
            : `Energy Snapshot (${dayOffset > 0 ? `+${dayOffset}` : dayOffset} Days)`
        }
      />

      {/* Tier 1: Resonance with Natal Chart */}
      <BaZiTierCard
        eyebrow={`DAY GOD: ${dayStemRelation} · HOUR GOD: ${hourStemRelation}`}
        badgeText={isUsefulDay ? 'High Qi Boost' : 'Steady Flow'}
        badgeColor={isUsefulDay ? '#10B981' : colors.purple}
        title={`${liveChart.dayPillar.stem.pinyin}-${liveChart.dayPillar.branch.pinyin} Day × ${liveChart.hourPillar?.stem.pinyin}-${liveChart.hourPillar?.branch.pinyin} Hour`}
        summary={
          isUsefulDay
            ? `Today's ${liveChart.dayPillar.stem.element} energy directly nourishes your useful Yong Shen element.`
            : `Activates ${dayStemRelation} themes in your daily decisions and ${hourStemRelation} in this 2-hour window.`
        }
        onPressMore={() => setShowEnergyModal(true)}
        colors={colors}
      />

      {/* Tier 2: Detailed Breakdown Modal */}
      <BaZiSheetModal
        visible={showEnergyModal}
        onClose={() => setShowEnergyModal(false)}
        eyebrow={`${solarNow.solarDateStr} · ${solarNow.shichenLabel}`}
        title="Live Day & Hour Energy Breakdown"
        colors={colors}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} color={colors.gold} />
          <T bold size={14}>
            How Today Interacts With Your Day Master ({natalChart.dayMaster.stem.pinyin})
          </T>
        </View>

        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt, gap: 4 }}>
          <T bold size={11} style={{ color: colors.purple }}>
            DAY PILLAR INFLUENCE · {dayStemRelation.toUpperCase()}
          </T>
          <T size={13} style={{ lineHeight: 19 }}>
            The day stem {liveChart.dayPillar.stem.hanzi} ({liveChart.dayPillar.stem.pinyin}{' '}
            {liveChart.dayPillar.stem.element}) brings {dayStemRelation} energy to your{' '}
            {natalChart.dayMaster.stem.element} core.
          </T>
        </View>

        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt, gap: 4 }}>
          <T bold size={11} style={{ color: colors.gold }}>
            CURRENT 2-HOUR WINDOW · {hourStemRelation.toUpperCase()}
          </T>
          <T size={13} style={{ lineHeight: 19 }}>
            During {solarNow.shichenLabel}, {liveChart.hourPillar?.stem.pinyin}{' '}
            {liveChart.hourPillar?.stem.element} activates {hourStemRelation} — ideal for focused
            intentions aligned with your {natalChart.qiBoost[0]?.element} Yong Shen.
          </T>
        </View>
      </BaZiSheetModal>
    </View>
  );
}