import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import {
  Heart,
  Plus,
  Users,
  Sparkles,
  Share2,
  Bookmark,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Star,
} from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import {
  BondProfileInput,
  BondRelationshipType,
  NatalChartResults,
} from './astrology.types';
import { analyzeBondCompatibility, formatShortDate } from './astrology.transits';
import { PUBLIC_FIGURES_CATALOG } from './astrology.insights';
import { TransitRingSvg } from './TransitRingSvg';

const REL_LABELS: Record<BondRelationshipType, string> = {
  romantic: 'Романтичен партньор',
  ex_partner: 'Бивш партньор',
  friend: 'Приятел',
  family: 'Семейство',
  other: 'Друг човек',
  public_figure: 'Публична личност',
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
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Форма за създаване на нов Bond / Custom Friend (6.13–6.17 & 8.6)
  const [newName, setNewName] = useState('');
  const [newBirthdate, setNewBirthdate] = useState('');
  const [newBirthTime, setNewBirthTime] = useState('');
  const [newCity, setNewCity] = useState('Sofia');
  const [newRelType, setNewRelType] = useState<BondRelationshipType>('romantic');

  const selectedPartner =
    allProfiles.find((p) => p.id === selectedId) || allProfiles[0];

  const bondAnalysis = useMemo(() => {
    if (!selectedPartner) return null;
    return analyzeBondCompatibility(results, userName || 'Ти', selectedPartner, bondDate);
  }, [results, userName, selectedPartner, bondDate]);

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
    setNewName('');
    setNewBirthdate('');
    setNewBirthTime('');
    setShowCreateForm(false);
  };

  return (
    <View style={{ gap: 14 }}>
      {/* Горна лента: Създаване на Bond & Социална интеграция (Friends / Connect / Chat) */}
      <Card style={{ padding: 14, gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Heart size={16} color={colors.purple} />
            <T bold size={14}>
              Bonds & Relationship Intelligence
            </T>
          </View>

          <TouchableOpacity
            onPress={() => setShowCreateForm((v) => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: colors.purple,
            }}
          >
            <Plus size={14} color="#FFFFFF" />
            <T bold size={11} style={{ color: '#FFFFFF' }}>
              New Bond
            </T>
          </TouchableOpacity>
        </View>

        {/* Бързи бутони към Friends / Connect (Dating) / Chat (Модули 8 & 9) */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => onOpenPeopleOrChat('people')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: colors.surfaceAlt,
            }}
          >
            <Users size={14} color={colors.purple} />
            <T bold size={11}>
              Friends & Connect
            </T>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onOpenPeopleOrChat('chat')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: colors.surfaceAlt,
            }}
          >
            <MessageCircle size={14} color={colors.gold} />
            <T bold size={11}>
              Cosmic Chat
            </T>
          </TouchableOpacity>
        </View>

        {/* Форма за добавяне на Custom Friend / Partner / Family */}
        {showCreateForm && (
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceAlt,
              gap: 8,
              marginTop: 4,
            }}
          >
            <T bold size={13}>
              Създай нов Bond (Партньор, Бивш, Приятел, Семейство)
            </T>

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
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: newRelType === rt ? colors.purple : colors.surface,
                    }}
                  >
                    <T
                      bold
                      size={10}
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
              placeholder="Име (напр. Мария)"
              placeholderTextColor={colors.muted}
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                color: colors.text,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={newBirthdate}
                onChangeText={setNewBirthdate}
                placeholder="Дата (15.05.1996)"
                placeholderTextColor={colors.muted}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  color: colors.text,
                }}
              />
              <TextInput
                value={newBirthTime}
                onChangeText={setNewBirthTime}
                placeholder="Час (14:30)"
                placeholderTextColor={colors.muted}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  color: colors.text,
                }}
              />
            </View>
            <TextInput
              value={newCity}
              onChangeText={setNewCity}
              placeholder="Град на раждане (Sofia)"
              placeholderTextColor={colors.muted}
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                color: colors.text,
              }}
            />
            <TouchableOpacity
              onPress={handleCreateBond}
              style={{
                backgroundColor: colors.purple,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <T bold size={13} style={{ color: '#FFFFFF' }}>
                Изчисли и запази Bond
              </T>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Избор на профил: Моите Bonds + Публични личности (Модул 15) */}
      <Section>Select Bond or Public Figure</Section>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {allProfiles.map((prof) => {
            const active = prof.id === selectedPartner?.id;
            return (
              <TouchableOpacity
                key={prof.id}
                onPress={() => setSelectedId(prof.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: active ? colors.purple : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.purple : colors.line,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
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
          {/* Модул 6.2–6.12: Резултати от съвместимостта */}
          <Card style={{ padding: 14, gap: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <T bold size={10} style={{ color: colors.gold }}>
                  {REL_LABELS[bondAnalysis.partner.relationshipType].toUpperCase()} ·{' '}
                  {bondAnalysis.partnerChart.planetsByKey.sun?.sign} ☉ /{' '}
                  {bondAnalysis.partnerChart.planetsByKey.moon?.sign} ☾
                </T>
                <T bold size={16} style={{ marginTop: 2 }}>
                  {userName || 'Ти'} & {bondAnalysis.partner.name}
                </T>
              </View>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() =>
                    onSaveBondInsight(
                      `bond_${bondAnalysis.partner.id}`,
                      `Bond: ${bondAnalysis.partner.name} (${bondAnalysis.scores.overall}%)`,
                      bondAnalysis.personalizedSummary
                    )
                  }
                  style={{
                    padding: 7,
                    borderRadius: 8,
                    backgroundColor: savedIds.has(`bond_${bondAnalysis.partner.id}`)
                      ? colors.purple
                      : colors.surfaceAlt,
                  }}
                >
                  {savedIds.has(`bond_${bondAnalysis.partner.id}`) ? (
                    <Check size={14} color="#FFFFFF" />
                  ) : (
                    <Bookmark size={14} color={colors.purple} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    onShareText(
                      `Natala Bond: ${bondAnalysis.partner.name}`,
                      bondAnalysis.personalizedSummary
                    )
                  }
                  style={{ padding: 7, borderRadius: 8, backgroundColor: colors.surfaceAlt }}
                >
                  <Share2 size={14} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {bondAnalysis.partner.bio && (
              <T muted size={11}>
                {bondAnalysis.partner.bio}
              </T>
            )}

            {/* 4-те показателя за съвместимост */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[
                { label: 'Обща', val: bondAnalysis.scores.overall },
                { label: 'Романтична', val: bondAnalysis.scores.romantic },
                { label: 'Емоционална', val: bondAnalysis.scores.emotional },
                { label: 'Психолог.', val: bondAnalysis.scores.psychological },
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
                  <T bold size={15} style={{ color: colors.purple }}>
                    {s.val}%
                  </T>
                  <T muted size={9}>
                    {s.label}
                  </T>
                </View>
              ))}
            </View>

            <T size={13} style={{ lineHeight: 19 }}>
              {bondAnalysis.personalizedSummary}
            </T>

            <View style={{ gap: 6 }}>
              <T bold size={12} style={{ color: '#10B981' }}>
                Силни страни на връзката:
              </T>
              {bondAnalysis.strengths.map((st, i) => (
                <T key={i} size={12}>
                  • {st}
                </T>
              ))}

              <T bold size={12} style={{ color: '#F59E0B', marginTop: 4 }}>
                Потенциални конфликти и предизвикателства:
              </T>
              {bondAnalysis.conflicts.map((cf, i) => (
                <T key={i} size={12}>
                  • {cf}
                </T>
              ))}

              <T bold size={12} style={{ color: colors.purple, marginTop: 4 }}>
                Общи житейски теми и взаимно влияние:
              </T>
              <T size={12}>• {bondAnalysis.mutualInfluence}</T>
              {bondAnalysis.sharedThemes.map((th, i) => (
                <T key={i} size={12}>
                  • {th}
                </T>
              ))}
            </View>
          </Card>

          {/* Модул 7: Bond Transits, Transit Ring, Romantic Timing & Time Travel за Bonds */}
          <Section>Bond Transits & Romantic Timing</Section>
          <Card style={{ padding: 14, gap: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: colors.surfaceAlt,
                borderRadius: 10,
                padding: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => setBondDate((d) => new Date(d.getTime() - 30 * 86400000))}
                style={{ padding: 4 }}
              >
                <ChevronLeft size={16} color={colors.purple} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} color={colors.purple} />
                  <T bold size={12}>
                    Bond Time Travel: {formatShortDate(bondDate)}
                  </T>
                </View>
                <T muted size={10}>
                  {bondAnalysis.romanticTiming.phaseLabel} ({bondAnalysis.romanticTiming.score}%)
                </T>
              </View>
              <TouchableOpacity
                onPress={() => setBondDate((d) => new Date(d.getTime() + 30 * 86400000))}
                style={{ padding: 4 }}
              >
                <ChevronRight size={16} color={colors.purple} />
              </TouchableOpacity>
            </View>

            <TransitRingSvg
              transits={bondAnalysis.bondTransits}
              colors={colors}
              title={`BOND TRANSIT RING (${bondAnalysis.partner.name.toUpperCase()})`}
            />

            <View style={{ padding: 10, borderRadius: 10, backgroundColor: colors.purpleSoft }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Sparkles size={13} color={colors.purple} />
                <T bold size={11} style={{ color: colors.purple }}>
                  Периоди на сближаване:
                </T>
              </View>
              {bondAnalysis.romanticTiming.closenessWindows.map((w, i) => (
                <T key={i} size={11} style={{ marginTop: 2 }}>
                  • {w}
                </T>
              ))}
            </View>
          </Card>
        </>
      )}
    </View>
  );
}