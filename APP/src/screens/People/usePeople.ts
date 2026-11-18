import { useState, useMemo, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  connectByCosmicCode,
  declineConnectionRequest,
  fetchPeopleHub,
  likeOrRequestPerson,
  removeFriendPerson,
  skipMatchPerson,
} from '../../services/peopleService';
import * as MatchEngine from '../../services/match-engine';
import * as Compat from './people.compatibility';
import { PeopleFilterId, PersonProfile } from './people.types';

function safeToMatchInput(person: any): MatchEngine.UserMatchInput {
  if (typeof Compat.toMatchEngineInput === 'function') {
    return Compat.toMatchEngineInput(person);
  }
  const id = String(person?.id || person?._id || person?.email || '');
  const hasExact = Boolean(
    person?.hasExactBirthTime ||
      (typeof person?.birthTime === 'string' &&
        /^([01]\d|2[0-3]):([0-5]\d)$/.test(person.birthTime.trim()))
  );
  return {
    id,
    profileVersion: person?.updatedAt || person?.profileVersion || '1',
    isActive: person?.isActive !== false,
    isDiscoverable: person?.isDiscoverable !== false,
    symbolicMatchConsent: person?.symbolicMatchConsent !== false,
    datingConsent: person?.datingConsent !== false,
    birthdate: person?.birthdate || null,
    birthTime: hasExact ? person.birthTime : null,
    hasExactBirthTime: hasExact,
    birthCity: person?.birthCity || null,
    currentLocation: person?.currentLocation || null,
    gender: person?.gender,
    seekingGenders: person?.seekingGenders,
    ageRangePreference: person?.ageRangePreference,
    maxDistanceKm: person?.maxDistanceKm ?? null,
    blockedUserIds: person?.blockedUserIds,
    reportedUserIds: person?.reportedUserIds,
    dislikedUserIds: person?.dislikedUserIds,
    preferences: person?.preferences,
    mbti: person?.mbti || null,
    natalChart: person?.natalChart || null,
    westernElements: person?.westernElements || null,
    polarity: person?.polarity || null,
    bazi: person?.bazi || null,
    interests: Array.isArray(person?.interests) ? person.interests : [],
  };
}

