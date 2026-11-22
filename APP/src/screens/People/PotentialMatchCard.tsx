import { ProfileAvatar } from '../../components/ProfileAvatar';
import React from 'react';
import { View, Pressable } from 'react-native';
import { Heart, X, Sparkles, RotateCcw, MapPin } from 'lucide-react-native';
import { Card, T, Pill } from '../../components/UI';
import {
  getAgeFromBirthdate,
  resolveLifePath,
  resolveMbtiType,
  resolveSunSign,
} from './people.compatibility';
import { CompatibilityBreakdown, PersonProfile } from './people.types';
import { styles } from './people.styles';

interface PotentialMatchCardProps {
  colors: any;
  person: PersonProfile | null;
  compatibility: CompatibilityBreakdown | null;
  canRewind: boolean;
  onSkip: () => void;
  onRewind: () => void;
  onInspect: (person: PersonProfile) => void;
  onLike: (person: PersonProfile) => void;
}

export function PotentialMatchCard({
  colors,
  person,
  compatibility,
  canRewind,
  onSkip,
  onRewind,
  onInspect,
  onLike,
}: PotentialMatchCardProps) {
  if (!person || !compatibility) {
    return (
      <Card style={styles.matchCard}>
        <T bold size={17}>
          No new souls in your queue right now ✨
        </T>
        <T muted size={13} style={styles.matchBio}>
          You have seen all registered users. Invite a friend with your Natala Cosmic ID!
        </T>
      </Card>
    );
  }

  const age = getAgeFromBirthdate(person.birthdate);
  const sunSign = resolveSunSign(person);
  const mbtiType = resolveMbtiType(person);
  const lifePath = resolveLifePath(person);

  return (
    <Card style={styles.matchCard}>
      <View style={styles.matchTopRow}>
        <View style={[styles.resonanceBadge, { backgroundColor: colors.purpleSoft }]}>
          <Sparkles size={13} color={colors.purple} />
          <T bold size={11} style={{ color: colors.purple }}>
            {compatibility.overall}% Resonance
          </T>
        </View>

        <View style={[styles.onlinePill, { backgroundColor: colors.surfaceAlt }]}>
          {person.isOnline && <View style={styles.onlineDot} />}
          <MapPin size={11} color={colors.muted} />
          <T muted size={11}>
            {person.birthCity?.name || 'Earth'}
          </T>
        </View>
      </View>

      <Pressable onPress={() => onInspect(person)} style={{ alignItems: 'center', gap: 6 }}>
        <ProfileAvatar name={person.name} source={person.avatarUrl} size={92} />
        <T bold size={23}>
          {person.name}
          {age ? `, ${age}` : ''}
        </T>
        <T muted size={13}>
          {[mbtiType, sunSign, `Life Path ${lifePath}`].filter(Boolean).join(' · ')}
        </T>
      </Pressable>

      {Boolean(person.bio) && (
        <T muted size={13} style={styles.matchBio}>
          {person.bio}
        </T>
      )}

      <Pill onPress={() => onInspect(person)}>
        Shared · {compatibility.sharedInterests.slice(0, 2).join(' & ') || 'Cosmic Discovery'}
      </Pill>

      <View style={styles.matchActionsRow}>
        {canRewind && (
          <Pressable
            accessibilityLabel="Previous match"
            onPress={onRewind}
            style={[styles.smallRoundBtn, { backgroundColor: colors.surfaceAlt }]}
          >
            <RotateCcw size={18} color={colors.muted} />
          </Pressable>
        )}

        <Pressable
          accessibilityLabel="Skip potential match"
          onPress={onSkip}
          style={[styles.roundActionBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <X size={23} color={colors.muted} />
        </Pressable>

        <Pressable
          accessibilityLabel="Inspect compatibility"
          onPress={() => onInspect(person)}
          style={[styles.roundActionBtn, { backgroundColor: colors.purpleSoft }]}
        >
          <Sparkles size={23} color={colors.purple} />
        </Pressable>

        <Pressable
          accessibilityLabel="Like potential match"
          onPress={() => onLike(person)}
          style={[styles.roundActionBtn, { backgroundColor: colors.goldSoft }]}
        >
          <Heart size={23} color={colors.gold} />
        </Pressable>
      </View>
    </Card>
  );
}