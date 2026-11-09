import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, Sparkles, RotateCcw, Wind, Flame, Droplets, CheckCircle2 } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero } from '../components/UI';

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
    category: "ФИЗИКА И ГРАДЕЖ",
    question: "Как бихте описали вашата физическа структура и костна система?",
    options: [
      { label: "Фина, слаба, лека конструкция; трудно качвам килограми.", dosha: 'vata' },
      { label: "Средно устройство, атлетично, мускулесто; лесно поддържам тегло.", dosha: 'pitta' },
      { label: "Едра, здрава и широка костна структура; лесно качвам килограми.", dosha: 'kapha' },
    ],
  },
  {
    id: 2,
    category: "КОЖА И КОСА",
    question: "Какво е типичното състояние на вашата кожа и коса?",
    options: [
      { label: "Суха, тънка или хладна кожа; чуплива, суха коса.", dosha: 'vata' },
      { label: "Топла, чувствителна или склонна към зачервяване кожа; права, тънка коса.", dosha: 'pitta' },
      { label: "Гладка, мека и влажна кожа; гъста, плътна и бляскава коса.", dosha: 'kapha' },
    ],
  },
  {
    id: 3,
    category: "МЕТАБОЛИЗЪМ И АПЕТИТ",
    question: "Как реагира вашата храносмилателна система?",
    options: [
      { label: "Променлив апетит и газове; понякога забравям да ям.", dosha: 'vata' },
      { label: "Силно храносмилане и силен апетит; ставам раздразнителен, ако огладнея.", dosha: 'pitta' },
      { label: "Бавен метаболизъм; обичам да хапвам, но мога да пропускам хранения.", dosha: 'kapha' },
    ],
  },
  {
    id: 4,
    category: "УМ И ТЕМПЕРАМЕНТ",
    question: "Как възприемате нова информация и как работи умът ви?",
    options: [
      { label: "Уча изключително бързо, но и бързо забравям; бърз и творчески ум.", dosha: 'vata' },
      { label: "Остър, аналитичен, фокусиран и организиран ум; добра памет.", dosha: 'pitta' },
      { label: "Уча методично и по-бавно, но имам дълбока, устойчива памет.", dosha: 'kapha' },
    ],
  },
  {
    id: 5,
    category: "СЪН И ПОЧИВКА",
    question: "Какъв е характерът на вашия сън?",
    options: [
      { label: "Повърхностен, лек, с чести събуждания или безсъние.", dosha: 'vata' },
      { label: "Умерено дълбок, кратък, но възстановяващ; събуждам се свеж.", dosha: 'pitta' },
      { label: "Дълбок, тежък и продължителен; трудно се събуждам сутрин.", dosha: 'kapha' },
    ],
  },
  {
    id: 6,
    category: "РЕАКЦИЯ ПРИ СТРЕС",
    question: "Как реагирате, когато сте под напрежение?",
    options: [
      { label: "Изпитвам безпокойство, тревожност, страх или объркване.", dosha: 'vata' },
      { label: "Ставам критичен, гневна, раздразнителен или доминиращ.", dosha: 'pitta' },
      { label: "Затварям се в себе си, ставам инертен, бавен или упрям.", dosha: 'kapha' },
    ],
  },
  {
    id: 7,
    category: "КЛИМАТИЧНИ ПРЕДПОЧИТАНИЯ",
    question: "Кое време и температура понасяте най-трудно?",
    options: [
      { label: "Мразя студа и вятъра; обичам топлина и слънце.", dosha: 'vata' },
      { label: "Мразя жегата и горещото слънце; предпочитам прохлада.", dosha: 'pitta' },
      { label: "Мразя влажното и студено време; предпочитам сухо и топло.", dosha: 'kapha' },
    ],
  },
  {
    id: 8,
    category: "ТЕМП НА ДЕЙСТВИЕ",
    question: "Какъв е вашият ежедневен ритъм на движение и разговор?",
    options: [
      { label: "Бърз, импулсивен, енергичен; постоянно съм в движение.", dosha: 'vata' },
      { label: "Целенасочен, ефективен, точен и тона ми е убедителен.", dosha: 'pitta' },
      { label: "Плавен, спокоен, умерено бавен и стабилен.", dosha: 'kapha' },
    ],
  },
];

