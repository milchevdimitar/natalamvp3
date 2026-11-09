import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  CloudUpload,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero, Progress } from '../components/UI';
import { saveUserProfile } from '../services/api';
import { UserProfile } from '../models/User';

interface Question {
  id: number;
  text: string;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  direction: 1 | -1;
}

const QUESTIONS: Question[] = [
  // E vs I (1-10)
  { id: 1, text: 'You feel energized when spending time with a large group of people.', dimension: 'EI', direction: 1 },
  { id: 2, text: 'You prefer a quiet environment at home over a loud party.', dimension: 'EI', direction: -1 },
  { id: 3, text: 'You enjoy starting conversations with new and unfamiliar people.', dimension: 'EI', direction: 1 },
  { id: 4, text: 'You often feel drained after prolonged social interaction.', dimension: 'EI', direction: -1 },
  { id: 5, text: 'You easily express your thoughts out loud in a group setting.', dimension: 'EI', direction: 1 },
  { id: 6, text: 'You prefer a few close friends over a wide circle of acquaintances.', dimension: 'EI', direction: -1 },
  { id: 7, text: 'You get excited about social events and dynamic gatherings.', dimension: 'EI', direction: 1 },
  { id: 8, text: 'You need alone time to recharge after a long day.', dimension: 'EI', direction: -1 },
  { id: 9, text: 'You act quickly and spontaneously in social situations.', dimension: 'EI', direction: 1 },
  { id: 10, text: 'You prefer written communication over phone calls.', dimension: 'EI', direction: -1 },

  // S vs N (11-20)
  { id: 11, text: 'You focus more on concrete facts than on abstract theories.', dimension: 'SN', direction: 1 },
  { id: 12, text: 'You often get caught up in daydreams and theories about the future.', dimension: 'SN', direction: -1 },
  { id: 13, text: 'You trust practical experience more than intuition.', dimension: 'SN', direction: 1 },
  { id: 14, text: 'You are fascinated by hidden meanings and symbolism behind things.', dimension: 'SN', direction: -1 },
  { id: 15, text: 'You prefer clear, step-by-step instructions.', dimension: 'SN', direction: 1 },
  { id: 16, text: 'You enjoy searching for new, unconventional ways to solve familiar problems.', dimension: 'SN', direction: -1 },
  { id: 17, text: 'You notice details in your environment that others tend to miss.', dimension: 'SN', direction: 1 },
  { id: 18, text: 'You are more interested in big ideas than in detailed execution.', dimension: 'SN', direction: -1 },
  { id: 19, text: 'You consider yourself a realist with a practical outlook on life.', dimension: 'SN', direction: 1 },
  { id: 20, text: 'You often have strong intuitive insights that turn out to be true.', dimension: 'SN', direction: -1 },

  // T vs F (21-30)
  { id: 21, text: 'When making decisions, you rely primarily on logic and objective analysis.', dimension: 'TF', direction: 1 },
  { id: 22, text: 'It is more important to you to preserve harmony and people\'s feelings.', dimension: 'TF', direction: -1 },
  { id: 23, text: 'You believe the truth is more important than sparing someone\'s feelings.', dimension: 'TF', direction: 1 },
  { id: 24, text: 'You easily empathize with the emotions and experiences of others.', dimension: 'TF', direction: -1 },
  { id: 25, text: 'You evaluate situations objectively without bringing in personal emotions.', dimension: 'TF', direction: 1 },
  { id: 26, text: 'You often make decisions based on your personal values and morals.', dimension: 'TF', direction: -1 },
  { id: 27, text: 'Constructive criticism should be direct, even if it might hurt.', dimension: 'TF', direction: 1 },
  { id: 28, text: 'You always consider how your decisions will affect those around you.', dimension: 'TF', direction: -1 },
  { id: 29, text: 'You convince others using facts and arguments rather than emotional appeals.', dimension: 'TF', direction: 1 },
  { id: 30, text: 'Compassion and forgiveness are more important than strict justice.', dimension: 'TF', direction: -1 },

  // J vs P (31-40)
  { id: 31, text: 'You like having a clear schedule and planned tasks for the day.', dimension: 'JP', direction: 1 },
  { id: 32, text: 'You prefer keeping options open and acting according to the situation.', dimension: 'JP', direction: -1 },
  { id: 33, text: 'You complete your tasks well ahead of deadline.', dimension: 'JP', direction: 1 },
  { id: 34, text: 'You work best under a burst of inspiration at the last minute.', dimension: 'JP', direction: -1 },
  { id: 35, text: 'You feel at ease when everything is tidy and organized.', dimension: 'JP', direction: 1 },
  { id: 36, text: 'Improvisation is one of your strongest assets.', dimension: 'JP', direction: -1 },
  { id: 37, text: 'You plan your trips and vacations in detail in advance.', dimension: 'JP', direction: 1 },
  { id: 38, text: 'You are annoyed by overly strict rules and rigid structures.', dimension: 'JP', direction: -1 },
  { id: 39, text: 'You always follow a clear system and structure in your work.', dimension: 'JP', direction: 1 },
  { id: 40, text: 'You easily change your plans on the go without feeling stressed.', dimension: 'JP', direction: -1 },
];

