import {
  ActiveDoshaClockInfo,
  AgniAnalysis,
  AyurvedaMatchResult,
  AyurvedaMatchType,
  AyurvedaProfile,
  ConstitutionCode,
  DinacharyaStep,
  DoshaName,
  DoshaScores,
  ElementScores,
  GunaName,
  GunaScores,
  SeasonalRitucharya,
  TasteName,
  TasteRecommendation,
  VitalEssenceMetrics,
} from './ayurveda.types';
import {
  DOSHA_META,
  HERBS_BY_DOSHA,
  PRACTICES_BY_DOSHA,
  SUBDOSHAS_BY_DOSHA,
} from './ayurveda.data';

function normalizeDoshas(v: number, p: number, k: number): DoshaScores {
  const total = v + p + k || 1;
  const vPct = Math.round((v / total) * 100);
  const pPct = Math.round((p / total) * 100);
  const kPct = Math.max(5, 100 - vPct - pPct);
  return { Vata: vPct, Pitta: pPct, Kapha: kPct };
}

export function deriveConstitutionCode(scores: DoshaScores): {
  code: ConstitutionCode;
  primary: DoshaName;
  secondary: DoshaName;
} {
  const entries = (['Vata', 'Pitta', 'Kapha'] as DoshaName[]).sort(
    (a, b) => scores[b] - scores[a]
  );
  const primary = entries[0];
  const secondary = entries[1];
  const tertiary = entries[2];

  if (scores[primary] - scores[tertiary] <= 8) {
    return { code: 'Tridoshic', primary, secondary };
  }
  if (scores[primary] - scores[secondary] <= 11) {
    return {
      code: `${primary}-${secondary}` as ConstitutionCode,
      primary,
      secondary,
    };
  }
  return { code: primary, primary, secondary };
}

// Live 4-hour Ayurvedic Dosha Clock (Real-time)
export function getActiveDoshaClock(date: Date = new Date()): ActiveDoshaClockInfo {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const currentTimeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  if (hour >= 6 && hour < 10) {
    return {
      currentTimeStr,
      activeDosha: 'Kapha',
      periodLabel: 'Morning Kapha Window',
      timeRange: '06:00 – 10:00',
      energyQuality: 'Steady, grounding & physically strong',
      bestActivities: 'Vigorous exercise, breathwork, warm hydration & structured planning.',
      avoidActivities: 'Sleeping in past sunrise or heavy, sugary breakfasts.',
    };
  }
  if (hour >= 10 && hour < 14) {
    return {
      currentTimeStr,
      activeDosha: 'Pitta',
      periodLabel: 'Midday Pitta Window',
      timeRange: '10:00 – 14:00',
      energyQuality: 'Peak Agni (digestive fire) & sharp mental focus',
      bestActivities: 'Your largest nourishing meal of the day, analytical work & key decisions.',
      avoidActivities: 'Skipping lunch, intense conflict, or overheating in direct sun.',
    };
  }
  if (hour >= 14 && hour < 18) {
    return {
      currentTimeStr,
      activeDosha: 'Vata',
      periodLabel: 'Afternoon Vata Window',
      timeRange: '14:00 – 18:00',
      energyQuality: 'Light, creative, communicative & mobile',
      bestActivities: 'Brainstorming, creative expression, collaboration & warm herbal tea.',
      avoidActivities: 'Cold iced drinks, excessive caffeine, or erratic multitasking.',
    };
  }
  if (hour >= 18 && hour < 22) {
    return {
      currentTimeStr,
      activeDosha: 'Kapha',
      periodLabel: 'Evening Kapha Window',
      timeRange: '18:00 – 22:00',
      energyQuality: 'Naturally slowing, calm & restorative',
      bestActivities: 'Light early dinner, gentle walk, warm bath, reading & family connection.',
      avoidActivities: 'Heavy late-night meals or high-adrenaline stimulation.',
    };
  }
  if (hour >= 22 || hour < 2) {
    return {
      currentTimeStr,
      activeDosha: 'Pitta',
      periodLabel: 'Nocturnal Pitta Window',
      timeRange: '22:00 – 02:00',
      energyQuality: 'Cellular detoxification, liver repair & memory integration',
      bestActivities: 'Deep restorative sleep (lights out by 22:15 maximizes Ojas renewal).',
      avoidActivities: 'Late-night snacking, doomscrolling, or working through the night.',
    };
  }
  return {
    currentTimeStr,
    activeDosha: 'Vata',
    periodLabel: 'Dawn Vata Window (Brahma Muhurta)',
    timeRange: '02:00 – 06:00',
    energyQuality: 'Subtle, intuitive, peaceful & spiritually receptive',
    bestActivities: 'Waking near sunrise, meditation, journaling & gentle Pranayama.',
    avoidActivities: 'Overstimulation immediately upon waking.',
  };
}

