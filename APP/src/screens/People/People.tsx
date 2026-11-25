import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { Card, Pill, Section, T } from '../../components/UI';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { ProfileQrScreen } from '../../components/ProfileQrScreen';
import { StoryViewer } from '../../components/StoryViewer';
import { useApp } from '../../context/AppContext';
import { DiscoverGridSection } from './DiscoverGridSection';
import { FriendListSection } from './FriendListSection';

import { PeopleHeader } from './PeopleHeader';
import { usePeople } from './usePeople';

export default function People({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const { colors, user, stories, notifications, datingTabVisible, setPage } = useApp();
  const people = usePeople(user, setPage);
  const [passed, setPassed] = useState<string[]>([]);
  const query = Boolean(people.search.trim());
  const person = people.filteredDiscover.find((item) => !passed.includes(item.id) && !people.requestedIds.includes(item.id));
  const mirror = notifications?.find((item) => item.kind === 'mirror_invited' && item.mirrorId);
  const authorIds = new Set([
    user?._id, user?.id, user?.email,
    ...people.filteredFriends.flatMap(({ id, _id, email }) => [id, _id, email]),
  ].filter(Boolean).map((value) => String(value).toLowerCase().trim()));
  const circleStories = query ? [] : stories.filter(({ userId }) => authorIds.has(String(userId).toLowerCase().trim()));
  const invite = <Card style={styles.actionCard} onPress={() => setPage('mirror')}>
    <Sparkles size={20} color={colors.purple} />
    <View style={styles.copy}><T bold>Invite a friend to Mirror</T><T muted size={12}>Answer a question and see how they know you.</T></View>
    <ChevronRight size={16} color={colors.muted} />
  </Card>;

  return <>
    <PeopleHeader view="people" search={people.search} onSearch={people.setSearch} onScan={() => people.setInviteModalVisible(true)} />
    <View style={styles.stack}>
      {!query && mirror && <Card style={styles.actionCard} onPress={() => setPage('mirror-session', mirror.mirrorId)}>
        <Sparkles size={20} color={colors.gold} />
        <View style={styles.copy}><T bold>Your turn in Mirror</T><T muted size={12}>{mirror.body}</T></View>
        <ChevronRight size={16} color={colors.muted} />
      </Card>}
      {people.loading ? <T muted>Finding people…</T> : <>
        <FriendListSection
          colors={colors} user={user} incomingRequests={people.incomingRequests} friends={people.filteredFriends}
          onAcceptRequest={people.handleAcceptRequest} onDeclineRequest={people.handleDeclineRequest}
          onInspectPerson={(entry) => onOpenProfile(entry.id)} onOpenChat={people.handleOpenChatWith}
          beforeFriends={circleStories.length > 0 ? <View style={styles.stack}>
            <Section>Circle stories</Section>
            <StoryViewer circular visibleStories={circleStories} />
          </View> : undefined}
          emptyFriends={query ? <T muted size={13}>No friends match your search.</T> : <View style={styles.stack}>
            <T muted size={13}>Add someone you know to start your circle.</T>
            <Pill onPress={() => people.setInviteModalVisible(true)}>Scan their QR code</Pill>
          </View>}
        />
        {!query && invite}
        <Section>Discover</Section>
        {query ? <DiscoverGridSection colors={colors} user={user} peopleList={people.filteredDiscover}
          requestedIds={people.requestedIds} onInspectPerson={(entry) => onOpenProfile(entry.id)} onToggleConnect={people.handleToggleDiscoverConnect} />
          : person ? <Card style={styles.featured}>
            <ProfileAvatar name={person.name} source={person.avatarUrl} size={72} />
            <T bold size={20}>{person.name}</T>
            {!!person.bio && <T muted style={styles.center}>{person.bio}</T>}
            {!!person.interests.length && <T muted size={13} style={styles.center}>{person.interests.join(' · ')}</T>}
            <View style={styles.actions}>
              <Pill onPress={() => setPassed((previous) => [...previous, person.id])}>Next</Pill>
              <Pill onPress={() => onOpenProfile(person.id)}>View profile</Pill>
              <Pill selected onPress={() => people.handleToggleDiscoverConnect(person)}>Connect</Pill>
            </View>
          </Card> : <Card style={styles.stack}>
            <T muted>You’re caught up for now.</T>
            {passed.length > 0 && <Pill onPress={() => setPassed([])}>See skipped profiles</Pill>}
          </Card>}
        <View style={styles.actions}>
          <Pill onPress={people.onRefresh} disabled={people.refreshing}>{people.refreshing ? 'Refreshing…' : 'Refresh Circle'}</Pill>
          {!datingTabVisible && <Pill onPress={() => setPage('dating')}>Open Dating</Pill>}
        </View>
      </>}
    </View>
    {people.inviteModalVisible && <ProfileQrScreen initialMode="scan"
      onClose={() => people.setInviteModalVisible(false)} onOpenProfile={onOpenProfile} />}
  </>;
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  copy: { flex: 1, gap: 3 },
  featured: { alignItems: 'center', gap: 9, padding: 15 },
  center: { textAlign: 'center' },
});