const DOSHA_DETAILS = {
  vata: {
    title: "Вата (Vata)",
    element: "Въздух & Етер 💨",
    icon: Wind,
    color: "#7653AD",
    bg: "rgba(118, 83, 173, 0.12)",
    traits: "Креативност, бързина, гъвкавост, артистичност.",
    description: "Вие сте задвижвани от принципа на движението. Имате жив ум, богата фантазия и ентусиазъм. Когато сте в баланс, сте изключително вдъхновяващи. При дисбаланс сте склонни към безпокойство, суха кожа и безсъние.",
    recommendations: [
      "Консумирайте топла, маслена и сготвена храна.",
      "Спазвайте строг дневен режим за сън и хранене.",
      "Практикувайте успокояващи медитации и топла самомасаж (Абянга).",
    ],
  },
  pitta: {
    title: "Пита (Pitta)",
    element: "Огън & Вода 💥",
    icon: Flame,
    color: "#E65B63",
    bg: "rgba(230, 91, 99, 0.12)",
    traits: "Интелект, лидерство, решителност, организираност.",
    description: "Вие сте задвижвани от принципа на трансформацията и метаболизма. Имате ясен ум, остър аналитичен дух и естествена амбиция. При баланс сте отлични лидери. При дисбаланс сте склонни към гняв, зачервявания и киселини.",
    recommendations: [
      "Избягвайте прекалено люти, кисели и мазни храни.",
      "Търсете прохлада, природа и разходки край вода.",
      "Не прекалявайте с работохолизма и състезателния дух.",
    ],
  },
  kapha: {
    title: "Кафа (Kapha)",
    element: "Земя & Вода 💧",
    icon: Droplets,
    color: "#AD7B3A",
    bg: "rgba(173, 123, 58, 0.12)",
    traits: "Стабилност, състрадание, издръжливост, спокойствие.",
    description: "Вие сте задвижвани от принципа на структурата и смазването. Имате голямо сърце, силен имунитет и дълбоко търпение. При баланс носите хармония и сигурност. При дисбаланс сте склонни към мудност, задържане на тегло и инерция.",
    recommendations: [
      "Наблягайте на лека, топла, пикантна и горчива храна.",
      "Включете редовни, динамични кардио тренировки.",
      "Ставайте рано (преди 6:00 ч.) и избягвайте следобедния сън.",
    ],
  },
};

export default function Ayurveda() {
  const { colors, setPage } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<{ vata: number; pitta: number; kapha: number }>({
    vata: 0,
    pitta: 0,
    kapha: 0,
  });
  const [completed, setCompleted] = useState(false);

  const handleSelectOption = (dosha: DoshaType) => {
    const updatedScores = { ...scores, [dosha]: scores[dosha] + 1 };
    setScores(updatedScores);

    if (currentIndex + 1 < AYURVEDA_QUESTIONS.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleReset = () => {
    setScores({ vata: 0, pitta: 0, kapha: 0 });
    setCurrentIndex(0);
    setCompleted(false);
  };

  const total = AYURVEDA_QUESTIONS.length;
  const currentQ = AYURVEDA_QUESTIONS[currentIndex];

  // Изчисление на водещата Доша
  const getDominantDosha = (): DoshaType => {
    const { vata, pitta, kapha } = scores;
    if (vata >= pitta && vata >= kapha) return 'vata';
    if (pitta >= vata && pitta >= kapha) return 'pitta';
    return 'kapha';
  };

  const dominantKey = getDominantDosha();
  const dominant = DOSHA_DETAILS[dominantKey];
  const IconComponent = dominant.icon;

  const vataPct = Math.round((scores.vata / total) * 100);
  const pittaPct = Math.round((scores.pitta / total) * 100);
  const kaphaPct = Math.round((scores.kapha / total) * 100);

  return (
    <>
      <TouchableOpacity
        onPress={() => setPage('explore')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
      >
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Назад към Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="AYURVEDA DOSHA DIAGNOSTICS"
        first="Вашата"
        accent="Аюрведа Конституция."
        description="Открийте своя роден баланс между кардиналните енергии Вата, Пита и Кафа."
      />

      {!completed ? (
        <View style={{ gap: 16, marginBottom: 40 }}>
          {/* Прогрес бар */}
          <Card style={{ paddingVertical: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <T bold size={11} style={{ color: colors.purple, letterSpacing: 1 }}>
                {currentQ.category}
              </T>
              <T muted size={11}>
                Въпрос {currentIndex + 1} от {total}
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

          {/* Карта с въпрос */}
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
      ) : (
        /* Резултати */
        <View style={{ gap: 20, marginBottom: 40 }}>
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
                ДОМИНИРАЩА ПРАКРИТИ ЕНЕРГИЯ
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

          {/* Графичен баланс на 3-те Доши */}
          <Section>Разпределение на енергиите</Section>
          <Card style={{ gap: 14 }}>
            {/* Вата */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={13} style={{ color: DOSHA_DETAILS.vata.color }}>
                  Вата (Vata) — Воздух
                </T>
                <T bold size={13}>{vataPct}%</T>
              </View>
              <View style={{ height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${vataPct}%`, backgroundColor: DOSHA_DETAILS.vata.color }} />
              </View>
            </View>

            {/* Пита */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={13} style={{ color: DOSHA_DETAILS.pitta.color }}>
                  Пита (Pitta) — Огън
                </T>
                <T bold size={13}>{pittaPct}%</T>
              </View>
              <View style={{ height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${pittaPct}%`, backgroundColor: DOSHA_DETAILS.pitta.color }} />
              </View>
            </View>

            {/* Кафа */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={13} style={{ color: DOSHA_DETAILS.kapha.color }}>
                  Кафа (Kapha) — Земя
                </T>
                <T bold size={13}>{kaphaPct}%</T>
              </View>
              <View style={{ height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${kaphaPct}%`, backgroundColor: DOSHA_DETAILS.kapha.color }} />
              </View>
            </View>
          </Card>

          {/* Препоръки за баланс */}
          <Section>Аюрведични Препоръки</Section>
          <Card style={{ gap: 12 }}>
            <T bold size={15} style={{ color: colors.text }}>
              Как да поддържате своя хармония:
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

          <Pill selected onPress={handleReset} style={{ alignSelf: 'center', marginTop: 10 }}>
            <RotateCcw size={14} color="#FFF" style={{ marginRight: 6 }} /> Повтори теста
          </Pill>
        </View>
      )}
    </>
  );
}