import {
  AstrologyClassItem,
  AudioSessionItem,
  BondProfileInput,
  DailyUpdatePackage,
  LibraryArticleItem,
  NatalChartResults,
  PatternAnalysisItem,
  PsychologicalInsightBlock,
  SharedExperienceItem,
  TransitAspectItem,
} from './astrology.types';
import { formatShortDate, getMoonPhaseInfo } from './astrology.transits';

const ELEMENT_TRAITS: Record<
  string,
  { core: string; emotion: string; strength: string; challenge: string; growth: string }
> = {
  Fire: {
    core: 'директна жизненост, смелост и стремеж към автентично себеизразяване',
    emotion: 'бързи, топли и интензивни емоционални импулси, които търсят действие',
    strength: 'лидерство, вдъхновение на околните и способност да започваш от нулата',
    challenge: 'нетърпение, импулсивност и прегаряне при липса на пауза',
    growth: 'съчетаване на смелия импулс със стратегическо търпение',
  },
  Earth: {
    core: 'устойчивост, практичен разум и усет към реалната стойност',
    emotion: 'стабилни, дълбоки и премерени чувства, които се разгръщат чрез доверие',
    strength: 'надеждност, последователност и изграждане на трайни резултати',
    challenge: 'свръхконтрол, съпротива срещу внезапни промени и самокритичност',
    growth: 'доверие в потока на промяната и гъвкавост извън зоната на комфорт',
  },
  Air: {
    core: 'интелектуално любопитство, социална свързаност и обективен поглед',
    emotion: 'осмисляне на чувствата чрез диалог, идеи и споделена перспектива',
    strength: 'комуникативност, адаптивност и свързване на хора и концепции',
    challenge: 'прекомерно анализиране, разпиляване и дистанциране от тялото',
    growth: 'заземяване на идеите в конкретни действия и телесно присъствие',
  },
  Water: {
    core: 'дълбока интуиция, емпатия и чувствителност към невидимите пластове',
    emotion: 'океански, всеобхватни емоции и силна способност за съпреживяване',
    strength: 'емоционална интелигентност, творческа дълбочина и лечителско присъствие',
    challenge: 'попиване на чужди настроения, страх от уязвимост и оттегляне',
    growth: 'здравословни енергийни граници и ясно изразяване на личните нужди',
  },
};

