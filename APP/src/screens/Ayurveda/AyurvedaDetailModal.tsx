import { BackButton } from '../../components/BackButton';
import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Card, T } from '../../components/UI';

export function AyurvedaTierCard({
  eyebrow,
  title,
  summary,
  badgeText,
  badgeColor,
  onPressMore,
  colors,
}: {
  eyebrow?: string;
  title: string;
  summary: string;
  badgeText?: string;
  badgeColor?: string;
  onPressMore: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPressMore}>
      <Card
        style={{
          padding: 15,
          borderRadius: 16,
          gap: 7,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {eyebrow ? (
            <T bold size={10} style={{ color: colors.gold, letterSpacing: 0.6 }}>
              {eyebrow.toUpperCase()}
            </T>
          ) : (
            <View />
          )}

          {badgeText && (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <T bold size={10} style={{ color: badgeColor || colors.purple }}>
                {badgeText}
              </T>
            </View>
          )}
        </View>

        <T bold size={15}>
          {title}
        </T>

        <T muted size={12} numberOfLines={2} style={{ lineHeight: 18 }}>
          {summary}
        </T>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: 2,
          }}
        >
          <T bold size={12} style={{ color: colors.purple }}>
            More
          </T>
          <ChevronRight size={14} color={colors.purple} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export function AyurvedaSheetModal({
  visible,
  onClose,
  eyebrow,
  title,
  colors,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(10, 10, 18, 0.68)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            maxHeight: '85%',
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingHorizontal: 18,
            paddingBottom: 28,
            borderTopWidth: 1,
            borderColor: colors.line,
          }}
        >
          <View
            style={{
              width: 38,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.line,
              alignSelf: 'center',
              marginBottom: 12,
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <BackButton onPress={onClose} />
            <View style={{ flex: 1 }}>
              {eyebrow && (
                <T bold size={10} style={{ color: colors.gold, letterSpacing: 0.7 }}>
                  {eyebrow.toUpperCase()}
                </T>
              )}
              <T bold size={18} style={{ marginTop: 2 }}>
                {title}
              </T>
            </View>


          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}