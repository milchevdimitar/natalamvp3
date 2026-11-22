import {
  AyurvedaQuizQuestion,
  DoshaName,
  HerbAndSpiceItem,
  PracticeItem,
  SubdoshaItem,
} from './ayurveda.types';

export const DOSHA_META: Record<
  DoshaName,
  {
    sanskrit: string;
    elements: string;
    qualities: string;
    color: string;
    archetypeTitle: string;
    archetypeSummary: string;
    strengths: string;
    watchOuts: string;
  }
> = {
  Vata: {
    sanskrit: 'वात · Wind & Ether',
    elements: 'Ether (Akasha) + Air (Vayu)',
    qualities: 'Light · Dry · Mobile · Cool · Subtle',
    color: '#8B5CF6',
    archetypeTitle: 'The Visionary Creator',
    archetypeSummary:
      'Quick-minded, imaginative, and adaptable, thriving on inspiration, movement, and creative freedom.',
    strengths: 'Creativity, enthusiasm, rapid learning, intuition, and spiritual receptivity.',
    watchOuts: 'Irregular appetite, scattered focus, dry skin, or restlessness when overstimulated.',
  },
  Pitta: {
    sanskrit: 'पित्त · Fire & Water',
    elements: 'Fire (Tejas) + Water (Apas)',
    qualities: 'Hot · Sharp · Light · Liquid · Penetrating',
    color: '#EF4444',
    archetypeTitle: 'The Transformative Leader',
    archetypeSummary:
      'Focused, courageous, and articulate, driven by clarity, mastery, and purposeful execution.',
    strengths: 'Strong digestion, sharp intellect, leadership, discernment, and natural charisma.',
    watchOuts: 'Overheating, impatience, perfectionism, or acidity when skipping meals or rest.',
  },
  Kapha: {
    sanskrit: 'कफ · Earth & Water',
    elements: 'Earth (Prithvi) + Water (Apas)',
    qualities: 'Steady · Cool · Heavy · Soft · Grounded',
    color: '#10B981',
    archetypeTitle: 'The Grounded Nurturer',
    archetypeSummary:
      'Calm, loyal, and resilient, anchoring others with emotional warmth, stamina, and steady devotion.',
    strengths: 'Deep endurance, compassion, calm memory, immune strength, and unwavering loyalty.',
    watchOuts: 'Sluggishness, attachment, congestion, or resistance to change when under-stimulated.',
  },
};

export const PRAKRITI_QUIZ_QUESTIONS: AyurvedaQuizQuestion[] = [
  {
    id: 'q1',
    category: 'Body Frame',
    prompt: 'Natural physical build & skeletal structure:',
    options: [
      { dosha: 'Vata', label: 'Slender, light joints, prominent collarbones' },
      { dosha: 'Pitta', label: 'Medium, athletic, well-proportioned muscle tone' },
      { dosha: 'Kapha', label: 'Solid, broad shoulders/hips, strong endurance' },
    ],
  },
  {
    id: 'q2',
    category: 'Digestion',
    prompt: 'Appetite & digestive rhythm:',
    options: [
      { dosha: 'Vata', label: 'Variable — sometimes forget to eat, prone to bloating' },
      { dosha: 'Pitta', label: 'Strong & sharp — irritable if meals are delayed' },
      { dosha: 'Kapha', label: 'Steady & slow — can skip meals easily without hunger' },
    ],
  },
  {
    id: 'q3',
    category: 'Mind & Focus',
    prompt: 'Learning style & mental tempo:',
    options: [
      { dosha: 'Vata', label: 'Fast ideation, creative leaps, easily distracted' },
      { dosha: 'Pitta', label: 'Analytical, decisive, laser-focused on goals' },
      { dosha: 'Kapha', label: 'Methodical, calm absorption, strong long-term memory' },
    ],
  },
  {
    id: 'q4',
    category: 'Sleep',
    prompt: 'Natural sleep pattern:',
    options: [
      { dosha: 'Vata', label: 'Light sleeper, active dreams, wakes easily' },
      { dosha: 'Pitta', label: 'Sound 6–7 hours, wakes alert and ready to act' },
      { dosha: 'Kapha', label: 'Deep, heavy 8+ hours, loves slow mornings' },
    ],
  },
  {
    id: 'q5',
    category: 'Temperature',
    prompt: 'Climate & temperature preference:',
    options: [
      { dosha: 'Vata', label: 'Dislikes cold & wind; thrives in warm, humid weather' },
      { dosha: 'Pitta', label: 'Runs warm; prefers cool, crisp, shaded environments' },
      { dosha: 'Kapha', label: 'Dislikes damp chill; enjoys warm, dry sunshine' },
    ],
  },
  {
    id: 'q6',
    category: 'Stress',
    prompt: 'Default reaction under pressure:',
    options: [
      { dosha: 'Vata', label: 'Worry, overthinking, feeling ungrounded' },
      { dosha: 'Pitta', label: 'Frustration, intensity, taking over control' },
      { dosha: 'Kapha', label: 'Withdrawal, quiet resistance, holding onto feelings' },
    ],
  },
];

