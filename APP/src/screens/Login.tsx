import React, { useState } from 'react';
import { View, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LogIn, User as UserIcon, Mail, Sparkles, Calendar, MapPin } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Hero, Pill } from '../components/UI';
import { loginUser, saveUserProfile } from '../services/api';
import { saveAndSyncProfile } from '../services/profileManager';

export default function Login() {
  const { colors, setUser, setPage } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Формени данни
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [birthDay, setBirthDay] = useState('15');
  const [birthMonth, setBirthMonth] = useState('6');
  const [birthYear, setBirthYear] = useState('1995');
  const [city, setCity] = useState('София');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      alert('Моля, въведете валиден имейл адрес.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        // Вход със съществуващ профил
        const res = await loginUser(email.trim(), name.trim() || undefined);
        if (res.success && res.user) {
          setUser(res.user);
          setPage('home');
        }
      } else {
        // Нов профил с изчисление на нумерология и карти локално
        if (!name.trim()) {
          alert('Моля, въведете вашето име.');
          setLoading(false);
          return;
        }

        const calculatedProfile = await saveAndSyncProfile({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          birthDate: {
            day: parseInt(birthDay, 10) || 1,
            month: parseInt(birthMonth, 10) || 1,
            year: parseInt(birthYear, 10) || 1995,
          },
          birthCity: { name: city.trim() || 'София' },
        });

        setUser(calculatedProfile);
        setPage('home');
      }
    } catch (err) {
      alert('Възникна грешка при връзка със сървъра. Опитайте отново.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: 20 }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 12, paddingHorizontal: 12, height: 48, gap: 10 }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 12, paddingHorizontal: 12, height: 48, gap: 10 }}>
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
                  value={birthDay}
                  onChangeText={setBirthDay}
                  style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 12, textAlign: 'center', color: colors.text, height: 48 }}
                />
                <TextInput
                  placeholder="ММ"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={birthMonth}
                  onChangeText={setBirthMonth}
                  style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 12, textAlign: 'center', color: colors.text, height: 48 }}
                />
                <TextInput
                  placeholder="ГГГГ"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={birthYear}
                  onChangeText={setBirthYear}
                  style={{ flex: 2, backgroundColor: colors.surfaceAlt, borderRadius: 12, textAlign: 'center', color: colors.text, height: 48 }}
                />
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <T bold size={13}>Град на раждане</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 12, paddingHorizontal: 12, height: 48, gap: 10 }}>
                <MapPin size={18} color={colors.muted} />
                <TextInput
                  placeholder="напр. София"
                  placeholderTextColor={colors.muted}
                  value={city}
                  onChangeText={setCity}
                  style={{ flex: 1, color: colors.text, fontSize: 14 }}
                />
              </View>
            </View>
          </>
        )}

        <View style={{ marginTop: 10 }}>
          <Pill selected onPress={handleSubmit}>
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                {mode === 'login' ? <LogIn size={16} color="#FFF" /> : <Sparkles size={16} color="#FFF" />}
                <T bold style={{ color: '#FFF' }}>
                  {mode === 'login' ? 'Влез в профила' : 'Създай профил и продължи'}
                </T>
              </>
            )}
          </Pill>
        </View>
      </Card>
    </View>
  );
}