import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  RotateCcw,
  Wind,
  Flame,
  Droplets,
  CheckCircle2,
  CloudUpload,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero } from '../components/UI';
import { saveUserProfile } from '../services/api';
import { UserProfile } from '../models/User';

type DoshaType = 'vata' | 'pitta' | 'kapha';

interface Option {
  label: string;
  dosha: DoshaType;
}

interface Question {
  id: number;
  category: string;
  question: string;
  options: Option[];
}

const AYURVEDA_QUESTIONS: Question[] = [
  {
    id: 1,
    category: "BODY & BUILD",
    question: "How would you describe your physical structure and frame?",
    options: [
      { label: "Slender, thin, light build; hard to gain weight.", dosha: 'vata' },
      { label: "Medium, athletic, muscular build; easy to maintain weight.", dosha: 'pitta' },
      { label: "Large, sturdy, broad frame; gain weight easily.", dosha: 'kapha' },
    ],
  },
  {
    id: 2,
    category: "SKIN & HAIR",
    question: "What is the typical condition of your skin and hair?",
    options: [
      { label: "Dry, thin, or cool skin; brittle, dry hair.", dosha: 'vata' },
      { label: "Warm, sensitive, or redness-prone skin; straight, fine hair.", dosha: 'pitta' },
      { label: "Smooth, soft, moist skin; thick, full, lustrous hair.", dosha: 'kapha' },
    ],
  },
  {
    id: 3,
    category: "METABOLISM & APPETITE",
    question: "How does your digestive system function?",
    options: [
      { label: "Variable appetite and bloating; sometimes forget to eat.", dosha: 'vata' },
      { label: "Strong digestion and intense appetite; irritable if meals are delayed.", dosha: 'pitta' },
      { label: "Slow metabolism; enjoy eating, but can easily skip meals.", dosha: 'kapha' },
    ],
  },
  {
    id: 4,
    category: "MIND & TEMPERAMENT",
    question: "How do you process new information and how does your mind work?",
    options: [
      { label: "Learn very quickly but forget easily; fast and creative mind.", dosha: 'vata' },
      { label: "Sharp, analytical, focused, and organized mind; good memory.", dosha: 'pitta' },
      { label: "Learn methodically and slower, but have a deep, lasting memory.", dosha: 'kapha' },
    ],
  },
  {
    id: 5,
    category: "SLEEP & REST",
    question: "What is the nature of your sleep?",
    options: [
      { label: "Light, shallow, with frequent awakenings or insomnia.", dosha: 'vata' },
      { label: "Moderately deep, sound, resting well on fewer hours.", dosha: 'pitta' },
      { label: "Deep, heavy, long sleep; hard to wake up in the morning.", dosha: 'kapha' },
    ],
  },
  {
    id: 6,
    category: "STRESS RESPONSE",
    question: "How do you react under pressure or stress?",
    options: [
      { label: "Feel anxious, worried, fearful, or confused.", dosha: 'vata' },
      { label: "Become critical, angry, irritable, or aggressive.", dosha: 'pitta' },
      { label: "Withdraw, become passive, sluggish, or stubborn.", dosha: 'kapha' },
    ],
  },
  {
    id: 7,
    category: "CLIMATE PREFERENCES",
    question: "Which climate or weather do you dislike most?",
    options: [
      { label: "Dislike cold and windy weather; love warmth and sunshine.", dosha: 'vata' },
      { label: "Dislike heat and hot sun; prefer cool environments.", dosha: 'pitta' },
      { label: "Dislike damp, cold weather; prefer dry and warm climates.", dosha: 'kapha' },
    ],
  },
  {
    id: 8,
    category: "PACE & ENERGY",
    question: "What is your daily pace of action and speech?",
    options: [
      { label: "Fast, impulsive, energetic; constantly on the move.", dosha: 'vata' },
      { label: "Goal-oriented, efficient, precise, persuasive tone.", dosha: 'pitta' },
      { label: "Smooth, relaxed, steady, and deliberate.", dosha: 'kapha' },
    ],
  },
];

