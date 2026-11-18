import React, { useMemo, useState } from 'react';
import {
  View,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  ArrowLeft,
  Clock,
  Sliders,
  Compass,
  Activity,
  Layers,
  TrendingUp,
  Heart,
  MapPin,
  Check,
} from 'lucide-react-native';
import { Hero, Card, T, Section } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import {
  BaZiTabId,
  BaZiViewComplexity,
  CityPreset,
  Gender,
} from './bazi.types';
import { calculateBaZiChart } from './bazi.calculator';
import {
  CITY_PRESETS,
  convertLocalToTrueSolarTime,
  findCityPreset,
} from './bazi.solar';
import { PillarGrid } from './PillarGrid';
import { BaZiSheetModal, BaZiTierCard } from './BaZiDetailModal';
import { BaZiTabToday } from './BaZiTabToday';
import { BaZiTabAnalysis } from './BaZiTabAnalysis';
import { BaZiTabLuck } from './BaZiTabLuck';
import { BaZiTabMatchMaker } from './BaZiTabMatchMaker';

function parseTimeString(raw: any): { hour: number; minute: number } | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2}):(\d{1,2})(?::\d{2})?\s*(AM|PM|am|pm)?$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
    return { hour, minute };
  }
  return null;
}

function extractInitialProfile(user: any) {
  let day = 15;
  let month = 6;
  let year = 1995;

  if (user?.birthdate) {
    const d = new Date(user.birthdate);
    if (!Number.isNaN(d.getTime())) {
      day = d.getUTCDate();
      month = d.getUTCMonth() + 1;
      year = d.getUTCFullYear();
    }
  } else if (user?.birthDate?.day && user?.birthDate?.month && user?.birthDate?.year) {
    day = Number(user.birthDate.day);
    month = Number(user.birthDate.month);
    year = Number(user.birthDate.year);
  }

  const parsedTime =
    parseTimeString(user?.birthTime) || parseTimeString(user?.birthDate?.time);
  const city = findCityPreset(
    typeof user?.birthCity === 'string' ? user.birthCity : user?.birthCity?.name
  );
  const gender: Gender =
    user?.gender === 'male' || user?.sex === 'male' ? 'male' : 'female';

  return {
    name: user?.name || 'Your Birth Blueprint',
    dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    timeStr: parsedTime
      ? `${String(parsedTime.hour).padStart(2, '0')}:${String(parsedTime.minute).padStart(2, '0')}`
      : '',
    unknownTime: !parsedTime,
    city,
    gender,
  };
}

