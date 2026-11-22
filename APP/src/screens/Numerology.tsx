import { useCalc } from '../services/calcApi';
import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
} from 'react-native';
import {
  ArrowLeft,
  Sparkles,
  Hash,
  Compass,
  Award,
  Calendar,
  User,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { BirthDateTag } from '../components/BirthDateTag';
import { getBirthParts } from '../services/profileDashboard';
import { Card, T, Section, Pill, Hero } from '../components/UI';
import { saveUserProfile } from '../services/api';
import { UserProfile } from '../models/User';

interface LifePathInfo {
  title: string;
  subtitle: string;
  description: string;
  traits: string[];
  challenge: string;
}

const LIFE_PATH_DATA: Record<number, LifePathInfo> = {
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
const getFormattedUserDate = (user: any): string | null => {
  if (!user) return null;
  const birth = getBirthParts(user);
  if (birth) return [birth.day, birth.month, birth.year].map((part) => String(part).padStart(2, '0')).join('.');

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

function calculateLifePath(dStr: string) {
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

export default function Numerology() {
  const { colors, setPage, user, setUser } = useApp();
  const dateStr = getFormattedUserDate(user);
  const remote = useCalc<ReturnType<typeof calculateLifePath>>('numerology/life-path', dateStr ? { user: { birthdate: dateStr } } : null);
  const result = remote.data ?? (dateStr ? calculateLifePath(dateStr) : null);
  const lifePath = result?.lifePathNumber;

  useEffect(() => {
    if (!remote.loading && lifePath && user?.email && user.numerology?.lifePathNumber !== lifePath) {
      const syncNumerology = async () => {

        const updatedUser: UserProfile = {
          ...user,
          numerology: {
            ...user.numerology,
            lifePathNumber: lifePath,
          },
        };

        try {
          await setUser(updatedUser);
          await saveUserProfile(updatedUser);
        } catch (error) {
          console.warn('Offline mode: Result saved locally.', error);
        }
      };

      syncNumerology();
    }
  }, [lifePath, remote.loading, user, setUser]);

  return (
    <>
      <TouchableOpacity
        onPress={() => setPage('explore')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
      >
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Back to Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="NUMEROLOGY ENGINE · LIFE PATH"
        first="Your"
        accent="Life Path Number."
        description="Discover your birth destiny, core vibrations, and life path code."
      />

      {result ? (
        <View style={{ gap: 18, marginBottom: 40 }}>
          {/* Main result card */}
          <Card style={{ alignItems: 'center', paddingVertical: 26, gap: 10 }}>
            <T muted size={11} style={{ letterSpacing: 2 }}>
              YOUR LIFE PATH NUMBER ({user?.name || 'User'})
            </T>
            <BirthDateTag date={result.dateStr} />
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: colors.purpleSoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 4,
              }}
            >
              <T bold size={42} style={{ color: colors.purple }}>
                {result.lifePathNumber}
              </T>
            </View>
            <T bold size={22} style={{ textAlign: 'center' }}>
              {result.info.title}
            </T>
            <T muted size={13} style={{ textAlign: 'center', maxWidth: 300 }}>
              {result.info.subtitle}
            </T>
          </Card>

          {/* Calculation breakdown */}
          <Section>Mathematical Code</Section>
          <Card style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Hash size={16} color={colors.purple} />
              <T bold size={14}>Vibration Breakdown</T>
            </View>

            <View style={{ gap: 8, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T muted size={13}>Day ({result.day}):</T>
                <T bold size={13} style={{ color: colors.purple }}>{result.dayReduced}</T>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T muted size={13}>Month ({result.month}):</T>
                <T bold size={13} style={{ color: colors.purple }}>{result.monthReduced}</T>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T muted size={13}>Year ({result.year}):</T>
                <T bold size={13} style={{ color: colors.purple }}>{result.yearReduced}</T>
              </View>

              <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 4 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T bold size={13}>Sum ({result.dayReduced} + {result.monthReduced} + {result.yearReduced}):</T>
                <T bold size={15} style={{ color: colors.gold }}>
                  {result.totalSum} → {result.lifePathNumber}
                </T>
              </View>
            </View>
          </Card>

          {/* Life Mission */}
          <Section>Life Mission</Section>
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color={colors.gold} />
              <T bold size={15}>Essence & Purpose</T>
            </View>
            <T muted size={13} style={{ lineHeight: 20 }}>
              {result.info.description}
            </T>
          </Card>

          {/* Traits */}
          <Section>Core Vibrations</Section>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {result.info.traits.map((trait: string, idx: number) => (
              <Card key={idx} style={{ width: '48%', alignItems: 'center', paddingVertical: 14, gap: 6 }}>
                <Award size={20} color={colors.purple} />
                <T bold size={13}>{trait}</T>
              </Card>
            ))}
          </View>

          {/* Challenge */}
          <Section>Life Lesson</Section>
          <Card style={{ gap: 8, backgroundColor: colors.purpleSoft }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Compass size={16} color={colors.purple} />
              <T bold size={14} style={{ color: colors.purple }}>
                Growth Challenge
              </T>
            </View>
            <T bold size={13}>
              {result.info.challenge}
            </T>
          </Card>
        </View>
      ) : (
        /* Empty state when birth date is missing in profile */
        <Card style={{ alignItems: 'center', paddingVertical: 30, gap: 12, marginBottom: 40 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.purpleSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={32} color={colors.purple} />
          </View>
          <T bold size={16}>Missing Birth Date in Profile</T>
          <T muted size={13} style={{ textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
            No birth date was found in your profile database. Please add it in your settings.
          </T>
          <Pill selected onPress={() => setPage('profile')}>
            <User size={14} color="#FFFFFF" /> Go to Profile
          </Pill>
        </Card>
      )}
    </>
  );
}