const TYPE_DESCRIPTIONS: Record<string, { title: string; subtitle: string; desc: string; traits: string[] }> = {
  INFP: { title: "The Mediator", subtitle: "Poetic, kind and altruistic spirit", desc: "You are idealists, guided by deep personal values and a desire for authenticity.", traits: ["Empathy", "Creativity", "Idealism", "Flexibility"] },
  INFJ: { title: "The Advocate", subtitle: "Quiet and mystical, yet inspiring idealist", desc: "You possess a rare balance of visionary intuition and determination to bring about change.", traits: ["Intuition", "Determination", "Depth", "Integrity"] },
  INTJ: { title: "The Architect", subtitle: "Strategic thinker with a plan for everything", desc: "You are independent, analytical, and pursue knowledge and logical perfection.", traits: ["Strategy", "Independence", "Logic", "Vision"] },
  INTP: { title: "The Logician", subtitle: "Innovative inventor with an unquenchable thirst for knowledge", desc: "You love theory, deconstructing ideas, and searching for universal truths.", traits: ["Analytical", "Originality", "Open-minded", "Curiosity"] },
  ENFP: { title: "The Campaigner", subtitle: "Enthusiastic, creative, and free spirit", desc: "You energize those around you with positivity, new ideas, and warmth.", traits: ["Enthusiasm", "Charisma", "Imagination", "Spontaneity"] },
  ENFJ: { title: "The Protagonist", subtitle: "Charismatic and inspiring leader", desc: "You have a natural gift for seeing potential in others and bringing people together.", traits: ["Leadership", "Empathy", "Organization", "Inspiration"] },
  ENTJ: { title: "The Commander", subtitle: "Bold and decisive strategic leader", desc: "You find ways where others see obstacles and achieve ambitious goals.", traits: ["Decisiveness", "Strategy", "Efficiency", "Confidence"] },
  ENTP: { title: "The Debater", subtitle: "Smart and curious thinker who loves a challenge", desc: "You are masters of intellectual debate and uncovering new perspectives.", traits: ["Quick Wit", "Innovation", "Energy", "Non-conformity"] },
  ISTJ: { title: "The Logistician", subtitle: "Practical and fact-minded individual with high reliability", desc: "You value tradition, order, precision, and taking personal responsibility.", traits: ["Reliability", "Structure", "Honesty", "Practicality"] },
  ISFJ: { title: "The Defender", subtitle: "Dedicated and warm protector", desc: "You are warm, caring, and always ready to protect your loved ones.", traits: ["Loyalty", "Care", "Patience", "Support"] },
  ESTJ: { title: "The Executive", subtitle: "Excellent administrator with practical sense", desc: "You organize projects and people with tradition, stability, and clear rules.", traits: ["Firmness", "Organization", "Leadership", "Logic"] },
  ESFJ: { title: "The Consul", subtitle: "Extraordinarily caring and social person", desc: "For you, community harmony and supporting loved ones come first.", traits: ["Sociability", "Warmth", "Duty", "Harmony"] },
  ISTP: { title: "The Virtuoso", subtitle: "Bold and practical experimenters", desc: "You love exploring the world with your hands and mind, masters of tools.", traits: ["Practicality", "Calmness", "Spontaneity", "Problem Solving"] },
  ISFP: { title: "The Adventurer", subtitle: "Flexible and charming artists", desc: "You live in the present moment and express yourselves through aesthetics, freedom, and kindness.", traits: ["Artistry", "Passion", "Freedom", "Empathy"] },
  ESTP: { title: "The Entrepreneur", subtitle: "Smart, energetic, and perceptive people", desc: "You love risks, dynamics, and swift practical actions here and now.", traits: ["Boldness", "Perceptiveness", "Energy", "Practicality"] },
  ESFP: { title: "The Entertainer", subtitle: "Spontaneous, enthusiastic, and lively people", desc: "You love life, fun, and sharing joyful moments with those around you.", traits: ["Vivacity", "Enthusiasm", "Aesthetics", "Friendship"] },
};

