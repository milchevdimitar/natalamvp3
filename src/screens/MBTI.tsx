import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Zap,
  Heart,
  Compass,
  Layers,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero, Progress } from '../components/UI';

// 40 MBTI въпроса
interface Question {
  id: number;
  text: string;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  direction: 1 | -1; // 1 = към първата буква (E, S, T, J), -1 = към втората (I, N, F, P)
}

const QUESTIONS: Question[] = [
  // E vs I (1-10)
  { id: 1, text: 'Зареждате се с енергия, когато прекарвате време сред много хора.', dimension: 'EI', direction: 1 },
  { id: 2, text: 'Предчитате спокойна среда у дома пред шумно парти.', dimension: 'EI', direction: -1 },
  { id: 3, text: 'Обичате да започвате разговори с нови и непознати хора.', dimension: 'EI', direction: 1 },
  { id: 4, text: 'Често се чувствате изцедени след продължително общуване.', dimension: 'EI', direction: -1 },
  { id: 5, text: 'Лесно изразявате мислите си гласно в група.', dimension: 'EI', direction: 1 },
  { id: 6, text: 'Предпочитате няколко много близки приятели пред широк кръг познати.', dimension: 'EI', direction: -1 },
  { id: 7, text: 'Вълнуват ви социални събития и динамични срещи.', dimension: 'EI', direction: 1 },
  { id: 8, text: 'Нуждаете се от време насаме, за да презаредите след дълъг ден.', dimension: 'EI', direction: -1 },
  { id: 9, text: 'Действате бързо и спонтанно в социални ситуации.', dimension: 'EI', direction: 1 },
  { id: 10, text: 'Предпочитате писмената комуникация пред телефонните разговори.', dimension: 'EI', direction: -1 },

  // S vs N (11-20)
  { id: 11, text: 'Фокусирате се повече върху конкретните факти, отколкото върху абстрактни теории.', dimension: 'SN', direction: 1 },
  { id: 12, text: 'Често се увличате в мечти и теории за бъдещето.', dimension: 'SN', direction: -1 },
  { id: 13, text: 'Доверявате се на практическия си опит повече, отколкото на интуицията.', dimension: 'SN', direction: 1 },
  { id: 14, text: 'Вълнуват ви скритите значения и символиката зад нещата.', dimension: 'SN', direction: -1 },
  { id: 15, text: 'Предпочитате ясно дефинирани инструкции стъпка по стъпка.', dimension: 'SN', direction: 1 },
  { id: 16, text: 'Обичате да търсите нови, нестандартни начини за решаване на познати проблеми.', dimension: 'SN', direction: -1 },
  { id: 17, text: 'Забелязвате детайли в средата си, които другите изпускат.', dimension: 'SN', direction: 1 },
  { id: 18, text: 'Интересувате се повече от големи идеи, отколкото от детайлното им изпълнение.', dimension: 'SN', direction: -1 },
  { id: 19, text: 'Смятате се за реалист с практичен поглед над живота.', dimension: 'SN', direction: 1 },
  { id: 20, text: 'Често имате силни интуитивни прозрения, които се оказват верни.', dimension: 'SN', direction: -1 },

  // T vs F (21-30)
  { id: 21, text: 'При вземане на решение разчитате предимно на логика и обективен анализ.', dimension: 'TF', direction: 1 },
  { id: 22, text: 'За вас е по-важно да запазите хармонията и чувствата на хората.', dimension: 'TF', direction: -1 },
  { id: 23, text: 'Смятате, че истината е по-важна от това да спестите нечии чувства.', dimension: 'TF', direction: 1 },
  { id: 24, text: 'Лесно се съпреживявате с емоциите и преживяванията на другите.', dimension: 'TF', direction: -1 },
  { id: 25, text: 'Оценявате ситуациите отстрани, без да влагате лични емоции.', dimension: 'TF', direction: 1 },
  { id: 26, text: 'Често вземате решения въз основа на личните си ценности и морал.', dimension: 'TF', direction: -1 },
  { id: 27, text: 'Конструктивната критика трябва да бъде директна, дори да е болезнена.', dimension: 'TF', direction: 1 },
  { id: 28, text: 'Винаги се съобразявате с това как решенията ви ще повлияят на околните.', dimension: 'TF', direction: -1 },
  { id: 29, text: 'Убеждавате с факти и аргументи, а не с емоционални апели.', dimension: 'TF', direction: 1 },
  { id: 30, text: 'Съчувствието и прошката са по-важни от строгата справедливост.', dimension: 'TF', direction: -1 },

  // J vs P (31-40)
  { id: 31, text: 'Обичате да имате ясен график и планирани задачи за деня.', dimension: 'JP', direction: 1 },
  { id: 32, text: 'Предпочитате да оставяте възможностите отворени и да действате според ситуацията.', dimension: 'JP', direction: -1 },
  { id: 33, text: 'Приключвате задачите си много преди крайния срок.', dimension: 'JP', direction: 1 },
  { id: 34, text: 'Работите най-добре под прилив на вдъхновение в последния момент.', dimension: 'JP', direction: -1 },
  { id: 35, text: 'Чувствате се спокойни, когато всичко е подредено и организирано.', dimension: 'JP', direction: 1 },
  { id: 36, text: 'Импровизацията е една от най-силните ви страни.', dimension: 'JP', direction: -1 },
  { id: 37, text: 'Планирате почивките и пътуванията си детайлно предварително.', dimension: 'JP', direction: 1 },
  { id: 38, text: 'Дразните се от прекалено строги правила и стриктни рамки.', dimension: 'JP', direction: -1 },
  { id: 39, text: 'Винаги следвате ясна система и структура в работата си.', dimension: 'JP', direction: 1 },
  { id: 40, text: 'Лесно променяте плановете си в движение без стрес.', dimension: 'JP', direction: -1 },
];

