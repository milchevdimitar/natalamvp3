import {
  AstrologyClassItem,
  AudioSessionItem,
  BondProfileInput,
  DailyUpdatePackage,
  LibraryArticleItem,
  NatalChartResults,
  PatternAnalysisItem,
  PsychologicalInsightBlock,
  TransitAspectItem,
} from './astrology.types';
import { formatShortDate, getMoonPhaseInfo } from './astrology.transits';

const ELEMENT_TRAITS: Record<
  string,
  { core: string; emotion: string; strength: string; challenge: string; growth: string }
> = {
  Fire: {
    core: 'direct vitality, courage, and a drive for authentic self-expression',
    emotion: 'quick, warm, and passionate emotional impulses seeking action',
    strength: 'leadership, inspiring others, and initiating bold new chapters',
    challenge: 'impatience, impulsiveness, and burnout without intentional rest',
    growth: 'pairing bold initiative with strategic patience',
  },
  Earth: {
    core: 'resilience, practical wisdom, and a keen sense of tangible value',
    emotion: 'steady, deep, and measured feelings built through trust',
    strength: 'reliability, consistency, and turning vision into lasting results',
    challenge: 'over-control, resistance to sudden change, and self-criticism',
    growth: 'trusting the flow of change beyond familiar structures',
  },
  Air: {
    core: 'intellectual curiosity, social connectivity, and objective clarity',
    emotion: 'processing feelings through dialogue, ideas, and shared perspective',
    strength: 'communication, adaptability, and bridging people and concepts',
    challenge: 'over-analyzing, scattered focus, and detaching from bodily cues',
    growth: 'grounding ideas into embodied presence and concrete action',
  },
  Water: {
    core: 'deep intuition, empathy, and sensitivity to subtle undercurrents',
    emotion: 'oceanic, immersive feelings and profound capacity for compassion',
    strength: 'emotional intelligence, creative depth, and healing presence',
    challenge: 'absorbing external moods, fear of vulnerability, and withdrawal',
    growth: 'maintaining clear energetic boundaries while expressing needs openly',
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
      title: 'Core Personality & Identity',
      placementTag: `Sun in ${sun.sign} (House ${sun.house}) · ${ascSign} Rising`,
      body: `Your essence blends the solar purpose of ${sun.sign} in House ${sun.house} with the lens of ${ascSign} Rising. Dominant ${chart.elements.dominantElement} energy gives you ${elInfo.core}.`,
      actionTip: `Invest energy in House ${sun.house} themes—that is where your sense of purpose shines brightest.`,
    },
    {
      id: 'insight_emotional',
      code: '1.9',
      category: 'emotional',
      title: 'Emotional Reactions & Inner World',
      placementTag: `Moon in ${moon.sign} (House ${moon.house})`,
      body: `With your Moon in ${moon.sign} in House ${moon.house}, your nervous system seeks safety through ${elInfo.emotion}. Under stress, your instinct is to protect your inner space in House ${moon.house}.`,
      actionTip: 'Take a conscious 10-minute pause before responding during emotionally charged moments.',
    },
    {
      id: 'insight_strengths',
      code: '1.10',
      category: 'strengths',
      title: 'Natural Strengths & Gifts',
      placementTag: `Chart Ruler: ${chart.chartRuler.modernRuler} in ${chart.chartRuler.rulerSign} (House ${chart.chartRuler.rulerHouse})`,
      body: `Your chart ruler (${chart.chartRuler.modernRuler} in ${chart.chartRuler.rulerSign}) unlocks ${elInfo.strength}. Your ${chart.modalities.dominantModality} modality helps you set the pace when it matters most.`,
      actionTip: `Lean into ${chart.chartRuler.rulerSign} qualities whenever stepping into unfamiliar territory.`,
    },
    {
      id: 'insight_challenges',
      code: '1.11',
      category: 'challenges',
      title: 'Growth Edges & Challenges',
      placementTag: `Saturn in ${saturn.sign} (House ${saturn.house})`,
      body: `Saturn in ${saturn.sign} (House ${saturn.house}) highlights where you hold yourself to the highest standard and may encounter ${elInfo.challenge}.`,
      actionTip: 'Replace harsh self-criticism with steady, incremental milestones.',
    },
    {
      id: 'insight_conflicts',
      code: '1.12',
      category: 'conflicts',
      title: 'Inner Polarities & Tensions',
      placementTag: topAspect
        ? `${topAspect.body1} ${topAspect.symbol} ${topAspect.body2} (${topAspect.aspectType})`
        : `Venus in ${venus.sign} ↔ Mars in ${mars.sign}`,
      body: topAspect
        ? `Your ${topAspect.body1} ${topAspect.aspectType} ${topAspect.body2} (${topAspect.orb}° orb) creates an internal dialogue between two core drives. Integrating both turns friction into magnetic presence.`
        : `The interplay between Venus in ${venus.sign} and Mars in ${mars.sign} balances how you give affection with how you assert your boundaries.`,
      actionTip: 'Acknowledge both needs openly rather than suppressing one for the other.',
    },
    {
      id: 'insight_synthesis',
      code: '1.13',
      category: 'insight',
      title: 'Personalized Synthesis Insight',
      placementTag: `${chart.polarity.dominantPolarity} Polarity · ${
        chart.isDayChart ? 'Day Chart' : 'Night Chart'
      }`,
      body: `As a ${
        chart.isDayChart ? 'day' : 'night'
      } chart with dominant ${chart.polarity.dominantPolarity} polarity, your evolutionary path unfolds through ${elInfo.growth}.`,
      actionTip: 'Save this insight to your personal collection and revisit it before major decisions.',
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
      title: 'Personality Traits',
      placementBasis: `Sun in ${sun.sign} · ${chart.angles.asc.sign} Rising`,
      summary: `A blend of ${sun.element} essence and a ${chart.modalities.dominantModality} approach to life.`,
      deepDive: `You project ${chart.angles.asc.sign} qualities upon first meeting, while your core motivation is fueled by Sun in ${sun.sign} (House ${sun.house}).`,
      growthKey: 'Align your outer persona with your deepest inner priorities.',
    },
    {
      id: 'pat_2_2',
      code: '2.2',
      title: 'Emotional Patterns',
      placementBasis: `Moon in ${moon.sign} (House ${moon.house})`,
      summary: `Your emotional imprint seeks ${moon.element} resonance and belonging.`,
      deepDive: `Moon in ${moon.sign} processes life through the lens of House ${moon.house}. When overwhelmed, you recharge by tending to that domain.`,
      growthKey: 'Honor emotional vulnerability as a source of clarity rather than weakness.',
    },
    {
      id: 'pat_2_3',
      code: '2.3',
      title: 'Behavioral Patterns',
      placementBasis: `Mars in ${mars.sign} · Mercury in ${mercury.sign}`,
      summary: `You take action in ${mars.sign} style while analyzing situations through ${mercury.sign}.`,
      deepDive: `Mars in House ${mars.house} shapes your drive and strategy, while Mercury in House ${mercury.house} governs how you articulate decisions.`,
      growthKey: 'Notice automatic reactions under pressure and choose a deliberate response.',
    },
    {
      id: 'pat_2_4',
      code: '2.4',
      title: 'Childhood Conditioning',
      placementBasis: `IC (House 4) in ${house4?.sign || moon.sign} · Saturn in ${saturn.sign}`,
      summary: `Early family dynamics shaped your baseline sense of safety and duty.`,
      deepDive: `Your 4th House cusp in ${house4?.sign || moon.sign} reflects your early home atmosphere, while Saturn in House ${saturn.house} mirrors internalized expectations.`,
      growthKey: 'Release inherited roles that no longer fit your adult truth.',
    },
    {
      id: 'pat_2_5',
      code: '2.5',
      title: 'Recurring Life Themes',
      placementBasis: `South Node in ${southNode.sign} → North Node in ${northNode.sign}`,
      summary: `Familiar ${southNode.sign} habits can loop until you consciously choose ${northNode.sign}.`,
      deepDive: `Whenever you default to House ${southNode.house} comfort zones, life invites you to step forward into House ${northNode.house}.`,
      growthKey: `Courage to explore the unfamiliar terrain of ${northNode.sign}.`,
    },
    {
      id: 'pat_2_6',
      code: '2.6',
      title: 'Fears & Insecurities',
      placementBasis: `Saturn in House ${saturn.house} · Lilith in ${chart.planetsByKey.lilith?.sign}`,
      summary: `Core sensitivity centers on fear of inadequacy or loss of control in House ${saturn.house}.`,
      deepDive: `Lilith in ${chart.planetsByKey.lilith?.sign} illuminates where you may have muted your authentic voice to fit in.`,
      growthKey: 'Embrace imperfection as an essential part of mastery.',
    },
    {
      id: 'pat_2_7',
      code: '2.7',
      title: 'Attachment Styles',
      placementBasis: `Moon in ${moon.sign} · Venus in ${venus.sign}`,
      summary: `Your attachment style balances emotional closeness (${moon.sign}) with personal autonomy (${venus.sign}).`,
      deepDive: `In close bonds, you thrive with partners who respect both your emotional depth and your individual rhythm.`,
      growthKey: 'State your emotional needs directly without expecting mind-reading.',
    },
    {
      id: 'pat_2_8',
      code: '2.8',
      title: 'Family & Close Circle Dynamics',
      placementBasis: `House 3 in ${chart.houses[2]?.sign} · House 4 in ${house4?.sign}`,
      summary: `Among close relatives and peers, you often serve as a ${chart.elements.dominantElement} anchor.`,
      deepDive: `Your communication with family is colored by Mercury in ${mercury.sign} and the ruler of your 4th House.`,
      growthKey: 'Maintain loving boundaries without carrying guilt.',
    },
    {
      id: 'pat_2_9',
      code: '2.9',
      title: 'Romantic Patterns',
      placementBasis: `Descendant (House 7) in ${house7?.sign} · Venus in ${venus.sign}`,
      summary: `You gravitate toward partners embodying ${house7?.sign} qualities that mirror your hidden strengths.`,
      deepDive: `Venus in ${venus.sign} (House ${venus.house}) defines your love language—you value devotion expressed through ${venus.element} energy.`,
      growthKey: 'Choose partnership from wholeness rather than obligation.',
    },
    {
      id: 'pat_2_10',
      code: '2.10',
      title: 'Self-Worth & Value',
      placementBasis: `House 2 in ${house2?.sign} · Sun in ${sun.sign}`,
      summary: `Your sense of self-worth strengthens as you cultivate ${house2?.sign} talents.`,
      deepDive: `Tying self-esteem solely to external validation drains your center; you reclaim it through creative autonomy.`,
      growthKey: 'Acknowledge your progress daily regardless of outside applause.',
    },
    {
      id: 'pat_2_11',
      code: '2.11',
      title: 'Personal Growth',
      placementBasis: `Jupiter in ${chart.planetsByKey.jupiter?.sign} (House ${chart.planetsByKey.jupiter?.house})`,
      summary: `Your greatest expansion unfolds through House ${chart.planetsByKey.jupiter?.house} pursuits.`,
      deepDive: `Jupiter in ${chart.planetsByKey.jupiter?.sign} marks where life opens doors when you lead with curiosity and faith.`,
      growthKey: 'Invest in learning, mentorship, and expansive experiences.',
    },
    {
      id: 'pat_2_12',
      code: '2.12',
      title: 'Inner Transformation',
      placementBasis: `Pluto in ${pluto.sign} (House ${pluto.house})`,
      summary: `Profound personal rebirth occurs through House ${pluto.house} experiences.`,
      deepDive: `Pluto in ${pluto.sign} grants resilience to rise stronger and wiser after major life transitions.`,
      growthKey: 'Release control over chapters whose purpose is complete.',
    },
    {
      id: 'pat_2_13',
      code: '2.13',
      title: 'Potential & Talents',
      placementBasis: `Midheaven (MC) in ${chart.angles.mc.sign} · Part of Fortune in ${chart.planetsByKey.partOfFortune?.sign}`,
      summary: `Your vocation carries the signature of ${chart.angles.mc.sign} and the natural flow of Part of Fortune.`,
      deepDive: `The highest point of your chart (${chart.angles.mc.sign}) points toward public contributions blending skill with authenticity.`,
      growthKey: 'Channel your innate gifts into work that serves a larger vision.',
    },
    {
      id: 'pat_2_14',
      code: '2.14',
      title: 'Core Life Lessons',
      placementBasis: `Saturn in ${saturn.sign} ↔ North Node in ${northNode.sign}`,
      summary: `Your overarching curriculum combines mastery in ${saturn.sign} with courage in ${northNode.sign}.`,
      deepDive: `Every friction point in your natal chart is structured to cultivate inner authority, wisdom, and compassion.`,
      growthKey: 'Conscious awareness transforms fate into creative choice.',
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
      ? `Today ${topTransit.transitPlanet} forms a ${topTransit.aspectType} with your natal ${topTransit.natalPlanet}—focusing conscious action in House ${topTransit.natalHouse}.`
      : `The Moon in ${moonPhase.sign} (${moonPhase.name}) harmonizes with your ${sunSign} core, bringing a steady inner rhythm.`,
    activeInfluences:
      transits.length > 0
        ? transits.slice(0, 3).map((t) => `${t.transitSymbol} ${t.title} (${t.intensity}% intensity)`)
        : [`${moonPhase.symbol} ${moonPhase.name} in ${moonPhase.sign}`, `☉ Solar focus for ${sunSign}`],
    emotionalTheme: `The Moon transits ${moonPhase.sign} (${moonPhase.illumination}% illumination), resonating with your natal Moon in ${moonSign}—${moonPhase.guidance}`,
    potentialChallenge: challengeTransit
      ? `${challengeTransit.title}: ${challengeTransit.guidance}`
      : 'Avoid scattering your energy across too many commitments at once.',
    activatedProcess: `Activating your ${chart.elements.dominantElement} potential and recalibrating priorities in House ${
      topTransit?.natalHouse || chart.planetsByKey.sun?.house || 1
    }.`,
    mindfulGuidance:
      'Take 5 quiet minutes this morning to set one clear intention and notice meaningful synchronicities.',
  };
}

