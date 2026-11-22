import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import {
  ArrowLeft,
  Sliders,
  Compass,
  Clock,
  Activity,
  Leaf,
  Heart,
  Sparkles,
} from 'lucide-react-native';
import { Hero, Card, T, Section } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { saveSystemActivity, useSystemActivity } from '../../services/systemActivity';
import { getBirthParts } from '../../services/profileDashboard';
import {
  AyurvedaTabId,
  AyurvedaViewComplexity,
  DoshaName,
} from './ayurveda.types';
import { calculateAyurvedaProfile } from './ayurveda.calculator';
import { toLocalWallClock, useCalc } from '../../services/calcApi';
import { PRAKRITI_QUIZ_QUESTIONS } from './ayurveda.data';
import { DoshaBalanceCard } from './DoshaBalanceCard';
import { AyurvedaSheetModal, AyurvedaTierCard } from './AyurvedaDetailModal';
import { AyurvedaTabDaily } from './AyurvedaTabDaily';
import { AyurvedaTabDiagnostics } from './AyurvedaTabDiagnostics';
import { AyurvedaTabNutrition } from './AyurvedaTabNutrition';
import { AyurvedaTabMatch } from './AyurvedaTabMatch';

export default function Ayurveda() {
  const { colors, user, setPage } = useApp();

  const initial = useMemo(() => getBirthParts(user), [user]);

  const [activeTab, setActiveTab] = useState<AyurvedaTabId>('prakriti');
  const [viewComplexity, setViewComplexity] = useState<AyurvedaViewComplexity>('simple');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);

  const [personName, setPersonName] = useState(user?.name || 'Your Ayurvedic Blueprint');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, DoshaName>>({});
  const [stressLevel, setStressLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const savedAssessment = useSystemActivity(user?.email)?.ayurveda;

  useEffect(() => {
    if (!savedAssessment) return;
    setQuizAnswers(savedAssessment.answers);
    setStressLevel(savedAssessment.stress);
  }, [savedAssessment]);

  const options = useMemo(
    () => ({
        personName,
        birthYear: initial?.year,
        birthMonth: initial?.month,
        birthDay: initial?.day,
        useBirthBaseline: Boolean(initial),
        quizAnswers,
        currentStressLevel: stressLevel,
      }),
    [personName, initial, quizAnswers, stressLevel]
  );
  const localDate = toLocalWallClock();
  const remote = useCalc<ReturnType<typeof calculateAyurvedaProfile>>('ayurveda/profile', {
    options: { ...options, personName: undefined }, localDate,
  });
  const profile = useMemo(() => remote.data
    ? { ...remote.data, personName }
    : calculateAyurvedaProfile(options), [options, personName, remote.data]);

  const answeredCount = Object.keys(quizAnswers).length;

  return (
    <>
      {/* Top Bar: Back + Simple/Pro Toggle */}
      <View style={styles.topNavRow}>
        <Pressable
          onPress={() => setPage('explore')}
          style={[styles.backBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <ArrowLeft size={16} color={colors.text} />
          <T bold size={12}>
            Explore
          </T>
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surfaceAlt,
            borderRadius: 10,
            padding: 3,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          {(['simple', 'pro'] as AyurvedaViewComplexity[]).map((mode) => {
            const active = viewComplexity === mode;
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => setViewComplexity(mode)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 7,
                  backgroundColor: active ? colors.action : 'transparent',
                }}
              >
                <T
                  bold
                  size={10}
                  style={{ color: active ? '#FFFFFF' : colors.muted }}
                >
                  {mode === 'simple' ? 'Simple' : 'Pro'}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Hero
        eyebrow="AYURVEDA · SCIENCE OF LIFE"
        first="Harmonize your"
        accent="inner elements."
        description="Prakriti & Vikriti constitution, Agni fire, Dinacharya rhythms & Ahara nutrition."
      />

      {/* 5-Tab Tiered Navigation */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surfaceAlt,
          borderRadius: 14,
          padding: 4,
          marginTop: 12,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        {(
          [
            { id: 'prakriti', label: 'Prakriti', Icon: Compass },
            { id: 'clock', label: 'Clock', Icon: Clock },
            { id: 'diagnostics', label: 'Agni & Qi', Icon: Activity },
            { id: 'ahara', label: 'Ahara', Icon: Leaf },
            { id: 'match', label: 'Match', Icon: Heart },
          ] as const
        ).map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => setActiveTab(id)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                backgroundColor: active ? colors.action : 'transparent',
              }}
            >
              <Icon size={14} color={active ? '#FFFFFF' : colors.muted} />
              <T bold size={10} style={{ color: active ? '#FFFFFF' : colors.muted }}>
                {label}
              </T>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'prakriti' && (
        <View style={{ gap: 14 }}>
          {/* Compact Constitution Header + Quiz Button */}
          <Card style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Sparkles size={18} color={colors.gold} />
              <View style={{ flex: 1, gap: 2 }}>
                <T bold size={14}>
                  {profile.personName} · {profile.constitutionType}
                </T>
                <T muted size={11}>
                  Primary: {profile.primaryDosha} · Secondary: {profile.secondaryDosha} ·{' '}
                  {answeredCount > 0
                    ? `${answeredCount}/${PRAKRITI_QUIZ_QUESTIONS.length} quiz refined`
                    : 'Birth baseline'}
                </T>
              </View>

              <TouchableOpacity
                onPress={() => setShowQuizModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 9,
                  backgroundColor: colors.purpleSoft,
                }}
              >
                <Sliders size={12} color={colors.purple} />
                <T bold size={11} style={{ color: colors.purple }}>
                  Quiz
                </T>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Prakriti & Vikriti Tridosha Card */}
          <DoshaBalanceCard
            profile={profile}
            mode={viewComplexity}
            colors={colors}
          />

          {/* Tier 1: Constitution Archetype Synthesis */}
          <AyurvedaTierCard
            eyebrow={`CONSTITUTION · ${profile.constitutionType.toUpperCase()}`}
            badgeText={
              profile.hasActiveImbalance
                ? `Pacify ${profile.imbalancedDosha}`
                : 'In Balance'
            }
            badgeColor={profile.hasActiveImbalance ? colors.gold : '#10B981'}
            title={profile.archetypeHeadline}
            summary={profile.archetypeSummary}
            onPressMore={() => setShowOverviewModal(true)}
            colors={colors}
          />

          {/* Quick Seasonal & Agni Snapshot */}
          <Section>Current Alignment Snapshot</Section>
          <Card style={styles.snapshotCard}>
            <T bold size={13} style={{ color: colors.gold }}>
              {profile.season.seasonName} ({profile.season.sanskritName}) ·{' '}
              {profile.agni.type}
            </T>
            <T muted size={12} style={{ lineHeight: 18 }}>
              {profile.agni.balancingProtocol}
            </T>
          </Card>
        </View>
      )}

      {activeTab === 'clock' && (
        <AyurvedaTabDaily
          profile={profile}
          mode={viewComplexity}
          colors={colors}
        />
      )}

      {activeTab === 'diagnostics' && (
        <AyurvedaTabDiagnostics
          profile={profile}
          mode={viewComplexity}
          colors={colors}
        />
      )}

      {activeTab === 'ahara' && (
        <AyurvedaTabNutrition
          profile={profile}
          mode={viewComplexity}
          colors={colors}
        />
      )}

      {activeTab === 'match' && (
        <AyurvedaTabMatch userProfile={profile} colors={colors} />
      )}

      {/* Tier 2: Full Constitution Synthesis Modal */}
      <AyurvedaSheetModal
        visible={showOverviewModal}
        onClose={() => setShowOverviewModal(false)}
        eyebrow={`PRAKRITI: ${profile.constitutionType.toUpperCase()}`}
        title={profile.archetypeHeadline}
        colors={colors}
      >
        <T size={14} style={{ lineHeight: 21 }}>
          {profile.archetypeSummary}
        </T>
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt }}>
          <T bold size={11} style={{ color: '#10B981' }}>
            NATURAL GIFTS & STRENGTHS
          </T>
          <T size={13} style={{ marginTop: 3, lineHeight: 19 }}>
            {profile.strengths}
          </T>
        </View>
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.purpleSoft }}>
          <T bold size={11} style={{ color: colors.purple }}>
            IMBALANCE SIGNS TO WATCH ({profile.imbalancedDosha.toUpperCase()})
          </T>
          <T size={13} style={{ marginTop: 3, lineHeight: 19 }}>
            {profile.watchOuts}
          </T>
        </View>
      </AyurvedaSheetModal>

      {/* Tier 2: Interactive Prakriti & Vikriti Assessment Quiz Modal */}
      <AyurvedaSheetModal
        visible={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        eyebrow="DOSHA ASSESSMENT"
        title="Refine Prakriti & Current Stress"
        colors={colors}
      >
        <TextInput
          value={personName}
          onChangeText={setPersonName}
          placeholder="Your Name"
          placeholderTextColor={colors.muted}
          style={{
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 9,
            color: colors.text,
          }}
        />

        {/* Current Stress / Vikriti Modulator */}
        <View style={{ gap: 6 }}>
          <T bold size={11} style={{ color: colors.gold }}>
            CURRENT STRESS & PACING (VIKRITI)
          </T>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['low', 'moderate', 'high'] as const).map((lvl) => {
              const active = stressLevel === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  onPress={() => setStressLevel(lvl)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 9,
                    alignItems: 'center',
                    backgroundColor: active ? colors.action : colors.surfaceAlt,
                  }}
                >
                  <T
                    bold
                    size={11}
                    style={{ color: active ? '#FFFFFF' : colors.muted }}
                  >
                    {lvl.toUpperCase()}
                  </T>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6 Constitutional Questions */}
        {PRAKRITI_QUIZ_QUESTIONS.map((q) => (
          <View
            key={q.id}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceAlt,
              gap: 7,
            }}
          >
            <T bold size={11} style={{ color: colors.purple }}>
              {q.category.toUpperCase()}
            </T>
            <T bold size={13}>
              {q.prompt}
            </T>
            <View style={{ gap: 5 }}>
              {q.options.map((opt) => {
                const selected = quizAnswers[q.id] === opt.dosha;
                return (
                  <TouchableOpacity
                    key={opt.dosha}
                    onPress={() =>
                      setQuizAnswers((prev) => ({ ...prev, [q.id]: opt.dosha }))
                    }
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 9,
                      backgroundColor: selected ? colors.purpleSoft : colors.surface,
                      borderWidth: 1,
                      borderColor: selected ? colors.purple : colors.line,
                    }}
                  >
                    <T
                      bold={selected}
                      size={12}
                      style={{ color: selected ? colors.purple : colors.text }}
                    >
                      {opt.label}
                    </T>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity
          disabled={answeredCount < PRAKRITI_QUIZ_QUESTIONS.length}
          onPress={async () => {
            if (user?.email) {
              try {
                await saveSystemActivity(user.email, 'ayurveda', {
                  answers: quizAnswers, stress: stressLevel, constitution: profile.constitutionType, scores: profile.prakriti,
                });
              } catch (error) {
                console.warn('Could not save Ayurveda assessment:', error);
                return;
              }
            }
            setShowQuizModal(false);
          }}
          style={{
            backgroundColor: colors.action,
            opacity: answeredCount < PRAKRITI_QUIZ_QUESTIONS.length ? 0.5 : 1,
            paddingVertical: 11,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <T bold size={13} style={{ color: '#FFFFFF' }}>
            Save & Update Blueprint
          </T>
        </TouchableOpacity>
      </AyurvedaSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  profileCard: {
    padding: 14,
    borderRadius: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  snapshotCard: {
    padding: 15,
    borderRadius: 16,
    gap: 6,
    marginBottom: 24,
  },
});
