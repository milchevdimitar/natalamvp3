import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { Heart, MessageCircle, Sparkles, Star } from 'lucide-react-native';
import { BackButton } from '../components/BackButton';
import { Card, Pill, Section, T } from '../components/UI';
import { useApp } from '../context/AppContext';
import { authorizedFetch } from '../services/account';
import { API_BASE_URL } from '../services/apiBase';

type Memory = { id: string; text: string; status: 'pending' | 'saved'; proposedByYou: boolean };
type Constellation = {
  friend: { id: string; name: string };
  interests: string[];
  mirrors: { id: string; title: string; date: string }[];
  memories: Memory[];
};

async function request<Result>(path: string, method = 'GET', body?: object): Promise<Result> {
  const response = await authorizedFetch(API_BASE_URL + '/constellations/' + path, {
    method, ...(body && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  if (response.status === 204) return undefined as Result;
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error ?? 'Your constellation could not be loaded.');
  return result;
}

export default function CircleConstellation({ friendId }: { friendId: string }) {
  const { colors, goBack, setPage } = useApp();
  const [constellation, setConstellation] = useState<Constellation>();
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<string>();
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [removeId, setRemoveId] = useState<string>();
  const pending = useRef(false);
  const proposal = useRef<{ text: string; id: string } | undefined>(undefined);
  const path = encodeURIComponent(friendId);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice('');
    try { setConstellation(await request<Constellation>(path)); }
    catch (failure) {
      setConstellation(undefined);
      setNotice(failure instanceof Error ? failure.message : 'Could not load your constellation.');
    } finally { setLoading(false); }
  }, [path]);

  useEffect(() => { void load(); }, [load]);

  const write = async (work: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setNotice('');
    try { await work(); await load(); }
    catch (failure) { setNotice(failure instanceof Error ? failure.message : 'Could not update your constellation.'); }
    finally { pending.current = false; setBusy(false); }
  };

  const propose = () => {
    const text = draft.trim();
    if (!text) return;
    if (proposal.current?.text !== text) proposal.current = { text, id: randomUUID() };
    const requestId = proposal.current.id;
    void write(async () => {
      await request(path + '/memories', 'POST', { text, requestId });
      setDraft('');
      proposal.current = undefined;
    });
  };
  const remove = (id: string) => void write(async () => {
    await request(path + '/memories/' + id, 'DELETE');
    setRemoveId(undefined);
  });
  const memoryRow = (memory: Memory) => <Card key={memory.id} style={styles.stack}>
    <T>{memory.text}</T>
    {memory.status === 'pending' && <T muted size={12}>{memory.proposedByYou ? 'Waiting for approval' : 'Proposed by ' + constellation?.friend.name}</T>}
    <View style={styles.actions}>
      {memory.status === 'pending' && !memory.proposedByYou && <Pill selected disabled={busy} onPress={() => void write(async () => {
        await request(path + '/memories/' + memory.id, 'PUT');
      })}>Save together</Pill>}
      <Pill disabled={busy} onPress={() => removeId === memory.id ? remove(memory.id) : setRemoveId(memory.id)}>
        {removeId === memory.id ? 'Confirm removal' : memory.status === 'saved' ? 'Remove' : memory.proposedByYou ? 'Withdraw' : 'Decline'}
      </Pill>
    </View>
  </Card>;

  const saved = constellation?.memories.filter(({ status }) => status === 'saved') || [];
  const proposed = constellation?.memories.filter(({ status }) => status === 'pending') || [];
  const openMemory = saved.find((item) => item.id === selectedMemory);
  const stars = [
    ...saved.map((item) => ({ id: 'memory:' + item.id, label: 'Saved memory', Icon: Heart, open: () => setSelectedMemory(item.id) })),
    ...(constellation?.mirrors ?? []).map((item) => ({ id: 'mirror:' + item.id, label: item.title, Icon: Sparkles, open: () => setPage('mirror-session', item.id) })),
    ...(constellation?.interests ?? []).map((item) => ({ id: 'interest:' + item, label: item, Icon: Star, open: () => setPage('shared-profile', friendId) })),
  ].slice(0, 9);

  return <View style={styles.stack}>
    <BackButton onPress={() => goBack('people')} />
    <T bold size={25}>Your shared constellation</T>
    {loading && !constellation && <T muted>Looking for your stars…</T>}
    {!!notice && <Card style={styles.stack}><T muted>{notice}</T><Pill onPress={() => void load()}>Refresh</Pill></Card>}
    {constellation && <>
      <Card style={styles.cover}>
        <View style={styles.actions}>
          {stars.map(({ id, label, Icon, open }) => <Pressable key={id} accessibilityRole="button" accessibilityLabel={label}
            style={styles.star} onPress={open}><Icon size={20} color={colors.gold} /></Pressable>)}
        </View>
        <T bold size={18}>You & {constellation.friend.name}</T>
        <T muted size={13}>{stars.length ? 'Your shared interests, Mirror moments and memories' : 'Add a memory to grow your constellation.'}</T>
        {openMemory && <T>{openMemory.text}</T>}
      </Card>
      {!!constellation.interests.length && <>
        <Section>Shared interests</Section>
        <Card onPress={() => setPage('shared-profile', friendId)} style={styles.actions}>
          {constellation.interests.map((interest) => <View key={interest} style={styles.interest}><Star size={13} color={colors.gold} /><T size={13}>{interest}</T></View>)}
        </Card>
      </>}
      {!!constellation.mirrors.length && <>
        <Section>Mirror moments</Section>
        {constellation.mirrors.map((mirror) => <Card key={mirror.id} style={styles.interest} onPress={() => setPage('mirror-session', mirror.id)}>
          <MessageCircle size={17} color={colors.purple} /><T>{mirror.title}</T>
        </Card>)}
      </>}
      {!!saved.length && <><Section>Memories you saved together</Section>{saved.map(memoryRow)}</>}
      {!!proposed.length && <><Section>Waiting for a decision</Section>{proposed.map(memoryRow)}</>}
      <Card style={styles.stack}>
        <View style={styles.interest}><Heart size={18} color={colors.purple} /><T bold>Propose a memory</T></View>
        <T muted size={12}>It becomes a star when your friend saves it too.</T>
        <TextInput accessibilityLabel="Memory" multiline maxLength={160} editable={!busy} value={draft} onChangeText={setDraft}
          placeholder="Something worth remembering" placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text, borderColor: colors.line }]} />
        <Pill selected disabled={busy || !draft.trim()} onPress={propose}>Send for approval</Pill>
      </Card>
      <Pill disabled={loading || busy} onPress={() => void load()}>Refresh</Pill>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cover: { alignItems: 'center', gap: 10 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  interest: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { borderWidth: 1, borderRadius: 14, minHeight: 50, padding: 10 },
});
