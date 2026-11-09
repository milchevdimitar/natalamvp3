import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Hash,
  Compass,
  Award,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero } from '../components/UI';

interface LifePathInfo {
  title: string;
  subtitle: string;
  description: string;
  traits: string[];
  challenge: string;
}

const LIFE_PATH_DATA: Record<number, LifePathInfo> = {
  1: {
    title: "Лидерът & Пионерът",
    subtitle: "Независимост, новаторство и силна воля",
    description: "Вие сте роден пионер. Вашата цел в живота е да проправяте нови пътища, да поемате инициатива и да разчитате на собствената си индивидуалност.",
    traits: ["Амбиция", "Независимост", "Лидерство", "Оригиналност"],
    challenge: "Преодоляване на инат и усвояване на умението да работите в екип.",
  },
  2: {
    title: "Дипломатът & Миротворецът",
    subtitle: "Хармония, интуиция и сътрудничество",
    description: "Вие сте естествен посредник и създател на хармония. Притежавате изключителна чувствителност към емоциите на другите.",
    traits: ["Емпатия", "Дипломатичност", "Интуиция", "Търпение"],
    challenge: "Изграждане на самочувствие и поставяне на здрави лични граници.",
  },
  3: {
    title: "Творецът & Комуникаторът",
    subtitle: "Креативност, себеизразяване и оптимизъм",
    description: "Вие носите радост и вдъхновение. Вашата мисия е да изразявате себе си чрез изкуство, думи, идеи и позитивна енергия.",
    traits: ["Харизма", "Въображение", "Оптимизъм", "Общителност"],
    challenge: "Фокусиране на енергията и избягване на разсеяността.",
  },
  4: {
    title: "Строителят & Организаторът",
    subtitle: "Стабилност, труд и надеждност",
    description: "Вие сте основата на всяко успешно начинание. Вашето число символизира ред, практичност, сигурност и изграждане на трайни неща.",
    traits: ["Дисциплина", "Лоялност", "Организираност", "Реализъм"],
    challenge: "Преодоляване на страха от промяна и гъвкавост в мисленето.",
  },
  5: {
    title: "Изследователят & Свободният дух",
    subtitle: "Свобода, динамика и приключения",
    description: "Вие обичате промяната и разнообразието. Животът за вас е приключение, изпълнено с нови преживявания, пътувания и трансформация.",
    traits: ["Гъвкавост", "Свободолюбие", "Адаптивност", "Енергичност"],
    challenge: "Поддържане на фокус и избягване на импулсивни решения.",
  },
  6: {
    title: "Пазителят & Учителят",
    subtitle: "Грижа, отговорност и любов към семейството",
    description: "Вие сте стълбът на подкрепа за вашите близки. Мисията ви е свързана с грижа, справедливост, домашен уют и помагане на общността.",
    traits: ["Отговорност", "Доброта", "Хармония", "Закрила"],
    challenge: "Избягване на прекаления контрол и перфекционизъм.",
  },
  7: {
    title: "Търсачът на истината & Мъдрецът",
    subtitle: "Анализ, духовност и дълбоко знание",
    description: "Вие търсите дълбоките истини зад повърхността на нещата. Търсач на знание, философ и изследовател на тайнството на живота.",
    traits: ["Аналитичност", "Духовност", "Мъдрост", "Интуиция"],
    challenge: "Преодоляване на склонността към изолация и доверие в хората.",
  },
  8: {
    title: "Властелинът & Манифестаторът",
    subtitle: "Успех, сила, власт и изобилие",
    description: "Вие притежавате бизнес усет и способност да превръщате идеите в материални резултати. Родени сте за големи постижения и управление.",
    traits: ["Амбиция", "Увереност", "Авторитет", "Практичност"],
    challenge: "Балансиране между материалния успех и духовните ценности.",
  },
  9: {
    title: "Хуманитаристът & Визионерът",
    subtitle: "Универсална любов, състрадание и мъдрост",
    description: "Вие сте с широка душа и визия за по-добър свят. Вашето число символизира завършеност, алтруизъм и висше съзнание.",
    traits: ["Състрадание", "Алтруизъм", "Визионерство", "Великодушие"],
    challenge: "Освобождаване от миналото и приемане на промените без разочарование.",
  },
  11: {
    title: "Просветителят (Майсторско число 11)",
    subtitle: "Висша интуиция, вдъхновение и духовно лидерство",
    description: "Вие сте мост между материалния и духовния свят. Притежавате изключителна интуиция и мисия да вдъхновявате другите.",
    traits: ["Интуиция", "Вдъхновение", "Прозрение", "Харизма"],
    challenge: "Справяне с високата чувствителност и нервното напрежение.",
  },
  22: {
    title: "Майсторът Архитект (Майсторско число 22)",
    subtitle: "Превръщане на най-големите мечти в реалност",
    description: "Притежавате силата на 4, но в грандиозен мащаб. Можете да изграждате мащабни системи и проекти, променящи живота на мнозина.",
    traits: ["Мащабно мислене", "Практичен визионер", "Сила", "Реализация"],
    challenge: "Справяне с огромната отговорност и страха от провал.",
  },
  33: {
    title: "Духовният Учител (Майсторско число 33)",
    subtitle: "Безкористна любов, изцеление и духовно водене",
    description: "Най-високото майсторско число. Вашата мисия е посветена на състраданието, изцелението и повдигането на съзнанието на хората.",
    traits: ["Безусловна любов", "Изцеление", "Мъдрост", "Преданост"],
    challenge: "Балансиране на собствените нужди с тези на целия свят.",
  }
};

