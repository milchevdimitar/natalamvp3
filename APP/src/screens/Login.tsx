import React, { useState } from 'react';
import {
  View,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LogIn, User as UserIcon, Mail, Sparkles, Clock } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Hero, Pill } from '../components/UI';
import { loginUser, saveUserProfile } from '../services/api';
import { saveAndSyncProfile } from '../services/profileManager';
import { CitySearchPicker } from '../components/CitySearchPicker';
import { CityLocation } from '../services/locationService';

export default function Login() {
  const { colors, setUser, setPage } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Формени данни
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [birthDay, setBirthDay] = useState('15');
  const [birthMonth, setBirthMonth] = useState('6');
  const [birthYear, setBirthYear] = useState('1995');
  const [birthHour, setBirthHour] = useState('');
  const [birthMinute, setBirthMinute] = useState('');

  // Избран град като обект
  const [selectedCity, setSelectedCity] = useState<CityLocation | null>({
    name: 'София',
    country: 'Bulgaria',
    lat: 42.6977,
    lng: 23.3219,
    timezone: 'Europe/Sofia',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      alert('Моля, въведете валиден имейл адрес.');
      return;
    }

    if (mode === 'login') {
      setLoading(true);
      try {
        const res = await loginUser(email.trim(), name.trim() || undefined);
        if (res.success && res.user) {
          setUser(res.user);
          setPage('home');
        }
      } catch {
        alert('Възникна грешка при връзка със сървъра. Опитайте отново.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!name.trim()) {
      alert('Моля, въведете вашето име.');
      return;
    }

    const dayNum = parseInt(birthDay, 10);
    const monthNum = parseInt(birthMonth, 10);
    const yearNum = parseInt(birthYear, 10);

    if (
      Number.isNaN(dayNum) ||
      dayNum < 1 ||
      dayNum > 31 ||
      Number.isNaN(monthNum) ||
      monthNum < 1 ||
      monthNum > 12 ||
      Number.isNaN(yearNum) ||
      yearNum < 1900 ||
      yearNum > 2100
    ) {
      alert('Моля, въведете валидна дата на раждане (ДД / ММ / ГГГГ).');
      return;
    }

    // Точен час на раждане във вида, въведен от потребителя ("HH:MM")
    let exactBirthTime: string | undefined;
    const rawHour = birthHour.trim();
    const rawMinute = birthMinute.trim();

    if (rawHour !== '' || rawMinute !== '') {
      const hourNum = rawHour === '' ? 0 : parseInt(rawHour, 10);
      const minuteNum = rawMinute === '' ? 0 : parseInt(rawMinute, 10);

      if (
        Number.isNaN(hourNum) ||
        hourNum < 0 ||
        hourNum > 23 ||
        Number.isNaN(minuteNum) ||
        minuteNum < 0 ||
        minuteNum > 59
      ) {
        alert('Моля, въведете валиден час на раждане (00–23 ч. и 00–59 мин.).');
        return;
      }

      exactBirthTime = `${String(hourNum).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}`;
    }

    setLoading(true);

    try {
      const cityPayload = selectedCity || {
        name: 'София',
        country: 'Bulgaria',
        lat: 42.6977,
        lng: 23.3219,
        timezone: 'Europe/Sofia',
      };

      // Форматиране спрямо точната схема на models/User.js
      const isoBirthDate = new Date(
        Date.UTC(yearNum, monthNum - 1, dayNum)
      ).toISOString();

      const schemaBirthCity = {
        name: cityPayload.name,
        country: cityPayload.country,
        latitude: cityPayload.lat,
        longitude: cityPayload.lng,
      };

      const calculatedProfile = await saveAndSyncProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        birthdate: isoBirthDate,
        birthDate: {
          day: dayNum,
          month: monthNum,
          year: yearNum,
          ...(exactBirthTime ? { time: exactBirthTime } : {}),
        },
        ...(exactBirthTime ? { birthTime: exactBirthTime } : {}),
        birthCity: {
          ...cityPayload,
          ...schemaBirthCity,
        },
      } as any);

      // Записваме директно полетата birthdate, birthTime и birthCity в MongoDB по UserSchema
      const synced = await saveUserProfile({
        ...(calculatedProfile as any),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        birthdate: isoBirthDate,
        ...(exactBirthTime ? { birthTime: exactBirthTime } : {}),
        birthCity: schemaBirthCity,
      });

      const finalUser = synced?.user || {
        ...calculatedProfile,
        birthdate: isoBirthDate,
        ...(exactBirthTime ? { birthTime: exactBirthTime } : {}),
        birthCity: schemaBirthCity,
      };

      setUser(finalUser);
      setPage('home');
    } catch {
      alert('Възникна грешка при връзка със сървъра. Опитайте отново.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 20, paddingBottom: 40 }}
    >
      <Hero
        eyebrow="WELCOME TO NATALA"
        first="Отключете своя"
        accent="вътрешен свят."
        description="Влезте или се регистрирайте, за да достъпите своите Натални карти, Аюрведа и MBTI профил."
      />

      {/* Селектор за режим (Вход / Регистрация) */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surfaceAlt,
          borderRadius: 14,
          padding: 4,
        }}
      >
        <TouchableOpacity
          onPress={() => setMode('login')}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 10,
            backgroundColor: mode === 'login' ? colors.purple : 'transparent',
          }}
        >
          <T bold size={13} style={{ color: mode === 'login' ? '#FFF' : colors.muted }}>
            Вход
          </T>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode('register')}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 10,
            backgroundColor: mode === 'register' ? colors.purple : 'transparent',
          }}
        >
          <T bold size={13} style={{ color: mode === 'register' ? '#FFF' : colors.muted }}>
            Регистрация
          </T>
        </TouchableOpacity>
      </View>

      <Card style={{ gap: 16, padding: 20 }}>
        {mode === 'register' && (
          <View style={{ gap: 8 }}>
            <T bold size={13}>Вашето Име</T>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceAlt,
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 48,
                gap: 10,
              }}
            >
              <UserIcon size={18} color={colors.muted} />
              <TextInput
                placeholder="напр. Димитър Милчев"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                style={{ flex: 1, color: colors.text, fontSize: 14 }}
              />
            </View>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <T bold size={13}>Имейл адрес</T>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceAlt,
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 48,
              gap: 10,
            }}
          >
            <Mail size={18} color={colors.muted} />
            <TextInput
              placeholder="email@domain.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={{ flex: 1, color: colors.text, fontSize: 14 }}
            />
          </View>
        </View>

        {mode === 'register' && (
          <>
            <View style={{ gap: 8 }}>
              <T bold size={13}>Дата на раждане (ДД / ММ / ГГГГ)</T>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  placeholder="ДД"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={2}
                  value={birthDay}
                  onChangeText={setBirthDay}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 12,
                    textAlign: 'center',
                    color: colors.text,
                    height: 48,
                  }}
                />
                <TextInput
                  placeholder="ММ"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={2}
                  value={birthMonth}
                  onChangeText={setBirthMonth}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 12,
                    textAlign: 'center',
                    color: colors.text,
                    height: 48,
                  }}
                />
                <TextInput
                  placeholder="ГГГГ"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={4}
                  value={birthYear}
                  onChangeText={setBirthYear}
                  style={{
                    flex: 2,
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 12,
                    textAlign: 'center',
                    color: colors.text,
                    height: 48,
                  }}
                />
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T bold size={13}>Час на раждане (ЧЧ : ММ)</T>
                <T muted size={11}>24ч формат · по избор</T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    height: 48,
                    gap: 8,
                  }}
                >
                  <Clock size={16} color={colors.gold} />
                  <TextInput
                    placeholder="ЧЧ (напр. 14)"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    maxLength={2}
                    value={birthHour}
                    onChangeText={setBirthHour}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      color: colors.text,
                      fontSize: 14,
                    }}
                  />
                </View>

                <T bold size={18} style={{ color: colors.muted }}>
                  :
                </T>

                <TextInput
                  placeholder="ММ (напр. 30)"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={2}
                  value={birthMinute}
                  onChangeText={setBirthMinute}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 12,
                    textAlign: 'center',
                    color: colors.text,
                    height: 48,
                    fontSize: 14,
                  }}
                />
              </View>
            </View>

            <CitySearchPicker
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
              colors={colors}
            />
          </>
        )}

        <View style={{ marginTop: 10 }}>
          <Pill selected onPress={handleSubmit}>
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                {mode === 'login' ? (
                  <LogIn size={16} color="#FFF" />
                ) : (
                  <Sparkles size={16} color="#FFF" />
                )}
                <T bold style={{ color: '#FFF' }}>
                  {mode === 'login' ? 'Влез в профила' : 'Създай профил и продължи'}
                </T>
              </>
            )}
          </Pill>
        </View>
      </Card>
    </ScrollView>
  );
}