const DOSHA_DETAILS = {
  vata: {
    title: "Vata",
    element: "Air & Ether 💨",
    icon: Wind,
    color: "#7653AD",
    bg: "rgba(118, 83, 173, 0.12)",
    traits: "Creativity, speed, flexibility, artistry.",
    description: "You are driven by the principle of movement. You have a lively mind, vivid imagination, and enthusiasm. In balance, you are inspiring and innovative. Out of balance, you are prone to anxiety, dry skin, and insomnia.",
    recommendations: [
      "Consume warm, unctuous, and freshly cooked meals.",
      "Maintain a consistent daily routine for sleep and meals.",
      "Practice calming meditation and warm oil self-massage (Abhyanga).",
    ],
  },
  pitta: {
    title: "Pitta",
    element: "Fire & Water 💥",
    icon: Flame,
    color: "#E65B63",
    bg: "rgba(230, 91, 99, 0.12)",
    traits: "Intellect, leadership, determination, organization.",
    description: "You are driven by the principle of transformation and metabolism. You possess a clear mind, sharp intellect, and natural ambition. In balance, you make excellent leaders. Out of balance, you tend toward irritability, inflammation, and digestive heat.",
    recommendations: [
      "Avoid excessively spicy, acidic, or fried foods.",
      "Seek cool environments, nature, and walks by water.",
      "Avoid overworking and excessive competitiveness.",
    ],
  },
  kapha: {
    title: "Kapha",
    element: "Earth & Water 💧",
    icon: Droplets,
    color: "#AD7B3A",
    bg: "rgba(173, 123, 58, 0.12)",
    traits: "Stability, compassion, endurance, tranquility.",
    description: "You are driven by the principle of structure and lubrication. You have a big heart, strong immunity, and deep patience. In balance, you bring harmony and grounding. Out of balance, you may experience lethargy, weight gain, and resistance to change.",
    recommendations: [
      "Focus on light, warm, spicy, and bitter foods.",
      "Engage in regular, dynamic cardio exercise.",
      "Wake up early (before 6:00 AM) and avoid daytime naps.",
    ],
  },
};