const reduceNumber = (num: number): number => {
  if (num === 11 || num === 22 || num === 33) return num;
  let current = num;
  while (current > 9) {
    if (current === 11 || current === 22 || current === 33) return current;
    current = String(current)
      .split('')
      .map(Number)
      .reduce((a, b) => a + b, 0);
  }
  return current;
};

export default function Numerology() {
  const { colors, setPage } = useApp();
  const [dateStr, setDateStr] = useState("15.06.2000");
  const [result, setResult] = useState<any>(() => calculateLifePath("15.06.2000"));

  function calculateLifePath(dStr: string) {
    try {
      const parts = dStr.split('.').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return null;

      const [day, month, year] = parts;
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1000 || year > 9999) {
        return null;
      }

      const dayReduced = reduceNumber(day);
      const monthReduced = reduceNumber(month);
      const yearSum = String(year).split('').map(Number).reduce((a, b) => a + b, 0);
      const yearReduced = reduceNumber(yearSum);

      const totalSum = dayReduced + monthReduced + yearReduced;
      const lifePathNumber = reduceNumber(totalSum);

      return {
        day,
        month,
        year,
        dayReduced,
        monthReduced,
        yearReduced,
        totalSum,
        lifePathNumber,
        info: LIFE_PATH_DATA[lifePathNumber] || LIFE_PATH_DATA[1],
        dateStr: dStr,
      };
    } catch (e) {
      return null;
    }
  }

  const handleCalculate = () => {
    const res = calculateLifePath(dateStr);
    if (res) {
      setResult(res);
    } else {
      alert("Моля въведете валидна дата във формат ДД.ММ.ГГГГ (напр. 15.06.2000)!");
    }
  };

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
        eyebrow="NUMEROLOGY ENGINE · LIFE PATH"
        first="Вашето"
        accent="Число на Живота."
        description="Открийте рождената си съдба, основните си вибрации и житейския си код."
      />

      {/* Форма за въвеждане на рождена дата */}
      <Card style={{ marginBottom: 20 }}>
        <View style={{ gap: 6, marginBottom: 14 }}>
          <T muted size={11}>
            ВЪВЕДЕТЕ РОЖДЕНА ДАТА (ДД.ММ.ГГГГ)
          </T>
          <View
            style={{
              height: 48,
              backgroundColor: colors.surfaceAlt,
              borderRadius: 14,
              justifyContent: 'center',
              paddingHorizontal: 14,
            }}
          >
            <TextInput
              style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}
              value={dateStr}
              onChangeText={setDateStr}
              placeholder="15.06.2000"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        <Pill selected onPress={handleCalculate}>
          ⑦ Изчисли Числото на Живота
        </Pill>
      </Card>

      {result && (
        <View style={{ gap: 18, marginBottom: 40 }}>
          {/* Главна карта с резултата */}
          <Card style={{ alignItems: 'center', paddingVertical: 26, gap: 10 }}>
            <T muted size={11} style={{ letterSpacing: 2 }}>
              ВАШЕТО ЧИСЛО НА ЖИВОТА
            </T>
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: colors.purpleSoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 4,
              }}
            >
              <T bold size={42} style={{ color: colors.purple }}>
                {result.lifePathNumber}
              </T>
            </View>
            <T bold size={22} style={{ textAlign: 'center' }}>
              {result.info.title}
            </T>
            <T muted size={13} style={{ textAlign: 'center', maxWidth: 300 }}>
              {result.info.subtitle}
            </T>
          </Card>

          {/* Стъпки на изчисление */}
          <Section>Математически Код</Section>
          <Card style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Hash size={16} color={colors.purple} />
              <T bold size={14}>Разбивка на вибрациите</T>
            </View>

            <View style={{ gap: 8, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T muted size={13}>Ден ({result.day}):</T>
                <T bold size={13} style={{ color: colors.purple }}>{result.dayReduced}</T>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T muted size={13}>Месец ({result.month}):</T>
                <T bold size={13} style={{ color: colors.purple }}>{result.monthReduced}</T>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T muted size={13}>Година ({result.year}):</T>
                <T bold size={13} style={{ color: colors.purple }}>{result.yearReduced}</T>
              </View>

              <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 4 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T bold size={13}>Сума ({result.dayReduced} + {result.monthReduced} + {result.yearReduced}):</T>
                <T bold size={15} style={{ color: colors.gold }}>
                  {result.totalSum} → {result.lifePathNumber}
                </T>
              </View>
            </View>
          </Card>

          {/* Описание на Числото */}
          <Section>Житейска Мисия</Section>
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color={colors.gold} />
              <T bold size={15}>Същност и предназначение</T>
            </View>
            <T muted size={13} style={{ lineHeight: 20 }}>
              {result.info.description}
            </T>
          </Card>

          {/* Ключови черти */}
          <Section>Ключови Вибрации</Section>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {result.info.traits.map((trait: string, idx: number) => (
              <Card key={idx} style={{ width: '48%', alignItems: 'center', paddingVertical: 14, gap: 6 }}>
                <Award size={20} color={colors.purple} />
                <T bold size={13}>{trait}</T>
              </Card>
            ))}
          </View>

          {/* Предизвикателство */}
          <Section>Житейски Урок</Section>
          <Card style={{ gap: 8, backgroundColor: colors.purpleSoft }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Compass size={16} color={colors.purple} />
              <T bold size={14} style={{ color: colors.purple }}>
                Предизвикателство за растеж
              </T>
            </View>
            <T bold size={13}>
              {result.info.challenge}
            </T>
          </Card>

          <View style={{ marginTop: 6 }}>
            <Pill onPress={() => { setDateStr(""); setResult(null); }}>
              <RotateCcw size={14} color={colors.purple} /> Нова рождена дата
            </Pill>
          </View>
        </View>
      )}
    </>
  );
}