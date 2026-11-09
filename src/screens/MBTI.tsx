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
import { TestResult, useSubmitTest, useTest } from '../api/hooks';

// The 40 questions now live in the database (backend/db/seeds/02_mbti_bg.sql)
// and are scored on the server, so results can't be changed from the app.

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
  const test = useTest('mbti', 'bg');
  const submit = useSubmitTest('mbti');
  const questions = test.data?.questions ?? [];

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const totalPages = Math.max(1, Math.ceil(questions.length / ITEMS_PER_PAGE));
  const currentQuestions = questions.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleSelect = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Scoring happens on the server; this only shapes its answer for the result screen.
  const toDisplay = (r: TestResult) => {
    const ratio = (d: keyof TestResult['dimensions']) => ({
      first: r.dimensions[d].pct,
      second: 100 - r.dimensions[d].pct,
    });
    return {
      type: r.type,
      details: TYPE_DESCRIPTIONS[r.type] || TYPE_DESCRIPTIONS.INFP,
      ratios: { EI: ratio('EI'), SN: ratio('SN'), TF: ratio('TF'), JP: ratio('JP') },
    };
  };

  const finish = () => {
    if (!test.data || submit.isPending) return;
    submit.mutate(
      {
        testId: test.data.id,
        answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
      },
      { onSuccess: () => setIsFinished(true) }
    );
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

      {test.isLoading ? (
        <Card>
          <T muted size={13}>Зареждане на въпросите…</T>
        </Card>
      ) : test.isError || !test.data ? (
        <Card style={{ gap: 10 }}>
          <T bold size={14}>Въпросите не могат да се заредят</T>
          <T muted size={12}>Проверете дали API сървърът работи (backend: npm run dev).</T>
          <Pill onPress={() => test.refetch()}>Опитай отново</Pill>
        </Card>
      ) : !isFinished ? (
        <>
          {/* Индикатор за Прогрес */}
          <Card style={{ marginBottom: 18, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T bold size={13}>
                Прогрес: {answeredCount} от {questions.length} въпроса
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
                        {q.position}
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

          {submit.isError && (
            <T muted size={12} style={{ marginTop: 14 }}>
              Резултатът не можа да се изчисли: {submit.error?.message}
            </T>
          )}

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
                selected={answeredCount === questions.length}
                onPress={() => {
                  if (answeredCount === questions.length) {
                    finish();
                  } else {
                    alert('Моля, отговорете на всички 40 въпроса, за да видите резултата!');
                  }
                }}
              >
                {submit.isPending ? 'Изчисляване…' : '✦ Завърши и виж резултата'}
              </Pill>
            )}
          </View>
        </>
      ) : (
        /* РЕЗУЛТАТЕН ЕКРАН ПРИ ЗАВЪРШВАНЕ (PLACEHOLDERS И КАРТИ) */
        (() => {
          if (!submit.data) return null;
          const res = toDisplay(submit.data);
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
                    submit.reset();
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