import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Pressable, Animated, ActivityIndicator } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  Sun,
  Moon,
  Brain,
  Layers3,
  Target,
  LogOut,
} from 'lucide-react-native';
import { Brand, Card, T, Section, Progress } from '../components/UI';
import { useApp } from '../context/AppContext';
import { getUserProfile } from '../services/api';

// ---------------------------------------------------------------------------
// ✦ АЛГОРИТЪМ ЗА ИЗЧИСЛЯВАНЕ НА ЕЛЕМЕНТНИЯ БАЛАНС ОТ РОЖДЕНАТА ДАТА
// ---------------------------------------------------------------------------
function calculateElementsFromBirthDate(rawDate?: any) {
  if (!rawDate) {
    return [
      { name: 'Fire', symbol: '🜂', value: 28, color: '#FF6B6B' },
      { name: 'Earth', symbol: '🜃', value: 24, color: '#4ECDC4' },
      { name: 'Air', symbol: '🜁', value: 26, color: '#FFE66D' },
      { name: 'Water', symbol: '🜄', value: 22, color: '#4A90E2' },
    ];
  }

  const d = new Date(rawDate);
  if (isNaN(d.getTime())) {
    return [
      { name: 'Fire', symbol: '🜂', value: 25, color: '#FF6B6B' },
      { name: 'Earth', symbol: '🜃', value: 25, color: '#4ECDC4' },
      { name: 'Air', symbol: '🜁', value: 25, color: '#FFE66D' },
      { name: 'Water', symbol: '🜄', value: 25, color: '#4A90E2' },
    ];
  }

  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const year = d.getUTCFullYear();

  // Оценяване на зодиакалната стихия по месец и ден
  const zodiacCutoffs = [20, 19, 21, 20, 21, 22, 23, 23, 23, 23, 22, 22];
  const zodiacElements = [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0]; // 0: Fire, 1: Earth, 2: Air, 3: Water

  let signIdx = month - 1;
  if (day < zodiacCutoffs[signIdx]) {
    signIdx = (signIdx + 11) % 12;
  }
  const mainElementIdx = zodiacElements[signIdx];

  let fireScore = 15;
  let earthScore = 15;
  let airScore = 15;
  let waterScore = 15;

  // Добавяне на тежест от слънчевия знак (+30 т.)
  if (mainElementIdx === 0) fireScore += 30;
  if (mainElementIdx === 1) earthScore += 30;
  if (mainElementIdx === 2) airScore += 30;
  if (mainElementIdx === 3) waterScore += 30;

  // Добавяне на принос от деня
  fireScore += day % 4 === 1 ? 15 : 5;
  earthScore += day % 4 === 2 ? 15 : 5;
  airScore += day % 4 === 3 ? 15 : 5;
  waterScore += day % 4 === 0 ? 15 : 5;

  // Добавяне на принос от месеца
  fireScore += month % 4 === 1 ? 12 : 4;
  earthScore += month % 4 === 2 ? 12 : 4;
  airScore += month % 4 === 3 ? 12 : 4;
  waterScore += month % 4 === 0 ? 12 : 4;

  // Добавяне на принос от нумерологичната сума на годината
  const yearSum = String(year)
    .split('')
    .reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);

  fireScore += yearSum % 4 === 1 ? 13 : 4;
  earthScore += yearSum % 4 === 2 ? 13 : 4;
  airScore += yearSum % 4 === 3 ? 13 : 4;
  waterScore += yearSum % 4 === 0 ? 13 : 4;

  const total = fireScore + earthScore + airScore + waterScore;
  const firePct = Math.round((fireScore / total) * 100);
  const earthPct = Math.round((earthScore / total) * 100);
  const airPct = Math.round((airScore / total) * 100);
  const waterPct = 100 - (firePct + earthPct + airPct);

  return [
    { name: 'Fire', symbol: '🜂', value: firePct, color: '#FF6B6B' },
    { name: 'Earth', symbol: '🜃', value: earthPct, color: '#4ECDC4' },
    { name: 'Air', symbol: '🜁', value: airPct, color: '#FFE66D' },
    { name: 'Water', symbol: '🜄', value: waterPct, color: '#4A90E2' },
  ];
}

