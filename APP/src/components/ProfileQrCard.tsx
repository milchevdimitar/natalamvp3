import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Share2, X } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'qrcode';
import { Brand, Card, T } from './UI';
import { ProfileAvatar } from './ProfileAvatar';
import { profileLink } from '../services/profileLinks';

export function ProfileQrCard({ id, name, photo, onShare, onClose, notice }: {
  id: string; name: string; photo?: string; onShare: () => void; onClose: () => void; notice?: string;
}) {
  const qr = useMemo(() => {
    const matrix = QRCode.create(profileLink(id), { errorCorrectionLevel: 'M' }).modules;
    const paths: string[] = [];
    for (let y = 0; y < matrix.size; y += 1) {
      for (let x = 0; x < matrix.size; x += 1) {
        if (matrix.get(y, x)) paths.push(`M${x} ${y}h1v1h-1z`);
      }
    }
    return { size: matrix.size, path: paths.join('') };
  }, [id]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Brand size={32} />
            <Pressable accessibilityRole="button" accessibilityLabel="Close QR card" onPress={onClose} style={styles.close}><X color="#f8faff" size={21} /></Pressable>
          </View>
          <ProfileAvatar name={name} source={photo} size={53} />
          <T bold size={20} style={styles.text}>{name}</T>
          <View style={styles.frame} accessible accessibilityLabel="Natala profile QR code">
            <Svg width={210} height={210} viewBox={`-4 -4 ${qr.size + 8} ${qr.size + 8}`} color="#0b132b">
              <Path d={qr.path} fill="currentColor" />
            </Svg>
          </View>
          <T muted size={12} style={styles.text}>Scan to open this profile on Natala.</T>
          <Pressable accessibilityRole="button" onPress={onShare} style={styles.share}><Share2 size={17} color="#fff" /><T bold size={13} style={{ color: '#fff' }}>Share profile</T></Pressable>
          {!!notice && <T muted size={12}>{notice}</T>}
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, backgroundColor: 'rgba(3,7,20,0.82)' },
  card: { width: '100%', maxWidth: 380, backgroundColor: '#15244c', padding: 17, gap: 10, alignItems: 'center' },
  header: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center' },
  frame: { borderRadius: 14, backgroundColor: '#fff', overflow: 'hidden' },
  share: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 46, gap: 7, borderRadius: 15, backgroundColor: '#654da9', marginTop: 4 },
});
