import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Modal, PanResponder, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton, backHeaderSpacing } from '../../components/BackButton';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Card, Pill, T } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { resolveProfilePhoto } from '../../components/ProfileAvatar';
import { datingAction, getDating, saveDating } from './datingApi';
import type { DatingPerson, DatingSettings } from './datingApi';

const preferences = [
  { value: 'any', label: 'Everyone' }, { value: 'female', label: 'Women' },
  { value: 'male', label: 'Men' }, { value: 'other', label: 'Other' },
] as const;

export function DatingSafety({ id, onDone, onCancel, matched = true }: {
  id: string; onDone: () => void; onCancel: () => void; matched?: boolean;
}) {
  const [choice, setChoice] = useState<'unmatch' | 'block' | 'report'>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return <Card style={styles.stack}>
    <T bold>Manage contact</T>
    {!choice ? <View style={styles.actions}>
      {matched && <Pill onPress={() => setChoice('unmatch')}>Unmatch</Pill>}
      <Pill onPress={() => setChoice('block')}>Block</Pill>
      <Pill onPress={() => setChoice('report')}>Report</Pill>
      <Pill onPress={onCancel}>Cancel</Pill>
    </View> : <>
      <T size={13}>{choice === 'report' ? 'Report this profile and remove it from your Dating view?' : choice === 'block'
        ? 'Block this person from contacting you?' : 'End this match and close its conversation?'}</T>
      <View style={styles.actions}>
        <Pill selected disabled={pending} onPress={async () => {
          setPending(true);
          try { await datingAction(id, choice); onDone(); }
          catch (e) { setError(e instanceof Error ? e.message : 'Could not complete this action.'); }
          finally { setPending(false); }
        }}>Confirm</Pill>
        <Pill disabled={pending} onPress={() => { setChoice(undefined); setError(''); }}>Cancel</Pill>
      </View>
    </>}
    {!!error && <T size={12}>{error}</T>}
  </Card>;
}

function DatingCard({ person, onInspect, onAction, busy }: {
  person: DatingPerson; onInspect: () => void; onAction: (a: 'like' | 'pass') => void; busy: boolean;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => !busy && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
    onPanResponderMove: (_, g) => x.setValue(g.dx * 0.65),
    onPanResponderRelease: (_, g) => {
      Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
      if (Math.abs(g.dx) >= 55) onAction(g.dx > 0 ? 'like' : 'pass');
    },
    onPanResponderTerminate: () => x.setValue(0),
  }), [busy, onAction, x]);
  return <>
    <Animated.View style={{ transform: [{ translateX: x }] }} {...swipe.panHandlers}>
      <Card onPress={onInspect} style={styles.personCard}>
        {!!person.photo && <Image source={{ uri: resolveProfilePhoto(person.photo) }} accessibilityLabel={person.name} style={styles.photo} />}
        <View style={styles.personBody}>
          <T bold size={24}>{person.name}, {person.age}</T>
          {!!person.city && <T muted size={13}>{person.city}</T>}
          <T muted size={12}>A perfect Sunday looks like…</T>
          <T size={15}>{person.prompt}</T>
          {person.shared.length > 0 && <T size={12}>You both like {person.shared.join(', ')}</T>}
          {!!person.sharedMoon && <T size={12}>You both have a {person.sharedMoon} Moon</T>}
          <T muted size={12}>View profile ›</T>
        </View>
      </Card>
    </Animated.View>
    <View style={styles.actions}>
      <Pill disabled={busy} onPress={() => onAction('pass')}>Pass</Pill>
      <Pill selected disabled={busy} onPress={() => onAction('like')}>Like ♥</Pill>
    </View>
  </>;
}