// Seasonal Ritucharya based on current month
export function getSeasonalRitucharya(date: Date = new Date()): SeasonalRitucharya {
  const month = date.getMonth() + 1;

  if (month === 11 || month === 12 || month === 1) {
    return {
      seasonName: 'Early Winter',
      sanskritName: 'Hemanta Ritu',
      dominantDosha: 'Vata',
      summary: 'Crisp, dry cold strengthens internal Agni while challenging Vata moisture.',
      keyAdjustments:
        'Favor warm cooked stews, healthy ghee/sesame oils, warming spices, and daily Abhyanga.',
    };
  }
  if (month === 2 || month === 3) {
    return {
      seasonName: 'Late Winter',
      sanskritName: 'Shishira Ritu',
      dominantDosha: 'Kapha',
      summary: 'Deep cold and dampness accumulate Kapha heaviness beneath the surface.',
      keyAdjustments:
        'Keep warmth high with ginger-cinnamon teas, dry brushing, and invigorating movement.',
    };
  }
  if (month === 4 || month === 5) {
    return {
      seasonName: 'Spring Renewal',
      sanskritName: 'Vasanta Ritu',
      dominantDosha: 'Kapha',
      summary: 'Rising warmth melts accumulated winter Kapha, calling for light cleansing.',
      keyAdjustments:
        'Emphasize bitter greens, pungent spices, lighter grains (barley, millet), and morning cardio.',
    };
  }
  if (month === 6 || month === 7 || month === 8) {
    return {
      seasonName: 'Summer Radiance',
      sanskritName: 'Grishma Ritu',
      dominantDosha: 'Pitta',
      summary: 'Long sunny days elevate Pitta heat and naturally moderate digestive fire.',
      keyAdjustments:
        'Favor sweet, hydrating fruits, cooling herbs (mint, coriander, fennel), and moonlight walks.',
    };
  }
  return {
    seasonName: 'Autumn Transition',
    sanskritName: 'Sharad Ritu',
    dominantDosha: 'Pitta',
    summary: 'Winds rise as residual summer heat meets dry air — a dual Pitta-Vata shift.',
    keyAdjustments:
      'Transition from raw salads to warm, grounding meals with sweet & bitter tastes.',
  };
}

