import React from 'react';
import { ScrollView, View, ActivityIndicator, Pressable } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { Hero, SearchBar, Section, Pill, T } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { PEOPLE_FILTERS } from './people.types';
import { usePeople } from './usePeople';
import { PotentialMatchCard } from './PotentialMatchCard';
import { FriendListSection } from './FriendListSection';
import { DiscoverGridSection } from './DiscoverGridSection';
import { ResonanceDetailModal } from './ResonanceDetailModal';
import { CosmicInviteModal } from './CosmicInviteModal';
import { styles } from './people.styles';

export default function People({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const { colors, setPage, user } = useApp();

  const {
    loading,
    refreshing,
    onRefresh,
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
    currentMatch,
    currentMatchCompatibility,
    canRewind,
    filteredFriends,
    incomingRequests,
    filteredDiscover,
    requestedIds,
    friendIds,
    inspectedPerson,
    setInspectedPerson,
    matchedPerson,
    setMatchedPerson,
    inviteModalVisible,
    setInviteModalVisible,
    handleSkipMatch,
    handleRewindMatch,
    handleLikeMatch,
    handleToggleDiscoverConnect,
    handleAcceptRequest,
    handleDeclineRequest,
    handleRemoveFriend,
    handleOpenChatWith,
    handleConnectByCode,
  } = usePeople(user, setPage);

  return (
    <>
      <Hero
        eyebrow="YOUR CIRCLE · DISCOVER & CONNECT"
        first="People who"
        accent="resonate."
        description="Discover real connections, compare natal charts & MBTI, and grow your circle."
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search people"
        qr={() => setInviteModalVisible(true)}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {PEOPLE_FILTERS.map((f) => (
            <Pill
              key={f.id}
              selected={activeFilter === f.id}
              onPress={() => setActiveFilter(f.id)}
            >
              {f.label}
            </Pill>
          ))}
        </ScrollView>

        <Pressable
          accessibilityLabel="Refresh people"
          onPress={onRefresh}
          style={{
            padding: 10,
            borderRadius: 12,
            backgroundColor: colors.surfaceAlt,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.purple} />
          ) : (
            <RefreshCw size={16} color={colors.purple} />
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center', gap: 10 }}>
          <ActivityIndicator size="large" color={colors.purple} />
          <T muted size={13}>
            Loading real profiles from your orbit...
          </T>
        </View>
      ) : (
        <>
          {!search && activeFilter === 'all' && (
            <>
              <Section>Potential matches</Section>
              <PotentialMatchCard
                colors={colors}
                person={currentMatch}
                compatibility={currentMatchCompatibility}
                canRewind={canRewind}
                onSkip={handleSkipMatch}
                onRewind={handleRewindMatch}
                onInspect={setInspectedPerson}
                onLike={handleLikeMatch}
              />
            </>
          )}

          <FriendListSection
            colors={colors}
            user={user}
            incomingRequests={incomingRequests}
            friends={filteredFriends}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
            onInspectPerson={setInspectedPerson}
            onOpenChat={handleOpenChatWith}
          />

          <DiscoverGridSection
            colors={colors}
            user={user}
            peopleList={filteredDiscover}
            requestedIds={requestedIds}
            onInspectPerson={setInspectedPerson}
            onToggleConnect={handleToggleDiscoverConnect}
          />
        </>
      )}

      {Boolean(inspectedPerson) && (
        <ResonanceDetailModal
          colors={colors}
          user={user}
          person={inspectedPerson}
          isFriend={inspectedPerson ? friendIds.has(inspectedPerson.id) : false}
          isRequested={inspectedPerson ? requestedIds.includes(inspectedPerson.id) : false}
          onClose={() => setInspectedPerson(null)}
          onConnect={(p) => {
            if (p.category === 'match') {
              handleLikeMatch(p);
            } else {
              handleToggleDiscoverConnect(p);
            }
          }}
          onOpenChat={handleOpenChatWith}
          onRemoveFriend={handleRemoveFriend}
        />
      )}

      {Boolean(matchedPerson) && (
        <ResonanceDetailModal
          colors={colors}
          user={user}
          person={matchedPerson}
          isCelebration
          isFriend
          isRequested={false}
          onClose={() => setMatchedPerson(null)}
          onConnect={() => {}}
          onOpenChat={handleOpenChatWith}
          onRemoveFriend={handleRemoveFriend}
        />
      )}

      {inviteModalVisible && (
        <CosmicInviteModal
          colors={colors}
          onClose={() => setInviteModalVisible(false)}
          onConnectByCode={handleConnectByCode}
          onOpenProfile={onOpenProfile}
        />
      )}
    </>
  );
}