export function buildPersonalPsychologicalInsights(
  chart: NatalChartResults
): PsychologicalInsightBlock[] {
  const sun = chart.planetsByKey.sun;
  const moon = chart.planetsByKey.moon;
  const mars = chart.planetsByKey.mars;
  const venus = chart.planetsByKey.venus;
  const saturn = chart.planetsByKey.saturn;
  const ascSign = chart.angles.asc.sign;
  const elInfo = ELEMENT_TRAITS[chart.elements.dominantElement] || ELEMENT_TRAITS.Fire;
  const topAspect = chart.aspects[0];

  return [
    {
      id: 'insight_personality',
      code: '1.8',
      category: 'personality',
      title: 'Ядро на личността и идентичност',
      placementTag: `Слънце в ${sun.sign} (Дом ${sun.house}) · Асцендент в ${ascSign}`,
      body: `Твоята същност съчетава соларната посока на ${sun.sign} в Дом ${sun.house} с призмата на Асцендент ${ascSign}. Доминиращата стихия ${chart.elements.dominantElement} ти дава ${elInfo.core}.`,
      actionTip: `Подхранвай проектите в сферата на Дом ${sun.house} — там най-ясно усещаш вътрешен смисъл.`,
    },
    {
      id: 'insight_emotional',
      code: '1.9',
      category: 'emotional',
      title: 'Емоционални реакции и вътрешен свят',
      placementTag: `Луна в ${moon.sign} (Дом ${moon.house})`,
      body: `С Луна в ${moon.sign} в Дом ${moon.house} твоята нервна система търси сигурност чрез ${elInfo.emotion}. Когато си под стрес, първата ти реакция е да защитиш пространството си в Дом ${moon.house}.`,
      actionTip: 'Давай си съзнателна пауза от 10 минути преди важни емоционални разговори.',
    },
    {
      id: 'insight_strengths',
      code: '1.10',
      category: 'strengths',
      title: 'Естествени силни страни и дарби',
      placementTag: `Управител: ${chart.chartRuler.modernRuler} в ${chart.chartRuler.rulerSign} (Дом ${chart.chartRuler.rulerHouse})`,
      body: `Управителят на картата ти (${chart.chartRuler.modernRuler} в ${chart.chartRuler.rulerSign}) отключва ${elInfo.strength}. Модалността ${chart.modalities.dominantModality} ти помага да задаваш темпото в ключови моменти.`,
      actionTip: `Опирай се на качествата на ${chart.chartRuler.rulerSign}, когато влизаш в нови ситуации.`,
    },
    {
      id: 'insight_challenges',
      code: '1.11',
      category: 'challenges',
      title: 'Зони на напрежение и предизвикателства',
      placementTag: `Сатурн в ${saturn.sign} (Дом ${saturn.house})`,
      body: `Позицията на Сатурн в ${saturn.sign} (Дом ${saturn.house}) показва къде изискваш най-много от себе си и често срещаш ${elInfo.challenge}.`,
      actionTip: 'Замени перфекционизма с малки, последователни стъпки без самоосъждане.',
    },
    {
      id: 'insight_conflicts',
      code: '1.12',
      category: 'conflicts',
      title: 'Вътрешни конфликти и полярности',
      placementTag: topAspect
        ? `${topAspect.body1} ${topAspect.symbol} ${topAspect.body2} (${topAspect.aspectType})`
        : `Венера в ${venus.sign} ↔ Марс в ${mars.sign}`,
      body: topAspect
        ? `Аспектът ${topAspect.body1} ${topAspect.aspectType} ${topAspect.body2} (орбис ${topAspect.orb}°) създава вътрешен диалог между две силни потребности. Интеграцията му превръща напрежението в магнитна харизма.`
        : `Диалогът между Венера в ${venus.sign} и Марс в ${mars.sign} балансира начина, по който обичаш, и начина, по който отстояваш границите си.`,
      actionTip: 'Назовавай на глас и двете си потребности, вместо да потискаш едната за сметка на другата.',
    },
    {
      id: 'insight_synthesis',
      code: '1.13',
      category: 'insight',
      title: 'Персонализирано синтезно прозрение',
      placementTag: `${chart.polarity.dominantPolarity} полярност · ${
        chart.isDayChart ? 'Дневна карта' : 'Нощна карта'
      }`,
      body: `Като ${
        chart.isDayChart ? 'дневна' : 'нощна'
      } карта с водеща ${chart.polarity.dominantPolarity} полярност, твоят път на развитие минава през ${elInfo.growth}.`,
      actionTip: 'Запази това прозрение в личната си колекция и го препрочитай при важни избори.',
    },
  ];
}