function Ring({ value, color, symbol, name }: { value: number; color: string; symbol: string; name: string }) {
  const { colors } = useApp();
  const r = 34, c = 2 * Math.PI * r;
  return (
    <View style={{ alignItems: 'center', gap: 4, width: '24%' }}>
      <View style={{ width: 85, height: 85, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width="85" height="85" viewBox="0 0 85 85">
          <Circle cx="42.5" cy="42.5" r={r} fill="none" stroke={colors.surfaceAlt} strokeWidth="7" />
          <Circle
            cx="42.5"
            cy="42.5"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(c * value) / 100} ${c}`}
            transform="rotate(-90 42.5 42.5)"
          />
        </Svg>
        <T size={27} style={{ position: 'absolute', color }}>
          {symbol}
        </T>
      </View>
      <T bold size={12}>{name}</T>
      <T muted size={11}>{value}%</T>
    </View>
  );
}

export default function Profile() {
  const { colors, theme, toggleTheme, user, setUser, setPage } = useApp();
  const progress = useRef(new Animated.Value(0)).current;
  const [number, setNumber] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setLoading(true);
      getUserProfile(user.email)
        .then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
          }
        })
        .catch((err) => console.warn('Грешка при опресняване:', err))
        .finally(() => setLoading(false));
    }

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    let i = 0;
    const timer = setInterval(() => {
      i += 4;
      setNumber(Math.min(i, 100));
      if (i >= 100) clearInterval(timer);
    }, 24);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    setUser(null);
    setPage('login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  const mbtiText = user?.mbti?.type ? `✦ ${user.mbti.type}` : '✦ MBTI Неизчислен';
  const sunSign = user?.natalChart?.sunSign || 'Неизчислен';
  const lifePath = user?.numerology?.lifePathNumber
    ? `${user.numerology.lifePathNumber}${user.numerology.isMasterNumber ? ' (Майсторско)' : ''}`
    : 'Неизчислено';
  const birthCard = user?.cardology?.birthCard || 'Няма карта';
  const dosha = user?.ayurveda?.dominantDosha
    ? user.ayurveda.dominantDosha.toUpperCase()
    : 'Неизчислена';

  // Динамично изчисление на стихиите спрямо рождената дата
  const birthDateValue =
    user?.birthdate ||
    user?.birthDate ||
    user?.dateOfBirth ||
    user?.dob ||
    user?.birth_date ||
    user?.profile?.birthDate;

  const dynamicElements = useMemo(() => {
    return calculateElementsFromBirthDate(birthDateValue);
  }, [birthDateValue]);

  const stats = [
    { name: 'Self Awareness', value: 84, icon: Brain, display: `${Math.round(number * 0.84)}%` },
    { name: 'Systems Explored', value: 80, icon: Layers3, display: `${Math.round(number * 0.08)}/10` },
    { name: 'Alignment', value: 82, icon: Target, display: `${(number * 0.823).toFixed(1)}%` },
  ];

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <Brand size={34} />
        <View style={{ flexDirection: 'row', gap: 9 }}>
          <Pressable
            accessibilityLabel="Cycle theme"
            onPress={toggleTheme}
            style={{ padding: 12, borderRadius: 99, backgroundColor: colors.surface }}
          >
            {theme === 'dark' ? (
              <Moon size={19} color={colors.purple} />
            ) : (
              <Sun size={19} color={colors.purple} />
            )}
          </Pressable>
          <Pressable
            accessibilityLabel="Logout"
            onPress={handleLogout}
            style={{ padding: 12, borderRadius: 99, backgroundColor: colors.surface }}
          >
            <LogOut size={19} color={colors.purple} />
          </Pressable>
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 23 }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.purpleSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.purple} />
          ) : (
            <T size={38} bold style={{ color: colors.purple }}>
              {initials}
            </T>
          )}
        </View>
        <T bold size={30}>
          {user?.name || 'Потребител'}
        </T>
        <T muted size={12}>
          {user?.email || 'Няма въведен имейл'}
        </T>
        <T bold size={12} style={{ color: colors.purple, marginBottom: 10 }}>
          {mbtiText}
        </T>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {stats.map((s) => (
          <Card key={s.name} style={{ flex: 1, padding: 10, alignItems: 'center', gap: 7 }}>
            <s.icon size={27} color={colors.purple} />
            <Animated.View style={{ opacity: progress }}>
              <T bold size={21} style={{ textAlign: 'center' }}>
                {s.display}
              </T>
            </Animated.View>
            <T muted size={10} style={{ textAlign: 'center' }}>
              {s.name}
            </T>
          </Card>
        ))}
      </View>

      <Section>Your profile</Section>
      <Card style={{ gap: 15, marginBottom: 20 }}>
        {[
          ['Personality (MBTI)', user?.mbti?.type || 'Неизчислен'],
          ['Zodiac', sunSign],
          ['Life path', lifePath],
          ['Cardology Birth Card', birthCard],
          ['Ayurveda Dosha', dosha],
        ].map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T muted size={13}>
              {k}
            </T>
            <T bold size={13}>
              {v}
            </T>
          </View>
        ))}
      </Card>

      <Section>Personal lenses</Section>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {[
          ['☉', `Sun: ${sunSign}`],
          ['♠', `Card: ${birthCard}`],
          ['☯', `Dosha: ${dosha}`],
          ['🜁', `Life Path: ${user?.numerology?.lifePathNumber || '-'}`],
        ].map(([icon, name]) => (
          <Card key={name} style={{ width: '48%', alignItems: 'center', gap: 8 }}>
            <T size={34} style={{ color: colors.purple }}>
              {icon}
            </T>
            <T bold size={14}>
              {name}
            </T>
          </Card>
        ))}
      </View>

      <Section>Elemental balance</Section>
      <Card style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {dynamicElements.map((e) => (
            <Ring key={e.name} {...e} />
          ))}
        </View>
      </Card>

      <Section>Self-awareness</Section>
      <Card style={{ gap: 17, marginBottom: 20 }}>
        {[
          ['Self reflection', 84],
          ['Communication', 72],
          ['Emotional balance', 78],
          ['Personal growth', 91],
        ].map(([label, value]) => (
          <View key={label as string} style={{ gap: 7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T size={13}>{label}</T>
              <T muted size={12}>{value}%</T>
            </View>
            <Progress value={value as number} />
          </View>
        ))}
      </Card>

      <Section>What your map says</Section>
      <Card style={{ gap: 10, marginBottom: 40 }}>
        <T bold size={17}>Deep inner processing</T>
        <T muted size={13}>
          Здравейте, {user?.name || 'пътешествениче'}! Вашите изчисления (MBTI: {user?.mbti?.type || 'N/A'}, Life Path: {user?.numerology?.lifePathNumber || 'N/A'}) са синхронизирани от базата данни.
        </T>
      </Card>
    </>
  );
}