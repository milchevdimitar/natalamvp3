import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BackButton } from '../components/BackButton';
import { Card, Pill, T } from '../components/UI';
import { useApp } from '../context/AppContext';
import { getReflections, type ReflectionEntry } from '../services/reflections';

export default function ReflectionJournal() {
  const { goBack } = useApp();
  const [entries, setEntries] = useState<ReflectionEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async (next?: string, signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const result = await getReflections(next, signal);
      if (signal?.aborted) return;
      setEntries((previous) => next ? [...previous, ...result.entries] : result.entries);
      setCursor(result.nextCursor);
    } catch {
      if (!signal?.aborted) setError('Could not load your reflections.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };
  useEffect(() => {
    const abort = new AbortController();
    void load(undefined, abort.signal);
    return () => abort.abort();
  }, []);

  return <View style={{ gap: 10 }}>
    <BackButton onPress={() => goBack('profile')} />
    <T bold size={25}>My reflections</T>
    <T muted size={13}>Only you can see your journal.</T>
    {!entries.length && !loading && !error && <Card><T muted>Save your first Daily Moment answer to start your journal.</T></Card>}
    {entries.map(({ date, prompt, answer }) => <Card key={date} style={{ gap: 6 }}>
      <T muted size={12}>{date}</T>
      <T bold>{prompt.question}</T>
      {answer !== null && <T>{prompt.options[answer]}</T>}
    </Card>)}
    {loading && <T muted>Loading reflections…</T>}
    {!!error && <><T muted>{error}</T><Pill onPress={() => void load(cursor ?? undefined)}>Retry</Pill></>}
    {!loading && !error && cursor && <Pill onPress={() => void load(cursor)}>Load more</Pill>}
  </View>;
}
