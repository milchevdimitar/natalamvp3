// Numerology engine (Life Path) — moved from APP/src/screens/Numerology.tsx

export interface LifePathInfo {
  title: string;
  subtitle: string;
  description: string;
  traits: string[];
  challenge: string;
}

export const LIFE_PATH_DATA: Record<number, LifePathInfo> = {
  1: {
    title: "The Leader & The Pioneer",
    subtitle: "Independence, innovation, and strong willpower",
    description: "You are a born pioneer. Your purpose in life is to forge new paths, take initiative, and rely on your own individuality.",
    traits: ["Ambition", "Independence", "Leadership", "Originality"],
    challenge: "Overcoming stubbornness and learning to work in a team.",
  },
  2: {
    title: "The Diplomat & The Peacemaker",
    subtitle: "Harmony, intuition, and cooperation",
    description: "You are a natural mediator and creator of harmony. You possess extraordinary sensitivity to the emotions of others.",
    traits: ["Empathy", "Diplomacy", "Intuition", "Patience"],
    challenge: "Building self-esteem and establishing healthy personal boundaries.",
  },
  3: {
    title: "The Creator & The Communicator",
    subtitle: "Creativity, self-expression, and optimism",
    description: "You bring joy and inspiration. Your mission is to express yourself through art, words, ideas, and positive energy.",
    traits: ["Charisma", "Imagination", "Optimism", "Sociability"],
    challenge: "Focusing your energy and avoiding distraction.",
  },
  4: {
    title: "The Builder & The Organizer",
    subtitle: "Stability, hard work, and reliability",
    description: "You are the foundation of any successful venture. Your number symbolizes order, practicality, security, and building lasting things.",
    traits: ["Discipline", "Loyalty", "Organization", "Realism"],
    challenge: "Overcoming the fear of change and staying flexible in your thinking.",
  },
  5: {
    title: "The Explorer & The Free Spirit",
    subtitle: "Freedom, dynamism, and adventure",
    description: "You love change and variety. Life for you is an adventure filled with new experiences, travel, and transformation.",
    traits: ["Flexibility", "Love of Freedom", "Adaptability", "Energy"],
    challenge: "Maintaining focus and avoiding impulsive decisions.",
  },
  6: {
    title: "The Nurturer & The Teacher",
    subtitle: "Care, responsibility, and love for family",
    description: "You are the pillar of support for your loved ones. Your mission centers on care, justice, creating home comfort, and helping the community.",
    traits: ["Responsibility", "Kindness", "Harmony", "Protection"],
    challenge: "Avoiding over-control and perfectionism.",
  },
  7: {
    title: "The Truth Seeker & The Sage",
    subtitle: "Analysis, spirituality, and deep knowledge",
    description: "You seek deep truths behind the surface of things. A seeker of knowledge, a philosopher, and an explorer of life's mysteries.",
    traits: ["Analytical Mind", "Spirituality", "Wisdom", "Intuition"],
    challenge: "Overcoming the tendency toward isolation and building trust in others.",
  },
  8: {
    title: "The Powerhouse & The Manifestor",
    subtitle: "Success, strength, authority, and abundance",
    description: "You possess business acumen and the ability to turn ideas into tangible results. You are born for major achievements and management.",
    traits: ["Ambition", "Confidence", "Authority", "Practicality"],
    challenge: "Balancing material success with spiritual values.",
  },
  9: {
    title: "The Humanitarian & The Visionary",
    subtitle: "Universal love, compassion, and wisdom",
    description: "You possess a broad soul and a vision for a better world. Your number symbolizes completion, altruism, and higher consciousness.",
    traits: ["Compassion", "Altruism", "Visionary Spirit", "Generosity"],
    challenge: "Releasing the past and accepting change without disappointment.",
  },
  11: {
    title: "The Illuminator (Master Number 11)",
    subtitle: "High intuition, inspiration, and spiritual leadership",
    description: "You are a bridge between the physical and spiritual realms. You possess exceptional intuition and a mission to inspire others.",
    traits: ["Intuition", "Inspiration", "Insight", "Charisma"],
    challenge: "Managing high sensitivity and nervous tension.",
  },
  22: {
    title: "The Master Architect (Master Number 22)",
    subtitle: "Turning the greatest dreams into reality",
    description: "You possess the power of 4, but on a grand scale. You can build large-scale systems and projects that transform many lives.",
    traits: ["Large-scale Thinking", "Practical Visionary", "Inner Strength", "Execution"],
    challenge: "Handling immense responsibility and the fear of failure.",
  },
  33: {
    title: "The Master Teacher (Master Number 33)",
    subtitle: "Selfless love, healing, and spiritual guidance",
    description: "The highest Master Number. Your mission is dedicated to compassion, healing, and elevating human consciousness.",
    traits: ["Unconditional Love", "Healing", "Wisdom", "Devotion"],
    challenge: "Balancing your own needs with those of the world.",
  }
};

const reduceNumber = (num: number): number => {
  if (num === 11 || num === 22 || num === 33) return num;
  let current = num;
  while (current > 9) {
    if (current === 11 || current === 22 || current === 33) return current;
    current = String(current)
      .split('')
      .map(Number)
      .reduce((a, b) => a + b, 0);
  }
  return current;
};

// Safe date parsing and formatting function from `user`
export const getFormattedUserDate = (user: any): string | null => {
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

  // 1. If already in DD.MM.YYYY format
  if (typeof rawDate === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(rawDate.trim())) {
    return rawDate.trim();
  }

  // 2. If ISODate from MongoDB (e.g., "2000-06-15T00:00:00.000Z")
  if (typeof rawDate === 'string' && rawDate.includes('-')) {
    const dateOnly = rawDate.split('T')[0];
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      if (year.length === 4 && Number(day) >= 1 && Number(day) <= 31) {
        return `${day}.${month}.${year}`;
      }
    }
  }

  // 3. If JS Date object or Timestamp
  const d = new Date(rawDate);
  if (!isNaN(d.getTime())) {
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}.${month}.${year}`;
  }

  return null;
};

export function calculateLifePath(dStr: string) {
  try {
    const parts = dStr.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;

    const [day, month, year] = parts;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1000 || year > 9999) {
      return null;
    }

    const dayReduced = reduceNumber(day);
    const monthReduced = reduceNumber(month);
    const yearSum = String(year).split('').map(Number).reduce((a, b) => a + b, 0);
    const yearReduced = reduceNumber(yearSum);

    const totalSum = dayReduced + monthReduced + yearReduced;
    const lifePathNumber = reduceNumber(totalSum);

    return {
      day,
      month,
      year,
      dayReduced,
      monthReduced,
      yearReduced,
      totalSum,
      lifePathNumber,
      info: LIFE_PATH_DATA[lifePathNumber] || LIFE_PATH_DATA[1],
      dateStr: dStr,
    };
  } catch (e) {
    return null;
  }
}
