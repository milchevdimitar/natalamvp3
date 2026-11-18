import React, { useState } from 'react';
import {
  View,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  LogIn,
  User as UserIcon,
  Mail,
  Sparkles,
  Clock,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Hero, Pill } from '../components/UI';
import { loginUser, saveUserProfile } from '../services/api';
import { saveAndSyncProfile } from '../services/profileManager';
import { CitySearchPicker } from '../components/CitySearchPicker';
import { CityLocation } from '../services/locationService';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function Login() {
  const { colors, setUser, setPage } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [birthDay, setBirthDay] = useState('15');
  const [birthMonth, setBirthMonth] = useState('6');
  const [birthYear, setBirthYear] = useState('1995');
  const [birthHour, setBirthHour] = useState('');
  const [birthMinute, setBirthMinute] = useState('');

  // Selected city state compatible with CitySearchPicker (CityLocation | null)
  const [selectedCity, setSelectedCity] = useState<CityLocation | null>({
    name: 'Sofia',
    country: 'Bulgaria',
    lat: 42.6977,
    lng: 23.3219,
    timezone: 'Europe/Sofia',
    region: 'Sofia-City',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      showAlert('Invalid Email', 'Please enter a valid email address.');
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
        showAlert(
          'Connection Error',
          'Could not connect to the server. Please try again.'
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!name.trim()) {
      showAlert('Missing Name', 'Please enter your full name.');
      return;
    }

    if (!selectedCity) {
      showAlert('Missing City', 'Please select your city of birth.');
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
      showAlert(
        'Invalid Date',
        'Please enter a valid date of birth (DD / MM / YYYY).'
      );
      return;
    }

    // Parse optional birth time ("HH:MM")
    const rawHour = birthHour.trim();
    const rawMinute = birthMinute.trim();
    const hasCustomTime = rawHour !== '' || rawMinute !== '';

    const hourNum = rawHour === '' ? 0 : parseInt(rawHour, 10);
    const minuteNum = rawMinute === '' ? 0 : parseInt(rawMinute, 10);

    if (
      hasCustomTime &&
      (Number.isNaN(hourNum) ||
        hourNum < 0 ||
        hourNum > 23 ||
        Number.isNaN(minuteNum) ||
        minuteNum < 0 ||
        minuteNum > 59)
    ) {
      showAlert(
        'Invalid Time',
        'Please enter a valid time of birth (00–23h and 00–59m).'
      );
      return;
    }

    const exactBirthTime = hasCustomTime
      ? `${String(hourNum).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}`
      : undefined;

    setLoading(true);

    try {
      // Embed exact hours & minutes into the UTC ISO date string
      const isoBirthDate = new Date(
        Date.UTC(
          yearNum,
          monthNum - 1,
          dayNum,
          hasCustomTime ? hourNum : 12,
          hasCustomTime ? minuteNum : 0
        )
      ).toISOString();

      // Map CityLocation (lat/lng) to MongoDB User schema (latitude/longitude)
      const schemaBirthCity = {
        name: selectedCity.name,
        country: selectedCity.country,
        latitude: selectedCity.lat,
        longitude: selectedCity.lng,
        ...(selectedCity.timezone ? { timezone: selectedCity.timezone } : {}),
        ...(selectedCity.region ? { region: selectedCity.region } : {}),
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
          ...selectedCity,
          ...schemaBirthCity,
        },
      } as any);

      // Remove helper birthDate object before persisting to MongoDB
      const { birthDate: _ignoredBirthDate, ...cleanCalculated } =
        (calculatedProfile as any) || {};

      const payloadToSave = {
        ...cleanCalculated,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        birthdate: isoBirthDate,
        birthTime: exactBirthTime || cleanCalculated?.birthTime || null,
        birthCity: schemaBirthCity,
      };

      const synced = await saveUserProfile(payloadToSave);

      const finalUser = synced?.user
        ? {
            ...synced.user,
            birthTime: synced.user.birthTime || payloadToSave.birthTime,
          }
        : payloadToSave;

      setUser(finalUser);
      setPage('home');
    } catch {
      showAlert(
        'Connection Error',
        'Could not connect to the server. Please try again.'
      );
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
        first="Unlock your"
        accent="inner world."
        description="Sign in or register to access your Natal Charts, Ayurveda, and MBTI profile."
      />

      {/* Mode Switcher (Sign In / Register) */}
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
          <T
            bold
            size={13}
            style={{ color: mode === 'login' ? '#FFF' : colors.muted }}
          >
            Sign In
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
          <T
            bold
            size={13}
            style={{ color: mode === 'register' ? '#FFF' : colors.muted }}
          >
            Register
          </T>
        </TouchableOpacity>
      </View>

      <Card style={{ gap: 16, padding: 20 }}>
        {mode === 'register' && (
          <View style={{ gap: 8 }}>
            <T bold size={13}>
              Full Name
            </T>
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
                placeholder="e.g. Alex Mercer"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                style={{ flex: 1, color: colors.text, fontSize: 14 }}
              />
            </View>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <T bold size={13}>
            Email Address
          </T>
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
              <T bold size={13}>
                Date of Birth (DD / MM / YYYY)
              </T>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  placeholder="DD"
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
                  placeholder="MM"
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
                  placeholder="YYYY"
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
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <T bold size={13}>
                  Time of Birth (HH : MM)
                </T>
                <T muted size={11}>
                  24h format · optional
                </T>
              </View>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
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
                    placeholder="HH (e.g. 14)"
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
                  placeholder="MM (e.g. 30)"
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
              onSelectCity={(city) => setSelectedCity(city)}
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
                  {mode === 'login' ? 'Sign In' : 'Create Profile & Continue'}
                </T>
              </>
            )}
          </Pill>
        </View>
      </Card>
    </ScrollView>
  );
}