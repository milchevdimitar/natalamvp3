import { ProfileAvatar } from '../../components/ProfileAvatar';
import React from 'react';
import { View, Pressable } from 'react-native';
import { Card, T, Section, Pill } from '../../components/UI';
import {
  calculateCompatibility,
  resolveMbtiType,
  resolveSunSign,
} from './people.compatibility';
import { PersonProfile } from './people.types';
import { styles } from './people.styles';

interface DiscoverGridSectionProps {
  colors: any;
  user: any;
  peopleList: PersonProfile[];
  requestedIds: string[];
  onInspectPerson: (person: PersonProfile) => void;
  onToggleConnect: (person: PersonProfile) => void;
}

export function DiscoverGridSection({
  colors,
  user,
  peopleList,
  requestedIds,
  onInspectPerson,
  onToggleConnect,
}: DiscoverGridSectionProps) {
  return (
    <>
      <Section>People to discover ({peopleList.length})</Section>
      {peopleList.length === 0 ? (
        <Card style={{ marginBottom: 24 }}>
          <T muted size={13} style={{ textAlign: 'center' }}>
            No other registered users match your current filter.
          </T>
        </Card>
      ) : (
        <View style={styles.discoverGrid}>
          {peopleList.map((person) => {
            const isRequested = requestedIds.includes(person.id);
            const comp = calculateCompatibility(user, person);
            const subtitle = [resolveMbtiType(person), resolveSunSign(person)]
              .filter(Boolean)
              .join(' · ');

            return (
              <Card key={person.id} style={styles.discoverCard}>
                <View
                  style={[
                    styles.miniScoreTag,
                    { backgroundColor: colors.purpleSoft },
                  ]}
                >
                  <T bold size={10} style={{ color: colors.purple }}>
                    {comp.overall}% Match
                  </T>
                </View>

                <Pressable
                  onPress={() => onInspectPerson(person)}
                  style={{ alignItems: 'center', gap: 5 }}
                >
                  <ProfileAvatar name={person.name} source={person.avatarUrl} size={58} />
                  <T bold size={13} style={{ textAlign: 'center' }}>
                    {person.name}
                  </T>
                  <T muted size={11} style={{ textAlign: 'center' }}>
                    {subtitle || person.birthCity?.name}
                  </T>
                </Pressable>

                <Pill
                  selected={isRequested}
                  onPress={() => onToggleConnect(person)}
                >
                  {isRequested ? 'Requested ✓' : '＋ Connect'}
                </Pill>
              </Card>
            );
          })}
        </View>
      )}
    </>
  );
}