const TYPE_DESCRIPTIONS: Record<string, { title: string; subtitle: string; desc: string; traits: string[] }> = {
  INFP: { title: "Медиаторът", subtitle: "Поетичен, мил и алтруистичен дух", desc: "Вие сте идеалисти, водени от дълбоки лични ценности и желание за автентичност.", traits: ["Емпатичност", "Креативност", "Идеализъм", "Гъвкавост"] },
  INFJ: { title: "Адвокатът", subtitle: "Тих и мистичен, но вдъхновяващ идеалист", desc: "Притежавате рядък баланс от визионерска интуиция и решителност за промяна.", traits: ["Интуиция", "Целеустременост", "Дълбочина", "Принципност"] },
  INTJ: { title: "Архитектът", subtitle: "Стратегически мислител с план за всичко", desc: "Вие сте независими, аналитични и преследвате знанието и логическата съвършеност.", traits: ["Стратегия", "Независимост", "Логика", "Визия"] },
  INTP: { title: "Логикът", subtitle: "Иновативен изобретател с жажда за знание", desc: "Обичате теорията, деконструирането на идеи и търсенето на универсални истини.", traits: ["Аналитичност", "Оригиналност", "Отворено съзнание", "Любопитство"] },
  ENFP: { title: "Борецът", subtitle: "Ентусиазиран, креативен и свободен дух", desc: "Зареждате хората около себе си с позитивизъм, нови идеи и топлота.", traits: ["Ентусиазъм", "Харизма", "Въображение", "Спонтанност"] },
  ENFJ: { title: "Протагонистът", subtitle: "Харизматичен и вдъхновяващ лидер", desc: "Имате вродена дарба да виждате потенциала у другите и да ги обединявате.", traits: ["Лидерство", "Емпатия", "Организираност", "Вдъхновение"] },
  ENTJ: { title: "Командирът", subtitle: "Смел и решителен стратегически лидер", desc: "Вие намирате пътища там, където другите виждат пречки, и постигате големи цели.", traits: ["Решителност", "Стратегичност", "Ефективност", "Увереност"] },
  ENTP: { title: "Дебаторът", subtitle: "Умен и любопитен мислител, обичащ предизвикателствата", desc: "Вие сте майстори на интелектуалния дебат и откриването на нови перспективи.", traits: ["Бърз ум", "Иновативност", "Енергичност", "Неконфорпност"] },
  ISTJ: { title: "Logician / Администратор", subtitle: "Практичен и фактологичен човек с висока надеждност", desc: "Цъните традицията, реда, точността и поемането на лична отговорност.", traits: ["Надеждност", "Организираност", "Честност", "Практичност"] },
  ISFJ: { title: "Защитникът", subtitle: "Покровителствен и отдаден защитник", desc: "Вие сте топли, грижовни и винаги готови да защитите любимите си хора.", traits: ["Лоялност", "Грижовност", "Търпение", "Подкрепа"] },
  ESTJ: { title: "Мениджърът", subtitle: "Отличен администратор с практичен усет", desc: "Организирате проекти и хора с традиция, стабилност и ясни правила.", traits: ["Твърдост", "Организация", "Лидерство", "Логика"] },
  ESFJ: { title: "Консулът", subtitle: "Изключително грижовен и социален човек", desc: "За вас хармонията в общността и подкрепата на близките са на първо място.", traits: ["Социалност", "Топлота", "Дълг", "Хармония"] },
  ISTP: { title: "Виртуозът", subtitle: "Дръзки и практични експериментатори", desc: "Обичате да изследвате света с ръцете и ума си, майстори на инструментите.", traits: ["Практичност", "Спокойствие", "Спопонтанност", "Решение на проблеми"] },
  ISFP: { title: "Приключенецът", subtitle: "Гъвкави и очарователни артисти", desc: "Живеете в настоящето и изразявате себе си чрез естетика, свобода и доброта.", traits: ["Артистичност", "Страст", "Свобода", "Емпатия"] },
  ESTP: { title: "Предприемачът", subtitle: "Умни, енергични и възприемчиви хора", desc: "Обичате рисковете, динамиката и бързите практически действия тук и сега.", traits: ["Дръзкост", "Възприемчивост", "Динамика", "Практичност"] },
  ESFP: { title: "Аниматорът", subtitle: "Спонтанни, ентусиазирани и жизнени хора", desc: "Обичате живота, забавлението и споделянето на радостни моменти с околните.", traits: ["Жизнерадост", "Ентусиазъм", "Естетика", "Приятелство"] }
};

