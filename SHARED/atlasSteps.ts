export const atlasVersion = 1;

export type AtlasStep = {
  id: string;
  title: string;
  description: string;
  route?: 'astrology' | 'numerology' | 'chinese-zodiac' | 'ayurveda' | 'mbti' | 'cardology' | 'tarot' | 'bazi';
  requiresBirth?: boolean;
  showMoon?: boolean;
  showMirror?: boolean;
  showJournal?: boolean;
  showTransits?: boolean;
  focusPlanet?: 'venus' | 'mercury';
  choices?: readonly string[];
};

type AtlasChapter = {
  id: string;
  title: string;
  description: string;
  reward: string;
  steps: readonly AtlasStep[];
};

export const atlasChapters: readonly AtlasChapter[] = [
  {
    id: 'who-i-am', title: 'Who I Am',
    description: 'Explore three parts of your birth profile and decide what feels like you.',
    reward: 'Your first constellation',
    steps: [
      { id: 'sun', title: 'Meet your Sun', description: 'Find the sign associated with your sense of identity.', route: 'astrology', requiresBirth: true },
      { id: 'life-path', title: 'Read your Life Path', description: 'See what numerology makes of your birth date.', route: 'numerology', requiresBirth: true },
      { id: 'birth-year', title: 'Meet your birth-year animal', description: 'Explore your animal and element in the Chinese zodiac.', route: 'chinese-zodiac', requiresBirth: true },
      { id: 'recognize', title: 'What do you recognize?', description: 'Choose the description that feels most familiar.', choices: ['My Sun sign', 'My Life Path', 'My birth-year animal', 'I’m still deciding'] },
      { id: 'portrait', title: 'Make it yours', description: 'Choose what you want to carry forward from these readings.', choices: ['Something I recognize', 'Something I want to explore', 'Something I see differently'] },
    ],
  },
  {
    id: 'inner-weather', title: 'My Inner Weather',
    description: 'Notice how today feels, try one small reset and decide what to keep.',
    reward: 'Your Inner Weather constellation',
    steps: [
      { id: 'weather-check-in', title: 'Name your inner weather', description: 'Pause for a moment. What feels closest to where you are today?', choices: ['Quiet', 'Restless', 'Steady', 'A mix'] },
      { id: 'weather-moon', title: 'Look up at the Moon', description: 'Notice the phase. Use it as a reminder to ask what you want to make room for today.', showMoon: true, choices: ['More focus', 'A slower pace', 'Something playful', 'I’m still deciding'] },
      { id: 'weather-reset', title: 'Try a small reset', description: 'Ayurveda offers a way to reflect on your rhythms. Choose one small action you can try right now.', route: 'ayurveda', choices: ['Take a short pause', 'Stretch or walk', 'Put one task aside', 'Come back to this later'] },
      { id: 'weather-reflect', title: 'Notice what changed', description: 'Check in again. What did the reset do for you?', choices: ['I feel more settled', 'I feel more energized', 'I feel much the same', 'I’ll review it later'] },
    ],
  },
  {
    id: 'how-i-connect', title: 'How I Connect',
    description: 'Notice how you show care, what you need, and what makes a conversation easier.',
    reward: 'Your Connections constellation',
    steps: [
      { id: 'connect-care', title: 'How do you show care?', description: 'Think of someone you were glad to be there for. What came most naturally?', choices: ['Listening', 'Making time', 'Doing something useful', 'Saying what I felt'] },
      { id: 'connect-venus', title: 'Read your Venus', description: 'Compare the themes in your Venus placement with a real moment when you felt close to someone.', route: 'astrology', focusPlanet: 'venus', choices: ['There’s a connection', 'Parts feel familiar', 'My experience differs', 'I’ll explore it later'] },
      { id: 'connect-archetypes', title: 'Ask for what you need', description: 'Use 16 Archetypes as a starting point. Choose a request you could actually make this week.', route: 'mbti', choices: ['Can you listen for a minute?', 'Can we make a plan?', 'Can we spend time together?', 'Can I have a little space?'] },
      { id: 'connect-reflect', title: 'Try it in a conversation', description: 'Pick one way to follow through. You can do this on your own or invite a friend into Mirror.', showMirror: true, choices: ['Say it directly', 'Write it down first', 'Ask someone how they see me', 'Come back when I’m ready'] },
    ],
  },
  {
    id: 'my-choices', title: 'My Choices',
    description: 'Look at a real choice from several angles and name a small step you can take.',
    reward: 'Your Choices constellation',
    steps: [
      { id: 'choices-mercury', title: 'How do you make sense of things?', description: 'Think of a decision you’re sitting with. Compare your first instinct with the themes of Mercury.', route: 'astrology', focusPlanet: 'mercury', choices: ['Think it through alone', 'Talk it through', 'Gather more information', 'Try a small experiment'] },
      { id: 'choices-cardology', title: 'Look through another lens', description: 'Use your birth card as a prompt. What have you overlooked in the choice you’re considering?', route: 'cardology', choices: ['What I value', 'What I’m assuming', 'What I can ask for', 'What I can undo'] },
      { id: 'choices-tarot', title: 'Consider a possibility', description: 'If you draw a card, use the image to imagine another option. What would be worth exploring?', route: 'tarot', choices: ['A simpler option', 'A little more time', 'Someone else’s perspective', 'The option I keep returning to'] },
      { id: 'choices-action', title: 'Choose a reversible step', description: 'Decide on a small action that will teach you something about your choice.', choices: ['Ask one question', 'Try a small version', 'Write out the trade-off', 'Set a date to revisit it'] },
    ],
  },
  {
    id: 'my-seasons', title: 'My Seasons',
    description: 'Compare what is changing now with patterns you’ve noticed over time.',
    reward: 'Your Seasons constellation',
    steps: [
      { id: 'seasons-transits', title: 'Notice what’s moving', description: 'Look at today’s sky or a current transit. Which part of your life already feels in motion?', showTransits: true, choices: ['My routines', 'My relationships', 'My work or learning', 'Nothing obvious right now'] },
      { id: 'seasons-bazi', title: 'Think in seasons', description: 'Explore BaZi if you like. What image best describes how this part of your life feels?', route: 'bazi', choices: ['Beginning', 'Growing', 'Simplifying', 'Resting'] },
      { id: 'seasons-reflections', title: 'Look back at your own words', description: 'Revisit a recent reflection if you have one, or bring to mind how things felt a few weeks ago.', showJournal: true, choices: ['Something shifted', 'A theme keeps returning', 'I see it differently now', 'I’m just starting to notice'] },
      { id: 'seasons-next', title: 'Decide what to keep', description: 'Pick something to remember when your circumstances change again.', choices: ['A rhythm that helps me', 'A question to ask again', 'A limit I want to keep', 'A habit I can let go'] },
    ],
  },
];

export const atlasSteps = atlasChapters.flatMap(({ steps }) => steps);

export function nextAtlasStep(steps: readonly AtlasStep[], completed: readonly { stepId: string }[]) {
  return steps.find(({ id }) => !completed.some(({ stepId }) => stepId === id));
}