export function Dating({ search }: { search: string }) {
  const { colors, setPage, setSelectedChat } = useApp();
  const [hub, setHub] = useState<Awaited<ReturnType<typeof getDating>>>();
  const [draft, setDraft] = useState<DatingSettings>();
  const [interestText, setInterestText] = useState('');
  const [editing, setEditing] = useState(false);
  const [inspected, setInspected] = useState<DatingPerson>();
  const [celebrate, setCelebrate] = useState<DatingPerson>();
  const [showMatches, setShowMatches] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const refresh = useCallback(async () => {
    try { setHub(await getDating()); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load Dating.'); return false; }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const run = async (work: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try { await work(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const edit = () => {
    const settings = hub?.settings;
    setDraft({ enabled: true, bio: '', prompt: '', city: '', interests: [], preference: 'any', minAge: 18, maxAge: 65, ...settings });
    setInterestText(settings?.interests?.join(', ') || '');
    setEditing(true);
  };
  const person = hub?.discover.find((p) => `${p.name} ${p.city || ''} ${p.interests.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()));
  const act = (action: 'like' | 'pass') => {
    if (!person) return;
    void run(async () => {
      const result = await datingAction(person.id, action);
      setHub((old) => old && { ...old, discover: old.discover.filter((item) => item.id !== person.id) });
      if (result.match) setCelebrate(result.match);
      await refresh();
    });
  };
  const sayHi = (target: DatingPerson) => void run(async () => {
    const result = await datingAction(target.id, 'chat');
    if (!result.chatId) throw new Error('Could not open the match conversation.');
    setCelebrate(undefined);
    setInspected(undefined);
    setSelectedChat({ chatId: result.chatId });
    setPage('chat');
  });
  const input = (label: string, value: string, onChangeText: (value: string) => void, maxLength: number, numeric = false) =>
    <TextInput accessibilityLabel={label} placeholder={label} placeholderTextColor={colors.muted} value={value}
      onChangeText={onChangeText} maxLength={maxLength} keyboardType={numeric ? 'number-pad' : 'default'}
      style={[styles.input, { color: colors.text, borderColor: colors.line }]} />;
  return <View style={styles.stack}>
    {!!error && <T size={13}>{error}</T>}
    {!hub ? <Pill onPress={() => { setError(''); void refresh(); }}>{error ? 'Try again' : 'Load Dating'}</Pill>
      : !hub.eligible ? <Card><T>Dating is available to adults aged 18 or older.</T></Card>
      : editing && draft ? <Card style={styles.stack}>
        <T bold size={20}>Your Dating profile</T>
        {input('City (optional)', draft.city, (city) => setDraft({ ...draft, city }), 60)}
        {input('Short bio', draft.bio, (bio) => setDraft({ ...draft, bio }), 240)}
        {input('A perfect Sunday looks like…', draft.prompt, (prompt) => setDraft({ ...draft, prompt }), 160)}
        {input('Interests, separated by commas', interestText, setInterestText, 120)}
        <T bold size={13}>Who you want to meet</T>
        <SegmentedControl label="Dating preference" options={preferences} value={draft.preference} onChange={(preference) => setDraft({ ...draft, preference })} />
        <T bold size={13}>Age range</T>
        <View style={styles.actions}>
          {input('From', String(draft.minAge || ''), (v) => setDraft({ ...draft, minAge: Number(v) }), 3, true)}
          {input('To', String(draft.maxAge || ''), (v) => setDraft({ ...draft, maxAge: Number(v) }), 3, true)}
        </View>
        <View style={styles.actions}>
          <Pill selected disabled={busy} onPress={() => void run(async () => {
            await saveDating({ ...draft, enabled: true, interests: interestText.split(',').map((v) => v.trim()) });
            setEditing(false);
            await refresh();
          })}>{hub.settings?.enabled ? 'Save profile' : 'Enable Dating'}</Pill>
          <Pill disabled={busy} onPress={() => setEditing(false)}>Cancel</Pill>
        </View>
      </Card> : !hub.settings?.enabled ? <Card style={styles.stack}>
        <T bold size={22}>Meet someone new</T>
        <T muted>Choose what to share on your Dating profile. A conversation opens when you both like each other.</T>
        {hub.hasPhoto ? <Pill selected onPress={edit}>Set up Dating</Pill> : <Pill selected onPress={() => setPage('profile')}>Add a profile photo</Pill>}
      </Card> : <>
        <View style={styles.actions}>
          <Pill selected={showMatches} onPress={() => { setShowMatches(!showMatches); void refresh(); }}>Matches ({hub.matches.length})</Pill>
          <Pill onPress={edit}>Edit profile</Pill>
          <Pill disabled={busy} onPress={() => void run(async () => {
            await saveDating({ enabled: false }); await refresh();
          })}>Pause</Pill>
        </View>
        {showMatches ? <View style={styles.stack}>
          {hub.matches.length === 0 && <Card><T muted>Mutual likes will appear here.</T></Card>}
          {hub.matches.map((match) => <Card key={match.id} onPress={() => setInspected(match)} style={styles.actions}>
            <T bold>{match.name}</T><T muted>View match ›</T>
          </Card>)}
        </View> : person ? <DatingCard key={person.id} person={person} onInspect={() => setInspected(person)} onAction={act} busy={busy} />
          : <Card style={styles.stack}><T muted>{search.trim() ? 'No Dating profiles match your search.' : 'You’re caught up for now.'}</T>
            <Pill onPress={() => void refresh()}>Refresh</Pill></Card>}
      </>}
    {(inspected || celebrate) && <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={() => { setInspected(undefined); setCelebrate(undefined); }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={backHeaderSpacing}><BackButton onPress={() => { setInspected(undefined); setCelebrate(undefined); }} /></View>
        <ScrollView contentContainerStyle={styles.modal}>
          {celebrate ? <Card style={styles.stack}>
            <T bold size={29}>It’s a match</T><T>You and {celebrate.name} liked each other.</T>
            <Pill selected disabled={busy} onPress={() => sayHi(celebrate)}>Say hi</Pill>
            <Pill onPress={() => setCelebrate(undefined)}>Keep exploring</Pill>
          </Card> : inspected && <>
            <Card style={styles.personCard}>
              {!!inspected.photo && <Image source={{ uri: resolveProfilePhoto(inspected.photo) }} style={styles.photo} />}
              <View style={styles.personBody}>
                <T bold size={24}>{inspected.name}, {inspected.age}</T>
                <T muted>{inspected.city}</T><T>{inspected.bio}</T>
                <T bold size={13}>A perfect Sunday looks like…</T><T>{inspected.prompt}</T>
                {!!inspected.interests.length && <T muted>{inspected.interests.join(' · ')}</T>}
              </View>
            </Card>
            {hub?.matches.some((match) => match.id === inspected.id) && <Pill selected disabled={busy} onPress={() => sayHi(inspected)}>Say hi</Pill>}
            <DatingSafety id={inspected.id} matched={hub?.matches.some((match) => match.id === inspected.id) ?? false}
              onCancel={() => setInspected(undefined)} onDone={() => { setInspected(undefined); void refresh(); }} />
          </>}
          {!!error && <T size={13}>{error}</T>}
        </ScrollView>
      </SafeAreaView>
    </Modal>}
  </View>;
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  actions: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  personCard: { padding: 0, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 1.12 },
  personBody: { padding: 16, gap: 6 },
  modal: { padding: 18, gap: 12, width: '100%', maxWidth: 520, alignSelf: 'center' },
  input: { borderWidth: 1, borderRadius: 13, minHeight: 46, paddingHorizontal: 12, minWidth: 70 },
});
