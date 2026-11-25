import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Sparkles } from 'lucide-react-native';
import { authorizedFetch } from '../../services/account';
import { API_BASE_URL } from '../../services/apiBase';
import { cosmic, glassPanel } from '../../theme/cosmic';

import { getReflections, type ReflectionEntry as Entry } from '../../services/reflections';

const interests = [['myself', 'Myself'], ['relationships', 'Relationships'], ['ritual', 'Daily ritual']] as const;
const localDay = () => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

async function request<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(base + path, init);
  if (!response.ok) throw new Error('Daily moment request failed');
  return response.json();
}

export function DailyMoment({ accountId, refreshedAt }: { accountId: string; refreshedAt: number }) {
  const base = API_BASE_URL;
  const storage = `natala:daily-moment:${base}:${accountId}`;
  const [entry, setEntry] = useState<Entry>();
  const [interest, setInterest] = useState<string>();
  const [day, setDay] = useState(localDay);
  const [zone, setZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [why, setWhy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Entry[]>();
  const [cursor, setCursor] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const update = () => {
      setDay(localDay());
      setZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    };
    const timer = setInterval(update, 30000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') update(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    setLoading(true);
    setError('');
    void (async () => {
      const [saved, preference] = await Promise.all([
        AsyncStorage.getItem(storage).catch(() => null),
        AsyncStorage.getItem(storage + ':interest').catch(() => null),
      ]);
      if (!active) return;
      if (saved) {
        try { const cached = JSON.parse(saved) as Entry; setEntry((previous) => previous ?? cached); } catch { /* Ignore an invalid cache. */ }
      }
      setInterest(preference ?? '');
      try {
        const result = await request<Entry>(base, '/today/current?zone=' + encodeURIComponent(zone)
          + '&interest=' + encodeURIComponent(preference || ''), { signal: controller.signal });
        if (!active) return;
        setEntry(result);
        setOffline(false);
        void AsyncStorage.setItem(storage, JSON.stringify({ ...result, answer: null })).catch(() => {});
      } catch {
        if (active) setOffline(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [base, storage, zone, day, retry, refreshedAt]);

  const pickInterest = (value: string) => {
    setInterest(value);
    void AsyncStorage.setItem(storage + ':interest', value).catch(() => {});
  };

  const save = async (answer: number) => {
    if (!entry || loading || savingRef.current || offline || entry.answer === answer) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const result = await request<Entry>(base, '/today/' + entry.date + '/answer', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, zone, promptId: entry.prompt.id, version: entry.prompt.version }),
      });
      setEntry(result);
      setHistory(undefined);
      void AsyncStorage.setItem(storage, JSON.stringify({ ...result, answer: null })).catch(() => {});
    } catch {
      setError('Could not confirm your choice. Refresh and try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const readHistory = async (next?: string) => {
    if (historyLoading) return;
    setHistoryLoading(true);
    setError('');
    try {
      const result = await getReflections(next);
      setHistory(next ? [...(history ?? []), ...result.entries] : result.entries);
      setCursor(result.nextCursor);
    } catch {
      setError('Reflections are unavailable. Try again when connected.');
    } finally {
      setHistoryLoading(false);
    }
  };

  return <>
    <View style={styles.card}>
      <LinearGradient pointerEvents="none" colors={glassPanel.colors} start={glassPanel.start} end={glassPanel.end} style={StyleSheet.absoluteFill} />
      <View style={styles.heading}>
        <Sparkles size={16} color={cosmic.gold} /><Text style={styles.kicker}>DAILY MOMENT</Text>
      </View>
      {entry ? <>
        <Text accessibilityRole="header" style={styles.title}>{entry.prompt.title}</Text>
        <Text style={styles.question}>{entry.prompt.question}</Text>
        <View style={styles.choices}>
          {entry.prompt.options.map((option, index) => {
            const selected = entry.answer === index;
            return <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected, disabled: loading || saving || offline }}
              disabled={loading || saving || offline} onPress={() => void save(index)} style={[styles.choice, selected && styles.selected]}>
              {selected && <Check size={12} color={cosmic.text} />}<Text style={styles.choiceText}>{option}</Text>
            </Pressable>;
          })}
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => setWhy(!why)}><Text style={styles.link}>Why today?</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => history ? setHistory(undefined) : void readHistory()}>
            <Text style={styles.link}>{history ? 'Hide reflections' : 'My reflections'}</Text>
          </Pressable>
        </View>
        {why && <Text style={styles.note}>{entry.prompt.reason}</Text>}
        {entry.answer !== null && <Text style={styles.note}>Saved to your reflections</Text>}
      </> : <Text style={styles.question}>{loading ? 'Finding your daily moment…' : 'Your daily moment is unavailable.'}</Text>}
      {offline && <Text style={styles.note}>{entry ? 'Showing your last available moment. Reconnect to answer.' : 'Connect to try again.'}</Text>}
      {!!error && <Text style={styles.note}>{error}</Text>}
      {(offline || error) && <Pressable accessibilityRole="button" onPress={() => setRetry((previous) => previous + 1)}><Text style={styles.link}>Refresh</Text></Pressable>}
    </View>
    {history && <View style={styles.card}>
      <Text style={styles.title}>My reflections</Text>
      {!history.length && <Text style={styles.note}>Your saved answers will appear here.</Text>}
      {history.map((item) => <View key={item.date} style={styles.reflection}>
        <Text style={styles.note}>{item.date}</Text>
        <Text style={styles.question}>{item.prompt.question}</Text>
        <Text style={styles.link}>{item.answer === null ? '' : item.prompt.options[item.answer]}</Text>
      </View>)}
      {cursor && <Pressable accessibilityRole="button" disabled={historyLoading} onPress={() => void readHistory(cursor)}><Text style={styles.link}>Load more</Text></Pressable>}
    </View>}
    {interest === '' && entry && <View style={styles.card}>
      <Text style={styles.question}>What brought you here?</Text>
      <View style={styles.choices}>
        {interests.map(([value, label]) => <Pressable key={value} accessibilityRole="button" style={styles.choice} onPress={() => pickInterest(value)}>
          <Text style={styles.choiceText}>{label}</Text>
        </Pressable>)}
        <Pressable accessibilityRole="button" style={styles.choice} onPress={() => pickInterest('skip')}><Text style={styles.choiceText}>Skip</Text></Pressable>
      </View>
    </View>}
  </>;
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 9, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: glassPanel.border, backgroundColor: glassPanel.background },
  heading: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  kicker: { color: cosmic.gold, fontSize: 11, letterSpacing: 1.1, fontWeight: '700' },
  title: { color: cosmic.text, fontSize: 25, fontWeight: '800' },
  question: { color: cosmic.text, fontSize: 15, lineHeight: 22 },
  note: { color: cosmic.muted, fontSize: 12, lineHeight: 17 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: cosmic.line },
  selected: { backgroundColor: 'rgba(151,119,245,0.27)', borderColor: cosmic.purple },
  choiceText: { color: cosmic.text, fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  link: { color: '#cac7ff', fontSize: 12, fontWeight: '700', paddingVertical: 6 },
  reflection: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cosmic.line, paddingTop: 8 },
});
