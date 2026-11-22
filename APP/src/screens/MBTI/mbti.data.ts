import { Question, TypeDescription } from './mbti.types';

export const ITEMS_PER_PAGE = 5;

export const QUESTIONS: Question[] = [
  // E vs I (1-10)
  { id: 1, text: 'You feel energized when spending time with a large group of people.', dimension: 'EI', direction: 1 },
  { id: 2, text: 'You prefer a quiet environment at home over a loud party.', dimension: 'EI', direction: -1 },
  { id: 3, text: 'You enjoy starting conversations with new and unfamiliar people.', dimension: 'EI', direction: 1 },
  { id: 4, text: 'You often feel drained after prolonged social interaction.', dimension: 'EI', direction: -1 },
  { id: 5, text: 'You easily express your thoughts out loud in a group setting.', dimension: 'EI', direction: 1 },
  { id: 6, text: 'You prefer a few close friends over a wide circle of acquaintances.', dimension: 'EI', direction: -1 },
  { id: 7, text: 'You get excited about social events and dynamic gatherings.', dimension: 'EI', direction: 1 },
  { id: 8, text: 'You need alone time to recharge after a long day.', dimension: 'EI', direction: -1 },
  { id: 9, text: 'You act quickly and spontaneously in social situations.', dimension: 'EI', direction: 1 },
  { id: 10, text: 'You prefer written communication over phone calls.', dimension: 'EI', direction: -1 },

  // S vs N (11-20)
  { id: 11, text: 'You focus more on concrete facts than on abstract theories.', dimension: 'SN', direction: 1 },
  { id: 12, text: 'You often get caught up in daydreams and theories about the future.', dimension: 'SN', direction: -1 },
  { id: 13, text: 'You trust practical experience more than intuition.', dimension: 'SN', direction: 1 },
  { id: 14, text: 'You are fascinated by hidden meanings and symbolism behind things.', dimension: 'SN', direction: -1 },
  { id: 15, text: 'You prefer clear, step-by-step instructions.', dimension: 'SN', direction: 1 },
  { id: 16, text: 'You enjoy searching for new, unconventional ways to solve familiar problems.', dimension: 'SN', direction: -1 },
  { id: 17, text: 'You notice details in your environment that others tend to miss.', dimension: 'SN', direction: 1 },
  { id: 18, text: 'You are more interested in big ideas than in detailed execution.', dimension: 'SN', direction: -1 },
  { id: 19, text: 'You consider yourself a realist with a practical outlook on life.', dimension: 'SN', direction: 1 },
  { id: 20, text: 'You often have strong intuitive insights that turn out to be true.', dimension: 'SN', direction: -1 },

  // T vs F (21-30)
  { id: 21, text: 'When making decisions, you rely primarily on logic and objective analysis.', dimension: 'TF', direction: 1 },
  { id: 22, text: "It is more important to you to preserve harmony and people's feelings.", dimension: 'TF', direction: -1 },
  { id: 23, text: "You believe the truth is more important than sparing someone's feelings.", dimension: 'TF', direction: 1 },
  { id: 24, text: 'You easily empathize with the emotions and experiences of others.', dimension: 'TF', direction: -1 },
  { id: 25, text: 'You evaluate situations objectively without bringing in personal emotions.', dimension: 'TF', direction: 1 },
  { id: 26, text: 'You often make decisions based on your personal values and morals.', dimension: 'TF', direction: -1 },
  { id: 27, text: 'Constructive criticism should be direct, even if it might hurt.', dimension: 'TF', direction: 1 },
  { id: 28, text: 'You always consider how your decisions will affect those around you.', dimension: 'TF', direction: -1 },
  { id: 29, text: 'You convince others using facts and arguments rather than emotional appeals.', dimension: 'TF', direction: 1 },
  { id: 30, text: 'Compassion and forgiveness are more important than strict justice.', dimension: 'TF', direction: -1 },

  // J vs P (31-40)
  { id: 31, text: 'You like having a clear schedule and planned tasks for the day.', dimension: 'JP', direction: 1 },
  { id: 32, text: 'You prefer keeping options open and acting according to the situation.', dimension: 'JP', direction: -1 },
  { id: 33, text: 'You complete your tasks well ahead of deadline.', dimension: 'JP', direction: 1 },
  { id: 34, text: 'You work best under a burst of inspiration at the last minute.', dimension: 'JP', direction: -1 },
  { id: 35, text: 'You feel at ease when everything is tidy and organized.', dimension: 'JP', direction: 1 },
  { id: 36, text: 'Improvisation is one of your strongest assets.', dimension: 'JP', direction: -1 },
  { id: 37, text: 'You plan your trips and vacations in detail in advance.', dimension: 'JP', direction: 1 },
  { id: 38, text: 'You are annoyed by overly strict rules and rigid structures.', dimension: 'JP', direction: -1 },
  { id: 39, text: 'You always follow a clear system and structure in your work.', dimension: 'JP', direction: 1 },
  { id: 40, text: 'You easily change your plans on the go without feeling stressed.', dimension: 'JP', direction: -1 },
];