export function buildPatternAnalyses(chart: NatalChartResults): PatternAnalysisItem[] {
  const sun = chart.planetsByKey.sun;
  const moon = chart.planetsByKey.moon;
  const mercury = chart.planetsByKey.mercury;
  const venus = chart.planetsByKey.venus;
  const mars = chart.planetsByKey.mars;
  const saturn = chart.planetsByKey.saturn;
  const pluto = chart.planetsByKey.pluto;
  const northNode = chart.planetsByKey.northNode;
  const southNode = chart.planetsByKey.southNode;
  const house4 = chart.houses.find((h) => h.house === 4);
  const house7 = chart.houses.find((h) => h.house === 7);
  const house2 = chart.houses.find((h) => h.house === 2);

  return [
    {
      id: 'pat_2_1',
      code: '2.1',
      title: 'Личностни характеристики',
      placementBasis: `Слънце в ${sun.sign} · Асцендент ${chart.angles.asc.sign}`,
      summary: `Комбинация от ${sun.element} същност и ${chart.modalities.dominantModality} подход към света.`,
      deepDive: `Излъчваш качествата на ${chart.angles.asc.sign} при първи контакт, но вътрешната ти мотивация се движи от Слънце в ${sun.sign} (Дом ${sun.house}).`,
      growthKey: 'Съгласувай външния си образ с истинските си вътрешни приоритети.',
    },
    {
      id: 'pat_2_2',
      code: '2.2',
      title: 'Емоционални модели',
      placementBasis: `Луна в ${moon.sign} (Дом ${moon.house})`,
      summary: `Емоционалният ти отпечатък търси ${moon.element} резонанс и принадлежност.`,
      deepDive: `Луната в ${moon.sign} обработва преживяванията през филтъра на Дом ${moon.house}. При претоварване се нуждаеш от пространство за пренастройка.`,
      growthKey: 'Признавай уязвимостта си като източник на сила, а не на слабост.',
    },
    {
      id: 'pat_2_3',
      code: '2.3',
      title: 'Поведенчески модели',
      placementBasis: `Марс в ${mars.sign} · Меркурий в ${mercury.sign}`,
      summary: `Действаш в стил ${mars.sign}, като анализираш ситуациите през ${mercury.sign}.`,
      deepDive: `Когато преследваш цел, Марс в Дом ${mars.house} задава стратегията ти, а Меркурий в Дом ${mercury.house} оформя думите и решенията ти.`,
      growthKey: 'Наблюдавай автоматичните реакции в конфликт и избирай осъзнат отговор.',
    },
    {
      id: 'pat_2_4',
      code: '2.4',
      title: 'Влияние на детските преживявания',
      placementBasis: `IC (Дом 4) в ${house4?.sign || moon.sign} · Сатурн в ${saturn.sign}`,
      summary: `Ранната семейна среда е формирала усещането ти за сигурност и отговорност.`,
      deepDive: `Върхът на 4-ти дом в ${house4?.sign || moon.sign} показва атмосферата в дома на детството, а Сатурн в Дом ${saturn.house} отразява очакванията, които си интернализирал.`,
      growthKey: 'Освободи се от детските роли, които вече не служат на зрялото ти Аз.',
    },
    {
      id: 'pat_2_5',
      code: '2.5',
      title: 'Повтарящи се житейски ситуации',
      placementBasis: `Южен възел в ${southNode.sign} → Северен възел в ${northNode.sign}`,
      summary: `Познатият комфорт на ${southNode.sign} често те връща към сходни сценарии, докато не избереш ${northNode.sign}.`,
      deepDive: `Всеки път, когато избереш автоматичния модел на Дом ${southNode.house}, животът те кани да направиш крачка към Дом ${northNode.house}.`,
      growthKey: `Смелост да навлизаш в непознатата територия на ${northNode.sign}.`,
    },
    {
      id: 'pat_2_6',
      code: '2.6',
      title: 'Страхове и несигурности',
      placementBasis: `Сатурн в Дом ${saturn.house} · Лилит в ${chart.planetsByKey.lilith?.sign}`,
      summary: `Най-дълбоката ти чувствителност е свързана със страх от неприемане или загуба на контрол в Дом ${saturn.house}.`,
      deepDive: `Лилит в ${chart.planetsByKey.lilith?.sign} осветява местата, където си потискал автентичния си глас, за да се впишеш.`,
      growthKey: 'Приеми несъвършенството като естествена част от човешкия опит.',
    },
    {
      id: 'pat_2_7',
      code: '2.7',
      title: 'Модели на привързване',
      placementBasis: `Луна в ${moon.sign} · Венера в ${venus.sign}`,
      summary: `Твоят стил на привързване балансира нуждата от близост (${moon.sign}) и свобода (${venus.sign}).`,
      deepDive: `В интимните връзки търсиш партньор, който уважава едновременно емоционалната ти дълбочина и личния ти ритъм.`,
      growthKey: 'Комуникирай нуждите си директно, без да очакваш другият да чете мисли.',
    },
    {
      id: 'pat_2_8',
      code: '2.8',
      title: 'Отношения с близките',
      placementBasis: `Дом 3 в ${chart.houses[2]?.sign} · Дом 4 в ${house4?.sign}`,
      summary: `В семейството и близкия кръг често заемаш ролята на ${chart.elements.dominantElement} опора.`,
      deepDive: `Начинът, по който общуваш с роднини и близки, се определя от Меркурий в ${mercury.sign} и управителя на 4-ти дом.`,
      growthKey: 'Поставяй ясни граници с любов, без чувство за вина.',
    },
    {
      id: 'pat_2_9',
      code: '2.9',
      title: 'Романтични модели',
      placementBasis: `Десцендент (Дом 7) в ${house7?.sign} · Венера в ${venus.sign}`,
      summary: `Привличаш партньори, които носят качествата на ${house7?.sign} и оглеждат скритите ти страни.`,
      deepDive: `Венера в ${venus.sign} (Дом ${venus.house}) описва езика ти на любовта — цениш жест, който резонира с ${venus.element} стихията.`,
      growthKey: 'Избирай партньорство от позиция на цялост, а не от липса.',
    },
    {
      id: 'pat_2_10',
      code: '2.10',
      title: 'Самооценка и лична стойност',
      placementBasis: `Дом 2 в ${house2?.sign} · Слънце в ${sun.sign}`,
      summary: `Усещането ти за собствена стойност расте, когато развиваш талантите на ${house2?.sign}.`,
      deepDive: `Когато обвързваш самооценката си само с външно одобрение, губиш центъра си; връщаш го чрез творчество и самостоятелност.`,
      growthKey: 'Признавай постиженията си ежедневно, независимо от външната оценка.',
    },
    {
      id: 'pat_2_11',
      code: '2.11',
      title: 'Личностно развитие',
      placementBasis: `Юпитер в ${chart.planetsByKey.jupiter?.sign} (Дом ${chart.planetsByKey.jupiter?.house})`,
      summary: `Най-големият ти растеж идва чрез разширяване на хоризонта в сферата на Дом ${chart.planetsByKey.jupiter?.house}.`,
      deepDive: `Юпитер в ${chart.planetsByKey.jupiter?.sign} показва къде животът ти дава вятър в платната, когато действаш с вяра и любопитство.`,
      growthKey: 'Инвестирай в знания, менторство и нови преживявания.',
    },
    {
      id: 'pat_2_12',
      code: '2.12',
      title: 'Вътрешна трансформация',
      placementBasis: `Плутон в ${pluto.sign} (Дом ${pluto.house})`,
      summary: `Дълбоките ти метаморфози се случват в темите на Дом ${pluto.house}.`,
      deepDive: `Плутон в ${pluto.sign} ти дава способност да се възраждаш след кризи по-силен и по-мъдър.`,
      growthKey: 'Пускай контрола над онова, чийто цикъл вече е приключил.',
    },
    {
      id: 'pat_2_13',
      code: '2.13',
      title: 'Потенциал и таланти',
      placementBasis: `Медиум Цели (MC) в ${chart.angles.mc.sign} · Парс Фортуна в ${chart.planetsByKey.partOfFortune?.sign}`,
      summary: `Призванието ти носи подписа на ${chart.angles.mc.sign} и естествения поток на Парс Фортуна.`,
      deepDive: `Най-високата точка в картата ти (${chart.angles.mc.sign}) сочи обществения принос, в който съчетаваш професионализъм и автентичност.`,
      growthKey: 'Използвай естествените си дарби в служба на по-голяма кауза.',
    },
    {
      id: 'pat_2_14',
      code: '2.14',
      title: 'Житейски уроци',
      placementBasis: `Сатурн в ${saturn.sign} ↔ Северен възел в ${northNode.sign}`,
      summary: `Основният ти житейски урок е майсторство в ${saturn.sign} и смелост в ${northNode.sign}.`,
      deepDive: `Всяко предизвикателство в картата ти е проектирано да изгради вътрешна опора, мъдрост и състрадание.`,
      growthKey: 'Всяка осъзната стъпка превръща съдбата в свободен избор.',
    },
  ];
}

