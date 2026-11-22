import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Clock, Check, Sun } from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import { AyurvedaProfile, AyurvedaViewComplexity } from './ayurveda.types';
import { getActiveDoshaClock } from './ayurveda.calculator';
import { DOSHA_META } from './ayurveda.data';
import { AyurvedaSheetModal, AyurvedaTierCard } from './AyurvedaDetailModal';

export function AyurvedaTabDaily({
  profile,
  mode,
  colors,
}: {
  profile: AyurvedaProfile;
  mode: AyurvedaViewComplexity;
  colors: any;
}) {
  const [nowTick, setNowTick] = useState<Date>(() => new Date());
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [showClockModal, setShowClockModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const clockInfo = useMemo(() => getActiveDoshaClock(nowTick), [nowTick]);
  const doshaColor = DOSHA_META[clockInfo.activeDosha].color;

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={{ gap: 14 }}>
      {/* Tier 1: Real-Time Ayurvedic Dosha Clock */}
      <AyurvedaTierCard
        eyebrow={`LIVE DOSHA CLOCK · ${clockInfo.currentTimeStr} (${clockInfo.timeRange})`}
        badgeText={`${clockInfo.activeDosha} Time`}
        badgeColor={doshaColor}
        title={clockInfo.periodLabel}
        summary={clockInfo.bestActivities}
        onPressMore={() => setShowClockModal(true)}
        colors={colors}
      />

      {/* Tier 1: Seasonal Ritucharya Card */}
      <Card style={{ padding: 14, borderRadius: 16, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sun size={14} color={colors.gold} />
          <T bold size={11} style={{ color: colors.gold }}>
            SEASONAL RITUCHARYA · {profile.season.seasonName.toUpperCase()}
            {mode === 'pro' ? ` (${profile.season.sanskritName})` : ''}
          </T>
        </View>
        <T bold size={14}>
          Pacifying {profile.season.dominantDosha} Season
        </T>
        <T muted size={12} style={{ lineHeight: 18 }}>
          {profile.season.keyAdjustments}
        </T>
      </Card>

      {/* Interactive Daily Dinacharya Checklist */}
      <Section>Daily Dinacharya Rituals ({profile.imbalancedDosha}-Balancing)</Section>
      <View style={{ gap: 8 }}>
        {profile.dinacharya.map((step) => {
          const done = !!completedSteps[step.id];
          return (
            <TouchableOpacity
              key={step.id}
              activeOpacity={0.85}
              onPress={() => toggleStep(step.id)}
            >
              <Card
                style={{
                  padding: 14,
                  borderRadius: 15,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 11,
                  opacity: done ? 0.72 : 1,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    marginTop: 2,
                    backgroundColor: done ? '#10B981' : colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: done ? '#10B981' : colors.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {done && <Check size={13} color="#FFFFFF" />}
                </View>

                <View style={{ flex: 1, gap: 3 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <T bold size={10} style={{ color: colors.purple }}>
                      {step.window.toUpperCase()} · {step.timeRange}
                    </T>
                    {mode === 'pro' && (
                      <T muted size={10}>
                        {step.sanskrit}
                      </T>
                    )}
                  </View>
                  <T bold size={14}>
                    {step.title}
                  </T>
                  <T muted size={12} style={{ lineHeight: 18 }}>
                    {step.description}
                  </T>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tier 2: Dosha Clock Detail Modal */}
      <AyurvedaSheetModal
        visible={showClockModal}
        onClose={() => setShowClockModal(false)}
        eyebrow={`CIRCADIAN AYURVEDA · ${clockInfo.timeRange}`}
        title={clockInfo.periodLabel}
        colors={colors}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Clock size={15} color={doshaColor} />
          <T bold size={14}>
            Dominant Energy: {clockInfo.activeDosha} ({clockInfo.energyQuality})
          </T>
        </View>

        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.purpleSoft, gap: 4 }}>
          <T bold size={11} style={{ color: colors.purple }}>
            ALIGNED ACTIVITIES
          </T>
          <T size={13} style={{ lineHeight: 19 }}>
            {clockInfo.bestActivities}
          </T>
        </View>

        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt, gap: 4 }}>
          <T bold size={11} style={{ color: colors.gold }}>
            WHAT TO AVOID IN THIS WINDOW
          </T>
          <T size={13} style={{ lineHeight: 19 }}>
            {clockInfo.avoidActivities}
          </T>
        </View>
      </AyurvedaSheetModal>
    </View>
  );
}