export function usePeople(user: any, setPage: (page: any) => void) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<PeopleFilterId>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [myCosmicId, setMyCosmicId] = useState('');
  const [potentialMatches, setPotentialMatches] = useState<PersonProfile[]>([]);
  const [skippedStack, setSkippedStack] = useState<PersonProfile[]>([]);
  const [friends, setFriends] = useState<PersonProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<PersonProfile[]>([]);
  const [discoverPeople, setDiscoverPeople] = useState<PersonProfile[]>([]);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);

  const [inspectedPerson, setInspectedPerson] = useState<PersonProfile | null>(null);
  const [matchedPerson, setMatchedPerson] = useState<PersonProfile | null>(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  const loadHub = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const data = await fetchPeopleHub(user);
        setMyCosmicId(data.myCosmicId || '');
        setFriends(data.friends || []);
        setIncomingRequests(data.incomingRequests || []);
        setRequestedIds(data.requestedIds || []);
        setPotentialMatches(data.potentialMatches || []);
        setDiscoverPeople(data.discover || []);
      } catch (err: any) {
        console.warn('People hub load failed:', err?.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    loadHub(false);
  }, [loadHub]);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);

  // Enforce mutual dating eligibility (18+, consent, blocks, preferences) and rank deterministically
  const eligiblePotentialMatches = useMemo(() => {
    if (!user || potentialMatches.length === 0) return [];

    if (typeof MatchEngine.getEligibleRankedCandidates === 'function') {
      const ranked = MatchEngine.getEligibleRankedCandidates(
        safeToMatchInput(user),
        potentialMatches.map(safeToMatchInput),
        {
          limit: potentialMatches.length,
          requireDatingAdultCheck: true,
        }
      );

      const byId = new Map(potentialMatches.map((p) => [p.id, p]));
      return ranked.items
        .map((item) => byId.get(item.candidate.id))
        .filter((p): p is PersonProfile => Boolean(p));
    }

    console.warn(
      '[usePeople] MatchEngine.getEligibleRankedCandidates is unavailable; check src/services/match-engine/index.ts'
    );
    return potentialMatches;
  }, [user, potentialMatches]);

  const currentMatch =
    eligiblePotentialMatches.length > 0 ? eligiblePotentialMatches[0] : null;

  const currentMatchCompatibility = useMemo(
    () =>
      currentMatch
        ? Compat.calculateCompatibility(user, currentMatch, {
            requireDatingAdultCheck: true,
          })
        : null,
    [user, currentMatch]
  );

  const matchesFilter = useCallback(
    (person: PersonProfile, enforceDatingEligibility: boolean) => {
      if (!user) return false;

      if (
        typeof Compat.isCandidateMutuallyEligible === 'function' &&
        !Compat.isCandidateMutuallyEligible(user, person, enforceDatingEligibility)
      ) {
        return false;
      }

      const query = search.trim().toLowerCase();
      const mbtiType = Compat.resolveMbtiType(person).toLowerCase();
      const sunSign = Compat.resolveSunSign(person).toLowerCase();
      const city = (person.birthCity?.name || '').toLowerCase();

      const matchesSearch =
        !query ||
        person.name.toLowerCase().includes(query) ||
        mbtiType.includes(query) ||
        sunSign.includes(query) ||
        city.includes(query) ||
        (person.interests || []).some((i) => i.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (activeFilter === 'all') return true;

      if (activeFilter === 'high_match') {
        const comp = Compat.calculateCompatibility(user, person, {
          requireDatingAdultCheck: enforceDatingEligibility,
        });
        return comp.hasSymbolicScore && comp.overall >= 80;
      }

      if (activeFilter === 'intuitives') {
        return mbtiType.includes('n');
      }

      if (activeFilter === 'water_air') {
        const el = Compat.SIGN_ELEMENTS[Compat.resolveSunSign(person)];
        return el === 'Water' || el === 'Air';
      }

      if (activeFilter === 'tarot_astro') {
        return (person.interests || []).some((i) =>
          ['tarot', 'astrology'].includes(i.toLowerCase())
        );
      }

      return true;
    },
    [search, activeFilter, user]
  );

  const filteredFriends = useMemo(
    () => friends.filter((f) => matchesFilter(f, false)),
    [friends, matchesFilter]
  );

  const filteredDiscover = useMemo(() => {
    if (!user) return [];

    const filtered = discoverPeople.filter(
      (p) => !friendIds.has(p.id) && matchesFilter(p, true)
    );

    if (filtered.length === 0) return [];

    if (typeof MatchEngine.getEligibleRankedCandidates === 'function') {
      const ranked = MatchEngine.getEligibleRankedCandidates(
        safeToMatchInput(user),
        filtered.map(safeToMatchInput),
        {
          limit: filtered.length,
          requireDatingAdultCheck: true,
        }
      );

      const byId = new Map(filtered.map((p) => [p.id, p]));
      return ranked.items
        .map((item) => byId.get(item.candidate.id))
        .filter((p): p is PersonProfile => Boolean(p));
    }

    return filtered;
  }, [discoverPeople, friendIds, matchesFilter, user]);

  const handleSkipMatch = async () => {
    if (!currentMatch) return;
    const skipped = currentMatch;
    setPotentialMatches((prev) => prev.filter((p) => p.id !== skipped.id));
    setSkippedStack((prev) => [...prev, skipped]);
    try {
      await skipMatchPerson(user, skipped.id, false);
    } catch {}
  };

  const handleRewindMatch = async () => {
    if (skippedStack.length === 0) return;
    const last = skippedStack[skippedStack.length - 1];
    setSkippedStack((prev) => prev.slice(0, -1));
    setPotentialMatches((prev) =>
      prev.some((p) => p.id === last.id) ? prev : [last, ...prev]
    );
    try {
      await skipMatchPerson(user, last.id, true);
    } catch {}
  };

  const handleLikeMatch = async (person: PersonProfile) => {
    setPotentialMatches((prev) => prev.filter((p) => p.id !== person.id));
    try {
      const res = await likeOrRequestPerson(user, person.id);
      if (res.matched && res.person) {
        setFriends((prev) =>
          prev.some((f) => f.id === res.person!.id) ? prev : [res.person!, ...prev]
        );
        setIncomingRequests((prev) => prev.filter((r) => r.id !== person.id));
        setDiscoverPeople((prev) => prev.filter((d) => d.id !== person.id));
        setMatchedPerson(res.person);
      } else {
        setRequestedIds((prev) =>
          prev.includes(person.id) ? prev : [...prev, person.id]
        );
      }
    } catch (err: any) {
      Alert.alert('Connection error', err?.message || 'Could not send request.');
    }
  };

  const handleToggleDiscoverConnect = async (person: PersonProfile) => {
    if (friendIds.has(person.id)) return;
    const isAlreadyRequested = requestedIds.includes(person.id);

    if (isAlreadyRequested) {
      setRequestedIds((prev) => prev.filter((id) => id !== person.id));
      try {
        await cancelConnectionRequest(user, person.id);
      } catch {}
    } else {
      setRequestedIds((prev) => [...prev, person.id]);
      try {
        const res = await likeOrRequestPerson(user, person.id);
        if (res.matched && res.person) {
          setFriends((prev) =>
            prev.some((f) => f.id === res.person!.id) ? prev : [res.person!, ...prev]
          );
          setDiscoverPeople((prev) => prev.filter((d) => d.id !== person.id));
          setMatchedPerson(res.person);
        }
      } catch (err: any) {
        setRequestedIds((prev) => prev.filter((id) => id !== person.id));
        Alert.alert('Error', err?.message || 'Could not connect.');
      }
    }
  };

  const handleAcceptRequest = async (person: PersonProfile) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== person.id));
    try {
      const res = await acceptConnectionRequest(user, person.id);
      const added = res.person || { ...person, category: 'friend' as const };
      setFriends((prev) =>
        prev.some((f) => f.id === added.id) ? prev : [added, ...prev]
      );
      setDiscoverPeople((prev) => prev.filter((d) => d.id !== person.id));
      setMatchedPerson(added);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not accept request.');
      loadHub(true);
    }
  };

  const handleDeclineRequest = async (personId: string) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== personId));
    try {
      await declineConnectionRequest(user, personId);
    } catch {}
  };

  const handleRemoveFriend = (person: PersonProfile) => {
    Alert.alert(
      'Remove from Circle',
      `Remove ${person.name} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setFriends((prev) => prev.filter((f) => f.id !== person.id));
            setInspectedPerson(null);
            try {
              await removeFriendPerson(user, person.id);
              loadHub(true);
            } catch {}
          },
        },
      ]
    );
  };

  const handleOpenChatWith = async (person: PersonProfile) => {
    try {
      await AsyncStorage.setItem(
        'natala_active_chat_partner',
        JSON.stringify(person)
      );
    } catch {}
    setMatchedPerson(null);
    setInspectedPerson(null);
    setPage('chat');
  };

  const handleConnectByCode = async (codeOrEmail: string) => {
    try {
      const res = await connectByCosmicCode(user, codeOrEmail);
      setInviteModalVisible(false);

      if (res.matched && res.person) {
        setFriends((prev) =>
          prev.some((f) => f.id === res.person!.id) ? prev : [res.person!, ...prev]
        );
        setMatchedPerson(res.person);
      } else if (res.person) {
        setRequestedIds((prev) =>
          prev.includes(res.person!.id) ? prev : [...prev, res.person!.id]
        );
        Alert.alert(
          'Request Sent ✨',
          `Connection request sent to ${res.person.name}.`
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Not Found',
        err?.message || 'No registered user found with this code/email.'
      );
    }
  };

  return {
    loading,
    refreshing,
    onRefresh: () => loadHub(true),
    myCosmicId,
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
    currentMatch,
    currentMatchCompatibility,
    canRewind: skippedStack.length > 0,
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
  };
}