export function buildDailyUpdatePackage(
  chart: NatalChartResults,
  transits: TransitAspectItem[],
  targetDate: Date = new Date()
): DailyUpdatePackage {
  const moonPhase = getMoonPhaseInfo(targetDate);
  const topTransit = transits[0];
  const challengeTransit = transits.find((t) => t.harmony === 'challenging');
  const sunSign = chart.planetsByKey.sun?.sign || 'Aries';
  const moonSign = chart.planetsByKey.moon?.sign || 'Cancer';

  const harmoniousCount = transits.filter((t) => t.harmony === 'harmonious').length;
  const cosmicScore = Math.max(
    55,
    Math.min(97, 74 + harmoniousCount * 4 - (challengeTransit ? 5 : 0))
  );

  return {
    dateStr: formatShortDate(targetDate),
    moonPhase,
    cosmicScore,
    dailyMessage: topTransit
      ? `Днес ${topTransit.transitPlanet} формира ${topTransit.aspectType} с твоя натален ${topTransit.natalPlanet} — денят поставя фокус върху осъзнати действия в Дом ${topTransit.natalHouse}.`
      : `Луната в ${moonPhase.sign} (${moonPhase.name}) хармонизира с твоята ${sunSign} същност и носи ясен вътрешен ритъм.`,
    activeInfluences:
      transits.length > 0
        ? transits.slice(0, 3).map((t) => `${t.transitSymbol} ${t.title} (${t.intensity}% сила)`)
        : [`${moonPhase.symbol} ${moonPhase.name} в ${moonPhase.sign}`, `☉ Слънчев фокус за ${sunSign}`],
    emotionalTheme: `Луната преминава през ${moonPhase.sign} (${moonPhase.illumination}% осветеност) и резонира с твоята натална Луна в ${moonSign} — ${moonPhase.guidance}`,
    potentialChallenge: challengeTransit
      ? `${challengeTransit.title}: ${challengeTransit.guidance}`
      : 'Пази се от разпиляване на енергията в твърде много посоки едновременно.',
    activatedProcess: `Активиране на ${chart.elements.dominantElement} потенциала ти и пренастройка на приоритетите в Дом ${
      topTransit?.natalHouse || chart.planetsByKey.sun?.house || 1
    }.`,
    mindfulGuidance:
      'Отдели 5 минути сутринта за тишина, запиши едно основно намерение и наблюдавай синхроничностите през деня.',
  };
}

