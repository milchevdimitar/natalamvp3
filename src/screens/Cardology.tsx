import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Calendar, BookOpen, Search } from 'lucide-react-native';
import { Asset } from 'expo-asset';
import { useApp } from '../context/AppContext';
import { Card, T, Section, Pill, Hero } from '../components/UI';

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
  KS: { nameBg: "Поп Пика", symbol: "♠" },
  QS: { nameBg: "Дама Пика", symbol: "♠" },
  JS: { nameBg: "Вале Пика", symbol: "♠" },
  '10S': { nameBg: "10 Пика", symbol: "♠" },
  '9S': { nameBg: "9 Пика", symbol: "♠" },
  '8S': { nameBg: "8 Пика", symbol: "♠" },
  '7S': { nameBg: "7 Пика", symbol: "♠" },
  '6S': { nameBg: "6 Пика", symbol: "♠" },
  '5S': { nameBg: "5 Пика", symbol: "♠" },
  '4S': { nameBg: "4 Пика", symbol: "♠" },
  '3S': { nameBg: "3 Пика", symbol: "♠" },
  '2S': { nameBg: "2 Пика", symbol: "♠" },
  AS: { nameBg: "Асо Пика", symbol: "♠" },

  KD: { nameBg: "Поп Каро", symbol: "♦" },
  QD: { nameBg: "Дама Каро", symbol: "♦" },
  JD: { nameBg: "Вале Каро", symbol: "♦" },
  '10D': { nameBg: "10 Каро", symbol: "♦" },
  '9D': { nameBg: "9 Каро", symbol: "♦" },
  '8D': { nameBg: "8 Каро", symbol: "♦" },
  '7D': { nameBg: "7 Каро", symbol: "♦" },
  '6D': { nameBg: "6 Каро", symbol: "♦" },
  '5D': { nameBg: "5 Каро", symbol: "♦" },
  '4D': { nameBg: "4 Каро", symbol: "♦" },
  '3D': { nameBg: "3 Каро", symbol: "♦" },
  '2D': { nameBg: "2 Каро", symbol: "♦" },
  AD: { nameBg: "Асо Каро", symbol: "♦" },

  KC: { nameBg: "Поп Спатия", symbol: "♣" },
  QC: { nameBg: "Дама Спатия", symbol: "♣" },
  JC: { nameBg: "Вале Спатия", symbol: "♣" },
  '10C': { nameBg: "10 Спатия", symbol: "♣" },
  '9C': { nameBg: "9 Спатия", symbol: "♣" },
  '8C': { nameBg: "8 Спатия", symbol: "♣" },
  '7C': { nameBg: "7 Спатия", symbol: "♣" },
  '6C': { nameBg: "6 Спатия", symbol: "♣" },
  '5C': { nameBg: "5 Спатия", symbol: "♣" },
  '4C': { nameBg: "4 Спатия", symbol: "♣" },
  '3C': { nameBg: "3 Спатия", symbol: "♣" },
  '2C': { nameBg: "2 Спатия", symbol: "♣" },
  AC: { nameBg: "Асо Спатия", symbol: "♣" },

  KH: { nameBg: "Поп Купа", symbol: "♥" },
  QH: { nameBg: "Дама Купа", symbol: "♥" },
  JH: { nameBg: "Вале Купа", symbol: "♥" },
  '10H': { nameBg: "10 Купа", symbol: "♥" },
  '9H': { nameBg: "9 Купа", symbol: "♥" },
  '8H': { nameBg: "8 Купа", symbol: "♥" },
  '7H': { nameBg: "7 Купа", symbol: "♥" },
  '6H': { nameBg: "6 Купа", symbol: "♥" },
  '5H': { nameBg: "5 Купа", symbol: "♥" },
  '4H': { nameBg: "4 Купа", symbol: "♥" },
  '3H': { nameBg: "3 Купа", symbol: "♥" },
  '2H': { nameBg: "2 Купа", symbol: "♥" },
  AH: { nameBg: "Асо Купа", symbol: "♥" },
  J: { nameBg: "Жокер", symbol: "🃏" },
};

function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal);
      currentVal = '';
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        lines.push(row);
      }
      row = [];
    } else {
      currentVal += char;
    }
  }
  if (currentVal !== '' || row.length > 0) {
    row.push(currentVal);
    lines.push(row);
  }
  return lines;
}

