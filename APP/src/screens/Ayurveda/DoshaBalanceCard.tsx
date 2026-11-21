import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Wind, Flame, Droplets } from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import {
  AyurvedaProfile,
  AyurvedaViewComplexity,
  DoshaName,
  MahabhutaElement,
} from './ayurveda.types';
import { DOSHA_META } from './ayurveda.data';

export const DOSHA_ICONS = { Vata: Wind, Pitta: Flame, Kapha: Droplets };
const DOSHA_LIST: DoshaName[] = ['Vata', 'Pitta', 'Kapha'];

const MAHABHUTA_LIST: { key: MahabhutaElement; sanskrit: string; color: string }[] = [
  { key: 'Ether', sanskrit: 'Akasha', color: '#A855F7' },
  { key: 'Air', sanskrit: 'Vayu', color: '#38BDF8' },
  { key: 'Fire', sanskrit: 'Tejas', color: '#EF4444' },
  { key: 'Water', sanskrit: 'Apas', color: '#3B82F6' },
  { key: 'Earth', sanskrit: 'Prithvi', color: '#10B981' },
];

export function DoshaBalanceCard({
  profile,
  mode,
  colors,
}: {
  profile: AyurvedaProfile;
  mode: AyurvedaViewComplexity;
  colors: any;
}) {
  const [layer, setLayer] = useState<'prakriti' | 'vikriti'>('prakriti');
  const activeScores = layer === 'prakriti' ? profile.prakriti : profile.vikriti;

  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Section>
          {layer === 'prakriti' ? 'Prakriti · Birth Blueprint' : 'Vikriti · Current State'}
        </Section>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surfaceAlt,
            borderRadius: 9,
            padding: 2,
          }}
        >
          {(
            [
              { id: 'prakriti', label: 'Prakriti' },
              { id: 'vikriti', label: 'Vikriti' },
            ] as const
          ).map((item) => {
            const active = layer === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setLayer(item.id)}
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 7,
                  backgroundColor: active ? colors.purple : 'transparent',
                }}
              >
                <T
                  bold
                  size={10}
                  style={{ color: active ? '#FFFFFF' : colors.muted }}
                >
                  {item.label}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Card style={{ padding: 15, borderRadius: 16, gap: 12 }}>
        {/* 3 Dosha Columns */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {DOSHA_LIST.map((key) => {
            const Icon = DOSHA_ICONS[key];
            const meta = DOSHA_META[key];
            const pct = activeScores[key];
            const isTop =
              (layer === 'prakriti' && key === profile.primaryDosha) ||
              (layer === 'vikriti' && key === profile.imbalancedDosha);

            return (
              <View
                key={key}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  paddingHorizontal: 8,
                  borderRadius: 14,
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: isTop ? colors.purpleSoft : colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: isTop ? meta.color : colors.line,
                }}
              >
                <Icon size={17} color={meta.color} />
                <T bold size={13}>
                  {key}
                </T>
                <T bold size={18} style={{ color: meta.color }}>
                  {pct}%
                </T>
                <T muted size={9} numberOfLines={1} style={{ textAlign: 'center' }}>
                  {mode === 'pro' ? meta.qualities.split(' · ').slice(0, 2).join(' · ') : meta.elements.split(' ')[0]}
                </T>
              </View>
            );
          })}
        </View>

        {/* Pancha Mahabhuta (5 Elements) in Pro Mode */}
        {mode === 'pro' && (
          <View
            style={{
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: colors.line,
              gap: 6,
            }}
          >
            <T bold size={10} style={{ color: colors.gold, letterSpacing: 0.6 }}>
              PANCHA MAHABHUTA (FIVE GREAT ELEMENTS)
            </T>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              {MAHABHUTA_LIST.map((el) => (
                <View
                  key={el.key}
                  style={{
                    flex: 1,
                    paddingVertical: 6,
                    borderRadius: 9,
                    backgroundColor: colors.surfaceAlt,
                    alignItems: 'center',
                  }}
                >
                  <T bold size={11} style={{ color: el.color }}>
                    {profile.elements[el.key]}%
                  </T>
                  <T bold size={9}>
                    {el.key}
                  </T>
                  <T muted size={8}>
                    {el.sanskrit}
                  </T>
                </View>
              ))}
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}