// --- Модул 15: База данни с публични личности ---

export const PUBLIC_FIGURES_CATALOG: BondProfileInput[] = [
  {
    id: 'pf_jung',
    name: 'Carl Gustav Jung',
    relationshipType: 'public_figure',
    birthdate: '1875-07-26',
    birthTime: '19:32',
    birthCity: { name: 'Kesswil', country: 'Switzerland', latitude: 47.595, longitude: 9.318 },
    bio: 'Основател на аналитичната психология, изследовател на архетипите и синхроничността.',
    isPublicFigure: true,
  },
  {
    id: 'pf_frida',
    name: 'Frida Kahlo',
    relationshipType: 'public_figure',
    birthdate: '1907-07-06',
    birthTime: '08:30',
    birthCity: { name: 'Coyoacán', country: 'Mexico', latitude: 19.346, longitude: -99.161 },
    bio: 'Иконична художничка, превърнала личната болка и страст в безсмъртно изкуство.',
    isPublicFigure: true,
  },
  {
    id: 'pf_tesla',
    name: 'Nikola Tesla',
    relationshipType: 'public_figure',
    birthdate: '1856-07-10',
    birthTime: '00:00',
    birthCity: { name: 'Smiljan', country: 'Croatia', latitude: 44.566, longitude: 15.316 },
    bio: 'Визионер, изобретател и пионер в безжичната енергия и честотите.',
    isPublicFigure: true,
  },
  {
    id: 'pf_monroe',
    name: 'Marilyn Monroe',
    relationshipType: 'public_figure',
    birthdate: '1926-06-01',
    birthTime: '09:30',
    birthCity: { name: 'Los Angeles', country: 'USA', latitude: 34.052, longitude: -118.243 },
    bio: 'Кино легенда с магнетичен Лъвски Асцендент и дълбока емоционална чувствителност.',
    isPublicFigure: true,
  },
  {
    id: 'pf_jobs',
    name: 'Steve Jobs',
    relationshipType: 'public_figure',
    birthdate: '1955-02-24',
    birthTime: '19:15',
    birthCity: { name: 'San Francisco', country: 'USA', latitude: 37.774, longitude: -122.419 },
    bio: 'Съосновател на Apple, съчетаващ Рибешка визия с Девически перфекционизъм.',
    isPublicFigure: true,
  },
  {
    id: 'pf_diana',
    name: 'Princess Diana',
    relationshipType: 'public_figure',
    birthdate: '1961-07-01',
    birthTime: '19:45',
    birthCity: { name: 'Sandringham', country: 'UK', latitude: 52.83, longitude: 0.514 },
    bio: 'Символ на емпатията, хуманизма и емоционалната смелост.',
    isPublicFigure: true,
  },
];

