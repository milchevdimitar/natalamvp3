import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ArrowLeft, Bell, CalendarDays, ChevronRight, Mail, Pencil, UserRound } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Section, T } from '../components/UI';
import { useApp } from '../context/AppContext';
import { saveUserProfile } from '../services/api';
import { CitySearchPicker } from '../components/CitySearchPicker';
import type { CityLocation } from '../services/locationService';
import { findBirthCard, getBirthParts } from '../services/profileDashboard';
import { calculateLifePathNumber } from '../services/profileManager';
import { CosmicBackground, useReducedMotion } from './Home/CosmicBackground';

export function ProfileSettings({ onClose, birthLabel, birthCity }: {
  onClose: () => void; birthLabel?: string; birthCity?: string;
}) {
  const { user, setUser, colors, theme, logout } = useApp();
  const offset = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const [name, setName] = useState(String(user?.name || ''));
  const [editing, setEditing] = useState(false);
  const [editingBirth, setEditingBirth] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityLocation | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [birthNotice, setBirthNotice] = useState('');
  const [genderNotice, setGenderNotice] = useState('');
  const [editingGender, setEditingGender] = useState(false);
  const [deviceNotice, setDeviceNotice] = useState('');
  const [confirm, setConfirm] = useState(false);
  const displayName = name.trim();
  const canSave = !!user && !!displayName && displayName !== user.name && !saving;

  const saveName = async () => {
    if (!canSave || !user) return;
    setSaving(true);
    setNotice('');
    try {
      const result = await saveUserProfile({ email: user.email, name: displayName });
      if (!result.success) throw new Error('Profile update was rejected');
      await setUser({ ...user, ...result.user, name: displayName });
      setName(displayName);
      setEditing(false);
      setNotice('Name updated.');
    } catch {
      setNotice('Could not save the name. Try again when you are connected.');
    } finally {
      setSaving(false);
    }
  };

  const editBirth = () => {
    const parts = getBirthParts(user);
    setBirthDate(parts ? [parts.day, parts.month, parts.year].map((part) => String(part).padStart(2, '0')).join('.') : '');
    setBirthTime(String(user?.birthTime || user?.birthDate?.time || ''));
    const city = user?.birthCity;
    setSelectedCity(city && typeof city !== 'string' && Number.isFinite(city.latitude) && Number.isFinite(city.longitude) ? {
      name: city.name, country: city.country || '', lat: city.latitude, lng: city.longitude, timezone: city.timezone || '',
    } : null);
    setBirthNotice('');
    setEditingBirth(true);
  };

  const saveBirth = async () => {
    if (!user?.email || saving) return;
    const date = getBirthParts({ birthdate: birthDate });
    if (!date || new Date(date.year, date.month - 1, date.day) > new Date()) {
      setBirthNotice('Enter a valid birth date in DD.MM.YYYY format.');
      return;
    }
    const time = birthTime.trim();
    if (time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setBirthNotice('Use HH:MM for the birth time, or leave it blank if unknown.');
      return;
    }
    const [hour, minute] = time ? time.split(':').map(Number) : [12, 0];
    const city = selectedCity ? {
      name: selectedCity.name, country: selectedCity.country, latitude: selectedCity.lat, longitude: selectedCity.lng,
      ...(selectedCity.timezone ? { timezone: selectedCity.timezone } : {}),
    } : typeof user.birthCity === 'string' ? { name: user.birthCity } : user.birthCity;
    if (!city?.name) {
      setBirthNotice('Select a birth city.');
      return;
    }
    const previous = getBirthParts(user);
    const sameDate = previous?.year === date.year && previous?.month === date.month && previous?.day === date.day;
    const previousCity = user.birthCity;
    const sameCity = !selectedCity || (previousCity && typeof previousCity !== 'string' &&
      previousCity.name === selectedCity.name && previousCity.latitude === selectedCity.lat &&
      previousCity.longitude === selectedCity.lng && (previousCity.timezone || '') === selectedCity.timezone);
    if (sameDate && sameCity && time === String(user.birthTime || user.birthDate?.time || '')) {
      setEditingBirth(false);
      return;
    }
    const patch = {
      birthdate: new Date(Date.UTC(date.year, date.month - 1, date.day, hour, minute)).toISOString(),
      birthTime: time || null,
      hasExactBirthTime: Boolean(time),
      birthCity: city,
      numerology: calculateLifePathNumber(date.day, date.month, date.year),
      cardology: { birthCard: findBirthCard(date) },
      natalChart: null, westernElements: null, polarity: null, bazi: null,
    };
    setSaving(true);
    setBirthNotice('');
    try {
      const result = await saveUserProfile({ email: user.email, ...patch });
      if (!result.success) throw new Error('Birth details update was rejected');
      await setUser({ ...user, ...result.user, ...patch });
      setEditingBirth(false);
      setBirthNotice('Birth details updated.');
    } catch {
      setBirthNotice('Could not save the birth details. Try again when you are connected.');
    } finally {
      setSaving(false);
    }
  };

  const saveGender = async (gender: 'male' | 'female' | 'other') => {
    if (!user?.email || saving || user.gender === gender) return;
    setSaving(true);
    setGenderNotice('');
    try {
      const result = await saveUserProfile({ email: user.email, gender });
      if (!result.success) throw new Error('Gender update was rejected');
      await setUser({ ...user, ...result.user, gender });
      setEditingGender(false);
      setGenderNotice('Gender updated.');
    } catch {
      setGenderNotice('Could not save your selection. Try again when you are connected.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType={reduced ? 'none' : 'fade'} onRequestClose={() => { if (!saving) onClose(); }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <CosmicBackground offset={offset} reduced={reduced} light={theme === 'light'} />
        <Animated.ScrollView
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], { useNativeDriver: Platform.OS !== 'web' })}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <T size={40} style={styles.logo}>Natala</T>
            <Pressable accessibilityRole="button" accessibilityLabel="Close settings" disabled={saving} onPress={onClose} style={[styles.close, { backgroundColor: colors.surfaceAlt, borderColor: colors.line }]}>
              <ArrowLeft size={20} color={colors.text} />
            </Pressable>
          </View>
          <T bold size={30} style={styles.title}>Settings</T>

          <Section>Account</Section>
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><UserRound size={20} color={colors.purple} /></View>
              <View style={styles.copy}><T bold size={15}>Display name</T><T muted size={12}>{user?.name || 'Add a name'}</T></View>
              {!editing && <Pressable accessibilityRole="button" accessibilityLabel="Edit display name" onPress={() => { setName(String(user?.name || '')); setNotice(''); setEditing(true); }} style={[styles.edit, { backgroundColor: colors.purpleSoft }]}>
                <Pencil size={14} color={colors.purple} /><T bold size={12} style={{ color: colors.purple }}>Edit</T>
              </Pressable>}
            </View>
            {editing && <>
              <TextInput accessibilityLabel="Display name" autoFocus value={name} onChangeText={setName} maxLength={80} editable={!saving} returnKeyType="done" onSubmitEditing={saveName} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.line }]} />
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" disabled={saving} onPress={() => { setEditing(false); setNotice(''); }} style={[styles.action, { borderColor: colors.line }]}>
                  <T bold size={13}>Cancel</T>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={!canSave} onPress={saveName} style={[styles.action, { backgroundColor: colors.action, opacity: canSave || saving ? 1 : 0.55 }]}>
                  {saving ? <ActivityIndicator color="#fff" /> : <T bold size={13} style={{ color: '#fff' }}>Save name</T>}
                </Pressable>
              </View>
            </>}
            {!!notice && <T muted size={12}>{notice}</T>}
          </Card>

          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><CalendarDays size={19} color={colors.purple} /></View>
              <View style={styles.copy}><T bold size={15}>Birth details</T><T muted size={12}>{[birthLabel, birthCity].filter(Boolean).join(' · ') || 'Add your birth details'}</T></View>
              {!editingBirth && <Pressable accessibilityRole="button" accessibilityLabel="Edit birth details" onPress={editBirth} style={[styles.edit, { backgroundColor: colors.purpleSoft }]}>
                <Pencil size={14} color={colors.purple} /><T bold size={12} style={{ color: colors.purple }}>Edit</T>
              </Pressable>}
            </View>
            {editingBirth && <>
              <View style={styles.actions}>
                <View style={styles.copy}>
                  <T bold size={12}>Birth date</T>
                  <TextInput accessibilityLabel="Birth date" value={birthDate} onChangeText={setBirthDate} placeholder="DD.MM.YYYY" placeholderTextColor={colors.muted} maxLength={10} editable={!saving} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.line }]} />
                </View>
                <View style={styles.copy}>
                  <T bold size={12}>Birth time · optional</T>
                  <TextInput accessibilityLabel="Birth time" value={birthTime} onChangeText={setBirthTime} placeholder="HH:MM" placeholderTextColor={colors.muted} maxLength={5} editable={!saving} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.line }]} />
                </View>
              </View>
              <T bold size={12}>Birth city</T>
              <CitySearchPicker selectedCity={selectedCity} onSelectCity={setSelectedCity} colors={colors} />
              {!selectedCity && !!birthCity && <T muted size={12}>Current city · {birthCity}</T>}
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" disabled={saving} onPress={() => { setEditingBirth(false); setBirthNotice(''); }} style={[styles.action, { borderColor: colors.line }]}><T bold size={13}>Cancel</T></Pressable>
                <Pressable accessibilityRole="button" disabled={saving} onPress={saveBirth} style={[styles.action, { backgroundColor: colors.action }]}>
                  {saving ? <ActivityIndicator color="#fff" /> : <T bold size={13} style={{ color: '#fff' }}>Save birth details</T>}
                </Pressable>
              </View>
            </>}
            {!!birthNotice && <T muted size={12}>{birthNotice}</T>}
          </Card>

          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><UserRound size={19} color={colors.purple} /></View>
              <View style={styles.copy}><T bold size={15}>Gender</T><T muted size={12}>{user?.gender ? String(user.gender).replace(/^./, (c) => c.toUpperCase()) : 'Not set'}</T></View>
              <Pressable accessibilityRole="button" accessibilityLabel={editingGender ? 'Cancel gender edit' : 'Edit gender'} disabled={saving} onPress={() => { setEditingGender(!editingGender); setGenderNotice(''); }} style={[styles.edit, { backgroundColor: colors.purpleSoft }]}>
                {!editingGender && <Pencil size={14} color={colors.purple} />}<T bold size={12} style={{ color: colors.purple }}>{editingGender ? 'Cancel' : 'Edit'}</T>
              </Pressable>
            </View>
            {editingGender && <View style={styles.actions}>
              {(['male', 'female', 'other'] as const).map((value) => {
                const selected = user?.gender?.toLowerCase() === value;
                return <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected }} aria-selected={selected} disabled={saving} onPress={() => saveGender(value)} style={[styles.action, { backgroundColor: selected ? colors.action : colors.surface, borderColor: colors.line }]}>
                  <T bold size={13} style={{ color: selected ? '#fff' : colors.text }}>{value.charAt(0).toUpperCase() + value.slice(1)}</T>
                </Pressable>;
              })}
            </View>}
            {!!genderNotice && <T muted size={12}>{genderNotice}</T>}
          </Card>

          {!!user?.email && <Card style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><Mail size={19} color={colors.purple} /></View>
              <View style={styles.copy}><T bold size={15}>Sign-in email</T><T muted size={12}>{user.email}</T></View>
            </View>
          </Card>}

          {Platform.OS !== 'web' && <>
            <Section>Notifications</Section>
            <Card style={styles.card} onPress={() => Linking.openSettings().catch(() => setDeviceNotice('Could not open device settings.'))}>
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><Bell size={19} color={colors.purple} /></View>
                <View style={styles.copy}><T bold size={15}>Device permissions</T><T muted size={12}>Manage notifications in system settings</T></View>
                <ChevronRight size={17} color={colors.muted} />
              </View>
            </Card>
            {!!deviceNotice && <T muted size={12}>{deviceNotice}</T>}
          </>}

          {confirm ? <Card style={[styles.card, styles.signOutCard]}>
            <T bold size={16}>Sign out of Natala?</T>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={() => setConfirm(false)} style={[styles.action, { borderColor: colors.line }]}><T bold size={13}>Cancel</T></Pressable>
              <Pressable accessibilityRole="button" disabled={saving} onPress={logout} style={[styles.action, styles.danger]}><T bold size={13} style={styles.dangerText}>Sign out</T></Pressable>
            </View>
          </Card> : <Pressable accessibilityRole="button" disabled={saving} onPress={() => setConfirm(true)} style={({ pressed }) => [styles.signOutCard, styles.signOut, pressed && { opacity: 0.84 }]}>
            <T bold size={16} style={styles.dangerText}>Sign out</T>
          </Pressable>}
        </Animated.ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 19, paddingTop: 22, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 19 },
  logo: { fontFamily: 'DancingScript_700Bold', lineHeight: 49 },
  title: { letterSpacing: -1.2, marginBottom: 4, lineHeight: 38 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  card: { gap: 10, padding: 13, marginBottom: 10 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  edit: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 15 },
  input: { borderWidth: 1, minHeight: 50, borderRadius: 15, paddingHorizontal: 13, fontSize: 15 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, borderWidth: 1, borderColor: 'transparent', borderRadius: 15, minHeight: 45, justifyContent: 'center', alignItems: 'center' },
  signOutCard: { marginTop: 15, borderRadius: 23 },
  signOut: { minHeight: 74, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(190,205,246,0.28)', backgroundColor: 'rgba(0,0,0,0.45)' },
  danger: { backgroundColor: 'rgba(0,0,0,0.50)', borderColor: 'rgba(190,205,246,0.28)' },
  dangerText: { color: '#f8faff' },
});
