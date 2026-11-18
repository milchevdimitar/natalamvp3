import {
  AIDoshaAssessment,
  BiometricInput,
  DoshaLevel,
  DoshaPercentages,
  DoshaScores,
  DoshaType,
  HealthGoal,
  VikritiStatus,
} from './ayurveda.types';
import { DOSHA_META } from './ayurveda.data';

export function computePrakritiProfile(
  rawScores: DoshaScores,
  biometrics: BiometricInput
): {
  dominantDosha: DoshaType;
  secondaryDosha: DoshaType;
  percentages: DoshaPercentages;
  bmi: number;
  bmiCategory: string;
  lifeStageDosha: DoshaType;
} {
  const heightM = Math.max(1.2, biometrics.heightCm / 100);
  const bmi = Number((biometrics.weightKg / (heightM * heightM)).toFixed(1));

  // Biometric constitutional weighting (subtle reinforcement alongside questionnaire)
  const adjusted: DoshaScores = {
    vata: (rawScores.vata || 0) + (bmi < 19.5 ? 1.2 : 0),
    pitta: (rawScores.pitta || 0) + (bmi >= 19.5 && bmi <= 25.5 ? 1.0 : 0),
    kapha: (rawScores.kapha || 0) + (bmi > 25.5 ? 1.4 : 0),
  };

  const total = adjusted.vata + adjusted.pitta + adjusted.kapha || 1;
  const vataPct = Math.round((adjusted.vata / total) * 100);
  const pittaPct = Math.round((adjusted.pitta / total) * 100);
  const kaphaPct = Math.max(0, 100 - vataPct - pittaPct);

  const ordered = (['vata', 'pitta', 'kapha'] as DoshaType[]).sort(
    (a, b) => adjusted[b] - adjusted[a]
  );

  const bmiCategory =
    bmi < 18.5
      ? 'Lean / Underweight'
      : bmi < 25
      ? 'Balanced Weight'
      : bmi < 30
      ? 'Elevated Mass'
      : 'High Mass';

  // Ayurvedic stages of life (Kala): <25 Kapha, 25-55 Pitta, >55 Vata
  const lifeStageDosha: DoshaType =
    biometrics.age < 25 ? 'kapha' : biometrics.age <= 55 ? 'pitta' : 'vata';

  return {
    dominantDosha: ordered[0],
    secondaryDosha: ordered[1],
    percentages: { vata: vataPct, pitta: pittaPct, kapha: kaphaPct },
    bmi,
    bmiCategory,
    lifeStageDosha,
  };
}

export function computeVikritiStatus(
  vikritiScores: DoshaScores,
  dominantPrakriti: DoshaType
): VikritiStatus {
  const toLevel = (val: number): DoshaLevel => {
    if (val <= 0) return 'Low';
    if (val === 1) return 'Moderate';
    return 'High';
  };

  const vataLevel = toLevel(vikritiScores.vata);
  const pittaLevel = toLevel(vikritiScores.pitta);
  const kaphaLevel = toLevel(vikritiScores.kapha);

  const ordered = (['vata', 'pitta', 'kapha'] as DoshaType[]).sort(
    (a, b) => vikritiScores[b] - vikritiScores[a]
  );

  const totalSymptoms = vikritiScores.vata + vikritiScores.pitta + vikritiScores.kapha;
  const imbalancedDosha = totalSymptoms > 0 ? ordered[0] : dominantPrakriti;

  const agniState: VikritiStatus['agniState'] =
    totalSymptoms === 0
      ? 'Sama (Balanced)'
      : imbalancedDosha === 'vata'
      ? 'Vishama (Irregular)'
      : imbalancedDosha === 'pitta'
      ? 'Tikshna (Sharp/Hyper)'
      : 'Manda (Slow)';

  const amaLevel: VikritiStatus['amaLevel'] =
    totalSymptoms >= 5 ? 'Elevated' : totalSymptoms >= 2 ? 'Moderate' : 'Low';

  const ojasScore = Math.max(42, Math.min(96, 92 - totalSymptoms * 6));

  return {
    vata: vataLevel,
    pitta: pittaLevel,
    kapha: kaphaLevel,
    imbalancedDosha,
    agniState,
    amaLevel,
    ojasScore,
  };
}

