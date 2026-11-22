import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { saveUserProfile } from '../services/api';
import { ProfileAvatar, resolveProfilePhoto } from './ProfileAvatar';
import { T } from './UI';

export function ProfilePhoto({ name, source }: { name: string; source?: string }) {
  const { user, updateCurrentUserProfile } = useApp();
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const save = async (avatarUrl: string) => {
    if (!user?.email) throw new Error('Sign in to edit your photo.');
    const { user: updated } = await saveUserProfile({ email: user.email, avatarUrl });
    await updateCurrentUserProfile({ avatarUrl: updated.avatarUrl });
  };

  const pick = async () => {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true,
      });
      if (result.canceled) return;
      const data = result.assets[0]?.base64;
      const mime = data?.startsWith('/9j/') ? 'image/jpeg' : data?.startsWith('iVBORw0KGgo') ? 'image/png' : null;
      if (!data || !mime || data.length > 639900) {
        setNotice('Choose a smaller JPEG or PNG image.');
        return;
      }
      await save(`data:${mime};base64,${data}`);
    } catch {
      setNotice('Could not upload your photo. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      await save('');
      setPreview(false);
    } catch {
      setNotice('Could not delete your photo. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={source ? 'View profile photo' : 'Add profile photo'} disabled={busy}
      onPress={source ? () => { setNotice(''); setPreview(true); } : pick} style={styles.avatar}>
      <ProfileAvatar name={name} source={source} showInitials={false} />
      {!source && <View style={styles.plus}>{busy ? <ActivityIndicator size="small" color="#170f2d" /> : <Plus size={17} color="#170f2d" />}</View>}
    </Pressable>
    {!preview && !!notice && <T muted size={12} style={styles.notice}>{notice}</T>}
    {preview && !!source && <Modal visible animationType="fade" onRequestClose={() => { if (!busy) setPreview(false); }}>
      <SafeAreaView style={styles.preview}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close photo preview" disabled={busy} onPress={() => setPreview(false)} style={styles.close}>
          <X size={22} color="white" />
        </Pressable>
        <Image source={{ uri: resolveProfilePhoto(source) }} style={styles.image} resizeMode="contain" accessibilityLabel="Profile photo" />
        {!!notice && <T size={12} style={styles.notice}>{notice}</T>}
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={remove} style={styles.button}><T bold style={styles.white}>Delete photo</T></Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={pick} style={[styles.button, styles.upload]}><T bold style={styles.ink}>{busy ? 'Please wait…' : 'Upload new photo'}</T></Pressable>
        </View>
      </SafeAreaView>
    </Modal>}
  </>;
}

const styles = StyleSheet.create({
  avatar: { position: 'relative' },
  plus: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#141938', backgroundColor: '#c1aeff', alignItems: 'center', justifyContent: 'center' },
  preview: { flex: 1, backgroundColor: '#070914', padding: 16, gap: 12 },
  close: { alignSelf: 'flex-end', padding: 10 },
  image: { flex: 1, width: '100%' },
  actions: { flexDirection: 'row', gap: 10, paddingBottom: 10 },
  button: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 13, backgroundColor: '#27263d' },
  upload: { backgroundColor: '#c1aeff' },
  white: { color: '#fff' },
  ink: { color: '#170f2d' },
  notice: { textAlign: 'center' },
});