export default function Cardology() {
  const { colors, setPage } = useApp();
  const [dateInput, setDateInput] = useState("31.08");
  const [loading, setLoading] = useState(true);
  const [cardsDeck, setCardsDeck] = useState<CardItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  useEffect(() => {
    async function loadCsvFile() {
      try {
        const asset = Asset.fromModule(require('../../assets/Cardology.csv'));
        await asset.downloadAsync();
        
        const response = await fetch(asset.localUri || asset.uri);
        const csvText = await response.text();

        const allRows = parseCSV(csvText);
        const dataRows = allRows.slice(1);
        const loadedDeck: CardItem[] = [];

        dataRows.forEach((row) => {
          if (row.length < 5) return;

          const cardN = parseInt(row[0].trim(), 10) || 0;
          const rawDatesCell = row[1].trim();
          const code = row[2].trim();
          const bookN = parseInt(row[3].trim(), 10) || 0;
          const text = row[4].trim();

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

        setCardsDeck(loadedDeck);
        findCardByDateInput("31.08", loadedDeck);
      } catch (err) {
        console.error("Грешка при зареждане на данните:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCsvFile();
  }, []);

  const findCardByDateInput = (input: string, deckToSearch = cardsDeck) => {
    const clean = input.trim().replace(/[\/\-\s]/g, '.');
    const parts = clean.split('.').map((p) => parseInt(p.trim(), 10));

    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const day = parts[0];
      const month = parts[1];

      const found = deckToSearch.find((card) =>
        card.dates.some((d) => d.day === day && d.month === month)
      );

      setSelectedCard(found || null);
    } else {
      setSelectedCard(null);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setPage('explore')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
      >
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Назад към Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="КАРДОЛОГИЯ"
        first="Вашата"
        accent="Рождена Карта."
        description="Открийте значението на вашата соларна рождена карта."
      />

      {loading ? (
        <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
          <ActivityIndicator size="large" color={colors.purple} />
          <T muted size={13}>
            Зареждане...
          </T>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 20 }}>
            <View style={{ gap: 6, marginBottom: 14 }}>
              <T muted size={11}>ВЪВЕДЕТЕ ДЕН И МЕСЕЦ (НАПР. 31.08, 29.09 ИЛИ 1.01)</T>
              <View
                style={{
                  height: 48,
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 14,
                  justifyContent: 'center',
                  paddingHorizontal: 14,
                }}
              >
                <TextInput
                  style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}
                  value={dateInput}
                  onChangeText={(val) => {
                    setDateInput(val);
                    findCardByDateInput(val);
                  }}
                  placeholder="31.08"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <Pill selected onPress={() => findCardByDateInput(dateInput)}>
              <Search size={14} color="#FFF" style={{ marginRight: 6 }} /> Търси
            </Pill>
          </Card>

          {selectedCard ? (
            <View style={{ gap: 18, marginBottom: 40 }}>
              <Card style={{ alignItems: 'center', paddingVertical: 26, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} color={colors.gold} />
                  <T muted size={11} style={{ letterSpacing: 1.5 }}>
                    ВАШАТА РОЖДЕНА КАРТА
                  </T>
                </View>

                <View
                  style={{
                    width: 90,
                    height: 130,
                    borderRadius: 20,
                    backgroundColor: colors.purpleSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: colors.purple,
                    marginVertical: 4,
                  }}
                >
                  <T size={42} style={{ color: colors.purple }}>
                    {selectedCard.symbol}
                  </T>
                  <T bold size={16} style={{ marginTop: 4, color: colors.text }}>
                    {selectedCard.code}
                  </T>
                </View>

                <T bold size={24} style={{ color: colors.purple }}>
                  {selectedCard.nameBg}
                </T>
              </Card>

              <Section>Значение и характеристика</Section>
              <Card style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={16} color={colors.gold} />
                  <T bold size={15}>Тълкуване</T>
                </View>
                <T muted size={13} style={{ lineHeight: 21 }}>
                  {selectedCard.text}
                </T>
              </Card>
            </View>
          ) : (
            <Card style={{ alignItems: 'center', paddingVertical: 30, gap: 8 }}>
              <T bold size={15} style={{ color: colors.purple }}>
                Няма намерена карта за тази дата
              </T>
              <T muted size={12} style={{ textAlign: 'center' }}>
                Въведете дата във формат ДД.ММ (напр. 31.08, 29.09, 25.11, 1.01).
              </T>
            </Card>
          )}
        </>
      )}
    </>
  );
}