const ITEMS_PER_PAGE = 5;

export default function MBTI() {
  const { colors, setPage } = useApp();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const totalPages = Math.ceil(QUESTIONS.length / ITEMS_PER_PAGE);
  const currentQuestions = QUESTIONS.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / QUESTIONS.length) * 100);

  const handleSelect = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateResult = () => {
    let scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    QUESTIONS.forEach((q) => {
      const val = answers[q.id] || 4; // 1 to 7 scale
      const scoreWeight = val - 4; // range: -3 to +3

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

    return {
      type,
      details: TYPE_DESCRIPTIONS[type] || TYPE_DESCRIPTIONS.INFP,
      ratios: {
        EI: getPct(scores.E, scores.I),
        SN: getPct(scores.S, scores.N),
        TF: getPct(scores.T, scores.F),
        JP: getPct(scores.J, scores.P),
      },
    };
  };

  const isPageComplete = currentQuestions.every((q) => answers[q.id] !== undefined);

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
        eyebrow="YOUR PERSONALITY ATLAS · MBTI"
        first="Открийте своя"
        accent="вътрешен тип."
        description="40 въпроса с 7-степенна скала за оценка на вашите когнитивни предпочитания."
      />

      {!isFinished ? (
        <>
          {/* Индикатор за Прогрес */}
          <Card style={{ marginBottom: 18, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T bold size={13}>
                Прогрес: {answeredCount} от {QUESTIONS.length} въпроса
              </T>
              <T bold size={12} style={{ color: colors.purple }}>
                {progressPercent}%
              </T>
            </View>
            <Progress value={progressPercent} color={colors.purple} />
            <T muted size={11}>
              Страница {currentPage + 1} от {totalPages}
            </T>
          </Card>

          {/* Въпроси */}
          <View style={{ gap: 14 }}>
            {currentQuestions.map((q, idx) => {
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

                  {/* Likert Scale (7 точки) */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                      <T muted size={10}>
                        Несъгласен
                      </T>
                      <T muted size={10}>
                        Неутрален
                      </T>
                      <T muted size={10}>
                        Съгласен
                      </T>
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
                        // Различни размери на кръгчетата за градиентов акцент (1 и 7 са най-големи, 4 е най-малко)
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

          {/* Навигация на страниците */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 40 }}>
            {currentPage > 0 ? (
              <Pill onPress={() => setCurrentPage((p) => p - 1)}>
                ← Предишни
              </Pill>
            ) : <View />}

            {currentPage < totalPages - 1 ? (
              <Pill
                selected={isPageComplete}
                onPress={() => {
                  if (isPageComplete) {
                    setCurrentPage((p) => p + 1);
                  } else {
                    alert('Моля, отговорете на всички въпроси от тази страница!');
                  }
                }}
              >
                Следващи →
              </Pill>
            ) : (
              <Pill
                selected={answeredCount === QUESTIONS.length}
                onPress={() => {
                  if (answeredCount === QUESTIONS.length) {
                    setIsFinished(true);
                  } else {
                    alert('Моля, отговорете на всички 40 въпроса, за да видите резултата!');
                  }
                }}
              >
                ✦ Завърши и виж резултата
              </Pill>
            )}
          </View>
        </>
      ) : (
        /* РЕЗУЛТАТЕН ЕКРАН ПРИ ЗАВЪРШВАНЕ (PLACEHOLDERS И КАРТИ) */
        (() => {
          const res = calculateResult();
          return (
            <View style={{ gap: 18, marginBottom: 40 }}>
              {/* Главен Placeholder за Резултат */}
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
                  ВАШИЯТ ЛИЧНОСТЕН ТИП
                </T>
                <T bold size={36} style={{ color: colors.purple, letterSpacing: -1 }}>
                  {res.type}
                </T>
                <T bold size={20}>
                  {res.details.title}
                </T>
                <T muted size={13} style={{ textAlign: 'center', maxWidth: 320 }}>
                  {res.details.subtitle}
                </T>
              </Card>

              {/* Описание Placeholder */}
              <Card style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color={colors.gold} />
                  <T bold size={15}>
                    Същност на типа
                  </T>
                </View>
                <T muted size={13} style={{ lineHeight: 20 }}>
                  {res.details.desc}
                </T>
              </Card>

              {/* Процентен Баланс по Дихотомии (Placeholders) */}
              <Section>Когнитивен Баланс</Section>

              <Card style={{ gap: 14 }}>
                {/* E vs I */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T bold size={12}>
                      Екстраверсия (E) {res.ratios.EI.first}%
                    </T>
                    <T bold size={12}>
                      {res.ratios.EI.second}% Интроверсия (I)
                    </T>
                  </View>
                  <Progress value={res.ratios.EI.first} color={colors.purple} />
                </View>

                {/* S vs N */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T bold size={12}>
                      Сетивност (S) {res.ratios.SN.first}%
                    </T>
                    <T bold size={12}>
                      {res.ratios.SN.second}% Интуиция (N)
                    </T>
                  </View>
                  <Progress value={res.ratios.SN.first} color={colors.gold} />
                </View>

                {/* T vs F */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T bold size={12}>
                      Мислене (T) {res.ratios.TF.first}%
                    </T>
                    <T bold size={12}>
                      {res.ratios.TF.second}% Чувстване (F)
                    </T>
                  </View>
                  <Progress value={res.ratios.TF.first} color={colors.purple} />
                </View>

                {/* J vs P */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T bold size={12}>
                      Съдене (J) {res.ratios.JP.first}%
                    </T>
                    <T bold size={12}>
                      {res.ratios.JP.second}% Възприемане (P)
                    </T>
                  </View>
                  <Progress value={res.ratios.JP.first} color={colors.gold} />
                </View>
              </Card>

              {/* Ключови качества - Placeholders в 2 колони */}
              <Section>Водещи Черти</Section>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {res.details.traits.map((trait, i) => (
                  <Card key={i} style={{ width: '48%', alignItems: 'center', paddingVertical: 14, gap: 6 }}>
                    <CheckCircle2 size={20} color={colors.purple} />
                    <T bold size={13}>
                      {trait}
                    </T>
                  </Card>
                ))}
              </View>

              {/* Бутони за рестарт / връщане */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Pill
                  onPress={() => {
                    setAnswers({});
                    setCurrentPage(0);
                    setIsFinished(false);
                  }}
                >
                  <RotateCcw size={14} color={colors.purple} /> Направи отново
                </Pill>
                <Pill selected onPress={() => setPage('explore')}>
                  Към Explore ↗
                </Pill>
              </View>
            </View>
          );
        })()
      )}
    </>
  );
}