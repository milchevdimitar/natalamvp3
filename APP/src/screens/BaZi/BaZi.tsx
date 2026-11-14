import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft, Sparkles, Clock } from 'lucide-react-native';
import { Hero, Card, T, Section } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { calculateBaZiChart, CHINESE_HOURS } from './bazi.calculator';
import { PillarGrid } from './PillarGrid';
import { ElementsBalanceCard } from './ElementsBalanceCard';

interface ExtractedBirthData {
  day: number;
  month: number;
  year: number;
  formattedTime: string | null;
  branchIndex: number | null;
  shichenLabel: string | null;
}

function parseTimeString(raw: any): { hour: number; minute: number } | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Поддържа "14:30", "9:05", "14:30:00" и "2:30 PM" / "12:15 AM"
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

function hourToShichenBranchIndex(hour: number): number {
  // 23:00–00:59 -> 0 (Zi), 01:00–02:59 -> 1 (Chou), ..., 21:00–22:59 -> 11 (Hai)
  return Math.floor((hour + 1) / 2) % 12;
}

function extractUserBirthData(user: any): ExtractedBirthData {
  let day = 15;
  let month = 6;
  let year = 1995;

  // 1. Извличане на датата от базата (birthdate в models/User.js)
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

  // 2. Извличане на точния час директно от user.birthTime в базата данни
  const parsedTime =
    parseTimeString(user?.birthTime) || parseTimeString(user?.birthDate?.time);

  if (parsedTime) {
    const hh = String(parsedTime.hour).padStart(2, '0');
    const mm = String(parsedTime.minute).padStart(2, '0');
    const branchIndex = hourToShichenBranchIndex(parsedTime.hour);
    const shichen = CHINESE_HOURS.find((h) => h.branchIndex === branchIndex);

    return {
      day,
      month,
      year,
      formattedTime: `${hh}:${mm}`,
      branchIndex,
      shichenLabel: shichen ? `${shichen.label} (${shichen.range})` : null,
    };
  }

  return {
    day,
    month,
    year,
    formattedTime: null,
    branchIndex: null,
    shichenLabel: null,
  };
}

export default function BaZi() {
  const { colors, user, setPage } = useApp();

  // Чете датата и часа директно от профила в базата (без възможност за редакция)
  const birthData = useMemo(() => extractUserBirthData(user), [user]);

  const chart = useMemo(
    () =>
      calculateBaZiChart(
        birthData.year,
        birthData.month,
        birthData.day,
        birthData.branchIndex
      ),
    [birthData.year, birthData.month, birthData.day, birthData.branchIndex]
  );

  const formattedDate = `${String(birthData.day).padStart(2, '0')}.${String(
    birthData.month
  ).padStart(2, '0')}.${birthData.year}`;

  return (
    <>
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
      </View>

      <Hero
        eyebrow="BAZI · FOUR PILLARS OF DESTINY"
        first="Decode your"
        accent="elemental destiny."
        description="Your personal Chinese solar-term calculation of Year, Month, Day, and Hour pillars."
      />

      {/* Данни за раждането директно от базата данни */}
      <Card style={styles.profileInfoCard}>
        <View style={styles.profileInfoRow}>
          <Clock size={18} color={colors.gold} />
          <View style={{ flex: 1, gap: 2 }}>
            <T bold size={14}>
              {user?.name || 'Your Birth Blueprint'}
            </T>
            <T muted size={12}>
              Date: {formattedDate} · Birth Time:{' '}
              {birthData.formattedTime ? birthData.formattedTime : 'Not specified'}
            </T>
            {birthData.shichenLabel && (
              <T size={11} style={{ color: colors.purple }}>
                Shichen (时辰): {birthData.shichenLabel}
              </T>
            )}
          </View>
        </View>
      </Card>

      {/* 4-те стълба на съдбата */}
      <PillarGrid chart={chart} colors={colors} />

      {/* Day Master и Wu Xing 5 елемента */}
      <ElementsBalanceCard chart={chart} colors={colors} />

      {/* Годишен транзит 2026 */}
      <Section>2026 Annual Energy</Section>
      <Card style={styles.transitCard}>
        <View style={styles.transitHeader}>
          <Sparkles size={16} color={colors.gold} />
          <T bold size={14} style={{ color: colors.gold }}>
            {chart.annualTransit2026.pillarName}
          </T>
        </View>
        <T bold size={13}>
          {chart.annualTransit2026.elementRelation}
        </T>
        <T muted size={12} style={{ lineHeight: 19 }}>
          {chart.annualTransit2026.guidance}
        </T>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 15,
    marginTop: 12,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transitCard: {
    padding: 18,
    gap: 8,
    marginBottom: 28,
  },
  transitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});