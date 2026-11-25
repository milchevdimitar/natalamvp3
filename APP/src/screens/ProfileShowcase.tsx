import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';
import { useLocalBack } from '../components/NavigationBack';
import { BackButton } from '../components/BackButton';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Card, Pill, T } from '../components/UI';
import { useApp } from '../context/AppContext';
import { authorizedFetch } from '../services/account';
import { API_BASE_URL } from '../services/apiBase';

const slots = [
  { id: 'signature', title: 'My cosmic signature', hint: 'A symbol or detail that feels like you' },
  { id: 'exploring', title: 'Something I’m exploring', hint: 'A question, interest or new direction' },
  { id: 'ask', title: 'Ask me about…', hint: 'Give someone a way to start a conversation' },
] as const;
type Slot = (typeof slots)[number]['id'];
export type PublicShowcaseCard = { slot: Slot; text: string };
type Draft = PublicShowcaseCard & { visible: boolean };
type Showcase = { cards: Draft[]; discoverable: boolean };

async function request(value?: Showcase): Promise<Showcase> {
  const response = await authorizedFetch(API_BASE_URL + '/me/showcase', value ? {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value),
  } : undefined);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Could not load your showcase.');
  return data;
}

export function ShowcaseCards({ cards }: { cards: PublicShowcaseCard[] }) {
  return <View style={styles.stack}>
    {slots.map(({ id, title }) => {
      const card = cards.find((item) => item.slot === id);
      return card ? <Card key={id} style={styles.stack}>
        <T muted size={12}>{title}</T>
        <T bold size={16}>{card.text}</T>
      </Card> : null;
    })}
  </View>;
}

export default function ProfileShowcase() {
  const { user, colors, goBack } = useApp();
  const [draft, setDraft] = useState<Showcase>();
  const [preview, setPreview] = useState(false);
  useLocalBack(preview, () => setPreview(false));
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const update = (slot: Slot, change: Partial<Omit<Draft, 'slot'>>) => setDraft((previous) => {
    if (!previous) return previous;
    const card = previous.cards.find((item) => item.slot === slot) ?? { slot, text: '', visible: false };
    return { ...previous, cards: [...previous.cards.filter((item) => item.slot !== slot), { ...card, ...change }] };
  });

  useEffect(() => {
    let active = true;
    setError('');
    void request().then((data) => { if (active) setDraft(data); }).catch((failure) => {
      if (active) setError(failure.message);
    });
    return () => { active = false; };
  }, [attempt]);

  const save = async () => {
    if (!draft || pending.current) return;
    pending.current = true;
    setSaving(true);
    setError('');
    try {
      setDraft(await request({ ...draft, cards: draft.cards.filter(({ text }) => text.trim()) }));
      goBack('profile');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save your showcase.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };
  const visibleCards = draft?.cards.filter(({ visible, text }) => visible && text.trim()) ?? [];

  return <View style={styles.stack}>
    <BackButton onPress={() => preview ? setPreview(false) : goBack('profile')} />
    <T bold size={25}>{preview ? 'Profile preview' : 'Profile showcase'}</T>
    {!!error && <Card style={styles.stack}><T>{error}</T>
      {!draft && <Pill onPress={() => setAttempt((value) => value + 1)}>Retry</Pill>}
    </Card>}
    {!draft && !error && <T muted>Loading your showcase…</T>}
    {draft && (preview ? <>
      <Card style={[styles.stack, styles.identity]}>
        <ProfileAvatar name={user?.name ?? ''} source={user?.avatarUrl} size={60} />
        <T bold size={20}>{user?.name || 'Your profile'}</T>
        {typeof user?.bio === 'string' && !!user.bio && <T muted>{user.bio}</T>}
        <T muted size={12}>{draft.discoverable ? 'Visible to people in Natala' : 'Visible to your friends'}</T>
      </Card>
      <ShowcaseCards cards={visibleCards} />
      {visibleCards.length === 0 && <T muted>Your showcase is empty.</T>}
    </> : <>
      <Card style={styles.row}>
        <View style={styles.copy}>
          <T bold>Discoverable profile</T>
          <T muted size={12}>Show your profile in Discover and let people open your profile link. Friends keep access.</T>
        </View>
        <Switch accessibilityLabel="Discoverable profile" disabled={saving} value={draft.discoverable}
          onValueChange={(discoverable) => setDraft({ ...draft, discoverable })} />
      </Card>
      {slots.map(({ id, title, hint }) => {
        const card = draft.cards.find((item) => item.slot === id);
        return <Card key={id} style={styles.stack}>
          <T bold>{title}</T>
          <TextInput accessibilityLabel={title} placeholder={hint} placeholderTextColor={colors.muted}
            maxLength={120} multiline editable={!saving} value={card?.text || ''}
            style={[styles.input, { color: colors.text, borderColor: colors.line }]} onChangeText={(text) => update(id, { text })} />
          <View style={styles.row}>
            <T muted size={13}>Show on profile</T>
            <Switch accessibilityLabel={'Show ' + title + ' on profile'} disabled={saving || !card?.text.trim()}
              value={card?.visible === true && !!card.text.trim()} onValueChange={(visible) => update(id, { visible })} />
          </View>
        </Card>;
      })}
      <View style={styles.actions}>
        <Pill disabled={saving} onPress={() => setPreview(true)}>Preview</Pill>
        <Pill selected disabled={saving} onPress={() => void save()}>{saving ? 'Saving…' : 'Save showcase'}</Pill>
      </View>
    </>)}
  </View>;
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  copy: { flex: 1, gap: 4 },
  identity: { alignItems: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 14, padding: 10, fontSize: 15 },
});
