import React, { useMemo, useState } from 'react';
import { ScrollView, View, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import {
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Star,
  Wand2,
  Heart,
  Orbit,
} from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import {
  BondProfileInput,
  BondRelationshipType,
  NatalChartResults,
} from './astrology.types';
import { analyzeBondCompatibility, formatShortDate } from './astrology.transits';
import { PUBLIC_FIGURES_CATALOG } from './astrology.insights';
import { requestAstrologyAI } from './astrology.ai';
import { TransitRingSvg } from './TransitRingSvg';
import { DetailSheetModal, TieredSummaryCard } from './AstrologyDetailModal';

const REL_LABELS: Record<BondRelationshipType, string> = {
  romantic: 'Partner',
  ex_partner: 'Ex-Partner',
  friend: 'Friend',
  family: 'Family',
  other: 'Contact',
  public_figure: 'Public Figure',
};

export function AstrologyTabBonds({
  results,
  userName,
  customFriends,
  colors,
  savedIds,
  onAddCustomFriend,
  onSaveBondInsight,
  onShareText,
  onOpenPeopleOrChat,
}: {
  results: NatalChartResults;
  userName: string;
  customFriends: BondProfileInput[];
  colors: any;
  savedIds: Set<string>;
  onAddCustomFriend: (friend: BondProfileInput) => Promise<void> | void;
  onSaveBondInsight: (id: string, title: string, subtitle: string) => void;
  onShareText: (title: string, body: string) => void;
  onOpenPeopleOrChat: (target: 'people' | 'chat') => void;
}) {
  const allProfiles = useMemo(
    () => [...customFriends, ...PUBLIC_FIGURES_CATALOG],
    [customFriends]
  );

  const [selectedId, setSelectedId] = useState<string>(
    () => allProfiles[0]?.id || PUBLIC_FIGURES_CATALOG[0].id
  );
  const [bondDate, setBondDate] = useState<Date>(() => new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeDetailSheet, setActiveDetailSheet] = useState<
    'dynamics' | 'transits' | 'ai' | null
  >(null);

  const [aiBondReading, setAiBondReading] = useState<string | null>(null);
  const [isAiBondLoading, setIsAiBondLoading] = useState(false);

  const [newName, setNewName] = useState('');
  const [newBirthdate, setNewBirthdate] = useState('');
  const [newBirthTime, setNewBirthTime] = useState('');
  const [newCity, setNewCity] = useState('Sofia');
  const [newRelType, setNewRelType] = useState<BondRelationshipType>('romantic');

  const selectedPartner =
    allProfiles.find((p) => p.id === selectedId) || allProfiles[0];

  const bondAnalysis = useMemo(() => {
    if (!selectedPartner) return null;
    return analyzeBondCompatibility(results, userName || 'You', selectedPartner, bondDate);
  }, [results, userName, selectedPartner, bondDate]);

  const handleGenerateAiBondReading = async () => {
    if (!bondAnalysis) return;
    setIsAiBondLoading(true);
    const res = await requestAstrologyAI('bond_synastry', results, {
      bond: bondAnalysis,
    });
    setAiBondReading(res.text);
    setIsAiBondLoading(false);
  };

  const handleCreateBond = async () => {
    if (!newName.trim() || !newBirthdate.trim()) return;
    const created: BondProfileInput = {
      id: `cf_${Date.now()}`,
      name: newName.trim(),
      relationshipType: newRelType,
      birthdate: newBirthdate.trim(),
      birthTime: newBirthTime.trim() || undefined,
      birthCity: { name: newCity.trim() || 'Sofia', country: 'Bulgaria' },
    };
    await onAddCustomFriend(created);
    setSelectedId(created.id);
    setAiBondReading(null);
    setNewName('');
    setNewBirthdate('');
    setNewBirthTime('');
    setShowCreateModal(false);
  };

  return (
    <View style={{ gap: 14 }}>
      {/* Ниво 1: Избор на човек + бързи социални действия */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Section>Select Bond</Section>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            onPress={() => onOpenPeopleOrChat('people')}
            style={{
              padding: 7,
              borderRadius: 9,
              backgroundColor: colors.surfaceAlt,
            }}
          >
            <Users size={15} color={colors.purple} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onOpenPeopleOrChat('chat')}
            style={{
              padding: 7,
              borderRadius: 9,
              backgroundColor: colors.surfaceAlt,
            }}
          >
            <MessageCircle size={15} color={colors.gold} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 9,
              backgroundColor: colors.purple,
            }}
          >
            <Plus size={14} color="#FFFFFF" />
            <T bold size={11} style={{ color: '#FFFFFF' }}>
              New Bond
            </T>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {allProfiles.map((prof) => {
            const active = prof.id === selectedPartner?.id;
            return (
              <TouchableOpacity
                key={prof.id}
                onPress={() => {
                  setSelectedId(prof.id);
                  setAiBondReading(null);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: active ? colors.purple : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.purple : colors.line,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {prof.isPublicFigure && (
                    <Star size={11} color={active ? '#FFFFFF' : colors.gold} />
                  )}
                  <T bold size={12} style={{ color: active ? '#FFFFFF' : colors.text }}>
                    {prof.name}
                  </T>
                </View>
                <T
                  size={10}
                  style={{ color: active ? 'rgba(255,255,255,0.85)' : colors.muted }}
                >
                  {REL_LABELS[prof.relationshipType]}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {bondAnalysis && (
        <>
          {/* Ниво 1: Компактен Score Card */}
          <Card style={{ padding: 16, borderRadius: 16, gap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <T bold size={10} style={{ color: colors.gold }}>
                  {bondAnalysis.partnerChart.planetsByKey.sun?.sign} ☉ ·{' '}
                  {bondAnalysis.partnerChart.planetsByKey.moon?.sign} ☾
                </T>
                <T bold size={17} style={{ marginTop: 2 }}>
                  {userName || 'You'} & {bondAnalysis.partner.name}
                </T>
              </View>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: colors.purpleSoft,
                }}
              >
                <T bold size={16} style={{ color: colors.purple }}>
                  {bondAnalysis.scores.overall}%
                </T>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[
                { label: 'Romantic', val: bondAnalysis.scores.romantic },
                { label: 'Emotional', val: bondAnalysis.scores.emotional },
                { label: 'Mental', val: bondAnalysis.scores.psychological },
              ].map((s) => (
                <View
                  key={s.label}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: colors.surfaceAlt,
                    alignItems: 'center',
                  }}
                >
                  <T bold size={14}>
                    {s.val}%
                  </T>
                  <T muted size={10}>
                    {s.label}
                  </T>
                </View>
              ))}
            </View>

            <T muted size={13} numberOfLines={2} style={{ lineHeight: 19 }}>
              {bondAnalysis.personalizedSummary}
            </T>
          </Card>

          {/* Ниво 1: 3 ясни стъпки за навлизане в дълбочина */}
          <TieredSummaryCard
            tag="AI SYNASTRY ORACLE"
            title="AI Relationship Reading"
            summary="Synthesize your emotional chemistry, attraction axis, and growth lessons."
            onPressMore={() => {
              setActiveDetailSheet('ai');
              if (!aiBondReading && !isAiBondLoading) {
                handleGenerateAiBondReading();
              }
            }}
            colors={colors}
          />

          <TieredSummaryCard
            tag="COMPATIBILITY BLUEPRINT"
            title="Strengths, Friction & Shared Themes"
            summary={bondAnalysis.strengths[0] || bondAnalysis.mutualInfluence}
            onPressMore={() => setActiveDetailSheet('dynamics')}
            colors={colors}
          />

          <TieredSummaryCard
            tag={`ROMANTIC TIMING · ${bondAnalysis.romanticTiming.score}%`}
            title="Bond Transits & Transit Ring"
            summary={bondAnalysis.romanticTiming.phaseLabel}
            onPressMore={() => setActiveDetailSheet('transits')}
            colors={colors}
          />

          {/* Ниво 2: AI Oracle Modal */}
          <DetailSheetModal
            visible={activeDetailSheet === 'ai'}
            onClose={() => setActiveDetailSheet(null)}
            eyebrow="AI RELATIONSHIP ORACLE"
            title={`${userName || 'You'} & ${bondAnalysis.partner.name}`}
            colors={colors}
            onShare={
              aiBondReading
                ? () =>
                    onShareText(
                      `Bond Reading: ${bondAnalysis.partner.name}`,
                      aiBondReading
                    )
                : undefined
            }
          >
            {isAiBondLoading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="large" color={colors.purple} />
                <T muted size={12}>
                  Analyzing synastry aspects...
                </T>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Wand2 size={15} color={colors.purple} />
                  <T bold size={13} style={{ color: colors.purple }}>
                    Synastry Synthesis
                  </T>
                </View>
                <T size={14} style={{ lineHeight: 22 }}>
                  {aiBondReading}
                </T>
              </>
            )}
          </DetailSheetModal>

          {/* Ниво 2: Dynamics Modal */}
          <DetailSheetModal
            visible={activeDetailSheet === 'dynamics'}
            onClose={() => setActiveDetailSheet(null)}
            eyebrow="RELATIONSHIP DYNAMICS"
            title="Strengths & Growth Edges"
            colors={colors}
            isSaved={savedIds.has(`bond_${bondAnalysis.partner.id}`)}
            onSave={() =>
              onSaveBondInsight(
                `bond_${bondAnalysis.partner.id}`,
                `Bond: ${bondAnalysis.partner.name} (${bondAnalysis.scores.overall}%)`,
                bondAnalysis.personalizedSummary
              )
            }
            onShare={() =>
              onShareText(
                `Natala Bond: ${bondAnalysis.partner.name}`,
                bondAnalysis.personalizedSummary
              )
            }
          >
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Heart size={14} color="#10B981" />
                <T bold size={13} style={{ color: '#10B981' }}>
                  Core Strengths
                </T>
              </View>
              {bondAnalysis.strengths.map((st, i) => (
                <T key={i} size={13} style={{ lineHeight: 19 }}>
                  • {st}
                </T>
              ))}
            </View>

            <View style={{ gap: 6 }}>
              <T bold size={13} style={{ color: '#F59E0B' }}>
                Potential Friction
              </T>
              {bondAnalysis.conflicts.map((cf, i) => (
                <T key={i} size={13} style={{ lineHeight: 19 }}>
                  • {cf}
                </T>
              ))}
            </View>

            <View
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.purpleSoft,
                gap: 4,
              }}
            >
              <T bold size={11} style={{ color: colors.purple }}>
                MUTUAL INFLUENCE
              </T>
              <T size={13} style={{ lineHeight: 19 }}>
                {bondAnalysis.mutualInfluence}
              </T>
            </View>
          </DetailSheetModal>

          {/* Ниво 2: Bond Transits & Time Travel Modal */}
          <DetailSheetModal
            visible={activeDetailSheet === 'transits'}
            onClose={() => setActiveDetailSheet(null)}
            eyebrow="BOND TIMING & CYCLES"
            title={`Bond Transits (${formatShortDate(bondDate)})`}
            colors={colors}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: colors.surfaceAlt,
                borderRadius: 12,
                padding: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => setBondDate((d) => new Date(d.getTime() - 30 * 86400000))}
                style={{ padding: 6 }}
              >
                <ChevronLeft size={16} color={colors.purple} />
              </TouchableOpacity>
              <T bold size={13}>
                {formatShortDate(bondDate)}
              </T>
              <TouchableOpacity
                onPress={() => setBondDate((d) => new Date(d.getTime() + 30 * 86400000))}
                style={{ padding: 6 }}
              >
                <ChevronRight size={16} color={colors.purple} />
              </TouchableOpacity>
            </View>

            <TransitRingSvg
              transits={bondAnalysis.bondTransits}
              colors={colors}
              title={`BOND RING · ${bondAnalysis.partner.name.toUpperCase()}`}
            />

            <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.purpleSoft }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Orbit size={13} color={colors.purple} />
                <T bold size={11} style={{ color: colors.purple }}>
                  CLOSENESS WINDOWS
                </T>
              </View>
              {bondAnalysis.romanticTiming.closenessWindows.map((w, i) => (
                <T key={i} size={12} style={{ marginTop: 4 }}>
                  • {w}
                </T>
              ))}
            </View>
          </DetailSheetModal>
        </>
      )}

      {/* Модал за създаване на нов Bond */}
      <DetailSheetModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        eyebrow="ADD PROFILE"
        title="Create New Bond"
        colors={colors}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(
              ['romantic', 'ex_partner', 'friend', 'family', 'other'] as BondRelationshipType[]
            ).map((rt) => (
              <TouchableOpacity
                key={rt}
                onPress={() => setNewRelType(rt)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: newRelType === rt ? colors.purple : colors.surfaceAlt,
                }}
              >
                <T
                  bold
                  size={11}
                  style={{ color: newRelType === rt ? '#FFFFFF' : colors.muted }}
                >
                  {REL_LABELS[rt]}
                </T>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="Name"
          placeholderTextColor={colors.muted}
          style={{
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.text,
          }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={newBirthdate}
            onChangeText={setNewBirthdate}
            placeholder="Birth Date (15.05.1996)"
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.text,
            }}
          />
          <TextInput
            value={newBirthTime}
            onChangeText={setNewBirthTime}
            placeholder="Time (14:30)"
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.text,
            }}
          />
        </View>
        <TextInput
          value={newCity}
          onChangeText={setNewCity}
          placeholder="Birth City (Sofia)"
          placeholderTextColor={colors.muted}
          style={{
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.text,
          }}
        />
        <TouchableOpacity
          onPress={handleCreateBond}
          style={{
            backgroundColor: colors.purple,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <T bold size={13} style={{ color: '#FFFFFF' }}>
            Calculate & Save Bond
          </T>
        </TouchableOpacity>
      </DetailSheetModal>
    </View>
  );
}