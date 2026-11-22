import React, { useState } from 'react';
import { View } from 'react-native';
import { Flame, Sparkles, Activity } from 'lucide-react-native';
import { T, Section } from '../../components/UI';
import { AyurvedaProfile, AyurvedaViewComplexity } from './ayurveda.types';
import { AyurvedaSheetModal, AyurvedaTierCard } from './AyurvedaDetailModal';

type DiagnosticModalKey = null | 'agni' | 'essences' | 'gunas' | 'subdoshas';

export function AyurvedaTabDiagnostics({
  profile,
  mode,
  colors,
}: {
  profile: AyurvedaProfile;
  mode: AyurvedaViewComplexity;
  colors: any;
}) {
  const [openModal, setOpenModal] = useState<DiagnosticModalKey>(null);

  return (
    <View style={{ gap: 12 }}>
      <Section>Metabolic Fire, Vitality & Mind Diagnostics</Section>

      {/* 1. Agni (Digestive & Metabolic Fire) */}
      <AyurvedaTierCard
        eyebrow="AGNI · DIGESTIVE & METABOLIC FIRE"
        badgeText={`${profile.agni.efficiencyScore}% Efficiency`}
        badgeColor="#EF4444"
        title={`${profile.agni.type} (${profile.agni.englishTitle})`}
        summary={profile.agni.summary}
        onPressMore={() => setOpenModal('agni')}
        colors={colors}
      />

      {/* 2. Vital Essences: Ojas, Tejas, Prana & Ama */}
      <AyurvedaTierCard
        eyebrow="VITAL ESSENCES & AMA INDEX (0–10)"
        badgeText={`Ojas ${profile.vitalEssences.ojas}/10`}
        badgeColor="#10B981"
        title="Ojas, Tejas, Prana & Metabolic Purity"
        summary={profile.vitalEssences.summary}
        onPressMore={() => setOpenModal('essences')}
        colors={colors}
      />

      {/* 3. Triguna Mind Profile (Sattva, Rajas, Tamas) */}
      <AyurvedaTierCard
        eyebrow="TRIGUNA · MENTAL & EMOTIONAL QUALITIES"
        badgeText={`Primary: ${profile.primaryGuna}`}
        badgeColor={colors.purple}
        title={`Sattva ${profile.gunas.Sattva}% · Rajas ${profile.gunas.Rajas}% · Tamas ${profile.gunas.Tamas}%`}
        summary="Measures mental clarity (Sattva), active drive (Rajas), and grounded stillness (Tamas)."
        onPressMore={() => setOpenModal('gunas')}
        colors={colors}
      />

      {/* 4. Active Subdoshas */}
      <AyurvedaTierCard
        eyebrow={`SUBDOSHAS OF ${profile.imbalancedDosha.toUpperCase()}`}
        badgeText={`${profile.subdoshas.length} Pathways`}
        title={profile.subdoshas.map((s) => s.name).join(' · ')}
        summary={profile.subdoshas[0]?.tip || 'Targeted subdosha alignment.'}
        onPressMore={() => setOpenModal('subdoshas')}
        colors={colors}
      />

      {/* --- TIER 2 MODALS --- */}

      {/* Agni Modal */}
      <AyurvedaSheetModal
        visible={openModal === 'agni'}
        onClose={() => setOpenModal(null)}
        eyebrow={`METABOLIC FIRE · ${profile.agni.efficiencyScore}%`}
        title={`${profile.agni.type} · ${profile.agni.englishTitle}`}
        colors={colors}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Flame size={16} color="#EF4444" />
          <T bold size={14}>
            Digestive Assessment
          </T>
        </View>
        <T size={14} style={{ lineHeight: 21 }}>
          {profile.agni.summary}
        </T>
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.purpleSoft, gap: 4 }}>
          <T bold size={11} style={{ color: colors.purple }}>
            AGNI KINDLING PROTOCOL
          </T>
          <T size={13} style={{ lineHeight: 19 }}>
            {profile.agni.balancingProtocol}
          </T>
        </View>
      </AyurvedaSheetModal>

      {/* Vital Essences Modal */}
      <AyurvedaSheetModal
        visible={openModal === 'essences'}
        onClose={() => setOpenModal(null)}
        eyebrow="SUBTLE AYURVEDIC RESERVES"
        title="Ojas, Tejas, Prana & Ama"
        colors={colors}
      >
        {[
          {
            label: 'Ojas · Vitality & Immunity Reserve',
            score: profile.vitalEssences.ojas,
            color: '#10B981',
            desc: 'Deep biological resilience, calm strength, and radiant stamina.',
          },
          {
            label: 'Tejas · Cellular Intelligence & Focus',
            score: profile.vitalEssences.tejas,
            color: '#EF4444',
            desc: 'Discernment, enthusiasm, and transformative metabolic warmth.',
          },
          {
            label: 'Prana · Life Force & Breath Flow',
            score: profile.vitalEssences.prana,
            color: '#8B5CF6',
            desc: 'Sensory alertness, creativity, and nervous system vitality.',
          },
          {
            label: 'Ama · Metabolic Stagnation (Lower is Cleaner)',
            score: profile.vitalEssences.amaIndex,
            color: '#EAB308',
            desc: 'Undigested residue; cleared through warm spices, rest, and light dinners.',
          },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceAlt,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={13}>
                {item.label}
              </T>
              <T bold size={13} style={{ color: item.color }}>
                {item.score.toFixed(1)} / 10
              </T>
            </View>
            <T muted size={12} style={{ lineHeight: 18 }}>
              {item.desc}
            </T>
          </View>
        ))}

        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.purpleSoft }}>
          <T size={13} style={{ lineHeight: 19 }}>
            {profile.vitalEssences.deepGuidance}
          </T>
        </View>
      </AyurvedaSheetModal>

      {/* Triguna Modal */}
      <AyurvedaSheetModal
        visible={openModal === 'gunas'}
        onClose={() => setOpenModal(null)}
        eyebrow="MENTAL CONSTITUTION"
        title="Triguna Balance (Sattva · Rajas · Tamas)"
        colors={colors}
      >
        {(
          [
            {
              name: 'Sattva · Clarity & Harmony',
              pct: profile.gunas.Sattva,
              color: '#10B981',
              desc: 'Peaceful awareness, compassion, intuitive wisdom, and balanced speech.',
            },
            {
              name: 'Rajas · Passion & Momentum',
              pct: profile.gunas.Rajas,
              color: '#EF4444',
              desc: 'Ambition, initiative, outward action, and creative drive.',
            },
            {
              name: 'Tamas · Stillness & Grounding',
              pct: profile.gunas.Tamas,
              color: '#64748B',
              desc: 'Deep rest, stability, structure, and restorative sleep.',
            },
          ] as const
        ).map((g) => (
          <View key={g.name} style={{ gap: 5 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={13}>
                {g.name}
              </T>
              <T bold size={13} style={{ color: g.color }}>
                {g.pct}%
              </T>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: 99,
                backgroundColor: colors.surfaceAlt,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${g.pct}%`,
                  height: '100%',
                  backgroundColor: g.color,
                }}
              />
            </View>
            <T muted size={12}>
              {g.desc}
            </T>
          </View>
        ))}
      </AyurvedaSheetModal>

      {/* Subdoshas Modal */}
      <AyurvedaSheetModal
        visible={openModal === 'subdoshas'}
        onClose={() => setOpenModal(null)}
        eyebrow={`${profile.imbalancedDosha.toUpperCase()} SUBTLE PATHWAYS`}
        title="Subdosha Diagnostics"
        colors={colors}
      >
        {profile.subdoshas.map((sd) => (
          <View
            key={sd.name}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceAlt,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={14}>
                {sd.name}
              </T>
              <T bold size={11} style={{ color: colors.purple }}>
                {sd.status}
              </T>
            </View>
            {mode === 'pro' && (
              <T bold size={11} style={{ color: colors.gold }}>
                Domain: {sd.domain}
              </T>
            )}
            <T size={12} style={{ lineHeight: 18 }}>
              {sd.tip}
            </T>
          </View>
        ))}
      </AyurvedaSheetModal>
    </View>
  );
}