export function calculateAyurvedaProfile(options: {
  personName?: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  quizAnswers?: Record<string, DoshaName>;
  currentStressLevel?: 'low' | 'moderate' | 'high';
  useBirthBaseline?: boolean;
  date?: Date;
}): AyurvedaProfile {
  const {
    personName = 'Your Ayurvedic Blueprint',
    birthYear = 1995,
    birthMonth = 6,
    birthDay = 15,
    quizAnswers = {},
    currentStressLevel = 'moderate',
    useBirthBaseline = true,
    date = new Date(),
  } = options;

  // 1. Baseline Prakriti derived from birth season + quiz responses
  let vRaw = 30;
  let pRaw = 30;
  let kRaw = 30;

  // Birth date elemental baseline
  if (useBirthBaseline) {
    if ([10, 11, 12, 1].includes(birthMonth)) vRaw += 10;
    if ([5, 6, 7, 8, 9].includes(birthMonth)) pRaw += 10;
    if ([2, 3, 4].includes(birthMonth)) kRaw += 10;
    vRaw += (birthDay % 5) * 2;
    pRaw += ((birthDay + birthMonth) % 5) * 2;
    kRaw += ((birthYear + birthDay) % 5) * 2;
  }

  // Incorporate user quiz answers with strong weight
  Object.values(quizAnswers).forEach((dosha) => {
    if (dosha === 'Vata') vRaw += 16;
    if (dosha === 'Pitta') pRaw += 16;
    if (dosha === 'Kapha') kRaw += 16;
  });

  const prakriti = normalizeDoshas(vRaw, pRaw, kRaw);
  const { code: constitutionType, primary: primaryDosha, secondary: secondaryDosha } =
    deriveConstitutionCode(prakriti);

  // 2. Current Vikriti (Prakriti modulated by current season & stress)
  const season = getSeasonalRitucharya(date);
  let vikV = prakriti.Vata;
  let vikP = prakriti.Pitta;
  let vikK = prakriti.Kapha;

  if (season.dominantDosha === 'Vata') vikV += 9;
  if (season.dominantDosha === 'Pitta') vikP += 9;
  if (season.dominantDosha === 'Kapha') vikK += 9;

  if (currentStressLevel === 'high') {
    vikV += 10;
    vikP += 6;
  } else if (currentStressLevel === 'low') {
    vikK += 4;
  }

  const vikriti = normalizeDoshas(vikV, vikP, vikK);
  const imbalancedDosha = (['Vata', 'Pitta', 'Kapha'] as DoshaName[]).sort(
    (a, b) => vikriti[b] - vikriti[a]
  )[0];
  const hasActiveImbalance = vikriti[imbalancedDosha] - prakriti[imbalancedDosha] >= 5;

  // 3. Pancha Mahabhuta (5 Great Elements)
  const elements: ElementScores = {
    Ether: Math.round(prakriti.Vata * 0.52),
    Air: Math.round(prakriti.Vata * 0.48),
    Fire: Math.round(prakriti.Pitta * 0.68),
    Water: Math.round(prakriti.Pitta * 0.32 + prakriti.Kapha * 0.45),
    Earth: Math.round(prakriti.Kapha * 0.55),
  };

  // 4. Triguna Mind Profile (Sattva, Rajas, Tamas)
  const sattvaRaw = currentStressLevel === 'low' ? 54 : currentStressLevel === 'moderate' ? 44 : 34;
  const rajasRaw = Math.round((prakriti.Pitta + prakriti.Vata) * 0.38);
  const tamasRaw = Math.max(12, 100 - sattvaRaw - rajasRaw);
  const gunaTotal = sattvaRaw + rajasRaw + tamasRaw || 1;

  const gunas: GunaScores = {
    Sattva: Math.round((sattvaRaw / gunaTotal) * 100),
    Rajas: Math.round((rajasRaw / gunaTotal) * 100),
    Tamas: Math.max(8, 100 - Math.round((sattvaRaw / gunaTotal) * 100) - Math.round((rajasRaw / gunaTotal) * 100)),
  };

  const primaryGuna = (['Sattva', 'Rajas', 'Tamas'] as GunaName[]).sort(
    (a, b) => gunas[b] - gunas[a]
  )[0];

  // 5. Agni (Digestive Fire) Diagnosis
  const agniByDosha: Record<DoshaName, AgniAnalysis> = {
    Vata: {
      type: 'Vishama Agni',
      englishTitle: 'Variable Metabolic Fire',
      efficiencyScore: currentStressLevel === 'high' ? 68 : 79,
      summary:
        'Appetite and digestion fluctuate with stress or irregular schedules, occasionally causing dryness or gas.',
      balancingProtocol:
        'Anchor regular meal times, sip warm ginger-cumin tea before lunch, and favor warm, moist foods.',
    },
    Pitta: {
      type: 'Tikshna Agni',
      englishTitle: 'Sharp Metabolic Fire',
      efficiencyScore: currentStressLevel === 'high' ? 74 : 86,
      summary:
        'Strong, fast-burning digestion that transforms food quickly but can overheat if meals are delayed.',
      balancingProtocol:
        'Never skip midday lunch; cool excess fire with sweet fruits, coconut, fennel, and coriander.',
    },
    Kapha: {
      type: 'Manda Agni',
      englishTitle: 'Steady, Slow-Burning Fire',
      efficiencyScore: currentStressLevel === 'high' ? 70 : 78,
      summary:
        'Calm, enduring digestion that thrives on lighter portions and warming aromatic spices.',
      balancingProtocol:
        'Favor warm, spiced, lightly cooked meals; avoid iced drinks and heavy dairy after sunset.',
    },
  };

  const agni: AgniAnalysis =
    !hasActiveImbalance && currentStressLevel === 'low'
      ? {
          type: 'Sama Agni',
          englishTitle: 'Harmonious Balanced Fire',
          efficiencyScore: 93,
          summary:
            'Your digestive fire burns evenly, transforming nutrients cleanly into Ojas, clarity, and sustained energy.',
          balancingProtocol:
            'Maintain your seasonal rhythm, mindful eating pace, and warm herbal hydration.',
        }
      : agniByDosha[imbalancedDosha];

  // 6. Vital Essences: Ojas, Tejas, Prana & Ama (0 - 10 scale)
  const ojas = Number(
    Math.min(
      9.6,
      Math.max(5.2, 6.4 + prakriti.Kapha * 0.03 + (currentStressLevel === 'low' ? 1.1 : 0))
    ).toFixed(1)
  );
  const tejas = Number(
    Math.min(9.6, Math.max(5.5, 6.5 + prakriti.Pitta * 0.03)).toFixed(1)
  );
  const prana = Number(
    Math.min(9.6, Math.max(5.5, 6.5 + prakriti.Vata * 0.03)).toFixed(1)
  );
  const amaIndex = Number(
    Math.min(
      6.8,
      Math.max(1.4, (currentStressLevel === 'high' ? 4.4 : 2.6) + (vikriti.Kapha - 33) * 0.03)
    ).toFixed(1)
  );

  const vitalEssences: VitalEssenceMetrics = {
    ojas,
    tejas,
    prana,
    amaIndex,
    summary: `Ojas ${ojas}/10 · Tejas ${tejas}/10 · Prana ${prana}/10 · Ama Load ${amaIndex}/10.`,
    deepGuidance:
      amaIndex > 3.8
        ? 'Lighten evening meals and sip warm ginger-CCF tea for 5 days to clear mild Ama stagnation and restore Ojas.'
        : 'Your vital essences are clean and well-supported; prioritize sleep before 22:30 to keep Ojas abundant.',
  };

  // 7. Shad Rasa (Six Tastes 0 - 10 Priority Scale based on imbalancedDosha)
  const tasteScoresByDosha: Record<DoshaName, Record<TasteName, number>> = {
    Vata: { Sweet: 9.2, Sour: 8.4, Salty: 8.1, Pungent: 5.2, Bitter: 3.4, Astringent: 3.1 },
    Pitta: { Sweet: 9.0, Bitter: 8.8, Astringent: 8.2, Pungent: 3.0, Sour: 3.5, Salty: 3.8 },
    Kapha: { Pungent: 9.1, Bitter: 8.9, Astringent: 8.5, Sweet: 3.0, Sour: 3.6, Salty: 3.4 },
  };

  const tMap = tasteScoresByDosha[imbalancedDosha];
  const tastes: TasteRecommendation[] = [
    {
      taste: 'Sweet',
      sanskrit: 'Madhura',
      elements: 'Earth + Water',
      score: tMap.Sweet,
      action: tMap.Sweet >= 7 ? 'Favor Daily' : tMap.Sweet >= 5 ? 'Include Moderately' : 'Minimize',
      examples: 'Sweet potato, basmati rice, ripe dates, ghee, almonds, oats',
    },
    {
      taste: 'Sour',
      sanskrit: 'Amla',
      elements: 'Earth + Fire',
      score: tMap.Sour,
      action: tMap.Sour >= 7 ? 'Favor Daily' : tMap.Sour >= 5 ? 'Include Moderately' : 'Minimize',
      examples: 'Fresh lime, pomegranate, tamarind, cultured yogurt, berries',
    },
    {
      taste: 'Salty',
      sanskrit: 'Lavana',
      elements: 'Water + Fire',
      score: tMap.Salty,
      action: tMap.Salty >= 7 ? 'Favor Daily' : tMap.Salty >= 5 ? 'Include Moderately' : 'Minimize',
      examples: 'Himalayan pink salt, sea vegetables, celery, mineral broths',
    },
    {
      taste: 'Pungent',
      sanskrit: 'Katu',
      elements: 'Fire + Air',
      score: tMap.Pungent,
      action: tMap.Pungent >= 7 ? 'Favor Daily' : tMap.Pungent >= 5 ? 'Include Moderately' : 'Minimize',
      examples: 'Fresh ginger, black pepper, cayenne, garlic, mustard seed, radish',
    },
    {
      taste: 'Bitter',
      sanskrit: 'Tikta',
      elements: 'Air + Ether',
      score: tMap.Bitter,
      action: tMap.Bitter >= 7 ? 'Favor Daily' : tMap.Bitter >= 5 ? 'Include Moderately' : 'Minimize',
      examples: 'Dandelion greens, kale, turmeric, fenugreek, cacao, aloe vera',
    },
    {
      taste: 'Astringent',
      sanskrit: 'Kashaya',
      elements: 'Air + Earth',
      score: tMap.Astringent,
      action:
        tMap.Astringent >= 7 ? 'Favor Daily' : tMap.Astringent >= 5 ? 'Include Moderately' : 'Minimize',
      examples: 'Lentils, chickpeas, green tea, pomegranate, apples, broccoli',
    },
  ];

  // 8. Nutrition Lists (Favor vs. Reduce)
  const foodTables: Record<
    DoshaName,
    {
      favor: { category: string; items: string }[];
      reduce: { category: string; items: string }[];
    }
  > = {
    Vata: {
      favor: [
        { category: 'Grains & Roots', items: 'Basmati rice, oats, quinoa, sweet potato, beets, carrots' },
        { category: 'Healthy Fats', items: 'Ghee, sesame oil, olive oil, soaked almonds, avocado' },
        { category: 'Spices & Warmth', items: 'Ginger, cinnamon, cardamom, cumin, fennel, nutmeg' },
      ],
      reduce: [
        { category: 'Cold & Raw', items: 'Iced drinks, raw cruciferous salads, dry crackers, popcorn' },
        { category: 'Stimulants', items: 'Excess coffee, refined sugar, late-night snacking' },
      ],
    },
    Pitta: {
      favor: [
        { category: 'Cooling Produce', items: 'Cucumber, zucchini, leafy greens, sweet melon, pears, coconut' },
        { category: 'Grains & Proteins', items: 'Basmati rice, barley, mung beans, pumpkin seeds, ghee' },
        { category: 'Cooling Herbs', items: 'Coriander, fennel, fresh mint, cardamom, rose water, saffron' },
      ],
      reduce: [
        { category: 'Excess Heat', items: 'Chili peppers, vinegar, fried foods, fermented alcohol, excess garlic' },
        { category: 'Sour & Salty', items: 'Unripe tomatoes, sour citrus in excess, heavily salted snacks' },
      ],
    },
    Kapha: {
      favor: [
        { category: 'Light Grains', items: 'Barley, millet, buckwheat, quinoa, steamed bitter greens' },
        { category: 'Legumes & Spices', items: 'Red lentils, chickpeas, ginger, turmeric, black pepper, clove' },
        { category: 'Astringent Fruits', items: 'Apples, pears, pomegranate, berries, raw honey (unheated)' },
      ],
      reduce: [
        { category: 'Heavy & Sweet', items: 'Cold dairy, ice cream, wheat pastries, fried foods, excess oil' },
        { category: 'Damp & Cold', items: 'Iced smoothies, bananas at night, oversleeping after meals' },
      ],
    },
  };

  // 9. Tailored Dinacharya (Daily Routine)
  const dinacharya: DinacharyaStep[] = [
    {
      id: 'd1',
      window: 'Morning',
      timeRange: '06:00 – 07:30',
      title: 'Tongue Scraping & Warm Copper Water',
      sanskrit: 'Jihwa Prakshalana & Ushapan',
      description: 'Clear overnight Ama from the tongue and awaken gentle peristalsis with warm water.',
    },
    {
      id: 'd2',
      window: 'Morning',
      timeRange: '07:30 – 08:30',
      title:
        imbalancedDosha === 'Vata'
          ? 'Warm Oil Massage & Grounding Yoga'
          : imbalancedDosha === 'Pitta'
          ? 'Cooling Pranayama & Moon Flow'
          : 'Dry Brushing & Vigorous Sun Salutations',
      sanskrit: 'Abhyanga & Vyayama',
      description: PRACTICES_BY_DOSHA[imbalancedDosha][1].description,
    },
    {
      id: 'd3',
      window: 'Midday',
      timeRange: '12:00 – 13:30',
      title: 'Main Nourishing Meal at Peak Agni',
      sanskrit: 'Madhyahna Ahara',
      description: `Eat your largest, freshly cooked meal while Pitta digestive fire peaks, emphasizing ${tastes
        .filter((t) => t.score >= 8)
        .map((t) => t.taste)
        .join(' & ')} tastes.`,
    },
    {
      id: 'd4',
      window: 'Evening',
      timeRange: '18:30 – 22:00',
      title: 'Light Dinner & Digital Sunset',
      sanskrit: 'Ratri Dinacharya',
      description:
        'Enjoy a warm soup or light meal 3 hours before sleep; wind down before the 22:00 Pitta cycle.',
    },
  ];

  const meta = DOSHA_META[primaryDosha];

  return {
    personName,
    prakriti,
    vikriti,
    constitutionType,
    primaryDosha,
    secondaryDosha,
    imbalancedDosha,
    hasActiveImbalance,
    elements,
    gunas,
    primaryGuna,
    archetypeHeadline: `${constitutionType} · ${meta.archetypeTitle}`,
    archetypeSummary: meta.archetypeSummary,
    strengths: meta.strengths,
    watchOuts: meta.watchOuts,
    agni,
    vitalEssences,
    subdoshas: SUBDOSHAS_BY_DOSHA[imbalancedDosha],
    tastes,
    foodsToFavor: foodTables[imbalancedDosha].favor,
    foodsToReduce: foodTables[imbalancedDosha].reduce,
    herbsAndSpices: HERBS_BY_DOSHA[imbalancedDosha],
    practices: PRACTICES_BY_DOSHA[imbalancedDosha],
    dinacharya,
    season,
  };
}

