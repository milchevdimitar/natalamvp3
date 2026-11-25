import { StarField } from '../../components/StarField';
import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { X, Mail } from 'lucide-react-native';
import { T, Pill } from '../../components/UI';
import { styles } from './chat.styles';

interface NewChatModalProps {
  visible: boolean;
  colors: any;
  email: string;
  onChangeEmail: (val: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function NewChatModal({
  visible,
  colors,
  email,
  onChangeEmail,
  isSubmitting,
  onClose,
  onSubmit,
}: NewChatModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.modalBackdrop}
      >
        <StarField subtle />
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.modalCard,
            { backgroundColor: colors.surface, borderColor: colors.purple },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Mail size={18} color={colors.purple} />
              <T bold size={16}>
                Start Chat by Email
              </T>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <T muted size={12} style={{ marginBottom: 14 }}>
            Enter the email address of the user you wish to connect with.
          </T>

          <TextInput
            value={email}
            onChangeText={onChangeEmail}
            placeholder="user@example.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.surfaceAlt,
                color: colors.text,
                borderColor: colors.line,
              },
            ]}
          />

          <View style={styles.modalActions}>
            <Pill onPress={onClose}>Cancel</Pill>
            <Pill selected onPress={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                'Start Chat ↗'
              )}
            </Pill>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}