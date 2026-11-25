import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Check, LockKeyhole, Sparkles } from 'lucide-react-native';
import { atlasChapters, nextAtlasStep } from '../../../SHARED/atlasSteps';
import { StoryCanvas, captureStory } from '../components/StoryCanvas';
import { cosmic } from '../theme/cosmic';

import { BackButton } from '../components/BackButton';
import { Card, Pill, T } from '../components/UI';
import { useApp } from '../context/AppContext';
import { hasFeature } from '../services/account';
import { useAtlasProgress } from '../services/atlasProgress';
import { getDashboardSystems } from '../services/profileDashboard';
import { useSystemActivity } from '../services/systemActivity';
import { DetailScreen } from './Home/CelestialDetails';
import { useReducedMotion } from './Home/CosmicBackground';
import { MoonCalendarDetail } from './Home/MoonCalendarDetail';
import { getMoonPhaseData } from './Home/home.calculations';

export function AtlasPath({ initialChapter }: { initialChapter?: string }) {
  const [selected, setSelected] = useState(initialChapter);
  const { progress, error, refresh } = useAtlasProgress();
  const entry = atlasChapters.find(({ id }) => id === selected)
    ?? atlasChapters.find(({ steps }) => steps.some(({ id }) => id === progress?.nextStepId))
    ?? atlasChapters[0];
  return <View style={styles.stack}>
    {!!error && <Card style={styles.stack}><T muted>{error}</T><Pill onPress={refresh}>Retry</Pill></Card>}
    <View accessibilityLabel="Atlas chapter" style={styles.choices}>
      {atlasChapters.map(({ id, title }) => <Pill key={id} selected={entry.id === id} onPress={() => setSelected(id)}>{title}</Pill>)}
    </View>
    <AtlasChapterView key={entry.id} chapter={entry} completed={progress?.completed} />
  </View>;
}

function AtlasChapterView({ chapter, completed }: {
  chapter: (typeof atlasChapters)[number]; completed?: readonly { stepId: string }[];
}) {
  const { setPage, colors, addStory } = useApp();
  const storyRef = useRef<React.ComponentRef<typeof View> | null>(null);
  const awaitingPost = useRef(false);
  const [postingStory, setPostingStory] = useState(false);
  const [posted, setPosted] = useState(false);
  const [postNotice, setPostNotice] = useState('');
  const next = completed && nextAtlasStep(chapter.steps, completed);
  const completedCount = chapter.steps.filter(({ id }) => completed?.some(({ stepId }) => stepId === id)).length;
  const sizes = chapter.steps.map((_, index) => index % 2 === 0 ? 22 : 16);
  const post = async () => {
    if (awaitingPost.current || posted) return;
    awaitingPost.current = true;
    setPostingStory(true);
    setPostNotice('');
    try {
      await addStory(await captureStory(storyRef));
      setPosted(true);
    } catch {
      setPostNotice('Could not publish your story. Try again.');
    } finally {
      awaitingPost.current = false;
      setPostingStory(false);
    }
  };

  return <View style={styles.stack}>
    <Card style={styles.stack}>
      <T bold size={22}>{chapter.title}</T>
      <T muted>{chapter.description}</T>
      <T muted size={12}>{completed ? completedCount + ' of ' + chapter.steps.length + ' stations completed' : 'Loading your progress…'}</T>
    </Card>
    {chapter.steps.map((step) => {
      const done = completed?.some(({ stepId }) => stepId === step.id);
      const available = done || next?.id === step.id;
      const Icon = done ? Check : available ? Sparkles : LockKeyhole;
      return <Card key={step.id} style={styles.station} onPress={available ? () => setPage('atlas-step', step.id) : undefined}>
        <Icon size={20} color={done ? '#70d7b3' : available ? colors.gold : colors.muted} />
        <View style={styles.stationCopy}>
          <T bold>{step.title}</T>
          <T muted size={12}>{done ? 'Completed' : available ? step.description : 'Available after the previous station'}</T>
        </View>
      </Card>;
    })}
    {completed && !next && <Card style={styles.reward}>
      <View accessibilityLabel={chapter.steps.length + ' completed stars'} style={styles.stars}>
        {sizes.map((size, index) => <Sparkles key={chapter.steps[index].id} size={size} color={colors.gold} />)}
      </View>
      <T bold size={20}>{chapter.reward}</T>
      <T muted>You completed {chapter.title}.</T>
      <Pill selected disabled={postingStory || posted} onPress={() => void post()}>
        {postingStory ? 'Publishing…' : posted ? 'Added to story' : 'Share constellation'}
      </Pill>
      {!!postNotice && <T muted size={12}>{postNotice}</T>}
      <StoryCanvas storyRef={storyRef} title="Atlas">
        <View style={styles.stars}>
          {sizes.map((size, index) => <Sparkles key={chapter.steps[index].id} size={size + 8} color={cosmic.gold} />)}
        </View>
        <Text style={styles.storyTitle}>{chapter.title}</Text>
        <Text style={styles.storyCaption}>I completed a Natala constellation.</Text>
      </StoryCanvas>
    </Card>}
  </View>;
}

