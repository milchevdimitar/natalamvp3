import { TarotCardData } from './tarot.types';

export const MAJOR_ARCANA: TarotCardData[] = [
  { id: 0, name: '0. The Fool', pngKey: '00 The Fool', symbol: '🃏', arcana: 'Major', message: 'New beginnings, innocence, spontaneity, and infinite potential.' },
  { id: 1, name: 'I. The Magician', pngKey: '01 The Magician', symbol: '🪄', arcana: 'Major', message: 'Manifestation, resourcefulness, power, and inspired action.' },
  { id: 2, name: 'II. The High Priestess', pngKey: '02 The High Priestess', symbol: '🌙', arcana: 'Major', message: 'Intuition, sacred knowledge, divine feminine, and subconscious wisdom.' },
  { id: 3, name: 'III. The Empress', pngKey: '03 The Empress', symbol: '👑', arcana: 'Major', message: 'Femininity, beauty, nature, nurturing, and abundant creativity.' },
  { id: 4, name: 'IV. The Emperor', pngKey: '04 The Emperor', symbol: '🏛️', arcana: 'Major', message: 'Authority, structure, control, leadership, and a solid foundation.' },
  { id: 5, name: 'V. The Hierophant', pngKey: '05 The Hierophant', symbol: '📜', arcana: 'Major', message: 'Spiritual wisdom, tradition, institutions, and core belief systems.' },
  { id: 6, name: 'VI. The Lovers', pngKey: '06 The Lovers', symbol: '💕', arcana: 'Major', message: 'Love, harmony, meaningful partnerships, and alignment of values.' },
  { id: 7, name: 'VII. The Chariot', pngKey: '07 The Chariot', symbol: '🛞', arcana: 'Major', message: 'Control, willpower, success, action, and overcoming obstacles.' },
  { id: 8, name: 'VIII. Strength', pngKey: '08 Strength', symbol: '🦁', arcana: 'Major', message: 'Inner strength, courage, persuasion, compassion, and patience.' },
  { id: 9, name: 'IX. The Hermit', pngKey: '09 The Hermit', symbol: '🕯️', arcana: 'Major', message: 'Soul-searching, introspection, solitude, and inner enlightenment.' },
  { id: 10, name: 'X. Wheel of Fortune', pngKey: '10 Wheel of Fortune', symbol: '☸️', arcana: 'Major', message: 'Good luck, karma, life cycles, destiny, and pivotal turning points.' },
  { id: 11, name: 'XI. Justice', pngKey: '11 Justice', symbol: '⚖️', arcana: 'Major', message: 'Fairness, truth, cause and effect, law, and accountability.' },
  { id: 12, name: 'XII. The Hanged Man', pngKey: '12 Hanged Man', symbol: '🙃', arcana: 'Major', message: 'Surrender, letting go, new perspectives, and deliberate pause.' },
  { id: 13, name: 'XIII. Death', pngKey: '13 Death', symbol: '🦋', arcana: 'Major', message: 'Endings, deep transformation, transition, and making way for the new.' },
  { id: 14, name: 'XIV. Temperance', pngKey: '14 Temperance', symbol: '🌊', arcana: 'Major', message: 'Balance, moderation, patience, purpose, and inner peace.' },
  { id: 15, name: 'XV. The Devil', pngKey: '15 The devil', symbol: '⛓️', arcana: 'Major', message: 'Shadow self, attachment, restriction, and breaking mental chains.' },
  { id: 16, name: 'XVI. The Tower', pngKey: '16 The tower', symbol: '⚡', arcana: 'Major', message: 'Sudden upheaval, broken illusions, awakening, and breakthrough.' },
  { id: 17, name: 'XVII. The Star', pngKey: '17 The star', symbol: '⭐', arcana: 'Major', message: 'Hope, faith, purpose, renewal, and celestial guidance.' },
  { id: 18, name: 'XVIII. The Moon', pngKey: '18 The moon', symbol: '🌕', arcana: 'Major', message: 'Illusion, fear, anxiety, intuition, and diving into the unknown.' },
  { id: 19, name: 'XIX. The Sun', pngKey: '19 The sun', symbol: '☀️', arcana: 'Major', message: 'Positivity, fun, warmth, success, and radiant vitality.' },
  { id: 20, name: 'XX. Judgement', pngKey: '20 judgement', symbol: '🎺', arcana: 'Major', message: 'Judgement, rebirth, inner calling, absolution, and awakening.' },
  { id: 21, name: 'XXI. The World', pngKey: '21 The world', symbol: '🌍', arcana: 'Major', message: 'Completion, integration, accomplishment, travel, and wholeness.' },
];

const SUITS = [
  { key: 'Coins', name: 'Coins', symbol: '🪙', theme: 'material wealth & resources' },
  { key: 'Cups', name: 'Cups', symbol: '🍷', theme: 'emotions & relationships' },
  { key: 'Swords', name: 'Swords', symbol: '⚔️', theme: 'intellect & mental clarity' },
  { key: 'Wands', name: 'Wands', symbol: '🪄', theme: 'inspiration & creative action' },
];

const RANKS = [
  { rankKey: 'Ace', name: 'Ace', msg: 'New potential and fresh impulse' },
  { rankKey: '2', name: '2', msg: 'Balance, choices, and partnership' },
  { rankKey: '3', name: '3', msg: 'Growth, expansion, and early results' },
  { rankKey: '4', name: '4', msg: 'Stability, security, and foundation' },
  { rankKey: '5', name: '5', msg: 'Temporary friction and adaptation' },
  { rankKey: '6', name: '6', msg: 'Restoration, victory, and harmony' },
  { rankKey: '7', name: '7', msg: 'Assessment, strategy, and patience' },
  { rankKey: '8', name: '8', msg: 'Momentum, speed, and swift progress' },
  { rankKey: '9', name: '9', msg: 'Resilience, stamina, and fortitude' },
  { rankKey: '10', name: '10', msg: 'Culmination, completion, and fruition' },
  { rankKey: 'Princess', name: 'Princess', msg: 'Curiosity, news, and new ideas' },
  { rankKey: 'Knight', name: 'Knight', msg: 'Focused drive and decisive pursuit' },
  { rankKey: 'Queen', name: 'Queen', msg: 'Nurturing mastery and emotional wisdom' },
  { rankKey: 'King', name: 'King', msg: 'Commanding authority and leadership' },
];

export function getMinorArcana(): TarotCardData[] {
  const cards: TarotCardData[] = [];
  let idCounter = 22;

  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      const pngKey = `${suit.key} ${rank.rankKey}`;
      cards.push({
        id: idCounter++,
        name: `${rank.name} of ${suit.name}`,
        pngKey,
        symbol: suit.symbol,
        arcana: 'Minor',
        suit: suit.name,
        message: `${rank.msg} in the realm of ${suit.theme}.`,
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