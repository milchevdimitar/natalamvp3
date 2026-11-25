import { AppearanceSettings } from './AppearanceSettings';
import { useEdgeBack } from '../components/NavigationBack';
import { BirthPickerFields } from '../components/BirthPickerFields';
import type { BirthDate } from '../components/BirthWheelPicker';
import { BackButton, backHeaderSpacing } from '../components/BackButton';
import { SubscriptionDetails } from './SubscriptionDetails';
import { authorizedFetch, deleteAccount } from '../services/account';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Linking, Modal, Platform, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Bell, Sparkles, CalendarDays, ChevronRight, Mail, Pencil, UserRound, LogOut, Trash2, CreditCard, Heart } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Section, T } from '../components/UI';
import { useApp } from '../context/AppContext';
import { API_BASE_URL, saveUserProfile } from '../services/api';
import { CitySearchPicker } from '../components/CitySearchPicker';
import type { CityLocation } from '../services/locationService';
import { getBirthParts } from '../services/profileDashboard';
import { CosmicBackground, useReducedMotion } from './Home/CosmicBackground';

export function ProfileSettings({ onClose, birthLabel, birthCity, initialSubscription = false }: {
  onClose: () => void; birthLabel?: string; birthCity?: string; initialSubscription?: boolean;
}) {
  const { handleLocalBack, user, setUser, colors, theme, logout, datingTabVisible, setDatingTabVisible } = useApp();
  const insets = useSafeAreaInsets();
  const offset = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const [name, setName] = useState(String(user?.name || ''));
  const [editing, setEditing] = useState(false);
  const [editingBirth, setEditingBirth] = useState(false);
  const [birthDate, setBirthDate] = useState<BirthDate | null>(null);
  const [birthTime, setBirthTime] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityLocation | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [birthNotice, setBirthNotice] = useState('');
  const [genderNotice, setGenderNotice] = useState('');
  const [editingGender, setEditingGender] = useState(false);
  const [deviceNotice, setDeviceNotice] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showSubscription, setShowSubscription] = useState(initialSubscription);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState('');
  const back = () => {
    if (saving) return;
    if (showAppearance) { offset.setValue(0); setShowAppearance(false); return; }
    if (showSubscription && handleLocalBack()) return;
    if (confirmDelete) setConfirmDelete(false);
    else if (confirm) setConfirm(false);
    else if (editingBirth) { setEditingBirth(false); setBirthNotice(''); }
    else if (editingGender) { setEditingGender(false); setGenderNotice(''); }
    else if (editing) { setEditing(false); setNotice(''); }
    else if (showSubscription && !initialSubscription) {
      offset.setValue(0);
      setShowSubscription(false);
    } else onClose();
  };
  const edgeBack = useEdgeBack(back);
  const removeAccount = async () => {
    setSaving(true);
    setDeleteNotice('');
    try {
      await deleteAccount();
      if (user?.email) {
        const email = user.email.trim().toLowerCase();
        await AsyncStorage.getAllKeys().then((keys) => AsyncStorage.multiRemove(
          keys.filter((key) => key.startsWith(`natala:system:${email}:`) || key === `natala:discovery-streak:${email}` ||
            key === `natala:tab-activity:${API_BASE_URL}:${email}` || key === `natala:feed-recent:${API_BASE_URL}:${email}`),
        )).catch(() => {});
      }
      await logout();
    } catch (failure) {
      setDeleteNotice(failure instanceof Error ? failure.message : 'Could not delete this account.');
    } finally {
      setSaving(false);
    }
  };
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
    setBirthDate(parts && parts.year >= 1900 ? { year: parts.year, month: parts.month, day: parts.day } : null);
    const savedTime = user?.hasExactBirthTime === false ? '' : String(user?.birthTime || user?.birthDate?.time || '');
    const time = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(savedTime);
    setBirthTime(time ? time[1].padStart(2, '0') + ':' + time[2] : '');
    const city = user?.birthCity;
    setSelectedCity(city && typeof city !== 'string' && typeof city.latitude === 'number' && typeof city.longitude === 'number' &&
      Number.isFinite(city.latitude) && Number.isFinite(city.longitude) ? {
      name: city.name, country: city.country || '', lat: city.latitude, lng: city.longitude, timezone: city.timezone || '',
    } : null);
    setBirthNotice('');
    setEditingBirth(true);
  };

  const saveBirth = async () => {
    if (!user?.email || saving) return;
    if (!birthDate) {
      setBirthNotice('Choose a valid date of birth.');
      return;
    }
    const { day, month, year } = birthDate;
    if (!selectedCity) {
      setBirthNotice('Choose a city from the search results.');
      return;
    }
    setSaving(true);
    setBirthNotice('');
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/users/profile/birth`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, month, year, time: birthTime,
          city: { name: selectedCity.name, country: selectedCity.country, latitude: selectedCity.lat, longitude: selectedCity.lng, timezone: selectedCity.timezone },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.user) throw new Error(result.error || 'Could not save birth details.');
      setUser(result.user);
      setEditingBirth(false);
      setBirthNotice('Birth details updated.');
    } catch (error) {
      setBirthNotice(error instanceof Error ? error.message : 'Could not save birth details.');
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

  const accountRow = (title: string, icon: typeof Trash2, action: () => void) => {
    const Icon = icon;
    return <Card style={styles.card} onPress={saving ? undefined : action}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><Icon size={19} color={colors.purple} /></View>
        <View style={styles.copy}><T bold size={15}>{title}</T></View>
        <ChevronRight size={17} color={colors.muted} />
      </View>
    </Card>;
  };

  return (
    <Modal visible statusBarTranslucent navigationBarTranslucent animationType={reduced ? 'none' : 'fade'} onRequestClose={back}>
      <SafeAreaView edges={['left', 'right', 'bottom']} {...edgeBack} style={{ flex: 1, backgroundColor: colors.bg }}>
        <CosmicBackground offset={offset} reduced={reduced} light={theme === 'light'} />
        <Animated.ScrollView
          key={showAppearance ? 'appearance' : showSubscription ? 'subscription' : 'settings'}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], { useNativeDriver: Platform.OS !== 'web' })}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{ paddingTop: insets.top }}
        >
          <View style={styles.header}>
            <BackButton onPress={back} disabled={saving} />
          </View>
          <View style={styles.content}>
          <T bold size={30} style={styles.title}>{showAppearance ? 'Appearance' : showSubscription ? 'Subscription' : 'Settings'}</T>
          {showAppearance ? <AppearanceSettings /> : showSubscription ? <SubscriptionDetails /> : <>

          <Section>Account</Section>
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><UserRound size={20} color={colors.purple} /></View>
              <View style={styles.copy}><T bold size={15}>Your name</T><T muted size={12}>{user?.name || 'Add a name'}</T></View>
              {!editing && <Pressable accessibilityRole="button" accessibilityLabel="Edit your name" onPress={() => { setName(String(user?.name || '')); setNotice(''); setEditing(true); }} style={[styles.edit, { backgroundColor: colors.purpleSoft }]}>
                <Pencil size={14} color={colors.purple} /><T bold size={12} style={{ color: colors.purple }}>Edit</T>
              </Pressable>}
            </View>
            {editing && <>
              <TextInput accessibilityLabel="Your name" autoFocus value={name} onChangeText={setName} maxLength={80} editable={!saving} returnKeyType="done" onSubmitEditing={saveName} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.line }]} />
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
              <View style={styles.copy}><T bold size={15}>Birth details</T><T muted size={12}>{[birthLabel, birthLabel && (user?.birthTime || 'Unknown time'), birthCity].filter(Boolean).join(' · ') || 'Add your birth details'}</T></View>
              {!editingBirth && <Pressable accessibilityRole="button" accessibilityLabel="Edit birth details" onPress={editBirth} style={[styles.edit, { backgroundColor: colors.purpleSoft }]}>
                <Pencil size={14} color={colors.purple} /><T bold size={12} style={{ color: colors.purple }}>Edit</T>
              </Pressable>}
            </View>
            {editingBirth && <>
              <BirthPickerFields date={birthDate} time={birthTime} onDateChange={setBirthDate}
                onTimeChange={setBirthTime} colors={colors} disabled={saving} />
              <T bold size={13}>Place of birth</T>
              <CitySearchPicker selectedCity={selectedCity} onSelectCity={setSelectedCity} colors={colors} cosmicTheme={theme} />
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
              <View style={styles.copy}><T bold size={15}>Email</T><T muted size={12}>{user.email}</T></View>
            </View>
          </Card>}

          {confirmDelete ? <Card style={styles.card}>
            <T bold size={16}>Permanently delete your account?</T>
            <T muted size={13}>Your profile, stories and conversations will be removed. If you pay through an app store, manage renewal in Subscription.</T>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={() => setConfirmDelete(false)} style={[styles.action, { borderColor: colors.line }]}><T bold size={13}>Keep account</T></Pressable>
              <Pressable accessibilityRole="button" disabled={saving} onPress={removeAccount} style={[styles.action, styles.danger]}><T bold size={13} style={styles.dangerText}>{saving ? 'Deleting?' : 'Delete permanently'}</T></Pressable>
            </View>
            {!!deleteNotice && <T size={12}>{deleteNotice}</T>}
          </Card> : accountRow('Delete account', Trash2, () => setConfirmDelete(true))}

          {Platform.OS !== 'web' && <>
            <Card style={styles.card} onPress={() => Linking.openSettings().catch(() => setDeviceNotice('Could not open device settings.'))}>
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><Bell size={19} color={colors.purple} /></View>
                <View style={styles.copy}><T bold size={15}>Device permissions</T><T muted size={12}>Manage notifications in system settings</T></View>
                <ChevronRight size={17} color={colors.muted} />
              </View>
            </Card>
            {!!deviceNotice && <T muted size={12}>{deviceNotice}</T>}
          </>}

          {accountRow('Appearance', Sparkles, () => { offset.setValue(0); setShowAppearance(true); })}
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><Heart size={19} color={colors.purple} /></View>
              <View style={styles.copy}>
                <T bold size={15}>Show Dating tab</T>
                <T muted size={12}>Controls the bottom navigation on this device.</T>
              </View>
              <Switch value={datingTabVisible} onValueChange={setDatingTabVisible} accessibilityLabel="Show Dating tab" />
            </View>
          </Card>
          {accountRow('Manage subscriptions', CreditCard, () => { offset.setValue(0); setShowSubscription(true); })}

          {confirm ? <Card style={styles.card}>
            <T bold size={16}>Sign out of Natala?</T>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={() => setConfirm(false)} style={[styles.action, { borderColor: colors.line }]}><T bold size={13}>Cancel</T></Pressable>
              <Pressable accessibilityRole="button" disabled={saving} onPress={logout} style={[styles.action, styles.danger]}><T bold size={13} style={styles.dangerText}>Sign out</T></Pressable>
            </View>
          </Card> : accountRow('Sign out', LogOut, () => setConfirm(true))}
          </>}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: backHeaderSpacing.paddingHorizontal, paddingBottom: 36 },
  header: { width: '100%', maxWidth: 720, alignSelf: 'center', ...backHeaderSpacing, paddingBottom: 8 },
  title: { letterSpacing: -1.2, marginBottom: 4, lineHeight: 38 },
  card: { gap: 10, padding: 13, marginBottom: 10 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  edit: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 15 },
  input: { borderWidth: 1, minHeight: 50, borderRadius: 15, paddingHorizontal: 13, fontSize: 15 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, borderWidth: 1, borderColor: 'transparent', borderRadius: 15, minHeight: 45, justifyContent: 'center', alignItems: 'center' },
  danger: { backgroundColor: 'rgba(0,0,0,0.50)', borderColor: 'rgba(190,205,246,0.28)' },
  dangerText: { color: '#f8faff' },
});
