import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { Heart, Briefcase, Smile, Users } from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import {
  AyurvedaMatchType,
  AyurvedaProfile,
  DoshaName,
} from './ayurveda.types';
import {
  calculateAyurvedaProfile,
  compareAyurvedaProfiles,
} from './ayurveda.calculator';
import { AyurvedaSheetModal, AyurvedaTierCard } from './AyurvedaDetailModal';

export function AyurvedaTabMatch({
  userProfile,
  colors,
}: {
  userProfile: AyurvedaProfile;
  colors: any;
}) {
  const [matchType, setMatchType] = useState<AyurvedaMatchType>('romantic');
  const [partnerName, setPartnerName] = useState('Partner');
  const [partnerDateStr, setPartnerDateStr] = useState('1993-11-08');
  const [partnerPrimaryDosha, setPartnerPrimaryDosha] = useState<DoshaName>('Kapha');
  const [showModal, setShowModal] = useState(false);

  const partnerProfile = useMemo(() => {
    const parts = partnerDateStr.trim().split(/[-./]/);
    let y = 1993;
    let m = 11;
    let d = 8;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10) || 1993;
        m = parseInt(parts[1], 10) || 11;
        d = parseInt(parts[2], 10) || 8;
      } else {
        d = parseInt(parts[0], 10) || 8;
        m = parseInt(parts[1], 10) || 11;
        y = parseInt(parts[2], 10) || 1993;
      }
    }

    return calculateAyurvedaProfile({
      personName: partnerName || 'Partner',
      birthYear: y,
      birthMonth: m,
      birthDay: d,
      quizAnswers: {
        q1: partnerPrimaryDosha,
        q2: partnerPrimaryDosha,
        q3: partnerPrimaryDosha,
      },
    });
  }, [partnerName, partnerDateStr, partnerPrimaryDosha]);

  const matchResult = useMemo(
    () => compareAyurvedaProfiles(userProfile, partnerProfile, matchType),
    [userProfile, partnerProfile, matchType]
  );

  return (
    <View style={{ gap: 14 }}>
      <Section>Ayurvedic Dosha Compatibility</Section>

      {/* Relationship Context Selector */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {(
          [
            { id: 'romantic', label: 'Love', Icon: Heart },
            { id: 'business', label: 'Business', Icon: Briefcase },
            { id: 'friendship', label: 'Friends', Icon: Smile },
          ] as const
        ).map(({ id, label, Icon }) => {
          const active = matchType === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => setMatchType(id)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                paddingVertical: 9,
                borderRadius: 11,
                backgroundColor: active ? colors.purple : colors.surfaceAlt,
              }}
            >
              <Icon size={13} color={active ? '#FFFFFF' : colors.muted} />
              <T bold size={11} style={{ color: active ? '#FFFFFF' : colors.muted }}>
                {label}
              </T>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Partner Input Card */}
      <Card style={{ padding: 14, borderRadius: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={partnerName}
            onChangeText={setPartnerName}
            placeholder="Name"
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
              color: colors.text,
            }}
          />
          <TextInput
            value={partnerDateStr}
            onChangeText={setPartnerDateStr}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
              color: colors.text,
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <T muted size={11}>
            Primary Dosha:
          </T>
          {(['Vata', 'Pitta', 'Kapha'] as DoshaName[]).map((dosha) => {
            const active = partnerPrimaryDosha === dosha;
            return (
              <TouchableOpacity
                key={dosha}
                onPress={() => setPartnerPrimaryDosha(dosha)}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  borderRadius: 8,
                  alignItems: 'center',
                  backgroundColor: active ? colors.purpleSoft : colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: active ? colors.purple : colors.line,
                }}
              >
                <T
                  bold
                  size={11}
                  style={{ color: active ? colors.purple : colors.muted }}
                >
                  {dosha}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Tier 1: Compatibility Summary */}
      <AyurvedaTierCard
        eyebrow={`${userProfile.personName.toUpperCase()} & ${partnerName.toUpperCase()}`}
        badgeText={`${matchResult.overallScore}% Synergy`}
        badgeColor={matchResult.overallScore >= 85 ? '#10B981' : colors.purple}
        title={matchResult.headline}
        summary={matchResult.summary}
        onPressMore={() => setShowModal(true)}
        colors={colors}
      />

      {/* Tier 2: Full Compatibility Breakdown Modal */}
      <AyurvedaSheetModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        eyebrow={`${matchType.toUpperCase()} COMPATIBILITY · ${matchResult.overallScore}%`}
        title={`${userProfile.personName} & ${partnerName}`}
        colors={colors}
      >
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[
            { label: 'Dosha Match', val: matchResult.doshaChemistryScore },
            { label: 'Sattva Guna', val: matchResult.gunaHarmonyScore },
            { label: '5 Elements', val: matchResult.elementalBalanceScore },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 10,
                backgroundColor: colors.surfaceAlt,
                alignItems: 'center',
              }}
            >
              <T bold size={14}>
                {item.val}%
              </T>
              <T muted size={10}>
                {item.label}
              </T>
            </View>
          ))}
        </View>

        <View style={{ gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Users size={14} color="#10B981" />
            <T bold size={13} style={{ color: '#10B981' }}>
              Elemental Strengths
            </T>
          </View>
          {matchResult.strengths.map((s, idx) => (
            <T key={idx} size={13} style={{ lineHeight: 19 }}>
              • {s}
            </T>
          ))}
        </View>

        <View style={{ gap: 5 }}>
          <T bold size={13} style={{ color: colors.gold }}>
            Balancing Opportunities
          </T>
          {matchResult.frictionPoints.map((f, idx) => (
            <T key={idx} size={13} style={{ lineHeight: 19 }}>
              • {f}
            </T>
          ))}
        </View>

        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.purpleSoft }}>
          <T bold size={11} style={{ color: colors.purple }}>
            HARMONIZING RITUAL
          </T>
          <T size={13} style={{ marginTop: 3, lineHeight: 19 }}>
            {matchResult.ritualAdvice}
          </T>
        </View>
      </AyurvedaSheetModal>
    </View>
  );
}