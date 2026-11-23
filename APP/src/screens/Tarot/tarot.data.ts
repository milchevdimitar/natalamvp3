import { majorMeanings, minorMeanings } from './tarot.meanings';
import { TarotCardData } from './tarot.types';

export const MAJOR_ARCANA: TarotCardData[] = [
  { id: 0, name: '0. The Fool', pngKey: '00 The Fool', symbol: '🃏', arcana: 'Major', message: majorMeanings[0] },
  { id: 1, name: 'I. The Magician', pngKey: '01 The Magician', symbol: '🪄', arcana: 'Major', message: majorMeanings[1] },
  { id: 2, name: 'II. The High Priestess', pngKey: '02 The High Priestess', symbol: '🌙', arcana: 'Major', message: majorMeanings[2] },
  { id: 3, name: 'III. The Empress', pngKey: '03 The Empress', symbol: '👑', arcana: 'Major', message: majorMeanings[3] },
  { id: 4, name: 'IV. The Emperor', pngKey: '04 The Emperor', symbol: '🏛️', arcana: 'Major', message: majorMeanings[4] },
  { id: 5, name: 'V. The Hierophant', pngKey: '05 The Hierophant', symbol: '📜', arcana: 'Major', message: majorMeanings[5] },
  { id: 6, name: 'VI. The Lovers', pngKey: '06 The Lovers', symbol: '💕', arcana: 'Major', message: majorMeanings[6] },
  { id: 7, name: 'VII. The Chariot', pngKey: '07 The Chariot', symbol: '🛞', arcana: 'Major', message: majorMeanings[7] },
  { id: 8, name: 'VIII. Strength', pngKey: '08 Strength', symbol: '🦁', arcana: 'Major', message: majorMeanings[8] },
  { id: 9, name: 'IX. The Hermit', pngKey: '09 The Hermit', symbol: '🕯️', arcana: 'Major', message: majorMeanings[9] },
  { id: 10, name: 'X. Wheel of Fortune', pngKey: '10 Wheel of Fortune', symbol: '☸️', arcana: 'Major', message: majorMeanings[10] },
  { id: 11, name: 'XI. Justice', pngKey: '11 Justice', symbol: '⚖️', arcana: 'Major', message: majorMeanings[11] },
  { id: 12, name: 'XII. The Hanged Man', pngKey: '12 Hanged Man', symbol: '🙃', arcana: 'Major', message: majorMeanings[12] },
  { id: 13, name: 'XIII. Death', pngKey: '13 Death', symbol: '🦋', arcana: 'Major', message: majorMeanings[13] },
  { id: 14, name: 'XIV. Temperance', pngKey: '14 Temperance', symbol: '🌊', arcana: 'Major', message: majorMeanings[14] },
  { id: 15, name: 'XV. The Devil', pngKey: '15 The devil', symbol: '⛓️', arcana: 'Major', message: majorMeanings[15] },
  { id: 16, name: 'XVI. The Tower', pngKey: '16 The tower', symbol: '⚡', arcana: 'Major', message: majorMeanings[16] },
  { id: 17, name: 'XVII. The Star', pngKey: '17 The star', symbol: '⭐', arcana: 'Major', message: majorMeanings[17] },
  { id: 18, name: 'XVIII. The Moon', pngKey: '18 The moon', symbol: '🌕', arcana: 'Major', message: majorMeanings[18] },
  { id: 19, name: 'XIX. The Sun', pngKey: '19 The sun', symbol: '☀️', arcana: 'Major', message: majorMeanings[19] },
  { id: 20, name: 'XX. Judgement', pngKey: '20 judgement', symbol: '🎺', arcana: 'Major', message: majorMeanings[20] },
  { id: 21, name: 'XXI. The World', pngKey: '21 The world', symbol: '🌍', arcana: 'Major', message: majorMeanings[21] },
];

const SUITS = [
  { key: 'Coins', name: 'Coins', symbol: '🪙' },
  { key: 'Cups', name: 'Cups', symbol: '🍷' },
  { key: 'Swords', name: 'Swords', symbol: '⚔️' },
  { key: 'Wands', name: 'Wands', symbol: '🪄' },
] as const;

const RANKS = [
  { rankKey: 'Ace', name: 'Ace' },
  { rankKey: '2', name: '2' },
  { rankKey: '3', name: '3' },
  { rankKey: '4', name: '4' },
  { rankKey: '5', name: '5' },
  { rankKey: '6', name: '6' },
  { rankKey: '7', name: '7' },
  { rankKey: '8', name: '8' },
  { rankKey: '9', name: '9' },
  { rankKey: '10', name: '10' },
  { rankKey: 'Princess', name: 'Princess' },
  { rankKey: 'Knight', name: 'Knight' },
  { rankKey: 'Queen', name: 'Queen' },
  { rankKey: 'King', name: 'King' },
];

export function getMinorArcana(): TarotCardData[] {
  const cards: TarotCardData[] = [];
  let idCounter = 22;

  SUITS.forEach((suit) => {
    RANKS.forEach((rank, index) => {
      const pngKey = `${suit.key} ${rank.rankKey}`;
      cards.push({
        id: idCounter++,
        name: `${rank.name} of ${suit.name}`,
        pngKey,
        symbol: suit.symbol,
        arcana: 'Minor',
        suit: suit.name,
        message: minorMeanings[suit.key][index],
      });
    });
  });

  return cards;
}

export function getDeck(useFullDeck: boolean): TarotCardData[] {
  if (useFullDeck) {
    return [...MAJOR_ARCANA, ...getMinorArcana()];
  }
  return [...MAJOR_ARCANA];
}