export const PUBLIC_FIGURES_CATALOG: BondProfileInput[] = [
  {
    id: 'pf_jung',
    name: 'Carl Gustav Jung',
    relationshipType: 'public_figure',
    birthdate: '1875-07-26',
    birthTime: '19:32',
    birthCity: { name: 'Kesswil', country: 'Switzerland', latitude: 47.595, longitude: 9.318 },
    bio: 'Founder of analytical psychology, explorer of archetypes and synchronicity.',
    isPublicFigure: true,
  },
  {
    id: 'pf_frida',
    name: 'Frida Kahlo',
    relationshipType: 'public_figure',
    birthdate: '1907-07-06',
    birthTime: '08:30',
    birthCity: { name: 'Coyoacán', country: 'Mexico', latitude: 19.346, longitude: -99.161 },
    bio: 'Iconic painter who transformed personal intensity and passion into timeless art.',
    isPublicFigure: true,
  },
  {
    id: 'pf_tesla',
    name: 'Nikola Tesla',
    relationshipType: 'public_figure',
    birthdate: '1856-07-10',
    birthTime: '00:00',
    birthCity: { name: 'Smiljan', country: 'Croatia', latitude: 44.566, longitude: 15.316 },
    bio: 'Visionary inventor and pioneer of wireless energy and resonance.',
    isPublicFigure: true,
  },
  {
    id: 'pf_monroe',
    name: 'Marilyn Monroe',
    relationshipType: 'public_figure',
    birthdate: '1926-06-01',
    birthTime: '09:30',
    birthCity: { name: 'Los Angeles', country: 'USA', latitude: 34.052, longitude: -118.243 },
    bio: 'Cinema icon with magnetic Leo Rising and deep emotional sensitivity.',
    isPublicFigure: true,
  },
  {
    id: 'pf_jobs',
    name: 'Steve Jobs',
    relationshipType: 'public_figure',
    birthdate: '1955-02-24',
    birthTime: '19:15',
    birthCity: { name: 'San Francisco', country: 'USA', latitude: 37.774, longitude: -122.419 },
    bio: 'Co-founder of Apple, blending Pisces vision with Virgo precision.',
    isPublicFigure: true,
  },
  {
    id: 'pf_diana',
    name: 'Princess Diana',
    relationshipType: 'public_figure',
    birthdate: '1961-07-01',
    birthTime: '19:45',
    birthCity: { name: 'Sandringham', country: 'UK', latitude: 52.83, longitude: 0.514 },
    bio: 'Enduring symbol of empathy, humanitarianism, and emotional courage.',
    isPublicFigure: true,
  },
];

