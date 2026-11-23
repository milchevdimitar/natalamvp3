import { ExploreSystemHeader } from './ExploreSystemHeader';
import { useCalc } from '../services/calcApi';
import React, { useEffect } from 'react';
import {
  View,
} from 'react-native';
import { Sparkles, Hash, Compass, Award, Calendar, User } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
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
    description: "Life Path 1 is traditionally associated with initiative and independence. You may feel most engaged when a decision is yours to make or when you can try an approach nobody around you has tested yet. That can look like starting a project, making the first move in a difficult conversation, or choosing a direction before every detail is settled.\n\nThe growth question is how to stay self-directed while letting others contribute. Try sharing an unfinished idea with someone you trust. Hear their perspective, then decide what you want to keep and what you want to change.",
    traits: ["Ambition", "Independence", "Leadership", "Originality"],
    challenge: "Overcoming stubbornness and learning to work in a team.",
  },
  2: {
    title: "The Diplomat & The Peacemaker",
    subtitle: "Harmony, intuition, and cooperation",
    description: "Life Path 2 centers on cooperation and the ability to notice how people are responding to one another. You might recognize a tension before it is named, or find a way to make room for two different points of view. These skills matter in close relationships as much as they do on a team.\n\nHarmony can come at a cost if you routinely hide your own preferences. In your next shared decision, state what you want early and ask what the other person wants too. A good compromise gives both people a voice.",
    traits: ["Empathy", "Diplomacy", "Intuition", "Patience"],
    challenge: "Building self-esteem and establishing healthy personal boundaries.",
  },
  3: {
    title: "The Creator & The Communicator",
    subtitle: "Creativity, self-expression, and optimism",
    description: "Life Path 3 is linked with creative expression and the pleasure of making an idea accessible to someone else. That could mean writing, performing, telling a good story, or finding a playful way to explain a hard topic. Creativity can also be private, such as sketching an idea to understand it better.\n\nOne challenge is staying with a project after the excitement of starting fades. Pick a small piece you can finish this week and give it an audience of one. Sharing a finished draft can teach you more than keeping ten perfect ideas in your head.",
    traits: ["Charisma", "Imagination", "Optimism", "Sociability"],
    challenge: "Focusing your energy and avoiding distraction.",
  },
  4: {
    title: "The Builder & The Organizer",
    subtitle: "Stability, hard work, and reliability",
    description: "Life Path 4 is associated with structure, patience, and the satisfaction of building something that holds up over time. You might enjoy turning a messy job into a reliable process, looking after a commitment, or mastering a skill through repetition. Progress often becomes visible when you look back over weeks rather than days.\n\nA useful practice is to separate the part of a plan that truly matters from the steps you chose out of habit. Keep the goal steady and change one step if it serves you better. A sound structure can make experimenting easier.",
    traits: ["Discipline", "Loyalty", "Organization", "Realism"],
    challenge: "Overcoming the fear of change and staying flexible in your thinking.",
  },
  5: {
    title: "The Explorer & The Free Spirit",
    subtitle: "Freedom, dynamism, and adventure",
    description: "Life Path 5 is traditionally linked with freedom, variety, and learning through firsthand experience. You may be drawn to unfamiliar places, different kinds of people, or work that lets you switch approaches when new information appears. The underlying theme is choosing where to direct your curiosity.\n\nWhen novelty wears off, check whether the commitment has stopped serving you or simply reached its less exciting phase. Try giving a new interest a short experiment with a clear end date. That leaves room to explore while giving you something concrete to take away.",
    traits: ["Flexibility", "Love of Freedom", "Adaptability", "Energy"],
    challenge: "Maintaining focus and avoiding impulsive decisions.",
  },
  6: {
    title: "The Nurturer & The Teacher",
    subtitle: "Care, responsibility, and love for family",
    description: "Life Path 6 emphasizes care, responsibility, and creating a sense of belonging. It may show up in the way you welcome people, teach a skill, maintain a home, or notice a practical need before others do. Caring can be as simple as following up after someone has had a difficult day.\n\nBeing helpful is easier to sustain when the people involved can choose what support they want. Next time you see a problem, ask whether the person wants advice, practical help, or someone to listen. Set aside time for something that supports you as well.",
    traits: ["Responsibility", "Kindness", "Harmony", "Protection"],
    challenge: "Avoiding over-control and perfectionism.",
  },
  7: {
    title: "The Truth Seeker & The Sage",
    subtitle: "Analysis, spirituality, and deep knowledge",
    description: "Life Path 7 is associated with inquiry and the wish to understand how something works beneath the surface. You might need quiet to form your own view, or prefer a conversation that goes into detail rather than one that covers many topics quickly. Research, reflection, and observation are different ways to follow that interest.\n\nSolitude can give you perspective, and speaking your thoughts aloud can reveal what you missed. Bring one question you have been thinking about to a person you trust. See whether talking it through changes your understanding.",
    traits: ["Analytical Mind", "Spirituality", "Wisdom", "Intuition"],
    challenge: "Overcoming the tendency toward isolation and building trust in others.",
  },
  8: {
    title: "The Powerhouse & The Manifestor",
    subtitle: "Success, strength, authority, and abundance",
    description: "Life Path 8 traditionally explores ambition, stewardship, and the use of influence. It can be a useful lens for how you make decisions about work, money, or shared resources. You may enjoy turning a goal into something measurable and organizing the effort needed to reach it.\n\nConsider what your preferred measure of success leaves out. For a project you are working on, name one result you want and one value you want to protect while pursuing it. Review both when you decide whether the work is going well.",
    traits: ["Ambition", "Confidence", "Authority", "Practicality"],
    challenge: "Balancing material success with spiritual values.",
  },
  9: {
    title: "The Humanitarian & The Visionary",
    subtitle: "Universal love, compassion, and wisdom",
    description: "Life Path 9 is associated with compassion, wider perspective, and the ability to bring a chapter to a close. You might be drawn to questions about who benefits from your work, what a community needs, or what a past experience can teach you now. A broad perspective can help you notice possibilities that a narrow goal would miss.\n\nChoose one cause or person you can support in a specific, sustainable way. It can also help to ask which commitments belong to an earlier part of your life. Letting one end can free attention for a contribution you still want to make.",
    traits: ["Compassion", "Altruism", "Visionary Spirit", "Generosity"],
    challenge: "Releasing the past and accepting change without disappointment.",
  },
  11: {
    title: "The Illuminator (Master Number 11)",
    subtitle: "High intuition, inspiration, and spiritual leadership",
    description: "Master Number 11 is traditionally read alongside the cooperative qualities of 2. Its themes include sensitivity, imagination, and finding words for impressions that can be difficult to explain. That may resonate when an idea arrives suddenly or when you notice an emotional shift in a room.\n\nGive an impression time before acting on it. Write down what you sensed, distinguish the details you observed from your interpretation, and check your understanding when you can. The discipline of testing an insight can make it easier to share in a way others can use.",
    traits: ["Intuition", "Inspiration", "Insight", "Charisma"],
    challenge: "Managing high sensitivity and nervous tension.",
  },
  22: {
    title: "The Master Architect (Master Number 22)",
    subtitle: "Turning the greatest dreams into reality",
    description: "Master Number 22 is often called the builder because it combines a broad vision with the practical qualities associated with 4. It invites reflection on what it takes to make an ambitious idea useful beyond your own plans. That might mean building a process that a team can use or giving a long-term project a structure that can survive changes.\n\nStart by identifying the smallest version that would genuinely help someone. Try it, ask the people who use it what works, and revise before expanding. A large vision becomes easier to carry when responsibility is shared.",
    traits: ["Large-scale Thinking", "Practical Visionary", "Inner Strength", "Execution"],
    challenge: "Handling immense responsibility and the fear of failure.",
  },
  33: {
    title: "The Master Teacher (Master Number 33)",
    subtitle: "Selfless love, healing, and spiritual guidance",
    description: "Master Number 33 extends the traditional themes of care and responsibility associated with 6. It is often read through teaching, encouragement, and the kind of attention that helps someone develop their own confidence. You might find this meaningful in everyday roles, from mentoring a colleague to making a difficult subject less intimidating.\n\nCare is easier to offer over time when you know what you can realistically give. Choose one form of support you can provide consistently, agree on its limits, and make space for the other person to choose their own next step.",
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
      <ExploreSystemHeader route="numerology" />

      <Hero
        eyebrow="NUMEROLOGY ENGINE · LIFE PATH"
        first="Your"
        accent="Life Path Number."
      />

      {result ? (
        <View style={{ gap: 18, marginBottom: 40 }}>
          {/* Main result card */}
          <Card style={{ alignItems: 'center', paddingVertical: 26, gap: 10 }}>
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

          {/* Life Mission */}
          <Section>Life Mission</Section>
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color={colors.gold} />
              <T bold size={15}>Essence & Purpose</T>
            </View>
            <T muted size={13} style={{ lineHeight: 20 }}>
              {LIFE_PATH_DATA[result.lifePathNumber]?.description ?? result.info.description}
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
                <T muted size={13}>Reduced year:</T>
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
