import React, { useState } from 'react';
import { View } from 'react-native';
import { Leaf, Sparkles } from 'lucide-react-native';
import { T, Section } from '../../components/UI';
import { AyurvedaProfile, AyurvedaViewComplexity } from './ayurveda.types';
import { AyurvedaSheetModal, AyurvedaTierCard } from './AyurvedaDetailModal';

type NutritionModalKey = null | 'tastes' | 'foods' | 'herbs' | 'practices';

export function AyurvedaTabNutrition({
  profile,
  mode,
  colors,
}: {
  profile: AyurvedaProfile;
  mode: AyurvedaViewComplexity;
  colors: any;
}) {
  const [openModal, setOpenModal] = useState<NutritionModalKey>(null);

  const topTastes = profile.tastes
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <View style={{ gap: 12 }}>
      <Section>Ahara Nutrition, Herbs & Practices</Section>

      {/* 1. Shad Rasa (Six Tastes 0-10 Scale) */}
      <AyurvedaTierCard
        eyebrow="SHAD RASA · SIX TASTES SCALE (0–10)"
        badgeText={`Pacify ${profile.imbalancedDosha}`}
        badgeColor="#10B981"
        title={`Favor: ${topTastes.map((t) => t.taste).join(', ')}`}
        summary={topTastes
          .map((t) => `${t.taste} (${t.sanskrit}): ${t.score.toFixed(1)}/10`)
          .join(' · ')}
        onPressMore={() => setOpenModal('tastes')}
        colors={colors}
      />

      {/* 2. Favor vs. Reduce Foods */}
      <AyurvedaTierCard
        eyebrow="AYURVEDIC FOOD MATRIX"
        badgeText="Daily Plate"
        title="Foods to Favor vs. Foods to Reduce"
        summary={profile.foodsToFavor[0]?.items || 'Warm, freshly prepared whole foods.'}
        onPressMore={() => setOpenModal('foods')}
        colors={colors}
      />

      {/* 3. Classical Herbs & Spices */}
      <AyurvedaTierCard
        eyebrow="DRAVYAGUNA · HERBS & SPICES"
        badgeText={`${profile.herbsAndSpices.length} Formulations`}
        badgeColor={colors.gold}
        title={profile.herbsAndSpices.map((h) => h.name).join(' · ')}
        summary={profile.herbsAndSpices[0]?.benefit || ''}
        onPressMore={() => setOpenModal('herbs')}
        colors={colors}
      />

      {/* 4. Pranayama, Yoga & Marma */}
      <AyurvedaTierCard
        eyebrow="PRANAYAMA · YOGA · MARMA"
        badgeText="Mind-Body"
        title={profile.practices.map((p) => p.title).join(' · ')}
        summary={profile.practices[0]?.description || ''}
        onPressMore={() => setOpenModal('practices')}
        colors={colors}
      />

      {/* --- TIER 2 MODALS --- */}

      {/* Six Tastes Modal */}
      <AyurvedaSheetModal
        visible={openModal === 'tastes'}
        onClose={() => setOpenModal(null)}
        eyebrow={`SHAD RASA · ${profile.imbalancedDosha.toUpperCase()}-PACIFYING`}
        title="Six Tastes Priority Scale (0–10)"
        colors={colors}
      >
        {profile.tastes
          .slice()
          .sort((a, b) => b.score - a.score)
          .map((t) => (
            <View
              key={t.taste}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.surfaceAlt,
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={13}>
                  {t.taste} ({t.sanskrit})
                </T>
                <T
                  bold
                  size={13}
                  style={{ color: t.score >= 7 ? '#10B981' : colors.muted }}
                >
                  {t.score.toFixed(1)} / 10 · {t.action}
                </T>
              </View>
              {mode === 'pro' && (
                <T bold size={10} style={{ color: colors.purple }}>
                  Elements: {t.elements}
                </T>
              )}
              <T muted size={12} style={{ lineHeight: 18 }}>
                {t.examples}
              </T>
            </View>
          ))}
      </AyurvedaSheetModal>

      {/* Foods Modal */}
      <AyurvedaSheetModal
        visible={openModal === 'foods'}
        onClose={() => setOpenModal(null)}
        eyebrow={`${profile.imbalancedDosha.toUpperCase()} NUTRITION GUIDE`}
        title="Foods to Favor & Reduce"
        colors={colors}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Leaf size={15} color="#10B981" />
          <T bold size={14} style={{ color: '#10B981' }}>
            Favor Regularly
          </T>
        </View>
        {profile.foodsToFavor.map((row) => (
          <View
            key={row.category}
            style={{
              padding: 11,
              borderRadius: 11,
              backgroundColor: colors.surfaceAlt,
              gap: 3,
            }}
          >
            <T bold size={12}>
              {row.category}
            </T>
            <T muted size={12} style={{ lineHeight: 18 }}>
              {row.items}
            </T>
          </View>
        ))}

        <T bold size={14} style={{ color: colors.gold, marginTop: 4 }}>
          Reduce or Minimize
        </T>
        {profile.foodsToReduce.map((row) => (
          <View
            key={row.category}
            style={{
              padding: 11,
              borderRadius: 11,
              backgroundColor: colors.surfaceAlt,
              gap: 3,
            }}
          >
            <T bold size={12}>
              {row.category}
            </T>
            <T muted size={12} style={{ lineHeight: 18 }}>
              {row.items}
            </T>
          </View>
        ))}
      </AyurvedaSheetModal>

      {/* Herbs Modal */}
      <AyurvedaSheetModal
        visible={openModal === 'herbs'}
        onClose={() => setOpenModal(null)}
        eyebrow="CLASSICAL BOTANICAL SUPPORT"
        title="Herbs & Kitchen Spices"
        colors={colors}
      >
        {profile.herbsAndSpices.map((herb) => (
          <View
            key={herb.name}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceAlt,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={14}>
                {herb.name}
              </T>
              <T bold size={10} style={{ color: colors.purple }}>
                {herb.targetDoshas}
              </T>
            </View>
            {mode === 'pro' && (
              <T muted size={11}>
                Botanical: {herb.sanskrit}
              </T>
            )}
            <T size={12} style={{ lineHeight: 18 }}>
              {herb.benefit}
            </T>
            <T bold size={11} style={{ color: colors.gold, marginTop: 2 }}>
              Ritual: {herb.usage}
            </T>
          </View>
        ))}
      </AyurvedaSheetModal>

      {/* Practices Modal */}
      <AyurvedaSheetModal
        visible={openModal === 'practices'}
        onClose={() => setOpenModal(null)}
        eyebrow="RESTORATIVE MOVEMENT & BREATH"
        title="Pranayama, Yoga & Marma"
        colors={colors}
      >
        {profile.practices.map((pr) => (
          <View
            key={pr.title}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceAlt,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={10} style={{ color: colors.purple }}>
                {pr.category.toUpperCase()}
              </T>
              <T bold size={11} style={{ color: colors.gold }}>
                {pr.duration}
              </T>
            </View>
            <T bold size={14}>
              {pr.title} {mode === 'pro' ? `(${pr.sanskrit})` : ''}
            </T>
            <T muted size={12} style={{ lineHeight: 18 }}>
              {pr.description}
            </T>
          </View>
        ))}
      </AyurvedaSheetModal>
    </View>
  );
}