// --- Модули 10, 11, 13, 14: Content Library, Audio, Classes, Shared Experiences ---

export function buildContentLibrary(chart: NatalChartResults): LibraryArticleItem[] {
  const sunSign = chart.planetsByKey.sun?.sign || 'Aries';
  const moonSign = chart.planetsByKey.moon?.sign || 'Cancer';
  const dominantEl = chart.elements.dominantElement;

  return [
    {
      id: 'lib_climate',
      category: 'Cosmic Climate',
      readTime: '4 мин',
      title: 'Колективен космически климат и бавни планети',
      subtitle: 'Как външните цикли оформят поколенческите промени',
      body: 'Външните планети (Плутон, Нептун, Уран) задават макро-ритъма на колективното съзнание. Когато преминават през нови знаци, те пренареждат технологиите, общностите и начина, по който търсим смисъл.',
    },
    {
      id: 'lib_personal',
      category: 'Personal',
      readTime: '5 мин',
      title: `Твоят ${sunSign}–${moonSign} вътрешен компас`,
      subtitle: `Персонализиран анализ за доминираща стихия ${dominantEl}`,
      body: `Комбинацията от Слънце в ${sunSign} и Луна в ${moonSign} създава уникален подпис. Твоята ${dominantEl} природа ти позволява да виждаш решения там, където другите виждат застой.`,
    },
    {
      id: 'lib_relationships',
      category: 'Relationships',
      readTime: '6 мин',
      title: 'Огледалото на 7-ми дом и Венера в синастрията',
      subtitle: 'Защо привличаме точно определени партньори',
      body: 'Връзките не са случайни срещи, а живи диалози между две натални карти. Всеки аспект към твоята Луна или Венера осветява нужда, готова да бъде изцелена и споделена.',
    },
    {
      id: 'lib_growth',
      category: 'Personal Growth',
      readTime: '5 мин',
      title: 'Алхимията на Сатурн и Северния възел',
      subtitle: 'Превръщане на страха в житейско майсторство',
      body: 'Докато Южният възел пази нашите вродени навици, Северният възел ни кани към растеж. Сатурн дава структурата, чрез която мечтата се превръща в реалност.',
    },
    {
      id: 'lib_bonus',
      category: 'Bonus Chapter',
      readTime: '7 мин',
      title: 'Тайните на 12-ти дом и нощната интуиция',
      subtitle: 'Специална глава за сънищата, подсъзнанието и синхроничността',
      body: 'Дванадесети дом е пространството преди изгрева — там се раждат най-дълбоките творчески прозрения и връзката с колективното несъзнавано.',
    },
  ];
}