export const TYPE_DESCRIPTIONS: Record<string, TypeDescription> = {
  INFP: {
    title: 'The Mediator',
    subtitle: 'Poetic, kind and altruistic spirit',
    desc: 'You are idealists, guided by deep personal values and a desire for authenticity.',
    traits: ['Empathy', 'Creativity', 'Idealism', 'Flexibility'],
  },
  INFJ: {
    title: 'The Advocate',
    subtitle: 'Quiet and mystical, yet inspiring idealist',
    desc: 'You possess a rare balance of visionary intuition and determination to bring about change.',
    traits: ['Intuition', 'Determination', 'Depth', 'Integrity'],
  },
  INTJ: {
    title: 'The Architect',
    subtitle: 'Strategic thinker with a plan for everything',
    desc: 'You are independent, analytical, and pursue knowledge and logical perfection.',
    traits: ['Strategy', 'Independence', 'Logic', 'Vision'],
  },
  INTP: {
    title: 'The Logician',
    subtitle: 'Innovative inventor with an unquenchable thirst for knowledge',
    desc: 'You love theory, deconstructing ideas, and searching for universal truths.',
    traits: ['Analytical', 'Originality', 'Open-minded', 'Curiosity'],
  },
  ENFP: {
    title: 'The Campaigner',
    subtitle: 'Enthusiastic, creative, and free spirit',
    desc: 'You energize those around you with positivity, new ideas, and warmth.',
    traits: ['Enthusiasm', 'Charisma', 'Imagination', 'Spontaneity'],
  },
  ENFJ: {
    title: 'The Protagonist',
    subtitle: 'Charismatic and inspiring leader',
    desc: 'You have a natural gift for seeing potential in others and bringing people together.',
    traits: ['Leadership', 'Empathy', 'Organization', 'Inspiration'],
  },
  ENTJ: {
    title: 'The Commander',
    subtitle: 'Bold and decisive strategic leader',
    desc: 'You find ways where others see obstacles and achieve ambitious goals.',
    traits: ['Decisiveness', 'Strategy', 'Efficiency', 'Confidence'],
  },
  ENTP: {
    title: 'The Debater',
    subtitle: 'Smart and curious thinker who loves a challenge',
    desc: 'You are masters of intellectual debate and uncovering new perspectives.',
    traits: ['Quick Wit', 'Innovation', 'Energy', 'Non-conformity'],
  },
  ISTJ: {
    title: 'The Logistician',
    subtitle: 'Practical and fact-minded individual with high reliability',
    desc: 'You value tradition, order, precision, and taking personal responsibility.',
    traits: ['Reliability', 'Structure', 'Honesty', 'Practicality'],
  },
  ISFJ: {
    title: 'The Defender',
    subtitle: 'Dedicated and warm protector',
    desc: 'You are warm, caring, and always ready to protect your loved ones.',
    traits: ['Loyalty', 'Care', 'Patience', 'Support'],
  },
  ESTJ: {
    title: 'The Executive',
    subtitle: 'Excellent administrator with practical sense',
    desc: 'You organize projects and people with tradition, stability, and clear rules.',
    traits: ['Firmness', 'Organization', 'Leadership', 'Logic'],
  },
  ESFJ: {
    title: 'The Consul',
    subtitle: 'Extraordinarily caring and social person',
    desc: 'For you, community harmony and supporting loved ones come first.',
    traits: ['Sociability', 'Warmth', 'Duty', 'Harmony'],
  },
  ISTP: {
    title: 'The Virtuoso',
    subtitle: 'Bold and practical experimenters',
    desc: 'You love exploring the world with your hands and mind, masters of tools.',
    traits: ['Practicality', 'Calmness', 'Spontaneity', 'Problem Solving'],
  },
  ISFP: {
    title: 'The Adventurer',
    subtitle: 'Flexible and charming artists',
    desc: 'You live in the present moment and express yourselves through aesthetics, freedom, and kindness.',
    traits: ['Artistry', 'Passion', 'Freedom', 'Empathy'],
  },
  ESTP: {
    title: 'The Entrepreneur',
    subtitle: 'Smart, energetic, and perceptive people',
    desc: 'You love risks, dynamics, and swift practical actions here and now.',
    traits: ['Boldness', 'Perceptiveness', 'Energy', 'Practicality'],
  },
  ESFP: {
    title: 'The Entertainer',
    subtitle: 'Spontaneous, enthusiastic, and lively people',
    desc: 'You love life, fun, and sharing joyful moments with those around you.',
    traits: ['Vivacity', 'Enthusiasm', 'Aesthetics', 'Friendship'],
  },
};