import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { Sparkles } from 'lucide-react-native';
import { BackButton } from '../components/BackButton';
import { Card, Pill, Section, T } from '../components/UI';
import { useApp } from '../context/AppContext';
import { mirrorLink } from '../services/mirrorLinks';
import { API_BASE_URL } from '../services/apiBase';
import { authorizedFetch } from '../services/account';

type Question = { id: string; text: string; options: string[] };
type Friend = { id: string; name: string };
type Session = {
  id: string; role: 'initiator' | 'recipient'; question: Question; other: Friend;
  status: 'pending' | 'revealed' | 'declined' | 'cancelled'; ownAnswer?: number; guess?: number; chatEmail?: string;
};
type Overview = { friends: Friend[]; questions: Question[]; sessions: Session[] };
const empty: Overview = { friends: [], questions: [], sessions: [] };

async function request<T>(path = '', method = 'GET', body?: object): Promise<T> {
  const result = await authorizedFetch(API_BASE_URL + '/mirrors' + path, {
    method, ...(body && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const payload = await result.json().catch(() => null);
  if (!result.ok) throw new Error(payload?.error || 'Mirror is unavailable. Try again.');
  return payload;
}

function formatStatus(session: Session) {
  switch (session.status) {
    case 'pending': return session.role === 'recipient' ? 'Your turn' : 'Waiting for their answer';
    case 'revealed': return 'Answers revealed';
    case 'declined': return 'Declined';
    case 'cancelled': return 'Cancelled';
  }
}

export default function MirrorScreen({ sessionId, friendId, inviteToken }: { sessionId?: string; friendId?: string; inviteToken?: string }) {
  const { colors, goBack, setPage, setSelectedChat } = useApp();
  const [overview, setOverview] = useState<Overview>(empty);
  const [session, setSession] = useState<Session>();
  const [recipient, setRecipient] = useState(friendId);
  const [questionId, setQuestionId] = useState<string>();
  const [answer, setAnswer] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [linkNotice, setLinkNotice] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const draft = useRef<{ signature: string; id: string } | undefined>(undefined);
  const question = overview.questions.find((item) => item.id === questionId);
  const friend = overview.friends.find((item) => item.id === recipient);

  const load = useCallback(async (selectedId?: string) => {
    setLoading(true);
    setError('');
    try {
      if (inviteToken && !selectedId) {
        const opened = await request<{ sessionId: string }>('/redeem-link', 'POST', { token: inviteToken });
        setSession(await request<Session>('/' + opened.sessionId));
      } else if (selectedId) setSession(await request<Session>('/' + selectedId));
      else setOverview(await request<Overview>());
    } catch (failure) {
      if (selectedId || inviteToken) setSession(undefined);
      setError(failure instanceof Error ? failure.message : 'Could not load Mirror.');
    } finally { setLoading(false); }
  }, [inviteToken]);
  useEffect(() => { void load(sessionId); }, [load, sessionId]);

  const submit = async (action: () => Promise<Session>, open = false) => {
    if (pending.current) return;
    pending.current = true;
    setWorking(true);
    setError('');
    try {
      const result = await action();
      if (open) setPage('mirror-session', result.id);
      else setSession(result);
    }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save. Try again.'); }
    finally { pending.current = false; setWorking(false); }
  };

  const invite = () => {
    if (!friend || !question || answer === undefined) return;
    const signature = [friend.id, question.id, answer].join(':');
    if (draft.current?.signature !== signature) draft.current = { signature, id: randomUUID() };
    const id = draft.current.id;
    void submit(() => request<Session>('', 'POST', { recipient: friend.id, questionId: question.id, answer, clientRequestId: id }), true);
  };

  const shareInvite = async () => {
    if (!session || pending.current) return;
    pending.current = true;
    setWorking(true);
    setLinkNotice('');
    try {
      const { token } = await request<{ token: string }>('/' + session.id + '/link', 'POST');
      const url = mirrorLink(token);
      setShareUrl(url);
      if (Platform.OS !== 'web') await Share.share({ message: url });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setLinkNotice('Link copied.');
      }
    } catch (failure) {
      setLinkNotice(failure instanceof Error ? failure.message : 'Could not share the link.');
    } finally { pending.current = false; setWorking(false); }
  };

  const back = () => {
    goBack('people');
  };

  return <View style={styles.stack}>
    <BackButton onPress={back} />
    <View style={styles.title}>
      <Sparkles size={22} color={colors.purple} /><T bold size={25}>Mirror</T>
    </View>
    {loading && <T muted>Loading Mirror…</T>}
    {!!error && <Card style={styles.stack}>
      <T muted>{error}</T>
      <Pill disabled={loading || working} onPress={() => void load(session?.id || sessionId)}>Refresh</Pill>
    </Card>}
    {session ? <Card style={styles.stack}>
      <T size={12} muted>{session.other.name} · {formatStatus(session)}</T>
      <T bold size={20}>{session.question.text}</T>
      {session.status === 'revealed' && <>
        <View style={styles.reveal}>
          <T muted size={12}>{session.role === 'initiator' ? 'Your answer' : session.other.name + ' answered'}</T>
          <T bold>{session.question.options[session.ownAnswer ?? -1]}</T>
        </View>
        <View style={styles.reveal}>
          <T muted size={12}>{session.role === 'recipient' ? 'Your guess' : session.other.name + ' guessed'}</T>
          <T bold>{session.question.options[session.guess ?? -1]}</T>
        </View>
        {!!session.chatEmail && <Pill selected onPress={() => {
          setSelectedChat({ targetUser: session.chatEmail });
          setPage('chat');
        }}>Talk about it</Pill>}
      </>}
      {session.status === 'pending' && session.role === 'initiator' && <>
        <T muted>We’ll let you know when {session.other.name} answers.</T>
        <View style={styles.choices}>
          <Pill disabled={loading || working} onPress={() => void load(session.id)}>Check for answer</Pill>
          <Pill disabled={working} onPress={() => void submit(() => request<Session>('/' + session.id + '/cancel', 'POST'))}>Cancel invite</Pill>
          <Pill disabled={working} onPress={() => void shareInvite()}>Share invite link</Pill>
        </View>
      </>}
      {!!shareUrl && session.status === 'pending' && <Text selectable style={{ color: colors.text }}>{shareUrl}</Text>}
      {!!linkNotice && <T muted size={12}>{linkNotice}</T>}
      {session.status === 'pending' && session.role === 'recipient' && <>
        <T muted>Guess how {session.other.name} answered. Then you’ll see both choices.</T>
        <View style={styles.choices}>
          {session.question.options.map((option, index) => <Pill key={option} disabled={working} onPress={() =>
            void submit(() => request<Session>('/' + session.id + '/answer', 'PUT', { answer: index }))}>{option}</Pill>)}
        </View>
        <Pill disabled={working} onPress={() => void submit(() => request<Session>('/' + session.id + '/decline', 'POST'))}>Decline</Pill>
      </>}
    </Card> : !loading && !sessionId && !inviteToken && <>
      <Card style={styles.stack}>
        <T bold size={17}>Invite a friend</T>
        <T muted size={13}>Answer a question about yourself and see how a friend thinks you answered.</T>
        <View style={styles.choices}>
          {overview.friends.map((person) => <Pill key={person.id} selected={recipient === person.id} disabled={working}
            onPress={() => setRecipient(person.id)}>{person.name}</Pill>)}
        </View>
        {!overview.friends.length && <Pill onPress={() => setPage('people')}>Find friends in Circle</Pill>}
        {friend && <>
          <T bold size={14}>Pick a question</T>
          {overview.questions.map((item) => <Pill key={item.id} selected={item.id === questionId} disabled={working} onPress={() => {
            setQuestionId(item.id); setAnswer(undefined);
          }}>{item.text}</Pill>)}
        </>}
        {question && <>
          <T bold size={14}>Choose your answer</T>
          <View style={styles.choices}>
            {question.options.map((option, index) => <Pill key={option} selected={answer === index} disabled={working}
              onPress={() => setAnswer(index)}>{option}</Pill>)}
          </View>
          <Pill selected disabled={working || answer === undefined} onPress={invite}>{working ? 'Sending…' : 'Send invite'}</Pill>
        </>}
      </Card>
      {!!overview.sessions.length && <>
        <View style={styles.title}>
          <View style={{ flex: 1 }}><Section>Your invitations</Section></View>
          <Pill onPress={() => void load()}>Refresh</Pill>
        </View>
        {overview.sessions.map((item) => <Card key={item.id} style={styles.stack} onPress={() => setPage('mirror-session', item.id)}>
          <T bold>{item.other.name} · {formatStatus(item)}</T>
          <T muted size={13}>{item.question.text}</T>
        </Card>)}
      </>}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 4 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reveal: { paddingVertical: 8, gap: 4 },
});
