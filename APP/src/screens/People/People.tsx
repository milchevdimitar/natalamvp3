import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Pill, T } from '../../components/UI';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { ProfileQrScreen } from '../../components/ProfileQrScreen';
import { useApp } from '../../context/AppContext';
import { DiscoverGridSection } from './DiscoverGridSection';
import { FriendListSection } from './FriendListSection';
import { ResonanceDetailModal } from './ResonanceDetailModal';
import { PeopleHeader } from './PeopleHeader';
import { usePeople } from './usePeople';


function Friends({ people }: { people: ReturnType<typeof usePeople> }) {
  const { colors, user } = useApp();
  const [connections, setConnections] = useState(false);
  const [passed, setPassed] = useState<string[]>([]);
  const person = people.filteredDiscover.find((item) => !passed.includes(item.id) && !people.requestedIds.includes(item.id));
  return <View style={styles.stack}>
    <View style={styles.actions}>
      <Pill selected={!connections} onPress={() => setConnections(false)}>Suggested</Pill>
      <Pill selected={connections} onPress={() => setConnections(true)}>Connections{people.incomingRequests.length ? ` (${people.incomingRequests.length})` : ''}</Pill>
      <Pill onPress={people.onRefresh} disabled={people.refreshing}>Refresh</Pill>
    </View>
    {people.loading ? <T muted>Finding people…</T> : connections ? <FriendListSection
      colors={colors} user={user} incomingRequests={people.incomingRequests} friends={people.filteredFriends}
      onAcceptRequest={people.handleAcceptRequest} onDeclineRequest={people.handleDeclineRequest}
      onInspectPerson={people.setInspectedPerson} onOpenChat={people.handleOpenChatWith}
    /> : people.search.trim() ? <DiscoverGridSection colors={colors} user={user} peopleList={people.filteredDiscover}
      requestedIds={people.requestedIds} onInspectPerson={people.setInspectedPerson} onToggleConnect={people.handleToggleDiscoverConnect} />
      : person ? <Card style={styles.featured}>
        <ProfileAvatar name={person.name} source={person.avatarUrl} size={80} />
        <T bold size={23}>{person.name}</T>
        {!!person.bio && <T muted style={styles.center}>{person.bio}</T>}
        <T muted size={13} style={styles.center}>{person.interests.join(' · ')}</T>
        <View style={styles.actions}>
          <Pill onPress={() => setPassed((previous) => [...previous, person.id])}>Next</Pill>
          <Pill onPress={() => people.setInspectedPerson(person)}>View profile</Pill>
          <Pill selected onPress={() => people.handleToggleDiscoverConnect(person)}>Connect</Pill>
        </View>
      </Card> : <Card style={styles.stack}><T muted>You’re caught up for now.</T>
        {passed.length > 0 && <Pill onPress={() => setPassed([])}>See skipped profiles</Pill>}
      </Card>}
    {people.inspectedPerson && <ResonanceDetailModal
      colors={colors} user={user} person={people.inspectedPerson}
      isFriend={people.friendIds.has(people.inspectedPerson.id)}
      isRequested={people.requestedIds.includes(people.inspectedPerson.id)}
      onClose={() => people.setInspectedPerson(null)} onConnect={people.handleToggleDiscoverConnect}
      onOpenChat={people.handleOpenChatWith} onRemoveFriend={people.handleRemoveFriend}
    />}
  </View>;
}

export default function People({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const { user, setPage } = useApp();
  const people = usePeople(user, setPage);
  return <>
    <PeopleHeader view="people" search={people.search} onSearch={people.setSearch} onScan={() => people.setInviteModalVisible(true)} />
    <Friends people={people} />
    {people.inviteModalVisible && <ProfileQrScreen initialMode="scan"
      onClose={() => people.setInviteModalVisible(false)} onOpenProfile={onOpenProfile} />}
  </>;
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  featured: { alignItems: 'center', gap: 9, padding: 18 },
  center: { textAlign: 'center' },
});
