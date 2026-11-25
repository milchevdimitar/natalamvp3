import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Share2 } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { profileFromLink, profileId, profileLink, shareProfile } from '../services/profileLinks';
import { BackButton, backHeaderSpacing } from './BackButton';
import { CosmicBackground, useReducedMotion } from '../screens/Home/CosmicBackground';
import { Brand, Card, Pill, T } from './UI';

const modes = [{ value: 'scan', label: 'Scan' }, { value: 'code', label: 'My Code' }] as const;
type Mode = (typeof modes)[number]['value'];

function MyCode({ id, name }: { id: string | null; name: string }) {
  const { width, height } = useWindowDimensions();
  const { colors } = useApp();
  const [notice, setNotice] = useState('');
  const qr = useMemo(() => {
    if (!id) return null;
    const matrix = QRCode.create(profileLink(id), { errorCorrectionLevel: 'M' }).modules;
    const paths: string[] = [];
    for (let y = 0; y < matrix.size; y += 1) {
      for (let x = 0; x < matrix.size; x += 1) {
        if (matrix.get(y, x)) paths.push(`M${x} ${y}h1v1h-1z`);
      }
    }
    return { size: matrix.size, path: paths.join('') };
  }, [id]);
  const qrSize = Math.min(300, width - 88, Math.max(144, height * 0.4));
  const share = async () => {
    if (!id) return;
    setNotice('');
    try {
      if (await shareProfile(id, name) === 'copied') setNotice('Profile link copied.');
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) setNotice('Could not share the profile link.');
    }
  };
  return <ScrollView style={styles.fill} contentContainerStyle={styles.codeContent} showsVerticalScrollIndicator={false}>
    <Card style={styles.codeCard}>
      {qr ? <>
        <Brand size={38} />
        <View style={styles.qr} accessible accessibilityLabel="Natala profile QR code">
          <Svg width={qrSize} height={qrSize} viewBox={`-4 -4 ${qr.size + 8} ${qr.size + 8}`}>
            <Path d={qr.path} fill="#0b132b" />
          </Svg>
        </View>
        <T bold size={24} style={styles.center}>{name}</T>
        <Pressable accessibilityRole="button" onPress={share} style={[styles.share, { borderColor: colors.line }]}>
          <Share2 size={18} color={colors.text} /><T bold>Share link</T>
        </Pressable>
        {!!notice && <T muted size={12} style={styles.center}>{notice}</T>}
      </> : <T muted style={styles.center}>Sign in to a saved Natala account to show your QR code.</T>}
    </Card>
  </ScrollView>;
}

export function ProfileQrScreen({ initialMode, onClose, onOpenProfile }: {
  initialMode: Mode;
  onClose: () => void;
  onOpenProfile: (id: string) => void;
}) {
  const { colors, theme, user } = useApp();
  const [offset] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [mode, setMode] = useState(initialMode);
  const [permission, requestPermission] = useCameraPermissions();
  const [notice, setNotice] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const requested = useRef(false);
  const handled = useRef(false);
  const scanning = mode === 'scan';
  const showCamera = scanning && permission?.granted && !cameraError;
  const name = String(user?.name || '').trim() || 'Your profile';
  const id = profileId(user?._id ?? user?.id);

  useEffect(() => {
    if (!scanning || Platform.OS === 'web' || !permission?.canAskAgain || permission.granted || requested.current) return;
    requested.current = true;
    void requestPermission().catch(() => setCameraError(true));
  }, [scanning, permission, requestPermission]);

  const openLink = (raw: string) => {
    const scannedId = profileFromLink(raw);
    if (!scannedId) return false;
    if (!handled.current) {
      handled.current = true;
      onClose();
      onOpenProfile(scannedId);
    }
    return true;
  };
  const guideSize = Math.min(width * 0.65, height * 0.36, 290);

  return <Modal visible presentationStyle="fullScreen" animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
    <View style={[styles.fill, { backgroundColor: scanning ? '#080e21' : colors.bg }]}>
      {showCamera && <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onMountError={() => setCameraError(true)}
        onBarcodeScanned={ ({ data }) => { if (!openLink(data)) setNotice('This QR code is not a Natala profile link.'); }}
      />}
      {!scanning && <CosmicBackground offset={offset} reduced={reduced} light={theme === 'light'} />}
      <SafeAreaView style={styles.fill} pointerEvents="box-none">
        <View style={styles.header}>
          <BackButton onPress={onClose} onDark={scanning} />
          <View style={[styles.switcher, { backgroundColor: scanning || theme === 'dark' ? 'rgba(115,115,115,0.28)' : 'rgba(100,100,100,0.14)' }]}>
            {modes.map(({ value, label }) => (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: mode === value }}
                onPress={() => { setMode(value); setNotice(''); }}
                style={[styles.mode, mode === value && styles.activeMode]}>
                <T bold={mode === value} size={12} style={scanning ? styles.white : undefined}>{label}</T>
              </Pressable>
            ))}
          </View>
          <View style={styles.headerSpacer} />
        </View>
        {scanning ? <ScrollView style={styles.fill} contentContainerStyle={styles.scanContent}
          pointerEvents="box-none">
          <View style={styles.scanCenter}>
            {showCamera && <View pointerEvents="none" style={[styles.guide, { width: guideSize, height: guideSize }]} />}
            {!showCamera && <Card style={styles.manual}>
              <T size={14} style={styles.center}>{cameraError ? 'Camera unavailable.' : 'Allow camera access to scan a Natala QR code.'}</T>
              {permission?.canAskAgain === false && Platform.OS !== 'web'
                ? <Pill selected onPress={() => { void Linking.openSettings().catch(() => setNotice('Could not open camera settings.')); }}>Open camera settings</Pill>
                : <Pill selected onPress={() => {
                  setCameraError(false);
                  if (!permission?.granted) void requestPermission().catch(() => setCameraError(true));
                }}>{cameraError ? 'Retry camera' : 'Enable camera'}</Pill>}
            </Card>}
          </View>
          <View style={styles.scanFooter}>
            {showCamera && <T size={14} style={styles.scanText}>Fit a Natala QR code inside the frame.</T>}
            {!!notice && <T size={13} style={styles.scanText}>{notice}</T>}
          </View>
        </ScrollView> : <MyCode id={id} name={name} />}
      </SafeAreaView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { ...backHeaderSpacing, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerSpacer: { width: 44 },
  switcher: { flexDirection: 'row', borderRadius: 99, padding: 3 },
  mode: { minHeight: 32, minWidth: 65, paddingHorizontal: 10, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  activeMode: { backgroundColor: 'rgba(160,160,160,0.32)' },
  white: { color: '#fff' },
  center: { textAlign: 'center' },
  codeContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 16, paddingBottom: 20 },
  codeCard: { flexGrow: 1, width: '100%', maxWidth: 500, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20 },
  qr: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  share: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 48, gap: 9, borderWidth: 1, borderRadius: 99, paddingHorizontal: 20, backgroundColor: 'rgba(145,145,145,0.15)' },
  scanContent: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 18 },
  scanCenter: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  scanFooter: { alignItems: 'center', gap: 9 },
  scanText: { color: '#fff', backgroundColor: 'rgba(5,9,22,0.72)', textAlign: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  guide: { borderWidth: 2, borderColor: '#fff', borderRadius: 25 },
  manual: { width: '100%', maxWidth: 400, padding: 14, gap: 10 },
});
