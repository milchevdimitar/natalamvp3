import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Sparkles, CornerUpLeft, Clock } from 'lucide-react-native';
import { T } from '../../components/UI';
import { Message } from './chat.types';
import { formatStoryAge } from './chat.utils';
import { styles } from './chat.styles';

interface MessageBubbleProps {
  message: Message;
  currentUserEmail: string;
  colors: any;
  onReply: (message: Message) => void;
}

export function MessageBubble({
  message,
  currentUserEmail,
  colors,
  onReply,
}: MessageBubbleProps) {
  const isMe = message.senderEmail === currentUserEmail;

  return (
    <View
      style={[
        styles.messageWrapper,
        { alignSelf: isMe ? 'flex-end' : 'flex-start' },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => onReply(message)}
        style={[
          styles.messageBubble,
          {
            backgroundColor: isMe ? colors.purple : colors.surfaceAlt,
            borderBottomRightRadius: isMe ? 3 : 18,
            borderBottomLeftRadius: isMe ? 18 : 3,
          },
        ]}
      >
        {/* Цитирано съобщение (Reply To) */}
        {message.replyTo && (
          <View
            style={[
              styles.replyQuoteBox,
              {
                backgroundColor: isMe ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                borderLeftColor: isMe ? colors.gold : colors.purple,
              },
            ]}
          >
            <T bold size={10} style={{ color: isMe ? colors.gold : colors.purple }}>
              {message.replyTo.senderEmail === currentUserEmail
                ? 'You'
                : message.replyTo.senderEmail}
            </T>
            <T
              muted
              size={11}
              numberOfLines={1}
              style={{ color: isMe ? '#EAE6FF' : colors.text }}
            >
              {message.replyTo.text}
            </T>
          </View>
        )}

        {/* Стори карта */}
        {message.storyData?.imageUrl && (
          <View style={styles.storyCardContainer}>
            <Image
              source={{ uri: message.storyData.imageUrl }}
              style={styles.storyCardImage}
              resizeMode="cover"
            />
            <View style={styles.storyCardGradientOverlay} />

            <View style={styles.storyCardHeaderBadge}>
              <View style={styles.storyAvatarBorder}>
                <T bold size={10} style={{ color: '#FFF' }}>
                  {(message.storyData.authorName || 'S').charAt(0).toUpperCase()}
                </T>
              </View>
              <View style={{ flex: 1 }}>
                <T bold size={11} numberOfLines={1} style={{ color: '#FFFFFF' }}>
                  {message.storyData.authorName || 'Stargazer'}
                </T>
                <View style={styles.storyAgeRow}>
                  <Clock size={9} color="rgba(255,255,255,0.7)" />
                  <T size={9} style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {formatStoryAge(message.storyData.createdAt)}
                  </T>
                </View>
              </View>
            </View>

            <View style={styles.storyTypeBadge}>
              <Sparkles size={11} color={colors.gold} />
              <T bold size={10} style={{ color: colors.gold }}>
                {message.type === 'story_reply' ? 'Story Reply' : 'Shared Story'}
              </T>
            </View>
          </View>
        )}

        {/* Текст на съобщението */}
        {!!message.text && (
          <T
            size={14}
            style={[styles.messageText, { color: isMe ? '#FFFFFF' : colors.text }]}
          >
            {message.text}
          </T>
        )}
      </TouchableOpacity>

      {/* Време и бутон за отговор */}
      <View
        style={[
          styles.messageMetaRow,
          { justifyContent: isMe ? 'flex-end' : 'flex-start' },
        ]}
      >
        <T muted size={9}>
          {message.timestamp}
        </T>
        <TouchableOpacity onPress={() => onReply(message)} style={{ padding: 2 }}>
          <CornerUpLeft size={12} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}