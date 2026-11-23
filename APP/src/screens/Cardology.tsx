import { Image } from 'expo-image';
import { cardologyArtwork } from '../data/cardologyArtwork';
import { useCalc } from '../services/calcApi';
import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  User,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { getBirthParts } from '../services/profileDashboard';
import { Card, T, Section, Pill, Hero } from '../components/UI';
import { CARDOLOGY_TABLE } from '../data/cardologyData';
import { saveUserProfile } from '../services/api';
import { UserProfile } from '../models/User';

const CARD_WIDTH = 170;
const CARD_ASPECT_RATIO = 500 / 726;

interface CardItem {
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
const getUserDayAndMonth = (user: any): { day: number; month: number; formattedDate: string } | null => {
  if (!user) return null;
  const birth = getBirthParts(user);
  if (birth) {
    const { day, month } = birth;
    return { day, month, formattedDate: [day, month, birth.year].map((part) => String(part).padStart(2, '0')).join('.') };
  }

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

export default function Cardology() {
  const { colors, setPage, user, setUser } = useApp();
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const dateStr = getUserDayAndMonth(user)?.formattedDate;
  const remote = useCalc<{ card: CardItem | null; dateStr: string | null }>('cardology/birth-card', dateStr ? { user: { birthdate: dateStr } } : null);

  useEffect(() => {
    // 1. Load cards from table
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

    // 2. Extract birth date from user
    const userDate = getUserDayAndMonth(user);

    if (!userDate) {
      setSelectedCard(null);
      return;
    }


    // 3. Find birth card
    const foundCard = remote.data?.card ?? loadedDeck.find((card) =>
      card.dates.some((d) => d.day === userDate.day && d.month === userDate.month)
    );

    setSelectedCard(foundCard || null);

    // 4. Automatic synchronization with MongoDB Atlas
    if (!remote.loading && foundCard && user?.email && user.cardology?.birthCard !== foundCard.code) {
      const syncCard = async () => {

        const updatedUser: UserProfile = {
          ...user,
          cardology: {
            birthCard: foundCard.code,
          },
        };

        try {
          await setUser(updatedUser);
          await saveUserProfile(updatedUser);
        } catch (error) {
          console.warn('Offline mode: Card saved locally on device.', error);
        }
      };

      syncCard();
    }
  }, [remote.data, remote.loading, user, setUser]);

  const [failedArtwork, setFailedArtwork] = useState<string>();
  const cardCode = selectedCard?.code;
  const artwork = cardCode && cardCode !== failedArtwork ? cardologyArtwork[cardCode] : undefined;

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
        eyebrow="CARDOLOGY"
        first="Your"
        accent="Birth Card."
      />

      {selectedCard ? (
        <View style={{ gap: 18, marginBottom: 40 }}>
          {/* Birth card display */}
          <Card style={{ alignItems: 'center', paddingVertical: 26, gap: 12 }}>

            <View style={{
              width: '64%', maxWidth: CARD_WIDTH, aspectRatio: CARD_ASPECT_RATIO,
              borderRadius: 14, overflow: 'hidden', marginVertical: 4,
              backgroundColor: colors.purpleSoft, alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 23px rgba(5, 7, 24, 0.45)',
            }}>
              {artwork ? <Image
                key={cardCode}
                source={artwork}
                contentFit="contain"
                accessibilityLabel={selectedCard.nameBg}
                accessible
                style={{ width: '100%', height: '100%' }}
                onError={() => setFailedArtwork(cardCode)}
              /> : <>
                <T size={42} style={{ color: colors.purple }}>{selectedCard.symbol}</T>
                <T bold size={16} style={{ marginTop: 4, color: colors.text }}>{selectedCard.code}</T>
              </>}
            </View>

            <T bold size={24} style={{ color: colors.purple }}>
              {selectedCard.nameBg}
            </T>
          </Card>

          {/* Interpretation */}
          <Section>Meaning & Characteristics</Section>
          <Card style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BookOpen size={16} color={colors.gold} />
              <T bold size={15}>Interpretation</T>
            </View>
            <T muted size={13} style={{ lineHeight: 21 }}>
              {selectedCard.text}
            </T>
          </Card>
        </View>
      ) : (
        /* Missing birth date fallback */
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
            No birth date was found in your profile settings. Please add your birth date to reveal your birth card.
          </T>
          <Pill selected onPress={() => setPage('profile')}>
            <User size={14} color="#FFFFFF" /> Go to Profile
          </Pill>
        </Card>
      )}
    </>
  );
}
