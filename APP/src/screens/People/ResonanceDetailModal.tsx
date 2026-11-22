import { ProfileAvatar } from '../../components/ProfileAvatar';
import React from 'react';
import { View, Modal, Pressable, ScrollView } from 'react-native';
import { X, Sparkles, Heart } from 'lucide-react-native';
import { T, Pill } from '../../components/UI';
import {
  calculateCompatibility,
  getAgeFromBirthdate,
  resolveLifePath,
  resolveMbtiType,
  resolveSunSign,
} from './people.compatibility';
import { PersonProfile } from './people.types';
import { styles } from './people.styles';

interface ResonanceDetailModalProps {
  colors: any;
  user: any;
  person: PersonProfile | null;
  isCelebration?: boolean;
  isFriend: boolean;
  isRequested: boolean;
  onClose: () => void;
  onConnect: (person: PersonProfile) => void;
  onOpenChat: (person: PersonProfile) => void;
  onRemoveFriend: (person: PersonProfile) => void;
}

function ScoreBar({
  value,
  fillColor,
  trackColor,
}: {
  value: number;
  fillColor: string;
  trackColor: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      style={{
        height: 7,
        borderRadius: 99,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${clamped}%`,
          borderRadius: 99,
          backgroundColor: fillColor,
        }}
      />
    </View>
  );
}

export function ResonanceDetailModal({
  colors,
  user,
  person,
  isCelebration = false,
  isFriend,
  isRequested,
  onClose,
  onConnect,
  onOpenChat,
  onRemoveFriend,
}: ResonanceDetailModalProps) {
  if (!person) return null;

  const comp = calculateCompatibility(user, person);
  const age = getAgeFromBirthdate(person.birthdate);
  const mbtiType = resolveMbtiType(person);
  const sunSign = resolveSunSign(person);
  const moonSign = person.natalChart?.moonSign;
  const ascendant = person.natalChart?.ascendant;
  const lifePath = resolveLifePath(person);
  const dosha = person.ayurveda?.dominantDosha?.toUpperCase();
  const birthCard = person.cardology?.birthCard;

  const traits = [
    mbtiType,
    sunSign ? `☉ ${sunSign}` : '',
    moonSign ? `☽ ${moonSign}` : '',
    ascendant ? `↑ ${ascendant}` : '',
    `Life Path ${lifePath}`,
    dosha,
    birthCard ? `Card ${birthCard}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {isCelebration ? (
                <Heart size={18} color={colors.gold} />
              ) : (
                <Sparkles size={18} color={colors.purple} />
              )}
              <T
                bold
                size={15}
                style={{ color: isCelebration ? colors.gold : colors.purple }}
              >
                {isCelebration ? 'Cosmic Resonance Match!' : 'Resonance Blueprint'}
              </T>
            </View>

            <Pressable
              onPress={onClose}
              style={[styles.closeCircleBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <X size={18} color={colors.text || '#FFF'} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 14 }}
          >
            <View style={{ alignItems: 'center', gap: 6 }}>
              <ProfileAvatar name={person.name} source={person.avatarUrl} size={80} />
              <T bold size={22}>
                {person.name}
                {age ? `, ${age}` : ''}
              </T>
              <T muted size={12} style={{ textAlign: 'center' }}>
                {traits}
              </T>
              {Boolean(person.birthCity?.name) && (
                <T muted size={11}>
                  Born in {person.birthCity.name}
                  {person.birthCity.country ? `, ${person.birthCity.country}` : ''}
                </T>
              )}
              {Boolean(person.bio) && (
                <T muted size={12} style={{ textAlign: 'center', marginTop: 2 }}>
                  {person.bio}
                </T>
              )}
            </View>

            <View
              style={[
                styles.highlightsBox,
                { backgroundColor: colors.purpleSoft, alignItems: 'center' },
              ]}
            >
              <T bold size={26} style={{ color: colors.purple }}>
                {comp.overall}% Overall Resonance
              </T>
              <T size={12} style={{ textAlign: 'center' }}>
                {comp.summary}
              </T>
            </View>

            <View style={{ gap: 10 }}>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabelRow}>
                  <T bold size={12}>MBTI Cognitive Synergy</T>
                  <T bold size={12} style={{ color: colors.purple }}>
                    {comp.mbtiScore}%
                  </T>
                </View>
                <ScoreBar
                  value={comp.mbtiScore}
                  fillColor={colors.purple}
                  trackColor={colors.surfaceAlt}
                />
              </View>

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabelRow}>
                  <T bold size={12}>Natal Chart Harmony</T>
                  <T bold size={12} style={{ color: colors.gold }}>
                    {comp.astrologyScore}%
                  </T>
                </View>
                <ScoreBar
                  value={comp.astrologyScore}
                  fillColor={colors.gold}
                  trackColor={colors.surfaceAlt}
                />
              </View>

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabelRow}>
                  <T bold size={12}>Numerology Life Path</T>
                  <T bold size={12} style={{ color: colors.purple }}>
                    {comp.numerologyScore}%
                  </T>
                </View>
                <ScoreBar
                  value={comp.numerologyScore}
                  fillColor={colors.purple}
                  trackColor={colors.surfaceAlt}
                />
              </View>

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabelRow}>
                  <T bold size={12}>Shared Cosmic Interests</T>
                  <T bold size={12} style={{ color: colors.gold }}>
                    {comp.interestsScore}%
                  </T>
                </View>
                <ScoreBar
                  value={comp.interestsScore}
                  fillColor={colors.gold}
                  trackColor={colors.surfaceAlt}
                />
              </View>
            </View>

            <View style={[styles.highlightsBox, { backgroundColor: colors.surfaceAlt }]}>
              <T bold size={12} style={{ color: colors.gold }}>
                WHY YOU RESONATE
              </T>
              {comp.highlights.map((item, idx) => (
                <T key={idx} muted size={12} style={{ lineHeight: 18 }}>
                  ✦ {item}
                </T>
              ))}
            </View>

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'center',
                marginTop: 4,
              }}
            >
              {isFriend || isCelebration ? (
                <>
                  <Pill selected onPress={() => onOpenChat(person)}>
                    💬 Send Message
                  </Pill>
                  {isFriend && !isCelebration && (
                    <Pill onPress={() => onRemoveFriend(person)}>
                      Remove
                    </Pill>
                  )}
                </>
              ) : (
                <Pill
                  selected={!isRequested}
                  onPress={() => {
                    onConnect(person);
                    onClose();
                  }}
                >
                  {isRequested ? 'Request Sent ✓' : '✦ Send Connection Request'}
                </Pill>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}