export function buildContentLibrary(chart: NatalChartResults): LibraryArticleItem[] {
  const sunSign = chart.planetsByKey.sun?.sign || 'Aries';
  const moonSign = chart.planetsByKey.moon?.sign || 'Cancer';
  const dominantEl = chart.elements.dominantElement;

  return [
    {
      id: 'lib_climate',
      category: 'Cosmic Climate',
      readTime: '4 min',
      title: 'Collective Cosmic Climate & Outer Planets',
      subtitle: 'How slow-moving cycles shape generational shifts',
      body: 'Outer planets (Pluto, Neptune, Uranus) set the macro-rhythm of collective consciousness. As they transit new signs, they reshape technology, communities, and how we seek meaning.',
    },
    {
      id: 'lib_personal',
      category: 'Personal',
      readTime: '5 min',
      title: `Your ${sunSign}–${moonSign} Inner Compass`,
      subtitle: `Personalized guide for dominant ${dominantEl} energy`,
      body: `The pairing of Sun in ${sunSign} and Moon in ${moonSign} creates a distinct signature. Your ${dominantEl} nature allows you to spot opportunities where others see stagnation.`,
    },
    {
      id: 'lib_relationships',
      category: 'Relationships',
      readTime: '6 min',
      title: 'The Mirror of House 7 & Venus in Synastry',
      subtitle: 'Why we attract specific relational dynamics',
      body: 'Relationships are living dialogues between two natal charts. Every aspect to your Moon or Venus illuminates a need ready to be understood and integrated.',
    },
    {
      id: 'lib_growth',
      category: 'Personal Growth',
      readTime: '5 min',
      title: 'The Alchemy of Saturn & the North Node',
      subtitle: 'Turning hesitation into lasting mastery',
      body: 'While the South Node holds familiar habits, the North Node invites evolution. Saturn provides the structure through which vision becomes reality.',
    },
    {
      id: 'lib_bonus',
      category: 'Bonus Chapter',
      readTime: '7 min',
      title: 'Mysteries of House 12 & Nocturnal Intuition',
      subtitle: 'A dedicated chapter on dreams, subconscious patterns & synchronicity',
      body: 'The Twelfth House is the threshold before sunrise—where deep creative insights and connection to the collective unconscious emerge.',
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
      title: `Monthly Moon Journey: Moon in ${moonSign}`,
      subtitle: 'Guided lunar immersion for emotional clearing and intuition',
      frequencyHz: '432 Hz · Binaural Lunar',
      scriptPreview: `Close your eyes and bring awareness to the center of your chest. Let the calm lunar resonance of ${moonSign} dissolve accumulated tension...`,
    },
    {
      id: 'audio_360_element',
      type: '360° Immersive',
      durationSec: 600,
      durationLabel: '10:00',
      title: `360° Spatial Audio: ${dominantEl} Element`,
      subtitle: 'Immersive 360-degree soundscape tuned to harmonize your chart',
      frequencyHz: '528 Hz · 360° Spatial',
      scriptPreview: `Sound moves in a gentle orbit around you, balancing and restoring your ${dominantEl} vitality...`,
    },
    {
      id: 'audio_personal_insight',
      type: 'Personal Interpretation',
      durationSec: 300,
      durationLabel: '05:00',
      title: 'Personalized Natal Chart Audio Reading',
      subtitle: `Synthesis of Sun in ${chart.planetsByKey.sun?.sign}, Moon in ${moonSign} & ${chart.angles.asc.sign} Rising`,
      frequencyHz: '396 Hz · Grounding',
      scriptPreview: `Your natal chart is a singular celestial blueprint captured at the exact moment of your first breath...`,
    },
    {
      id: 'audio_sound_meditation',
      type: 'Sound Meditation',
      durationSec: 480,
      durationLabel: '08:00',
      title: 'Sound Meditation for Active Transits',
      subtitle: 'Nervous system reset during intense planetary aspects',
      frequencyHz: '639 Hz · Heart Coherence',
      scriptPreview: 'Inhale slowly for 4 seconds, hold gently for 4, and exhale for 6 seconds...',
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
      duration: '5 min',
      title: 'Foundations: Signs, Elements & Modalities',
      concept:
        'The zodiac divides into 4 elements (Fire, Earth, Air, Water) and 3 modalities (Cardinal, Fixed, Mutable). Elements describe temperament; modalities describe how energy initiates or sustains.',
      personalExample: `In your chart, ${chart.elements.dominantElement} is the dominant element and ${chart.modalities.dominantModality} is the dominant modality.`,
      takeaway: 'Understanding elemental balance reveals how you naturally recharge.',
    },
    {
      id: 'class_102',
      code: '13.3 · NATAL CHART',
      level: 'Beginner',
      duration: '6 min',
      title: 'The Big Three: Sun, Moon & Ascendant',
      concept:
        'The Sun represents conscious purpose, the Moon reflects emotional needs, and the Ascendant is the threshold through which you meet the world.',
      personalExample: `Your Big Three: Sun in ${sun.sign}, Moon in ${moon.sign}, and ${asc.sign} Rising.`,
      takeaway: 'Together, these three form the backbone of psychological astrology.',
    },
    {
      id: 'class_103',
      code: '13.4 · HOUSES & ANGLES',
      level: 'Intermediate',
      duration: '7 min',
      title: `The 12 Astrological Houses (${chart.houseSystem} System)`,
      concept:
        'Houses show the specific life arenas—career, relationships, home, creativity—where planetary energy unfolds.',
      personalExample: `Your Ascendant ruler (${chart.chartRuler.modernRuler}) resides in House ${chart.chartRuler.rulerHouse}.`,
      takeaway: 'Planets show "what", signs show "how", and houses show "where".',
    },
    {
      id: 'class_104',
      code: '13.5 · TRANSITS',
      level: 'Intermediate',
      duration: '6 min',
      title: 'Reading Transits & the Transit Ring',
      concept:
        'Transits track real-time planetary motion relative to your natal chart. Outer planets mark deep chapters, while inner planets highlight daily rhythms.',
      personalExample:
        'Open the Transits tab to inspect your active aspects, intensity scores, and exact peak dates.',
      takeaway: 'Transits illuminate timing—your awareness shapes the outcome.',
    },
    {
      id: 'class_105',
      code: '13.6 · SYNASTRY & BONDS',
      level: 'Advanced',
      duration: '8 min',
      title: 'Synastry & Bond Dynamics',
      concept:
        'Overlaying two charts reveals inter-aspects between Sun, Moon, Venus, and Mars—highlighting chemistry, emotional safety, and growth lessons.',
      personalExample:
        'Use the Bonds tab to compare your chart with partners, friends, family, or public figures.',
      takeaway: 'Enduring bonds blend harmonious trines for ease with squares for mutual growth.',
    },
  ];
}