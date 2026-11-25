import { StarField } from '../../components/StarField';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScanLine, X } from 'lucide-react-native';
import { T, Pill } from '../../components/UI';
import { profileFromLink } from '../../services/profileLinks';
import { styles } from './people.styles';

export function CosmicInviteModal({ colors, onClose, onConnectByCode, onOpenProfile }: {
  colors: any;
  onClose: () => void;
  onConnectByCode: (codeOrEmail: string) => Promise<void>;
  onOpenProfile: (id: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const requested = useRef(false);
  const handled = useRef(false);

  const askCamera = () => {
    void requestPermission().catch(() => setNotice('Camera unavailable. You can paste a Natala profile link below.'));
  };

  useEffect(() => {
    if (Platform.OS === 'web' || !permission || permission.granted || !permission.canAskAgain || requested.current) return;
    requested.current = true;
    void requestPermission().catch(() => setNotice('Camera unavailable. You can paste a Natala profile link below.'));
  }, [permission, requestPermission]);

  const openLink = (raw: string) => {
    const id = profileFromLink(raw);
    if (!id) return false;
    if (!handled.current) {
      handled.current = true;
      onClose();
      onOpenProfile(id);
    }
    return true;
  };

  const submit = async () => {
    const value = input.trim();
    if (!value || submitting || openLink(value)) return;
    if (!/^NTL-[a-f0-9]{6}$/i.test(value) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setNotice('Enter a Natala profile link, Cosmic ID or email.');
      return;
    }
    setSubmitting(true);
    try { await onConnectByCode(value); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={localStyles.backdrop}>
        <View style={[localStyles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <StarField subtle />
          <View style={localStyles.header}>
            <View style={localStyles.title}><ScanLine size={21} color={colors.purple} /><T bold size={18}>Scan a profile</T></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={onClose} style={localStyles.close}><X size={21} color={colors.text} /></Pressable>
          </View>
          {permission?.granted ? <View style={localStyles.camera}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onMountError={() => setNotice('Camera unavailable. You can paste a Natala profile link below.')}
              onBarcodeScanned={({ data }) => { if (!openLink(data)) setNotice('This QR code is not a Natala profile link.'); }}
            />
            <View pointerEvents="none" style={localStyles.guide} />
          </View> : <View style={[localStyles.permission, { backgroundColor: colors.surfaceAlt, borderColor: colors.line }]}>
            <T muted size={13} style={{ textAlign: 'center' }}>Allow camera access to scan a Natala QR code.</T>
            {permission?.canAskAgain === false && Platform.OS !== 'web'
              ? <Pill selected onPress={() => { void Linking.openSettings().catch(() => setNotice('Could not open camera settings.')); }}>Open camera settings</Pill>
              : <Pill selected onPress={askCamera}>Enable camera</Pill>}
          </View>}

          <View style={[styles.inviteInputRow, { backgroundColor: colors.surfaceAlt }]}>
            <TextInput
              accessibilityLabel="Natala profile link, Cosmic ID or email"
              value={input}
              onChangeText={(value) => { setInput(value); setNotice(''); }}
              placeholder="Paste a link, Cosmic ID or email"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={submit}
              style={{ flex: 1, minWidth: 0, color: colors.text, fontSize: 13 }}
            />
          </View>
          <Pill disabled={!input.trim() || submitting} onPress={submit}>{submitting ? 'Connecting…' : /^(?:https:\/\/|natala:)/i.test(input.trim()) ? 'Open profile' : 'Continue'}</Pill>
          {!!notice && <T muted size={12}>{notice}</T>}
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,7,20,0.84)', padding: 16 },
  card: { width: '100%', maxWidth: 430, padding: 15, borderWidth: 1, borderRadius: 25, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  camera: { height: 215, overflow: 'hidden', borderRadius: 18, backgroundColor: '#0a1026', alignItems: 'center', justifyContent: 'center' },
  guide: { width: 140, height: 140, borderWidth: 2, borderColor: '#edf1ff', borderRadius: 16 },
  permission: { minHeight: 110, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 16, borderWidth: 1, gap: 9 },
});
