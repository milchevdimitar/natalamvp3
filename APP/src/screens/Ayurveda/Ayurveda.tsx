import { BackButton } from '../../components/BackButton';
import { ExploreSystemHeader } from '../ExploreSystemHeader';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, Leaf } from 'lucide-react-native';
import { DoshaTriangle } from '../../components/DashboardCharts';
import { Card, Hero, Progress, Section, T } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { saveUserProfile } from '../../services/api';
import { getDashboardBalances } from '../../services/profileDashboard';
import { useSystemActivity } from '../../services/systemActivity';
import { calculateAyurvedaProfile } from './ayurveda.calculator';
import { DOSHA_CATEGORIES, PRAKRITI_QUIZ_QUESTIONS } from './ayurveda.data';
import { DoshaGuide } from './DoshaGuide';
import { DOSHA_ICONS } from './DoshaBalanceCard';
import { AyurvedaSheetModal } from './AyurvedaDetailModal';
import { describeDoshaBalance, doshaScoreBand, doshaTips } from './ayurveda.balance';
import type { DoshaName } from './ayurveda.types';

const questions = PRAKRITI_QUIZ_QUESTIONS;
export default function Ayurveda() {
  const { colors, user, updateCurrentUserProfile } = useApp();
  const activity = useSystemActivity(user?.email);
  const values = getDashboardBalances(user, activity).doshas;
  const [selectedDosha, setSelectedDosha] = useState<DoshaName | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, DoshaName>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const question = questions[index];
  const answered = questions.filter(({ id, options }) => options.some(({ dosha }) => dosha === answers[id])).length;
  const done = index === questions.length - 1;
  const balance = values ? describeDoshaBalance(values) : undefined;

  const startQuiz = () => {
    setIndex(0);
    setAnswers({});
    setError('');
    setQuizOpen(true);
  };

  const finish = async () => {
    if (!user?.email || saving || answered !== questions.length) return;
    setSaving(true);
    setError('');
    try {
      const { prakriti, primaryDosha, constitutionType } = calculateAyurvedaProfile({ quizAnswers: answers });
      const ayurveda = {
        answers,
        constitution: constitutionType,
        dominantDosha: primaryDosha.toLowerCase(),
        scores: { vata: prakriti.Vata, pitta: prakriti.Pitta, kapha: prakriti.Kapha },
      };
      const result = await saveUserProfile({ email: user.email, ayurveda });
      if (!result.success || !result.user?.ayurveda) throw new Error('Assessment was not saved');
      await updateCurrentUserProfile({ ayurveda: result.user.ayurveda });
      setQuizOpen(false);
    } catch {
      setError('Could not save your results. Your answers are still here. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <ExploreSystemHeader route="ayurveda" />
    <Hero eyebrow="AYURVEDA" first="Find your" accent="dosha balance." />

    <Card style={styles.card}>
      <View style={styles.row}>
        <Leaf size={20} color={colors.purple} />
        <View style={styles.copy}>
          <T bold size={16}>{values ? 'Your dosha balance' : 'Discover your doshas'}</T>
          <T muted size={13}>{values ? 'Your results also appear in Profile.' : 'Answer based on what is usually true for you.'}</T>
        </View>
      </View>
      {values && <DoshaTriangle categories={DOSHA_CATEGORIES} values={values} active />}
      <Pressable accessibilityRole="button" onPress={startQuiz} style={[styles.primary, { backgroundColor: colors.action }]}>
        <T bold size={14} style={styles.primaryText}>{values ? 'Retake quiz' : 'Take the quiz'}</T>
      </Pressable>
    </Card>

    {balance && <View style={styles.recommendations}>
      <Card style={styles.card}>
        <T muted size={12}>Your dosha type</T>
        <T bold size={20}>{balance.type}</T>
        <T muted size={13} style={styles.body}>{balance.description}</T>
      </Card>
      <Section>Ways to find balance</Section>
      {balance.doshas.map(({ name, color, value }) => {
        const band = doshaScoreBand(value);
        const tips = doshaTips[name];
        const Icon = DOSHA_ICONS[name];
        return <Card key={name} style={styles.card} onPress={() => setSelectedDosha(name)}>
          <View style={styles.row}>
            <Icon color={color} size={20} />
            <View style={styles.copy}><T bold size={15} style={{ color }}>{name} · {value}%</T></View>
            <ChevronRight size={17} color={colors.muted} />
          </View>
          <T muted size={13} style={styles.body}>{tips.general}</T>
          {band !== 'even' && <>
            <T bold size={12}>{band === 'higher' ? 'Higher in your result' : 'Lower in your result'}</T>
            <T muted size={13} style={styles.body}>{tips[band]}</T>
          </>}
        </Card>;
      })}
    </View>}

    {selectedDosha && <DoshaGuide dosha={selectedDosha} onClose={() => setSelectedDosha(null)} />}

    <AyurvedaSheetModal visible={quizOpen} onClose={() => { if (!saving) setQuizOpen(false); }}
      eyebrow={`QUESTION ${index + 1} OF ${questions.length}`} title="Dosha quiz" colors={colors}>
      <View style={styles.quiz}>
        <Progress value={answered / questions.length * 100} color={colors.purple} />
        <T bold size={17}>{question.prompt}</T>
        {question.options.map(({ dosha, label }) => {
          const checked = answers[question.id] === dosha;
          return <Pressable key={dosha} accessibilityRole="radio" accessibilityState={{ checked }} disabled={saving}
            onPress={() => setAnswers((current) => ({ ...current, [question.id]: dosha }))}
            style={[styles.option, { backgroundColor: checked ? colors.purpleSoft : colors.surfaceAlt, borderColor: checked ? colors.purple : colors.line }]}>
            <T size={14}>{label}</T>
          </Pressable>;
        })}
        {!!error && <View accessibilityRole="alert"><T size={13}>{error}</T></View>}
        <View style={styles.row}>
          {index > 0 && <BackButton disabled={saving} onPress={() => setIndex(index - 1)} label="Previous question" />}
          <Pressable accessibilityRole="button" disabled={saving || !answers[question.id] || (done && answered !== questions.length)}
            onPress={done ? finish : () => setIndex(index + 1)} style={[styles.primary, { flex: 1, backgroundColor: colors.action, opacity: answers[question.id] ? 1 : 0.5 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <T bold size={14} style={styles.primaryText}>{done ? 'Save results' : 'Next'}</T>}
            {!done && <ChevronRight size={17} color="#fff" />}
          </Pressable>
        </View>
      </View>
    </AyurvedaSheetModal>
  </>;
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  copy: { flex: 1, gap: 4 },
  primary: { minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  primaryText: { color: '#fff' },
  recommendations: { marginTop: 18, gap: 9 },
  body: { lineHeight: 20 },
  quiz: { gap: 12, paddingBottom: 10 },
  option: { minHeight: 50, borderRadius: 13, borderWidth: 1, justifyContent: 'center', padding: 12 },
});