export function generateAIDoshaAssessment(
  dominant: DoshaType,
  secondary: DoshaType,
  percentages: DoshaPercentages,
  vikriti: VikritiStatus,
  biometrics: BiometricInput,
  goal: HealthGoal
): AIDoshaAssessment {
  const isDual = Math.abs(percentages[dominant] - percentages[secondary]) <= 12;
  const constitutionLabel = isDual
    ? `${DOSHA_META[dominant].title}-${DOSHA_META[secondary].title}`
    : `${DOSHA_META[dominant].title} Dominant`;

  const focusDosha = vikriti.imbalancedDosha;

  const physiologicalFocus: string[] = [
    `Primary Prakriti (${constitutionLabel}): ${DOSHA_META[dominant].traits}`,
    `Current Vikriti Priority (${DOSHA_META[focusDosha].title} ${vikriti[focusDosha]}): ${
      focusDosha === 'vata'
        ? 'Stabilize nervous system rhythm, hydration, and regular warm meals.'
        : focusDosha === 'pitta'
        ? 'Cool systemic inflammation, soothe liver/gastric heat, and pace ambition.'
        : 'Stimulate lymphatic circulation, metabolic Agni, and morning movement.'
    }`,
    `Digestive Fire (${vikriti.agniState}) & Ojas Vitality (${vikriti.ojasScore}%): ${
      vikriti.amaLevel === 'Low'
        ? 'Clean metabolic absorption with strong baseline resilience.'
        : 'Support gentle Ama clearance via warm CCF tea and cooked whole foods.'
    }`,
  ];

  const dailyRhythmProtocol: string[] = [
    focusDosha === 'kapha'
      ? 'Wake before 6:00 AM during Kapha hours; begin with brisk movement and warm ginger-lemon water.'
      : 'Wake near sunrise; perform 3-minute tongue scraping and warm water hydration.',
    goal === 'hypertension'
      ? 'Practice 10 minutes of Nadi Shodhana & Apana Vayu Mudra twice daily to calm vascular tone.'
      : goal === 'weight_loss'
      ? 'Make lunch (12:00–1:30 PM) your largest meal when Pitta digestive fire peaks; keep dinner light before 7:00 PM.'
      : 'Eat your main meal at midday when Agni is strongest, followed by a 10-minute gentle walk.',
    focusDosha === 'vata'
      ? 'Apply warm sesame oil (Abhyanga) to feet and temples before a 10:00 PM wind-down.'
      : focusDosha === 'pitta'
      ? 'Disconnect from screens 45 minutes before bed; favor cool bedroom air and Moonlight meditation.'
      : 'Avoid daytime naps and keep evening meals light and spiced with black pepper and turmeric.',
  ];

  return {
    constitutionLabel,
    headline: `${constitutionLabel} Constitution · ${DOSHA_META[focusDosha].title}-Pacifying Focus`,
    summary: `At age ${biometrics.age}, your innate ${constitutionLabel} blueprint benefits most from pacifying ${DOSHA_META[focusDosha].title} (${vikriti[focusDosha]} Vikriti) while aligning daily meals and breathwork with your ${goal.replace('_', ' ')} goal.`,
    physiologicalFocus,
    dailyRhythmProtocol,
    clinicalNote:
      'Ayurvedic lifestyle and dietary guidance complements—and does not replace—individualized care from your licensed healthcare provider.',
  };
}

export function generateAIWellnessReply(
  prompt: string,
  dominant: DoshaType,
  vikriti: VikritiStatus,
  goal: HealthGoal,
  biometrics: BiometricInput
): string {
  const q = prompt.toLowerCase();
  const focus = vikriti.imbalancedDosha;
  const doshaTitle = DOSHA_META[focus].title;

  if (q.includes('diet') || q.includes('eat') || q.includes('food') || q.includes('meal')) {
    if (focus === 'vata') {
      return `For your ${DOSHA_META[dominant].title} constitution with ${doshaTitle} active, prioritize warm, cooked, moist meals—like Golden Mung Khichdi, spiced oats, and roasted root vegetables with ghee, cumin, and ginger. Avoid iced drinks and raw salads, especially at dinner.`;
    }
    if (focus === 'pitta') {
      return `To cool ${doshaTitle} while supporting your ${goal.replace('_', ' ')} goal, build meals around basmati rice, quinoa, steamed greens, cucumber, cilantro, and fennel. Minimize chili, vinegar, caffeine, and late-night heavy eating.`;
    }
    return `To invigorate ${doshaTitle} metabolism, favor light, warm, spiced dishes—such as red lentil dal, buckwheat, steamed cruciferous greens, ginger, turmeric, and black pepper. Keep portions moderate and avoid heavy dairy or cold sweets.`;
  }

  if (q.includes('blood pressure') || q.includes('hypertension') || q.includes('heart')) {
    return `In Ayurveda, healthy blood pressure combines Vata nervous-system calm with Pitta cooling. Sip warm Hibiscus-Coriander-Fennel tea, keep sodium low while boosting potassium-rich greens and squash, and practice 8 rounds of Nadi Shodhana (Alternate Nostril Breathing) with Apana Vayu Mudra daily alongside your physician's guidance.`;
  }

  if (q.includes('weight') || q.includes('fat') || q.includes('metabolism')) {
    return `Based on your current weight (${biometrics.weightKg} kg → target ${biometrics.targetWeightKg} kg), Ayurveda recommends eating your largest meal at midday (12:00–1:30 PM), sipping warm CCF (Cumin-Coriander-Fennel) tea between meals instead of snacking, and finishing dinner at least 3 hours before sleep.`;
  }

  if (q.includes('yoga') || q.includes('breath') || q.includes('pranayama') || q.includes('stress') || q.includes('sleep')) {
    return `For ${doshaTitle} balance today: practice ${
      focus === 'vata'
        ? '15 minutes of slow Grounding Sun-Earth poses followed by Legs-Up-The-Wall and Nadi Shodhana'
        : focus === 'pitta'
        ? '18 minutes of Moon Salutations and Sheetali Cooling Breath to release heat and mental tension'
        : '20 minutes of dynamic Sun Salutations and Kapalabhati breathwork to boost circulation'
    }. Finish with Prana Mudra for 5–10 minutes.`;
  }

  return `Your ${DOSHA_META[dominant].title} Prakriti (with ${doshaTitle} at ${vikriti[focus]} Vikriti and ${vikriti.agniState} Agni) thrives on rhythmic daily anchors: warm CCF tea before meals, a nourishing midday lunch tailored to your ${goal.replace('_', ' ')} goal, and 10 minutes of ${doshaTitle}-pacifying Pranayama in the evening.`;
}