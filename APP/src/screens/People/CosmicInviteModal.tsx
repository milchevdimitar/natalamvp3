import React, { useState } from 'react';
import { View, Modal, Pressable, TextInput, Share } from 'react-native';
import { X, QrCode, UserPlus } from 'lucide-react-native';
import { T, Pill } from '../../components/UI';
import { styles } from './people.styles';

interface CosmicInviteModalProps {
  colors: any;
  visible: boolean;
  myCosmicId: string;
  user: any;
  onClose: () => void;
  onConnectByCode: (codeOrEmail: string) => Promise<void>;
}

export function CosmicInviteModal({
  colors,
  visible,
  myCosmicId,
  user,
  onClose,
  onConnectByCode,
}: CosmicInviteModalProps) {
  const [friendCode, setFriendCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!visible) return null;

  const fallbackId = user?._id
    ? `NTL-${String(user._id).slice(-6).toUpperCase()}`
    : user?.email || 'NATALA';
  const displayCode = myCosmicId || fallbackId;

  const handleSharePass = async () => {
    try {
      await Share.share({
        message: `Connect with me on Natala! My Cosmic ID is ${displayCode} (or search ${
          user?.email || user?.name
        }).`,
      });
    } catch {}
  };

  const handleAdd = async () => {
    if (!friendCode.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onConnectByCode(friendCode);
      setFriendCode('');
    } finally {
      setSubmitting(false);
    }
  };

  const cardBg = colors.surface || colors.bg || '#181426';
  const borderCol = colors.line || 'rgba(255,255,255,0.12)';

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: cardBg, borderColor: borderCol },
          ]}
        >
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <QrCode size={18} color={colors.gold} />
              <T bold size={16}>
                Natala Cosmic Pass
              </T>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeCircleBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <X size={18} color={colors.text || '#FFF'} />
            </Pressable>
          </View>

          <View
            style={[
              styles.codeBox,
              { backgroundColor: colors.purpleSoft, borderColor: colors.purple },
            ]}
          >
            <T muted size={11} style={{ letterSpacing: 1.5 }}>
              YOUR REAL COSMIC ID
            </T>
            <T bold size={22} style={{ color: colors.purple, letterSpacing: 2 }}>
              {displayCode}
            </T>
            <T muted size={11} style={{ textAlign: 'center' }}>
              Share this ID or your email so other Natala users can connect with you.
            </T>
          </View>

          <Pill selected onPress={handleSharePass}>
            ↗ Share Invite Link
          </Pill>

          <View style={{ gap: 8, marginTop: 4 }}>
            <T bold size={13}>
              Connect by Cosmic ID or Email
            </T>
            <View style={[styles.inviteInputRow, { backgroundColor: colors.surfaceAlt }]}>
              <UserPlus size={16} color={colors.muted} />
              <TextInput
                value={friendCode}
                onChangeText={setFriendCode}
                placeholder="e.g. NTL-A1B2C3 or user@email.com"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                style={{ flex: 1, color: colors.text || '#FFF', fontSize: 13 }}
              />
            </View>
            <Pill onPress={handleAdd}>
              {submitting ? 'Connecting...' : '＋ Send Connection Request'}
            </Pill>
          </View>
        </View>
      </View>
    </Modal>
  );
}