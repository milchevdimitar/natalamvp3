import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import {
  Sun,
  Moon,
  Brain,
  Layers3,
  Target,
  ArrowUpRight,
  LogOut,
} from 'lucide-react-native';
import { Brand, Card, T, Section, Progress } from '../components/UI';
import { elements } from '../data/demo';
import { useApp } from '../context/AppContext';
import { getUserProfile } from '../services/api';

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
  const bloodGroup = user?.bloodGroup || 'Неизвестна';

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

      <Pressable
        onPress={() =>
          Alert.alert(
            'Personal Synthesis',
            'Синхронизирано с MongoDB Atlas. Всички профилни данни се извличат динамично.'
          )
        }
      >
        <LinearGradient
          colors={['#EAB76D', '#C98A43', '#B6743D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 22, gap: 10, marginBottom: 18 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T bold size={10} style={{ color: '#4C2A14', letterSpacing: 1.5 }}>
              ✧ YOUR PERSONAL SYNTHESIS
            </T>
            <View
              style={{
                backgroundColor: '#FFF2D7',
                borderRadius: 99,
                paddingHorizontal: 9,
                paddingVertical: 4,
              }}
            >
              <T bold size={10} style={{ color: '#7A4A18' }}>
                ✦ MONGODB LIVE
              </T>
            </View>
          </View>
          <T bold size={25} style={{ color: '#3D2417' }}>
            Анализ на картата
          </T>
          <T size={13} style={{ color: '#573720' }}>
            Данните за раждане и диагностика са заредени директно от вашия профил в MongoDB Atlas.
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <T bold size={13} style={{ color: '#3D2417' }}>
              Преглед на детайли
            </T>
            <ArrowUpRight size={17} color="#3D2417" />
          </View>
        </LinearGradient>
      </Pressable>

      <Section>Your profile</Section>
      <Card style={{ gap: 15 }}>
        {[
          ['Personality (MBTI)', user?.mbti?.type || 'Неизчислен'],
          ['Zodiac', sunSign],
          ['Life path', lifePath],
          ['Cardology Birth Card', birthCard],
          ['Ayurveda Dosha', dosha],
          ['Blood Group', bloodGroup],
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {[
          ['♠', `Card: ${birthCard}`],
          ['☯', `Dosha: ${dosha}`],
          ['◉', `Blood: ${bloodGroup}`],
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
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {elements.map((e) => (
            <Ring key={e.name} {...e} />
          ))}
        </View>
      </Card>

      <Section>Self-awareness</Section>
      <Card style={{ gap: 17 }}>
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
      <Card style={{ gap: 10 }}>
        <T bold size={17}>Deep inner processing</T>
        <T muted size={13}>
          Здравейте, {user?.name || 'пътешествениче'}! Вашите изчисления (MBTI: {user?.mbti?.type || 'N/A'}, Life Path: {user?.numerology?.lifePathNumber || 'N/A'}) са синхронизирани от базата данни.
        </T>
      </Card>
    </>
  );
}