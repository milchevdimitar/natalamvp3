import { StarField } from '../../components/StarField';
import { BackButton } from '../../components/BackButton';
import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { ChevronRight, Bookmark, Check, Share2 } from 'lucide-react-native';
import { Card, T } from '../../components/UI';

export function TieredSummaryCard({
  tag,
  title,
  summary,
  badgeText,
  badgeColor,
  onPressMore,
  colors,
}: {
  tag?: string;
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
          padding: 16,
          borderRadius: 16,
          gap: 8,
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
          {tag ? (
            <T bold size={10} style={{ color: colors.gold, letterSpacing: 0.6 }}>
              {tag.toUpperCase()}
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

        <T bold size={16}>
          {title}
        </T>

        <T muted size={13} numberOfLines={2} style={{ lineHeight: 19 }}>
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

export function DetailSheetModal({
  visible,
  onClose,
  eyebrow,
  title,
  colors,
  isSaved,
  onSave,
  onShare,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  colors: any;
  isSaved?: boolean;
  onSave?: () => void;
  onShare?: () => void;
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
        <StarField subtle />
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            maxHeight: '84%',
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
              marginBottom: 14,
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
                <T bold size={10} style={{ color: colors.gold, letterSpacing: 0.8 }}>
                  {eyebrow.toUpperCase()}
                </T>
              )}
              <T bold size={18} style={{ marginTop: 2 }}>
                {title}
              </T>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {onSave && (
                <TouchableOpacity
                  onPress={onSave}
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    backgroundColor: isSaved ? colors.purple : colors.surfaceAlt,
                  }}
                >
                  {isSaved ? (
                    <Check size={16} color="#FFFFFF" />
                  ) : (
                    <Bookmark size={16} color={colors.purple} />
                  )}
                </TouchableOpacity>
              )}

              {onShare && (
                <TouchableOpacity
                  onPress={onShare}
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    backgroundColor: colors.surfaceAlt,
                  }}
                >
                  <Share2 size={16} color={colors.muted} />
                </TouchableOpacity>
              )}


            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingBottom: 12 }}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}