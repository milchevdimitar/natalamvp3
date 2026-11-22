import { ProfileAvatar } from '../../components/ProfileAvatar';
import React from 'react';
import { View, Pressable } from 'react-native';
import { MessageCircle, Check, X, Sparkles } from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import {
  calculateCompatibility,
  resolveMbtiType,
  resolveSunSign,
} from './people.compatibility';
import { PersonProfile } from './people.types';
import { styles } from './people.styles';

interface FriendListSectionProps {
  colors: any;
  user: any;
  incomingRequests: PersonProfile[];
  friends: PersonProfile[];
  onAcceptRequest: (person: PersonProfile) => void;
  onDeclineRequest: (personId: string) => void;
  onInspectPerson: (person: PersonProfile) => void;
  onOpenChat: (person: PersonProfile) => void;
}

export function FriendListSection({
  colors,
  user,
  incomingRequests,
  friends,
  onAcceptRequest,
  onDeclineRequest,
  onInspectPerson,
  onOpenChat,
}: FriendListSectionProps) {
  return (
    <>
      {incomingRequests.length > 0 && (
        <>
          <Section>Connection requests ({incomingRequests.length})</Section>
          <View style={styles.listStack}>
            {incomingRequests.map((req) => {
              const comp = calculateCompatibility(user, req);
              const metaLine = [
                resolveMbtiType(req),
                resolveSunSign(req),
                req.birthCity?.name,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <Card key={req.id}>
                  <View style={styles.friendRow}>
                    <Pressable onPress={() => onInspectPerson(req)}>
                      <ProfileAvatar name={req.name} source={req.avatarUrl} size={50} />
                    </Pressable>
                    <Pressable
                      onPress={() => onInspectPerson(req)}
                      style={{ flex: 1, gap: 2 }}
                    >
                      <View style={styles.nameAndScoreRow}>
                        <T bold>{req.name}</T>
                        <View
                          style={[
                            styles.miniScoreTag,
                            { backgroundColor: colors.goldSoft },
                          ]}
                        >
                          <T bold size={10} style={{ color: colors.gold }}>
                            {comp.overall}% Match
                          </T>
                        </View>
                      </View>
                      <T muted size={11}>
                        {metaLine}
                      </T>
                    </Pressable>

                    <View style={styles.requestActionsRow}>
                      <Pressable
                        onPress={() => onDeclineRequest(req.id)}
                        style={[
                          styles.iconSquareBtn,
                          { backgroundColor: colors.surfaceAlt },
                        ]}
                      >
                        <X size={18} color={colors.muted} />
                      </Pressable>
                      <Pressable
                        onPress={() => onAcceptRequest(req)}
                        style={[
                          styles.iconSquareBtn,
                          { backgroundColor: colors.action },
                        ]}
                      >
                        <Check size={18} color="#FFF" />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        </>
      )}

      <Section>Your friends ({friends.length})</Section>
      {friends.length === 0 ? (
        <Card>
          <T muted size={13} style={{ textAlign: 'center' }}>
            Your circle is empty yet. Connect with people below or share your Cosmic ID.
          </T>
        </Card>
      ) : (
        <View style={styles.listStack}>
          {friends.map((friend) => {
            const comp = calculateCompatibility(user, friend);
            const metaLine = [
              resolveMbtiType(friend),
              resolveSunSign(friend),
              friend.birthCity?.name,
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <Card key={friend.id}>
                <View style={styles.friendRow}>
                  <Pressable
                    onPress={() => onInspectPerson(friend)}
                    style={styles.avatarWrap}
                  >
                    <ProfileAvatar name={friend.name} source={friend.avatarUrl} size={50} />
                    {friend.isOnline && (
                      <View
                        style={[
                          styles.avatarOnlineBadge,
                          { borderColor: colors.surface || colors.bg },
                        ]}
                      />
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => onInspectPerson(friend)}
                    style={{ flex: 1, gap: 3 }}
                  >
                    <View style={styles.nameAndScoreRow}>
                      <T bold>{friend.name}</T>
                      <View
                        style={[
                          styles.miniScoreTag,
                          {
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            backgroundColor: colors.purpleSoft,
                          },
                        ]}
                      >
                        <Sparkles size={9} color={colors.purple} />
                        <T bold size={10} style={{ color: colors.purple }}>
                          {comp.overall}%
                        </T>
                      </View>
                    </View>
                    <T muted size={11}>
                      {metaLine}
                    </T>
                  </Pressable>

                  <Pressable
                    accessibilityLabel={`Chat with ${friend.name}`}
                    onPress={() => onOpenChat(friend)}
                    style={[
                      styles.iconSquareBtn,
                      { backgroundColor: colors.purpleSoft },
                    ]}
                  >
                    <MessageCircle size={20} color={colors.purple} />
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </>
  );
}
