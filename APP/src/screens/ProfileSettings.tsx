import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ArrowLeft, Bell, CalendarDays, ChevronRight, LogOut, Mail, Pencil, UserRound } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand, Card, Section, T } from '../components/UI';
import { useApp } from '../context/AppContext';
import { saveUserProfile } from '../services/api';
import { CosmicBackground, useReducedMotion } from './Home/CosmicBackground';

export function ProfileSettings({ onClose, birthLabel, birthCity }: {
  onClose: () => void; birthLabel?: string; birthCity?: string;
}) {
  const { user, setUser, colors, theme, logout } = useApp();
  const offset = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const [name, setName] = useState(String(user?.name || ''));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [deviceNotice, setDeviceNotice] = useState('');
  const [confirm, setConfirm] = useState(false);
  const displayName = name.trim();
  const canSave = !!user && !!displayName && displayName !== user.name && !saving;

  const saveName = async () => {
    if (!canSave || !user) return;
    setSaving(true);
    setNotice('');
    try {
      const next = { ...user, name: displayName };
      const result = await saveUserProfile(next);
      if (!result.success) throw new Error('Profile update was rejected');
      await setUser({ ...next, ...result.user });
      setName(displayName);
      setEditing(false);
      setNotice('Name updated.');
    } catch {
      setNotice('Could not save the name. Try again when you are connected.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType={reduced ? 'none' : 'fade'} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <CosmicBackground offset={offset} reduced={reduced} light={theme === 'light'} />
        <Animated.ScrollView
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], { useNativeDriver: Platform.OS !== 'web' })}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <Brand size={36} />
            <Pressable accessibilityRole="button" accessibilityLabel="Close settings" onPress={onClose} style={[styles.close, { backgroundColor: colors.surfaceAlt, borderColor: colors.line }]}>
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

          {!!user?.email && <Card style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><Mail size={19} color={colors.purple} /></View>
              <View style={styles.copy}><T bold size={15}>Sign-in email</T><T muted size={12}>{user.email}</T></View>
            </View>
          </Card>}

          {!!(birthLabel || birthCity) && <Card style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><CalendarDays size={19} color={colors.purple} /></View>
              <View style={styles.copy}><T bold size={15}>Birth details</T><T muted size={12}>{[birthLabel, birthCity].filter(Boolean).join(' · ')}</T></View>
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
            <LogOut size={21} color="#ffd2d8" /><T bold size={16} style={styles.dangerText}>Sign out</T>
          </Pressable>}
        </Animated.ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 19, paddingTop: 22, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 19 },
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
  signOut: { minHeight: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: 1, borderColor: '#86526b', backgroundColor: '#46243f' },
  danger: { backgroundColor: '#572c46', borderColor: '#86526b' },
  dangerText: { color: '#ffd2d8' },
});