export const SUBDOSHAS_BY_DOSHA: Record<DoshaName, SubdoshaItem[]> = {
  Vata: [
    {
      name: 'Prana Vata',
      dosha: 'Vata',
      domain: 'Mind, Breath & Sensory Perception',
      status: 'Elevated',
      tip: 'Practice slow nasal breathing (Nadi Shodhana) and limit late-night screen exposure.',
    },
    {
      name: 'Samana Vata',
      dosha: 'Vata',
      domain: 'Digestive Motility & Absorption',
      status: 'Needs Grounding',
      tip: 'Eat warm, cooked meals at consistent hours with cumin and fresh ginger.',
    },
    {
      name: 'Apana Vata',
      dosha: 'Vata',
      domain: 'Downward Grounding & Elimination',
      status: 'Needs Grounding',
      tip: 'Warm sesame oil self-massage (Abhyanga) and soaked prunes or stewed apples.',
    },
  ],
  Pitta: [
    {
      name: 'Pachaka Pitta',
      dosha: 'Pitta',
      domain: 'Digestive Fire & Nutrient Transformation',
      status: 'Elevated',
      tip: 'Favor cooling herbs like fennel, coriander, and mint; avoid skipping lunch.',
    },
    {
      name: 'Sadhaka Pitta',
      dosha: 'Pitta',
      domain: 'Heart Clarity, Courage & Emotional Processing',
      status: 'Harmonious',
      tip: 'Evening walks in moonlight or nature and rose-water hydration soften intensity.',
    },
    {
      name: 'Alochaka Pitta',
      dosha: 'Pitta',
      domain: 'Visual Perception & Focus',
      status: 'Elevated',
      tip: 'Take 5-minute horizon breaks away from bright monitors every 90 minutes.',
    },
  ],
  Kapha: [
    {
      name: 'Avalambaka Kapha',
      dosha: 'Kapha',
      domain: 'Chest, Lungs & Emotional Resilience',
      status: 'Elevated',
      tip: 'Invigorating morning cardio and warm tulsi-ginger tea keep respiratory Qi light.',
    },
    {
      name: 'Kledaka Kapha',
      dosha: 'Kapha',
      domain: 'Stomach Lining & Moisture Balance',
      status: 'Harmonious',
      tip: 'Start the morning with warm water, lemon, and a pinch of black pepper or ginger.',
    },
    {
      name: 'Tarpaka Kapha',
      dosha: 'Kapha',
      domain: 'Nervous System Lubrication & Memory',
      status: 'Harmonious',
      tip: 'Stimulate curiosity with novel learning, vigorous breathwork, and dry brushing.',
    },
  ],
};

