import type { ExploreRoute } from './exploreRoutes';

type SystemGuide = {
  title: string;
  intro: string;
  how: string;
  firstStep: string;
};

export const systemGuides: Record<ExploreRoute, SystemGuide> = {
  astrology: {
    title: 'Astrology',
    intro: 'A birth chart is a map of the sky for the moment and place you were born. Western astrology reads that map symbolically. A planet represents a theme, its zodiac sign describes how the theme is expressed, and its house points to the area of life where it shows up.',
    how: 'Natala uses your birth date, time and city to calculate placements. The time and place matter for the Ascendant, the sign rising on the eastern horizon, and for the houses. Transits compare today’s sky with your birth chart.',
    firstStep: 'Open Chart and start with your Sun, Moon and Rising signs. Think of them as three entry points into identity, emotional needs and how you meet the world.',
  },
  numerology: {
    title: 'Numerology',
    intro: 'Numerology gives numbers symbolic meanings. The Life Path number is a way to explore recurring themes such as independence, cooperation or creativity through the numbers in your birth date.',
    how: 'Natala reduces your birth month, day and year separately, then adds and reduces the results. The method keeps 11, 22 and 33 as Master Numbers when they occur in the reduction.',
    firstStep: 'Read Life Mission for the interpretation of your number. Open Mathematical Code to see how Natala arrived at it from your date.',
  },
  mbti: {
    title: '16 Archetypes',
    intro: 'This questionnaire explores four pairs of preferences: where you recharge, what information you notice, how you decide, and how much structure you like. The four letters combine into one of 16 archetypes, inspired by the Myers–Briggs framework.',
    how: 'Natala scores your answers on four separate scales. Your four-letter result gives you a starting point, and Cognitive Balance shows how strongly your answers lean in each direction. A score close to the middle means both sides came up in your answers.',
    firstStep: 'Answer as you usually act. Then look at your closest scale and think of a situation where you naturally use each side.',
  },
  cardology: {
    title: 'Cardology',
    intro: 'Cardology connects your birth date to the cards in an ordinary playing-card deck. Each card combines a suit with a rank. Together they give you a symbolic theme to reflect on.',
    how: 'Natala uses the month and day of your birth to look up your Birth Card. The same birthday leads to the same card. A tarot draw, by comparison, begins with shuffled cards.',
    firstStep: 'Open your Birth Card and read the interpretation. Pick one theme you recognise and think of a concrete example from your own life.',
  },
  tarot: {
    title: 'Tarot',
    intro: 'Tarot began as a card game and later became a tradition of symbolic readings. A standard deck has 22 Major Arcana cards for broad themes and 56 Minor Arcana cards for more everyday situations.',
    how: 'Draw one Daily Card for a short reflection, or choose a layout in Custom Spread for several perspectives on a question. Tap a card to reveal it, then tap it again to read about it or draw a clarifier. A clarifier adds another image to consider alongside the first.',
    firstStep: 'Start with a question you can act on, such as “What could I pay more attention to today?” Notice what stands out in the picture before reading Natala’s interpretation.',
  },
  ayurveda: {
    title: 'Ayurveda',
    intro: 'Ayurveda is a traditional system from India. Its three doshas describe qualities such as movement and rhythm (Vata), heat and transformation (Pitta), and steadiness and structure (Kapha).',
    how: 'Natala’s quiz compares how often you choose answers linked to each dosha. The profile triangle visualises your answers. The guides describe how each dosha is understood in its aggravated, balanced and depleted states.',
    firstStep: 'Take the quiz and use the result as a reflection on your routines. The percentages summarise your answers and have no diagnostic meaning.',
  },
  bazi: {
    title: 'BaZi',
    intro: 'BaZi means “eight characters” and is also called the Four Pillars of Destiny. Year, month, day and hour each contribute two traditional calendar symbols, a Heavenly Stem and an Earthly Branch.',
    how: 'Natala uses your birth details to build the pillars. The Day Master is the stem of your birth day and acts as the reference point for reading relationships among Wood, Fire, Earth, Metal and Water.',
    firstStep: 'Start in Simple view, find your Day Master and then look at Five Elements Balance. Switch to Pro when you want to explore the individual pillars and their relationships.',
  },
  'chinese-zodiac': {
    title: 'Chinese Zodiac',
    intro: 'The Chinese zodiac assigns an animal to each year in a repeating 12-year cycle. Animals also pair with elements. The same animal comes around every 12 years, while the same animal–element pairing returns every 60.',
    how: 'Natala uses your Gregorian birth year to show your animal and element. In the Lunar New Year convention, birthdays early in January or February can fall in the previous zodiac year.',
    firstStep: 'Read your birth-year animal’s profile, then tap another animal to see how its folklore and symbolic qualities differ.',
  },
};