export function buildAudioJourneys(chart: NatalChartResults): AudioSessionItem[] {
  const moonSign = chart.planetsByKey.moon?.sign || 'Cancer';
  const dominantEl = chart.elements.dominantElement;

  return [
    {
      id: 'audio_moon_journey',
      type: 'Moon Journey',
      durationSec: 420,
      durationLabel: '07:00',
      title: `Месечно Moon Journey: Луна в ${moonSign}`,
      subtitle: 'Водено лунно пътуване за емоционално пречистване и интуиция',
      frequencyHz: '432 Hz · Binaural Lunar',
      scriptPreview: `Затвори очи и насочи вниманието си към центъра на гърдите. Позволи на лунната светлина в ${moonSign} да разтвори натрупаното напрежение...`,
    },
    {
      id: 'audio_360_element',
      type: '360° Immersive',
      durationSec: 600,
      durationLabel: '10:00',
      title: `360° Пространствено аудио: Стихия ${dominantEl}`,
      subtitle: 'Потапяща 360-градусова звукова среда за хармонизиране на картата',
      frequencyHz: '528 Hz · 360° Spatial',
      scriptPreview: `Звукът се движи в кръг около теб като планетарна орбита, балансирайки твоята ${dominantEl} енергия...`,
    },
    {
      id: 'audio_personal_insight',
      type: 'Personal Interpretation',
      durationSec: 300,
      durationLabel: '05:00',
      title: 'Персонализирана аудио интерпретация на Наталната карта',
      subtitle: `Синтез на Слънце в ${chart.planetsByKey.sun?.sign}, Луна в ${moonSign} и ASC ${chart.angles.asc.sign}`,
      frequencyHz: '396 Hz · Grounding',
      scriptPreview: `Твоята карта е уникална звездна архитектура, създадена в точния миг на първия ти дъх...`,
    },
    {
      id: 'audio_sound_meditation',
      type: 'Sound Meditation',
      durationSec: 480,
      durationLabel: '08:00',
      title: 'Звукова медитация при активни транзити',
      subtitle: 'Успокояване на нервната система при интензивни планетарни аспекти',
      frequencyHz: '639 Hz · Heart Coherence',
      scriptPreview: 'Вдишай бавно за 4 секунди, задръж за 4 и издишай за 6 секунди...',
    },
  ];
}

