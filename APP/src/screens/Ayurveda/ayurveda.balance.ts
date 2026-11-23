import { DOSHA_CATEGORIES } from './ayurveda.data';
import type { DoshaName } from './ayurveda.types';

const descriptions = {
  Vata: 'Vata is traditionally associated with movement and change. This result emphasizes curiosity and adaptability. A steady routine can give those qualities room to grow.',
  Pitta: 'Pitta is associated with heat and transformation. This result emphasizes focus and initiative. Making time to slow down can help you use that drive more comfortably.',
  Kapha: 'Kapha is associated with steadiness and nourishment. This result emphasizes patience and consistency. Small changes can bring variety to a familiar routine.',
  'Vata-Pitta': 'Vata’s curiosity pairs with Pitta’s focus, which can help you act on ideas. Try choosing one idea at a time and giving it enough attention to see where it goes.',
  'Pitta-Vata': 'Pitta’s drive pairs with Vata’s flexibility and new ideas. Set a clear priority and leave time to explore a different approach if needed.',
  'Vata-Kapha': 'Vata’s adaptability pairs with Kapha’s steadiness. Try bringing something new into a familiar routine, such as taking a different route on your usual walk.',
  'Kapha-Vata': 'Kapha’s steadiness pairs with Vata’s curiosity. Keep the routines that support you and make a little space for spontaneous plans.',
  'Pitta-Kapha': 'Pitta’s focus pairs with Kapha’s staying power. Use that combination to work toward a clear goal at a pace you can sustain.',
  'Kapha-Pitta': 'Kapha’s patience pairs with Pitta’s sense of direction. Choose one achievable next step when you want to turn a steady routine into a new priority.',
  Samadosha: 'Your three scores are close. In Ayurveda, this pattern is called Samadosha. A mix of regular routines, rest and movement gives you room to adapt as your days change.',
};

// Display thresholds for Natala's questionnaire. All differences are percentage points.
export function describeDoshaBalance(scores: readonly number[]) {
  const doshas = DOSHA_CATEGORIES.map(([name, color], index) => ({ name, color, value: scores[index] }))
    .sort((a, b) => b.value - a.value);
  const [first, second, third] = doshas;
  const type = first.value - third.value <= 8 ? 'Samadosha'
    : first.value - second.value <= 10 ? `${first.name}-${second.name}` as keyof typeof descriptions : first.name;
  return { type, description: descriptions[type], doshas };
}

export function doshaScoreBand(score: number) {
  if (score >= 40) return 'higher';
  if (score <= 26) return 'lower';
  return 'even';
}

export const doshaTips: Record<DoshaName, Record<'general' | 'higher' | 'lower', string>> = {
  Vata: {
    general: 'Give your day a reliable rhythm with regular times for meals, movement and rest.',
    higher: 'If your day feels scattered, leave a short pause between tasks and choose one calming evening habit.',
    lower: 'If you feel stuck in the same routine, try a new walking route or give yourself a few minutes for a creative activity.',
  },
  Pitta: {
    general: 'Alternate periods of focused work with breaks that give you space to reset.',
    higher: 'When you feel driven to keep pushing, step away from the task for a few minutes or choose an easier pace for your next activity.',
    lower: 'If it feels hard to get started, pick one clear priority and break it into a step you can finish today.',
  },
  Kapha: {
    general: 'Keep the routines that help you feel steady and make room for regular movement and variety.',
    higher: 'When your routine feels sluggish, start with a short brisk walk, a stretch break or a change of scenery.',
    lower: 'If your schedule feels unsettled, choose one grounding habit you can repeat, such as an unhurried meal or a familiar evening walk.',
  },
};