export default function BaZi() {
  const { colors, user, setPage } = useApp();

  const initial = useMemo(() => extractInitialProfile(user), [user]);

  const [activeTab, setActiveTab] = useState<BaZiTabId>('chart');
  const [viewComplexity, setViewComplexity] = useState<BaZiViewComplexity>('simple');
  const [showInputModal, setShowInputModal] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);

  const [profileName, setProfileName] = useState(initial.name);
  const [dateInput, setDateInput] = useState(initial.dateStr);
  const [timeInput, setTimeInput] = useState(initial.timeStr);
  const [unknownTime, setUnknownTime] = useState(initial.unknownTime);
  const [selectedCity, setSelectedCity] = useState<CityPreset>(initial.city);
  const [gender, setGender] = useState<Gender>(initial.gender);

  const parsedInput = useMemo(() => {
    const parts = dateInput.trim().split(/[-./]/);
    let y = 1995;
    let m = 6;
    let d = 15;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10) || 1995;
        m = parseInt(parts[1], 10) || 6;
        d = parseInt(parts[2], 10) || 15;
      } else {
        d = parseInt(parts[0], 10) || 15;
        m = parseInt(parts[1], 10) || 6;
        y = parseInt(parts[2], 10) || 1995;
      }
    }

    const parsedTime = unknownTime ? null : parseTimeString(timeInput);
    const solar = parsedTime
      ? convertLocalToTrueSolarTime(
          y,
          m,
          d,
          parsedTime.hour,
          parsedTime.minute,
          selectedCity
        )
      : null;

    return { y, m, d, parsedTime, solar };
  }, [dateInput, timeInput, unknownTime, selectedCity]);

  const chart = useMemo(() => {
    if (parsedInput.solar) {
      return calculateBaZiChart(
        parsedInput.solar.solarYear,
        parsedInput.solar.solarMonth,
        parsedInput.solar.solarDay,
        parsedInput.solar.shichenBranchIndex,
        gender
      );
    }
    return calculateBaZiChart(parsedInput.y, parsedInput.m, parsedInput.d, null, gender);
  }, [parsedInput, gender]);

  const formattedDate = `${String(parsedInput.d).padStart(2, '0')}.${String(
    parsedInput.m
  ).padStart(2, '0')}.${parsedInput.y}`;

  return (
    <>
      {/* Top Bar: Back + Simple/Pro Toggle */}
      <View style={styles.topNavRow}>
        <Pressable
          onPress={() => setPage('explore')}
          style={[styles.backBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <ArrowLeft size={16} color={colors.text} />
          <T bold size={12}>
            Explore
          </T>
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surfaceAlt,
            borderRadius: 10,
            padding: 3,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          {(['simple', 'pro'] as BaZiViewComplexity[]).map((mode) => {
            const active = viewComplexity === mode;
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => setViewComplexity(mode)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 7,
                  backgroundColor: active ? colors.purple : 'transparent',
                }}
              >
                <T
                  bold
                  size={10}
                  style={{ color: active ? '#FFFFFF' : colors.muted }}
                >
                  {mode === 'simple' ? 'Simple' : 'Pro'}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Hero
        eyebrow="BAZI · FOUR PILLARS OF DESTINY"
        first="Decode your"
        accent="elemental destiny."
        description="True Solar Time calculation, Qi diagnostics, Luck Pillars & MatchMaker."
      />

      {/* 5-Tab Tiered Navigation */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surfaceAlt,
          borderRadius: 14,
          padding: 4,
          marginTop: 12,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        {(
          [
            { id: 'chart', label: 'Chart', Icon: Compass },
            { id: 'live', label: 'Live ±3d', Icon: Activity },
            { id: 'diagnostics', label: 'Qi & Gods', Icon: Layers },
            { id: 'luck', label: 'Luck', Icon: TrendingUp },
            { id: 'match', label: 'Match', Icon: Heart },
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
                backgroundColor: active ? colors.purple : 'transparent',
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

      {activeTab === 'chart' && (
        <View style={{ gap: 14 }}>
          {/* Compact Birth Summary + True Solar Time + Chart Generator Button */}
          <Card style={styles.profileInfoCard}>
            <View style={styles.profileInfoRow}>
              <Clock size={18} color={colors.gold} />
              <View style={{ flex: 1, gap: 2 }}>
                <T bold size={14}>
                  {profileName} ({gender === 'female' ? '♀' : '♂'})
                </T>
                <T muted size={11}>
                  {formattedDate} · {selectedCity.name} ·{' '}
                  {parsedInput.solar
                    ? `${parsedInput.solar.localTimeStr} → ${parsedInput.solar.solarTimeStr} TST`
                    : 'Unknown Hour'}
                </T>
                {parsedInput.solar && viewComplexity === 'pro' && (
                  <T size={10} style={{ color: colors.purple }}>
                    Solar Offset: {parsedInput.solar.totalOffsetMinutes >= 0 ? '+' : ''}
                    {parsedInput.solar.totalOffsetMinutes} min (Lon{' '}
                    {parsedInput.solar.longitudeOffsetMinutes}m, EoT{' '}
                    {parsedInput.solar.eotMinutes}m)
                  </T>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setShowInputModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 9,
                  backgroundColor: colors.purpleSoft,
                }}
              >
                <Sliders size={12} color={colors.purple} />
                <T bold size={11} style={{ color: colors.purple }}>
                  Chart
                </T>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Four Pillars Grid */}
          <PillarGrid chart={chart} colors={colors} mode={viewComplexity} />

          {/* Tier 1: Day Master & Core Synthesis */}
          <BaZiTierCard
            eyebrow={`DAY MASTER · ${chart.dayMasterStrength.status.toUpperCase()} (${chart.dayMasterStrength.score}%)`}
            badgeText={`${chart.primaryProfile.archetype}`}
            title={chart.dayMaster.title}
            summary={chart.dayMaster.archetype}
            onPressMore={() => setShowOverviewModal(true)}
            colors={colors}
          />

          <Section>2026 Annual Energy</Section>
          <Card style={styles.transitCard}>
            <T bold size={13} style={{ color: colors.gold }}>
              {chart.annualTransit2026.pillarName}
            </T>
            <T bold size={13}>
              {chart.annualTransit2026.elementRelation}
            </T>
            <T muted size={12} style={{ lineHeight: 18 }}>
              {chart.annualTransit2026.guidance}
            </T>
          </Card>
        </View>
      )}

      {activeTab === 'live' && (
        <BaZiTabToday
          natalChart={chart}
          city={selectedCity}
          mode={viewComplexity}
          colors={colors}
        />
      )}

      {activeTab === 'diagnostics' && (
        <BaZiTabAnalysis chart={chart} mode={viewComplexity} colors={colors} />
      )}

      {activeTab === 'luck' && (
        <BaZiTabLuck chart={chart} mode={viewComplexity} colors={colors} />
      )}

      {activeTab === 'match' && (
        <BaZiTabMatchMaker
          userChart={chart}
          userName={profileName}
          colors={colors}
        />
      )}

      {/* Tier 2: Full Day Master & Yong Shen Synthesis Modal */}
      <BaZiSheetModal
        visible={showOverviewModal}
        onClose={() => setShowOverviewModal(false)}
        eyebrow={`${chart.zodiacAnimal} YEAR · ${chart.dayMasterStrength.statusLabel}`}
        title={chart.dayMaster.title}
        colors={colors}
      >
        <T size={14} style={{ lineHeight: 21 }}>
          {chart.dayMasterStrength.summary}
        </T>
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt }}>
          <T bold size={11} style={{ color: colors.gold }}>
            KEY STRENGTHS
          </T>
          <T size={13} style={{ marginTop: 3, lineHeight: 19 }}>
            {chart.dayMaster.strengths}
          </T>
        </View>
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.purpleSoft }}>
          <T bold size={11} style={{ color: colors.purple }}>
            USEFUL YONG SHEN: {chart.qiBoost[0]?.element.toUpperCase()} (
            {chart.qiBoost[0]?.score}/10)
          </T>
          <T size={13} style={{ marginTop: 3, lineHeight: 19 }}>
            {chart.dayMaster.balanceAdvice}
          </T>
        </View>
      </BaZiSheetModal>

      {/* Chart Generator Modal (Date, Time / Unknown Time, Location, Gender) */}
      <BaZiSheetModal
        visible={showInputModal}
        onClose={() => setShowInputModal(false)}
        eyebrow="BAZI CHART GENERATOR"
        title="Birth Details & True Solar Time"
        colors={colors}
      >
        <TextInput
          value={profileName}
          onChangeText={setProfileName}
          placeholder="Name"
          placeholderTextColor={colors.muted}
          style={{
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 9,
            color: colors.text,
          }}
        />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['female', 'male'] as Gender[]).map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g)}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: gender === g ? colors.purple : colors.surfaceAlt,
              }}
            >
              <T bold size={12} style={{ color: gender === g ? '#FFFFFF' : colors.muted }}>
                {g === 'female' ? 'Female (♀)' : 'Male (♂)'}
              </T>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={dateInput}
            onChangeText={setDateInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 9,
              color: colors.text,
            }}
          />
          <TextInput
            value={unknownTime ? '' : timeInput}
            onChangeText={setTimeInput}
            editable={!unknownTime}
            placeholder={unknownTime ? 'Unknown hour' : 'HH:MM'}
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 9,
              color: colors.text,
              opacity: unknownTime ? 0.5 : 1,
            }}
          />
        </View>

        <TouchableOpacity
          onPress={() => setUnknownTime((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              backgroundColor: unknownTime ? colors.purple : colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unknownTime && <Check size={12} color="#FFFFFF" />}
          </View>
          <T size={12}>Unknown birth time (calculate 3 Pillars)</T>
        </TouchableOpacity>

        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <MapPin size={13} color={colors.gold} />
            <T bold size={11} style={{ color: colors.gold }}>
              BIRTH LOCATION (FOR TRUE SOLAR TIME)
            </T>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {CITY_PRESETS.map((city) => {
                const active = city.name === selectedCity.name;
                return (
                  <TouchableOpacity
                    key={city.name}
                    onPress={() => setSelectedCity(city)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: active ? colors.purple : colors.surfaceAlt,
                    }}
                  >
                    <T
                      bold
                      size={11}
                      style={{ color: active ? '#FFFFFF' : colors.muted }}
                    >
                      {city.name} ({city.longitude}°)
                    </T>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity
          onPress={() => setShowInputModal(false)}
          style={{
            backgroundColor: colors.purple,
            paddingVertical: 11,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <T bold size={13} style={{ color: '#FFFFFF' }}>
            Apply & Recalculate
          </T>
        </TouchableOpacity>
      </BaZiSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  profileInfoCard: {
    padding: 14,
    borderRadius: 16,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transitCard: {
    padding: 16,
    borderRadius: 16,
    gap: 6,
    marginBottom: 24,
  },
});