// Ayurvedic Compatibility (MatchMaker)
export function compareAyurvedaProfiles(
  profileA: AyurvedaProfile,
  profileB: AyurvedaProfile,
  matchType: AyurvedaMatchType
): AyurvedaMatchResult {
  const dA = profileA.primaryDosha;
  const dB = profileB.primaryDosha;

  // Complementary Dosha chemistry (opposites balance; same dosha shares understanding)
  const isComplementaryPair =
    (dA === 'Vata' && dB === 'Kapha') ||
    (dA === 'Kapha' && dB === 'Vata') ||
    (dA === 'Pitta' && dB === 'Kapha') ||
    (dA === 'Kapha' && dB === 'Pitta') ||
    (dA === 'Vata' && dB === 'Pitta') ||
    (dA === 'Pitta' && dB === 'Vata');

  const doshaChemistryScore = isComplementaryPair ? 91 : 80;

  // Sattva & Triguna harmony
  const avgSattva = Math.round((profileA.gunas.Sattva + profileB.gunas.Sattva) / 2);
  const gunaHarmonyScore = Math.min(96, Math.max(68, 52 + avgSattva));

  // Combined 5-Element coverage
  const combinedElements = {
    Ether: profileA.elements.Ether + profileB.elements.Ether,
    Air: profileA.elements.Air + profileB.elements.Air,
    Fire: profileA.elements.Fire + profileB.elements.Fire,
    Water: profileA.elements.Water + profileB.elements.Water,
    Earth: profileA.elements.Earth + profileB.elements.Earth,
  };
  const balancedCount = Object.values(combinedElements).filter((v) => v >= 14).length;
  const elementalBalanceScore = 66 + balancedCount * 6;

  const weights =
    matchType === 'romantic'
      ? { dosha: 0.4, guna: 0.35, el: 0.25 }
      : matchType === 'business'
      ? { dosha: 0.3, guna: 0.35, el: 0.35 }
      : { dosha: 0.35, guna: 0.4, el: 0.25 };

  const overallScore = Math.round(
    doshaChemistryScore * weights.dosha +
      gunaHarmonyScore * weights.guna +
      elementalBalanceScore * weights.el
  );

  const strengths: string[] = [];
  if (isComplementaryPair) {
    strengths.push(
      `${dA} and ${dB} naturally balance each other's elemental qualities (${DOSHA_META[dA].elements.split(' ')[0]} meets ${DOSHA_META[dB].elements.split(' ')[0]}).`
    );
  } else {
    strengths.push(
      `Shared ${dA} constitution brings immediate mutual empathy around daily pace, appetite, and sensory needs.`
    );
  }
  strengths.push(
    `Combined ${avgSattva}% Sattvic clarity supports honest communication and shared growth.`
  );

  const frictionPoints: string[] = [];
  if (dA === dB) {
    frictionPoints.push(
      `Double ${dA} energy can amplify ${dA === 'Vata' ? 'restlessness' : dA === 'Pitta' ? 'intensity' : 'inertia'} during high-stress weeks.`
    );
  } else if ((dA === 'Vata' && dB === 'Pitta') || (dA === 'Pitta' && dB === 'Vata')) {
    frictionPoints.push(
      `Vata's spontaneity vs. Pitta's structured schedule benefits from clear agreements around timing.`
    );
  } else {
    frictionPoints.push(
      `Honor different natural speeds — allow ${dB} room to process at their authentic tempo.`
    );
  }

  const ritualAdvice =
    matchType === 'romantic'
      ? 'Share warm, unrushed evening meals and calming breathwork to keep both nervous systems grounded.'
      : matchType === 'business'
      ? `Channel ${dA} strengths into ${dA === 'Vata' ? 'vision & ideation' : dA === 'Pitta' ? 'strategy & execution' : 'operations & client trust'} while ${dB} anchors complementary priorities.`
      : 'Alternate active adventures with restorative nature walks to keep your friendship vibrant.';

  return {
    matchType,
    overallScore,
    doshaChemistryScore,
    gunaHarmonyScore,
    elementalBalanceScore,
    headline: `${profileA.constitutionType} × ${profileB.constitutionType}`,
    summary:
      overallScore >= 85
        ? `High Ayurvedic synergy (${overallScore}%): complementary Doshas and strong Sattvic resonance.`
        : `Harmonious dynamic (${overallScore}%): balanced elemental strengths with mindful pacing.`,
    strengths,
    frictionPoints,
    ritualAdvice,
  };
}