export default function AtlasStation({ id }: { id: string }) {
  const { user, account, setPage, goBack } = useApp();
  const { progress, error, refresh, complete } = useAtlasProgress();
  const [choice, setChoice] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const saving = useRef(false);
  const chapter = atlasChapters.find(({ steps }) => steps.some((item) => item.id === id));
  const step = chapter?.steps.find((item) => item.id === id);
  const next = progress && chapter && nextAtlasStep(chapter.steps, progress.completed);
  const activity = useSystemActivity(user?.email);
  const [moonOpen, setMoonOpen] = useState(false);
  const still = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const record = progress?.completed.find(({ stepId }) => stepId === id);
  const system = step?.route ? getDashboardSystems(user, activity).find(({ route }) => route === step.route) : undefined;
  const unlocked = !!record || id === next?.id;
  const licensed = !system || hasFeature(account, system.route);
  const selected = choice ?? record?.choice;

  const save = async () => {
    if (!step || saving.current) return;
    saving.current = true;
    setBusy(true);
    setNotice('');
    try { await complete(step.id, selected); }
    catch (failure) { setNotice(failure instanceof Error ? failure.message : 'Could not save this station.'); }
    finally { saving.current = false; setBusy(false); }
  };

  return <View style={styles.stack}>
    <BackButton onPress={() => goBack('explore')} />
    <Card style={styles.stack}>
      <T muted size={12}>{chapter?.title.toUpperCase() ?? "ATLAS"}</T>
      <T bold size={23}>{step?.title ?? 'Station unavailable'}</T>
      {!!step && <T muted>{step.description}</T>}
      {!!error && <><T muted>{error}</T><Pill onPress={refresh}>Retry</Pill></>}
      {!!step && progress && !unlocked && <T muted>Complete the earlier stations to continue.</T>}
      {step && unlocked && <>
        {step.showMirror && <Pill onPress={() => setPage('mirror')}>Open Mirror</Pill>}
        {step.showJournal && <Pill onPress={() => setPage('reflections')}>Open My reflections</Pill>}
        {step.showTransits && <Pill onPress={() => setPage('home', 'atlas-transits')}>Open today’s transits</Pill>}
        {system && (licensed ? <>
          {!!system.value && <T bold size={18}>{system.value}</T>}
          <T muted>{system.detail}</T>
          <Pill onPress={() => setPage(system.value || !step.requiresBirth ? system.route : 'profile', step.focusPlanet)}>{step.focusPlanet ? 'Find ' + (step.focusPlanet === 'venus' ? 'Venus' : 'Mercury') + ' in Chart Lab'
            : system.value || !step.requiresBirth ? 'Open ' + system.name : 'Add birth details'}</Pill>
        </> : <Pill onPress={() => setPage('subscription')}>View plans</Pill>)}
        {system && (!licensed || !system.value) && <Pill onPress={() => setPage('explore', 'library')}>Browse Library</Pill>}
        {step.showMoon && <>
          <T bold size={18}>{getMoonPhaseData().phaseName}</T>
          <Pill onPress={() => setMoonOpen(true)}>Open Moon calendar</Pill>
        </>}
        {step.choices && <View style={styles.choices}>
          {step.choices.map((item, index) => <Pill key={item} selected={selected === index} disabled={busy} onPress={() => setChoice(index)}>{item}</Pill>)}
        </View>}
        {(licensed || !step.requiresBirth) && <Pill selected disabled={busy || (step.requiresBirth ? !system?.value || !!record : selected === undefined || selected === record?.choice)}
          onPress={() => void save()}>{busy ? 'Saving…' : record && selected === record.choice ? 'Completed' : 'Complete station'}</Pill>}
        {!!record && <Pill onPress={() => {
          if (next) setPage('atlas-step', next.id);
          else setPage('explore', chapter?.id ?? 'path');
        }}>{next ? 'Next station' : 'See your constellation'}</Pill>}
      </>}
      {!!notice && <T muted>{notice}</T>}
    </Card>
    {moonOpen && <DetailScreen title="Moon calendar" onClose={() => setMoonOpen(false)} offset={still} reduced={reduced} darkBottom>
      <MoonCalendarDetail reduced={reduced} />
    </DetailScreen>}

  </View>;
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  station: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  stationCopy: { flex: 1, gap: 3 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  reward: { alignItems: 'center', gap: 8 },
  storyTitle: { color: cosmic.text, fontSize: 30, fontWeight: '800', textAlign: 'center' },
  storyCaption: { color: cosmic.muted, fontSize: 14, textAlign: 'center' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});
