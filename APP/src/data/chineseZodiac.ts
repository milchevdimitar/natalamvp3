export const animals = [
  { name: 'Rat', hanzi: '鼠', theme: 'Ingenuity', meaning: 'The Rat finds openings that others miss. Its story is about curiosity, careful observation, and making the most of what is at hand.', prompt: 'Which small opportunity deserves a closer look?' },
  { name: 'Ox', hanzi: '牛', theme: 'Steadiness', meaning: 'The Ox represents patient effort and the quiet strength of a promise kept. It builds trust through consistency.', prompt: 'What would steady progress look like this week?' },
  { name: 'Tiger', hanzi: '虎', theme: 'Courage', meaning: 'The Tiger symbolizes initiative and the daring to move first. Its challenge is to pair boldness with good timing.', prompt: 'Where can you take a brave, considered step?' },
  { name: 'Rabbit', hanzi: '兔', theme: 'Sensitivity', meaning: 'The Rabbit brings attention to tact, imagination, and the ability to create a sense of safety in unfamiliar places.', prompt: 'What would make your surroundings feel more supportive?' },
  { name: 'Dragon', hanzi: '龍', theme: 'Vision', meaning: 'The Dragon symbolizes ambition and a generous imagination. Its energy invites big ideas to find a practical form.', prompt: 'What one action would give a big idea a real start?' },
  { name: 'Snake', hanzi: '蛇', theme: 'Discernment', meaning: 'The Snake is associated with reflection and uncovering what lies beneath the surface. It values the time it takes to see clearly.', prompt: 'What becomes clearer when you pause before responding?' },
  { name: 'Horse', hanzi: '馬', theme: 'Independence', meaning: 'The Horse represents momentum, freedom, and the pleasure of exploring new directions. Purpose gives that energy a place to go.', prompt: 'Which direction would you choose with more room to move?' },
  { name: 'Goat', hanzi: '羊', theme: 'Care', meaning: 'The Goat symbolizes empathy and a feel for what makes ordinary life more beautiful. It values mutual support and gentle persistence.', prompt: 'What small act of care could change the atmosphere around you?' },
  { name: 'Monkey', hanzi: '猴', theme: 'Experimentation', meaning: 'The Monkey represents playful intelligence, quick adaptation, and the freedom to try an unexpected solution.', prompt: 'What could you learn by trying a different approach?' },
  { name: 'Rooster', hanzi: '雞', theme: 'Clarity', meaning: 'The Rooster is associated with attentiveness, precision, and the confidence to make intentions visible.', prompt: 'What detail would make your next decision clearer?' },
  { name: 'Dog', hanzi: '狗', theme: 'Loyalty', meaning: 'The Dog represents fairness, reliability, and showing up for the people and principles you care about.', prompt: 'Which commitment feels most worthy of your attention today?' },
  { name: 'Pig', hanzi: '豬', theme: 'Generosity', meaning: 'The Pig symbolizes warmth, hospitality, and the ability to enjoy what life offers while making room for others.', prompt: 'What would it look like to receive as kindly as you give?' },
] as const;

const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'] as const;
const modulo = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

export function chineseZodiacForYear(year: number) {
  // 1984 is Jia-Zi, the Wood Rat and first year of the 60-year cycle.
  const cycle = year - 1984;
  const animalIndex = modulo(cycle, animals.length);
  const stem = modulo(cycle, 10);
  return { animalIndex, animal: animals[animalIndex], element: elements[Math.floor(stem / 2)], polarity: stem % 2 === 0 ? 'Yang' : 'Yin' };
}