export const HERBS_BY_DOSHA: Record<DoshaName, HerbAndSpiceItem[]> = {
  Vata: [
    {
      name: 'Ashwagandha',
      sanskrit: 'Withania somnifera',
      targetDoshas: 'Pacifies Vata & Kapha',
      benefit: 'Deep nervous system adaptogen that builds Ojas, stamina, and restorative sleep.',
      usage: '1/2 tsp in warm almond or oat milk with nutmeg 45 minutes before bed.',
    },
    {
      name: 'Fresh Ginger & Cumin',
      sanskrit: 'Ardraka & Jeeraka',
      targetDoshas: 'Kindles Vishama Agni',
      benefit: 'Warms cold digestion, eliminates gas, and stabilizes variable appetite.',
      usage: 'Steep fresh ginger slices with cumin seeds before meals.',
    },
    {
      name: 'Sesame & Shatavari',
      sanskrit: 'Tila & Asparagus racemosus',
      targetDoshas: 'Nourishes Vata & Pitta',
      benefit: 'Replenishes tissue moisture, calms dryness, and supports emotional steadiness.',
      usage: 'Warm sesame oil Abhyanga before showering; Shatavari tea in afternoon.',
    },
  ],
  Pitta: [
    {
      name: 'Brahmi (Gotu Kola)',
      sanskrit: 'Centella asiatica',
      targetDoshas: 'Cools Pitta & Calms Vata',
      benefit: 'Cools an overheated mind, sharpens Sattvic clarity, and eases mental tension.',
      usage: 'Herbal infusion mid-afternoon or morning tonic.',
    },
    {
      name: 'Coriander, Fennel & Rose',
      sanskrit: 'Dhanyaka · Shatapushpa · Taruni',
      targetDoshas: 'Pacifies Pitta',
      benefit: 'Gently cools excess heat in the stomach and liver without dampening Agni.',
      usage: 'CCF + Rose petal tea sipped warm or room-temperature after lunch.',
    },
    {
      name: 'Amla (Indian Gooseberry)',
      sanskrit: 'Amalaki',
      targetDoshas: 'Tridoshic · Pitta Rasayana',
      benefit: 'Rich natural antioxidant supporting cellular Tejas, skin radiance, and healthy acidity.',
      usage: '1/2 tsp Amalaki powder in warm water each morning.',
    },
  ],
  Kapha: [
    {
      name: 'Tulsi (Holy Basil)',
      sanskrit: 'Ocimum sanctum',
      targetDoshas: 'Clears Kapha & Vata',
      benefit: 'Uplifts sluggish energy, clears respiratory channels, and awakens mental brightness.',
      usage: 'Hot Tulsi-ginger tea upon waking instead of heavy dairy drinks.',
    },
    {
      name: 'Trikatu (Ginger, Black Pepper, Long Pepper)',
      sanskrit: 'Trikatu Churna',
      targetDoshas: 'Kindles Manda Agni',
      benefit: 'Clears Ama stagnation, boosts metabolic fire, and prevents post-meal heaviness.',
      usage: 'Pinch with raw honey or sprinkled over warm cooked vegetables.',
    },
    {
      name: 'Turmeric & Cinnamon',
      sanskrit: 'Haridra & Twak',
      targetDoshas: 'Balances Kapha',
      benefit: 'Supports healthy circulation, joint mobility, and balanced blood sugar.',
      usage: 'Warm spiced infusion with black pepper before midday.',
    },
  ],
};

export const PRACTICES_BY_DOSHA: Record<DoshaName, PracticeItem[]> = {
  Vata: [
    {
      category: 'Pranayama',
      title: 'Alternate Nostril Breathing',
      sanskrit: 'Nadi Shodhana',
      duration: '7 min',
      description: 'Harmonizes left and right brain hemispheres and settles restless Vata wind.',
    },
    {
      category: 'Yoga Asana',
      title: 'Slow Grounding Flow & Child’s Pose',
      sanskrit: 'Balasana & Paschimottanasana',
      duration: '20 min',
      description: 'Seated forward folds and steady hip openers anchor Apana Vata downward.',
    },
    {
      category: 'Marma & Sensory',
      title: 'Warm Sesame Oil Self-Massage',
      sanskrit: 'Abhyanga',
      duration: '10 min',
      description: 'Apply warm sesame oil to soles of feet, scalp, and joints before a warm shower.',
    },
  ],
  Pitta: [
    {
      category: 'Pranayama',
      title: 'Cooling Lunar Breath',
      sanskrit: 'Sheetali / Chandra Bhedana',
      duration: '6 min',
      description: 'Inhale gently through the left nostril or curled tongue to release internal heat.',
    },
    {
      category: 'Yoga Asana',
      title: 'Moon Salutations & Gentle Twists',
      sanskrit: 'Chandra Namaskar',
      duration: '20 min',
      description: 'Non-competitive, fluid heart openers and abdominal twists release liver heat.',
    },
    {
      category: 'Marma & Sensory',
      title: 'Sandalwood / Rose Temple Cooling',
      sanskrit: 'Sthapani Marma',
      duration: '5 min',
      description: 'Cool rosewater compress on eyes and third-eye point after focused screen work.',
    },
  ],
  Kapha: [
    {
      category: 'Pranayama',
      title: 'Skull-Shining Breath',
      sanskrit: 'Kapalabhati / Bhastrika',
      duration: '5 min',
      description: 'Brisk, energizing exhalations clear lethargy and awaken Prana in the chest.',
    },
    {
      category: 'Yoga Asana',
      title: 'Dynamic Sun Salutations & Backbends',
      sanskrit: 'Surya Namaskar & Bhujangasana',
      duration: '25 min',
      description: 'Vigorous chest-opening movement builds heat, lightness, and circulation.',
    },
    {
      category: 'Marma & Sensory',
      title: 'Silk Glove Dry Brushing',
      sanskrit: 'Garshana',
      duration: '6 min',
      description: 'Invigorating dry lymphatic brushing toward the heart before a morning shower.',
    },
  ],
};