export function buildAstrologyClasses(chart: NatalChartResults): AstrologyClassItem[] {
  const sun = chart.planetsByKey.sun;
  const moon = chart.planetsByKey.moon;
  const asc = chart.angles.asc;

  return [
    {
      id: 'class_101',
      code: '13.1 · ASTROLOGY 101',
      level: 'Beginner',
      duration: '5 мин',
      title: 'Основи на астрологията: Знаци, Стихии и Модалности',
      concept:
        'Зодиакът се дели на 4 стихии (Огън, Земя, Въздух, Вода) и 3 модалности (Кардинална, Фиксирана, Мутабелна). Стихията показва темперамента, а модалността — начина на действие.',
      personalExample: `В твоята карта водеща е стихията ${chart.elements.dominantElement} и модалността ${chart.modalities.dominantModality}.`,
      takeaway: 'Познаването на стихийния баланс обяснява как зареждаш енергията си.',
    },
    {
      id: 'class_102',
      code: '13.3 · NATAL CHART',
      level: 'Beginner',
      duration: '6 мин',
      title: 'Голямата тройка: Слънце, Луна и Асцендент',
      concept:
        'Слънцето е съзнателната ти посока, Луната — емоционалният ти свят, а Асцендентът — вратата, през която взаимодействаш със света.',
      personalExample: `Твоята тройка е Слънце в ${sun.sign}, Луна в ${moon.sign} и Асцендент в ${asc.sign}.`,
      takeaway: 'Трите заедно образуват гръбнака на всяка психологическа интерпретация.',
    },
    {
      id: 'class_103',
      code: '13.4 · HOUSES & ANGLES',
      level: 'Intermediate',
      duration: '7 мин',
      title: '12-те астрологични дома (Система Placidus)',
      concept:
        'Домовете показват в коя конкретна сфера от живота (кариера, връзки, дом, творчество) се проявява енергията на планетите.',
      personalExample: `Твоят управител на Асцендента (${chart.chartRuler.modernRuler}) се намира в Дом ${chart.chartRuler.rulerHouse}.`,
      takeaway: 'Планетата е „какво“ се случва, знакът е „как“, а домът е „къде“.',
    },
    {
      id: 'class_104',
      code: '13.5 · TRANSITS',
      level: 'Intermediate',
      duration: '6 мин',
      title: 'Как да четем Транзитите и Transit Ring',
      concept:
        'Транзитите са реалното движение на планетите в небето спрямо наталната ти карта. Външните планети носят дългосрочни трансформации, а личните — ежедневни акценти.',
      personalExample: `В таб „Today & Transits“ можеш да видиш активните си аспекти и техните пикови дати в реално време.`,
      takeaway: 'Транзитите не отнемат свободната воля — те показват метеорологичната прогноза на времето.',
    },
    {
      id: 'class_105',
      code: '13.6 · SYNASTRY & BONDS',
      level: 'Advanced',
      duration: '8 мин',
      title: 'Синастрия и динамика на Bonds',
      concept:
        'При наслагване на две натални карти аспектите между Слънце, Луна, Венера и Марс разкриват химията, емоционалната сигурност и уроците във връзката.',
      personalExample: `Използвай таб „Bonds“, за да създадеш връзка с партньор, приятел или публична личност.`,
      takeaway: 'Най-силните връзки съчетават хармонични тригони за лекота и квадратури за растеж.',
    },
  ];
}

export const INITIAL_SHARED_EXPERIENCES: SharedExperienceItem[] = [
  {
    id: 'exp_1',
    author: 'Елена К.',
    bigThree: '☉ Scorpio · ☾ Pisces · ↑ Leo',
    topicTag: 'Сатурнов транзит',
    timeAgo: 'преди 2 ч.',
    content:
      'Откакто започнах да следя пиковите дати в Transit Ring, спрях да се съпротивлявам на промените в 10-ти дом и най-накрая смених работата си.',
    resonatesCount: 24,
  },
  {
    id: 'exp_2',
    author: 'Александър М.',
    bigThree: '☉ Aquarius · ☾ Gemini · ↑ Libra',
    topicTag: 'Bonds & Синастрия',
    timeAgo: 'преди 5 ч.',
    content:
      'Сравнихме картите си с партньорката ми в Bonds — веднага стана ясно защо нейната Луна в Рак и моята в Близнаци имат нужда от различен начин на успокоение.',
    resonatesCount: 19,
  },
  {
    id: 'exp_3',
    author: 'Мира Д.',
    bigThree: '☉ Taurus · ☾ Cancer · ↑ Virgo',
    topicTag: 'Moon Journey 360°',
    timeAgo: 'вчера',
    content:
      'Вечерното Moon Journey аудио преди сън ми стана ритуал при всяко пълнолуние.',
    resonatesCount: 31,
  },
];