export default function Ayurveda() {
  const { colors, setPage, user, setUser } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<{ vata: number; pitta: number; kapha: number }>({
    vata: 0,
    pitta: 0,
    kapha: 0,
  });
  const [completed, setCompleted] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const savedAyurveda = user?.ayurveda || (user as any)?.ayurvedic;
  const hasSavedResult = Boolean(savedAyurveda && (savedAyurveda.dominantDosha || savedAyurveda.scores));
  const showSavedResult = hasSavedResult && !isRetaking && !completed;

  const currentScores = showSavedResult && savedAyurveda?.scores
    ? savedAyurveda.scores
    : scores;

  const getDominantDoshaFromScores = (s: { vata: number; pitta: number; kapha: number }): DoshaType => {
    if (s.vata >= s.pitta && s.vata >= s.kapha) return 'vata';
    if (s.pitta >= s.vata && s.pitta >= s.kapha) return 'pitta';
    return 'kapha';
  };

  const dominantKey: DoshaType = showSavedResult && savedAyurveda?.dominantDosha
    ? (savedAyurveda.dominantDosha.toLowerCase() as DoshaType)
    : getDominantDoshaFromScores(currentScores);

  const dominant = DOSHA_DETAILS[dominantKey] || DOSHA_DETAILS.vata;
  const IconComponent = dominant.icon;

  const scoreSum = (currentScores.vata || 0) + (currentScores.pitta || 0) + (currentScores.kapha || 0) || AYURVEDA_QUESTIONS.length;
  const vataPct = Math.round(((currentScores.vata || 0) / scoreSum) * 100);
  const pittaPct = Math.round(((currentScores.pitta || 0) / scoreSum) * 100);
  const kaphaPct = Math.round(((currentScores.kapha || 0) / scoreSum) * 100);

  const handleFinishAndSync = async (finalScores: { vata: number; pitta: number; kapha: number }) => {
    setCompleted(true);
    setIsRetaking(false);

    if (!user || !user.email) {
      setSyncStatus('No active user session!');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Syncing with MongoDB Atlas...');

    const dominantDosha = getDominantDoshaFromScores(finalScores);

    const updatedUser: UserProfile = {
      ...user,
      ayurveda: {
        dominantDosha,
        scores: finalScores,
      },
    };

    try {
      await setUser(updatedUser);
      await saveUserProfile(updatedUser);
      setSyncStatus('Ayurvedic constitution saved to database!');
    } catch (error) {
      console.warn('Offline mode: Result saved locally.', error);
      setSyncStatus('Saved locally on device.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectOption = (dosha: DoshaType) => {
    const updatedScores = { ...scores, [dosha]: scores[dosha] + 1 };
    setScores(updatedScores);

    if (currentIndex + 1 < AYURVEDA_QUESTIONS.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinishAndSync(updatedScores);
    }
  };

  const handleRetake = () => {
    setScores({ vata: 0, pitta: 0, kapha: 0 });
    setCurrentIndex(0);
    setCompleted(false);
    setIsRetaking(true);
    setSyncStatus(null);
  };

  const total = AYURVEDA_QUESTIONS.length;
  const currentQ = AYURVEDA_QUESTIONS[currentIndex];

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
        eyebrow="AYURVEDA DOSHA DIAGNOSTICS"
        first="Your"
        accent="Ayurvedic Constitution."
        description="Discover your natural balance between Vata, Pitta, and Kapha energies."
      />

      {showSavedResult || completed ? (
        <View style={{ gap: 20, marginBottom: 40 }}>
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

          <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 14 }}>
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 24,
                backgroundColor: dominant.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconComponent size={38} color={dominant.color} />
            </View>

            <View style={{ alignItems: 'center', gap: 4 }}>
              <T muted size={11} style={{ letterSpacing: 1.5 }}>
                DOMINANT PRAKRITI ENERGY ({user?.name || 'User'})
              </T>
              <T bold size={26} style={{ color: dominant.color }}>
                {dominant.title}
              </T>
              <Pill>{dominant.element}</Pill>
            </View>

            <T muted size={13} style={{ textAlign: 'center', lineHeight: 21, paddingHorizontal: 10 }}>
              {dominant.description}
            </T>
          </Card>

          <Section>Energy Distribution</Section>
          <Card style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={13} style={{ color: DOSHA_DETAILS.vata.color }}>
                  Vata — Air & Ether
                </T>
                <T bold size={13}>{vataPct}%</T>
              </View>
              <View style={{ height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${vataPct}%`, backgroundColor: DOSHA_DETAILS.vata.color }} />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={13} style={{ color: DOSHA_DETAILS.pitta.color }}>
                  Pitta — Fire & Water
                </T>
                <T bold size={13}>{pittaPct}%</T>
              </View>
              <View style={{ height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${pittaPct}%`, backgroundColor: DOSHA_DETAILS.pitta.color }} />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={13} style={{ color: DOSHA_DETAILS.kapha.color }}>
                  Kapha — Earth & Water
                </T>
                <T bold size={13}>{kaphaPct}%</T>
              </View>
              <View style={{ height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${kaphaPct}%`, backgroundColor: DOSHA_DETAILS.kapha.color }} />
              </View>
            </View>
          </Card>

          <Section>Ayurvedic Recommendations</Section>
          <Card style={{ gap: 12 }}>
            <T bold size={15} style={{ color: colors.text }}>
              How to maintain your balance:
            </T>
            {dominant.recommendations.map((rec, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <CheckCircle2 size={16} color={dominant.color} style={{ marginTop: 2 }} />
                <T muted size={13} style={{ flex: 1, lineHeight: 19 }}>
                  {rec}
                </T>
              </View>
            ))}
          </Card>

          <Pill selected onPress={handleRetake} style={{ alignSelf: 'center', marginTop: 10 }}>
            <RotateCcw size={14} color="#FFF" style={{ marginRight: 6 }} /> Retake Test
          </Pill>
        </View>
      ) : (
        <View style={{ gap: 16, marginBottom: 40 }}>
          <Card style={{ paddingVertical: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <T bold size={11} style={{ color: colors.purple, letterSpacing: 1 }}>
                {currentQ.category}
              </T>
              <T muted size={11}>
                Question {currentIndex + 1} of {total}
              </T>
            </View>
            <View
              style={{
                height: 6,
                backgroundColor: colors.surfaceAlt,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${((currentIndex + 1) / total) * 100}%`,
                  backgroundColor: colors.purple,
                  borderRadius: 3,
                }}
              />
            </View>
          </Card>

          <Card style={{ gap: 16, paddingVertical: 20 }}>
            <T bold size={17} style={{ lineHeight: 24 }}>
              {currentQ.question}
            </T>

            <View style={{ gap: 10 }}>
              {currentQ.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => handleSelectOption(opt.dosha)}
                  style={{
                    backgroundColor: colors.surfaceAlt,
                    padding: 16,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <T size={14} style={{ lineHeight: 20 }}>
                    {opt.label}
                  </T>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>
      )}
    </>
  );
}