const ITEMS_PER_PAGE = 5;

export default function MBTI() {
  const { colors, setPage, user, setUser } = useApp();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const totalPages = Math.ceil(QUESTIONS.length / ITEMS_PER_PAGE);
  const currentQuestions = QUESTIONS.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / QUESTIONS.length) * 100);

  const hasSavedResult = Boolean(user?.mbti?.type);
  const showSavedResult = hasSavedResult && !isRetaking && !isFinished;

  const handleSelect = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateResult = () => {
    let scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    QUESTIONS.forEach((q) => {
      const val = answers[q.id] || 4;
      const scoreWeight = val - 4;

      if (q.dimension === 'EI') {
        if (q.direction === 1) scoreWeight > 0 ? (scores.E += scoreWeight) : (scores.I += Math.abs(scoreWeight));
        else scoreWeight > 0 ? (scores.I += scoreWeight) : (scores.E += Math.abs(scoreWeight));
      } else if (q.dimension === 'SN') {
        if (q.direction === 1) scoreWeight > 0 ? (scores.S += scoreWeight) : (scores.N += Math.abs(scoreWeight));
        else scoreWeight > 0 ? (scores.N += scoreWeight) : (scores.S += Math.abs(scoreWeight));
      } else if (q.dimension === 'TF') {
        if (q.direction === 1) scoreWeight > 0 ? (scores.T += scoreWeight) : (scores.F += Math.abs(scoreWeight));
        else scoreWeight > 0 ? (scores.F += scoreWeight) : (scores.T += Math.abs(scoreWeight));
      } else if (q.dimension === 'JP') {
        if (q.direction === 1) scoreWeight > 0 ? (scores.J += scoreWeight) : (scores.P += Math.abs(scoreWeight));
        else scoreWeight > 0 ? (scores.P += scoreWeight) : (scores.J += Math.abs(scoreWeight));
      }
    });

    const type = [
      scores.E >= scores.I ? 'E' : 'I',
      scores.N >= scores.S ? 'N' : 'S',
      scores.F >= scores.T ? 'F' : 'T',
      scores.P >= scores.J ? 'P' : 'J',
    ].join('');

    const getPct = (a: number, b: number) => {
      const total = a + b || 1;
      return { first: Math.round((a / total) * 100), second: Math.round((b / total) * 100) };
    };

    const ratios = {
      EI: getPct(scores.E, scores.I),
      SN: getPct(scores.S, scores.N),
      TF: getPct(scores.T, scores.F),
      JP: getPct(scores.J, scores.P),
    };

    return {
      type,
      details: TYPE_DESCRIPTIONS[type] || TYPE_DESCRIPTIONS.INFP,
      ratios,
      scores,
    };
  };

  const handleFinishAndSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing with MongoDB Atlas...');

    const res = calculateResult();

    const mbtiPayload = {
      type: res.type,
      percentages: {
        extraversion: res.ratios.EI.first,
        introversion: res.ratios.EI.second,
        intuitive: res.ratios.SN.second,
        observant: res.ratios.SN.first,
        thinking: res.ratios.TF.first,
        feeling: res.ratios.TF.second,
        judging: res.ratios.JP.first,
        prospecting: res.ratios.JP.second,
      },
    };

    if (!user || !user.email) {
      setSyncStatus('No active user session!');
      setIsSyncing(false);
      setIsFinished(true);
      setIsRetaking(false);
      return;
    }

    const updatedUser: UserProfile = {
      ...user,
      mbti: mbtiPayload,
    };

    try {
      await setUser(updatedUser);
      await saveUserProfile(updatedUser);
      setSyncStatus('Successfully saved to database!');
    } catch (error) {
      console.warn('Offline mode: Result saved locally on device.', error);
      setSyncStatus('Saved locally on device.');
    } finally {
      setIsSyncing(false);
      setIsFinished(true);
      setIsRetaking(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentPage(0);
    setIsFinished(false);
    setIsRetaking(true);
    setSyncStatus(null);
  };

  const isPageComplete = currentQuestions.every((q) => answers[q.id] !== undefined);

  const renderResultView = () => {
    let type = '';
    let details = TYPE_DESCRIPTIONS.INFP;
    let ratios = {
      EI: { first: 50, second: 50 },
      SN: { first: 50, second: 50 },
      TF: { first: 50, second: 50 },
      JP: { first: 50, second: 50 },
    };

    if (showSavedResult && user?.mbti) {
      type = user.mbti.type;
      details = TYPE_DESCRIPTIONS[type] || TYPE_DESCRIPTIONS.INFP;
      const p = user.mbti.percentages || {};
      ratios = {
        EI: { first: p.extraversion ?? 50, second: p.introversion ?? 50 },
        SN: { first: p.observant ?? 50, second: p.intuitive ?? 50 },
        TF: { first: p.thinking ?? 50, second: p.feeling ?? 50 },
        JP: { first: p.judging ?? 50, second: p.prospecting ?? 50 },
      };
    } else {
      const res = calculateResult();
      type = res.type;
      details = res.details;
      ratios = res.ratios;
    }

    return (
      <View style={{ gap: 18, marginBottom: 40 }}>
        {syncStatus && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 10,
              backgroundColor: colors.purpleSoft,
              borderRadius: 12,
            }}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={colors.purple} />
            ) : (
              <CloudUpload size={16} color={colors.purple} />
            )}
            <T size={12} style={{ color: colors.purple }}>
              {syncStatus}
            </T>
          </View>
        )}

        <Card style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: colors.purpleSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={38} color={colors.purple} />
          </View>
          <T muted size={11} style={{ letterSpacing: 2 }}>
            YOUR PERSONALITY TYPE
          </T>
          <T bold size={36} style={{ color: colors.purple, letterSpacing: -1 }}>
            {type}
          </T>
          <T bold size={20}>
            {details.title}
          </T>
          <T muted size={13} style={{ textAlign: 'center', maxWidth: 320 }}>
            {details.subtitle}
          </T>
        </Card>

        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color={colors.gold} />
            <T bold size={15}>
              Type Essence
            </T>
          </View>
          <T muted size={13} style={{ lineHeight: 20 }}>
            {details.desc}
          </T>
        </Card>

        <Section>Cognitive Balance</Section>
        <Card style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={12}>Extraversion (E) {ratios.EI.first}%</T>
              <T bold size={12}>{ratios.EI.second}% Introversion (I)</T>
            </View>
            <Progress value={ratios.EI.first} color={colors.purple} />
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={12}>Sensing (S) {ratios.SN.first}%</T>
              <T bold size={12}>{ratios.SN.second}% Intuition (N)</T>
            </View>
            <Progress value={ratios.SN.first} color={colors.gold} />
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={12}>Thinking (T) {ratios.TF.first}%</T>
              <T bold size={12}>{ratios.TF.second}% Feeling (F)</T>
            </View>
            <Progress value={ratios.TF.first} color={colors.purple} />
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={12}>Judging (J) {ratios.JP.first}%</T>
              <T bold size={12}>{ratios.JP.second}% Prospecting (P)</T>
            </View>
            <Progress value={ratios.JP.first} color={colors.gold} />
          </View>
        </Card>

        <Section>Core Traits</Section>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {details.traits.map((trait, i) => (
            <Card key={i} style={{ width: '48%', alignItems: 'center', paddingVertical: 14, gap: 6 }}>
              <CheckCircle2 size={20} color={colors.purple} />
              <T bold size={13}>
                {trait}
              </T>
            </Card>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <Pill onPress={handleRetake}>
            <RotateCcw size={14} color={colors.purple} /> Retake Test
          </Pill>
          <Pill selected onPress={() => setPage('explore')}>
            To Explore ↗
          </Pill>
        </View>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setPage('explore')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
      >
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Back to Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="YOUR PERSONALITY ATLAS · MBTI"
        first="Discover your"
        accent="inner type."
        description="40 questions with a 7-point scale to assess your cognitive preferences."
      />

      {showSavedResult || isFinished ? (
        renderResultView()
      ) : (
        <>
          <Card style={{ marginBottom: 18, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T bold size={13}>
                Progress: {answeredCount} of {QUESTIONS.length} questions
              </T>
              <T bold size={12} style={{ color: colors.purple }}>
                {progressPercent}%
              </T>
            </View>
            <Progress value={progressPercent} color={colors.purple} />
            <T muted size={11}>
              Page {currentPage + 1} of {totalPages}
            </T>
          </Card>

          <View style={{ gap: 14 }}>
            {currentQuestions.map((q) => {
              const currentVal = answers[q.id];
              return (
                <Card key={q.id} style={{ gap: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: colors.purpleSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <T bold size={12} style={{ color: colors.purple }}>
                        {q.id}
                      </T>
                    </View>
                    <T bold size={14} style={{ flex: 1, lineHeight: 20 }}>
                      {q.text}
                    </T>
                  </View>

                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                      <T muted size={10}>Disagree</T>
                      <T muted size={10}>Neutral</T>
                      <T muted size={10}>Agree</T>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: colors.surfaceAlt,
                        borderRadius: 99,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((val) => {
                        const isSelected = currentVal === val;
                        const size = val === 1 || val === 7 ? 32 : val === 2 || val === 6 ? 28 : val === 3 || val === 5 ? 24 : 22;

                        return (
                          <TouchableOpacity
                            key={val}
                            onPress={() => handleSelect(q.id, val)}
                            style={{
                              width: size,
                              height: size,
                              borderRadius: size / 2,
                              backgroundColor: isSelected
                                ? colors.purple
                                : val === 4
                                ? colors.line
                                : colors.surface,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: isSelected ? 0 : 1,
                              borderColor: isSelected ? 'transparent' : colors.line,
                            }}
                          >
                            <T
                              bold={isSelected}
                              size={11}
                              style={{ color: isSelected ? '#FFFFFF' : colors.muted }}
                            >
                              {val}
                            </T>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 40 }}>
            {currentPage > 0 ? (
              <Pill onPress={() => setCurrentPage((p) => p - 1)}>
                ← Previous
              </Pill>
            ) : <View />}

            {currentPage < totalPages - 1 ? (
              <Pill
                selected={isPageComplete}
                onPress={() => {
                  if (isPageComplete) {
                    setCurrentPage((p) => p + 1);
                  } else {
                    Alert.alert('Incomplete Page', 'Please answer all questions on this page!');
                  }
                }}
              >
                Next →
              </Pill>
            ) : (
              <Pill
                selected={answeredCount === QUESTIONS.length}
                onPress={() => {
                  if (answeredCount === QUESTIONS.length) {
                    handleFinishAndSync();
                  } else {
                    Alert.alert('Incomplete Test', 'Please answer all 40 questions to see your result!');
                  }
                }}
              >
                ✦ Complete & View Result
              </Pill>
            )}
          </View>
        </>
      )}
    </>
  );
}