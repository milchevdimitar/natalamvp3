// Cardology engine (birth card) — moved from APP/src/screens/Cardology.tsx
import { CARDOLOGY_TABLE } from './cardologyData';

export interface CardItem {
  id: number;
  code: string;
  bookCardN: number;
  nameBg: string;
  symbol: string;
  text: string;
  dates: { day: number; month: number }[];
}

const CARD_META: Record<string, { nameBg: string; symbol: string }> = {
  KS: { nameBg: "King of Spades", symbol: "♠" },
  QS: { nameBg: "Queen of Spades", symbol: "♠" },
  JS: { nameBg: "Jack of Spades", symbol: "♠" },
  '10S': { nameBg: "10 of Spades", symbol: "♠" },
  '9S': { nameBg: "9 of Spades", symbol: "♠" },
  '8S': { nameBg: "8 of Spades", symbol: "♠" },
  '7S': { nameBg: "7 of Spades", symbol: "♠" },
  '6S': { nameBg: "6 of Spades", symbol: "♠" },
  '5S': { nameBg: "5 of Spades", symbol: "♠" },
  '4S': { nameBg: "4 of Spades", symbol: "♠" },
  '3S': { nameBg: "3 of Spades", symbol: "♠" },
  '2S': { nameBg: "2 of Spades", symbol: "♠" },
  AS: { nameBg: "Ace of Spades", symbol: "♠" },

  KD: { nameBg: "King of Diamonds", symbol: "♦" },
  QD: { nameBg: "Queen of Diamonds", symbol: "♦" },
  JD: { nameBg: "Jack of Diamonds", symbol: "♦" },
  '10D': { nameBg: "10 of Diamonds", symbol: "♦" },
  '9D': { nameBg: "9 of Diamonds", symbol: "♦" },
  '8D': { nameBg: "8 of Diamonds", symbol: "♦" },
  '7D': { nameBg: "7 of Diamonds", symbol: "♦" },
  '6D': { nameBg: "6 of Diamonds", symbol: "♦" },
  '5D': { nameBg: "5 of Diamonds", symbol: "♦" },
  '4D': { nameBg: "4 of Diamonds", symbol: "♦" },
  '3D': { nameBg: "3 of Diamonds", symbol: "♦" },
  '2D': { nameBg: "2 of Diamonds", symbol: "♦" },
  AD: { nameBg: "Ace of Diamonds", symbol: "♦" },

  KC: { nameBg: "King of Clubs", symbol: "♣" },
  QC: { nameBg: "Queen of Clubs", symbol: "♣" },
  JC: { nameBg: "Jack of Clubs", symbol: "♣" },
  '10C': { nameBg: "10 of Clubs", symbol: "♣" },
  '9C': { nameBg: "9 of Clubs", symbol: "♣" },
  '8C': { nameBg: "8 of Clubs", symbol: "♣" },
  '7C': { nameBg: "7 of Clubs", symbol: "♣" },
  '6C': { nameBg: "6 of Clubs", symbol: "♣" },
  '5C': { nameBg: "5 of Clubs", symbol: "♣" },
  '4C': { nameBg: "4 of Clubs", symbol: "♣" },
  '3C': { nameBg: "3 of Clubs", symbol: "♣" },
  '2C': { nameBg: "2 of Clubs", symbol: "♣" },
  AC: { nameBg: "Ace of Clubs", symbol: "♣" },

  KH: { nameBg: "King of Hearts", symbol: "♥" },
  QH: { nameBg: "Queen of Hearts", symbol: "♥" },
  JH: { nameBg: "Jack of Hearts", symbol: "♥" },
  '10H': { nameBg: "10 of Hearts", symbol: "♥" },
  '9H': { nameBg: "9 of Hearts", symbol: "♥" },
  '8H': { nameBg: "8 of Hearts", symbol: "♥" },
  '7H': { nameBg: "7 of Hearts", symbol: "♥" },
  '6H': { nameBg: "6 of Hearts", symbol: "♥" },
  '5H': { nameBg: "5 of Hearts", symbol: "♥" },
  '4H': { nameBg: "4 of Hearts", symbol: "♥" },
  '3H': { nameBg: "3 of Hearts", symbol: "♥" },
  '2H': { nameBg: "2 of Hearts", symbol: "♥" },
  AH: { nameBg: "Ace of Hearts", symbol: "♥" },
  J: { nameBg: "Joker", symbol: "🃏" },
};

// Extract day and month from user profile (ISODate, string or Date)
export const getUserDayAndMonth = (user: any): { day: number; month: number; formattedDate: string } | null => {
  if (!user) return null;

  const rawDate =
    user.birthdate ||
    user.birthDate ||
    user.dateOfBirth ||
    user.dob ||
    user.birth_date ||
    user.profile?.birthDate ||
    user.profile?.dateOfBirth ||
    user.profile?.dob ||
    user.profile?.birth_date;

  if (!rawDate) return null;

  if (typeof rawDate === 'string') {
    // ISO Date format (e.g. "2000-08-31T00:00:00.000Z")
    if (rawDate.includes('-')) {
      const dateOnly = rawDate.split('T')[0];
      const partsISO = dateOnly.split('-');
      if (partsISO.length === 3) {
        const month = parseInt(partsISO[1], 10);
        const day = parseInt(partsISO[2], 10);
        if (!isNaN(day) && !isNaN(month)) {
          return {
            day,
            month,
            formattedDate: `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`,
          };
        }
      }
    }

    // Format DD.MM.YYYY or DD.MM
    const trimmed = rawDate.trim().replace(/[\/\-\s]/g, '.');
    const parts = trimmed.split('.').map((p) => parseInt(p, 10));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const day = parts[0];
      const month = parts[1];
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return {
          day,
          month,
          formattedDate: `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`,
        };
      }
    }
  }

  // JS Date object or Timestamp
  const d = new Date(rawDate);
  if (!isNaN(d.getTime())) {
    const day = d.getUTCDate();
    const month = d.getUTCMonth() + 1;
    return {
      day,
      month,
      formattedDate: `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`,
    };
  }

  return null;
};

function loadDeck(): CardItem[] {
  const loadedDeck: CardItem[] = [];

  (CARDOLOGY_TABLE as any[]).forEach((row, index) => {
    const keys = Object.keys(row);
    const cardN = Number(row[keys[0]] || index + 1);
    const rawDatesCell = String(row[keys[1]] || '');
    const code = String(row[keys[2]] || '').trim();
    const bookN = Number(row[keys[3]] || 0);
    const text = String(row[keys[4]] || '').trim();

    const meta = CARD_META[code] || { nameBg: code, symbol: "🃏" };

    const parsedDates: { day: number; month: number }[] = [];
    rawDatesCell.split(';').forEach((dateToken) => {
      const parts = dateToken.trim().split('.');
      if (parts.length === 2) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(d) && !isNaN(m)) {
          parsedDates.push({ day: d, month: m });
        }
      }
    });

    loadedDeck.push({
      id: cardN,
      code,
      bookCardN: bookN,
      nameBg: meta.nameBg,
      symbol: meta.symbol,
      text,
      dates: parsedDates,
    });
  });
  return loadedDeck;
}

const DECK = loadDeck();

export function findBirthCard(user: any): { card: CardItem | null; dateStr: string | null } {
  const userDate = getUserDayAndMonth(user);
  if (!userDate) return { card: null, dateStr: null };

  const card =
    DECK.find((c) => c.dates.some((d) => d.day === userDate.day && d.month === userDate.month)) ||
    null;

  return { card, dateStr: userDate.formattedDate };
}
