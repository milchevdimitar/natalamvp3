import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Heart, Briefcase, Smile, Users, Check } from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import { BaZiChart, Gender, MatchType } from './bazi.types';
import { calculateBaZiChart, compareBaZiCharts } from './bazi.calculator';
import { CITY_PRESETS, convertLocalToTrueSolarTime } from './bazi.solar';
import { BaZiSheetModal, BaZiTierCard } from './BaZiDetailModal';

export function BaZiTabMatchMaker({
  userChart,
  userName,
  colors,
}: {
  userChart: BaZiChart;
  userName: string;
  colors: any;
}) {
  const [matchType, setMatchType] = useState<MatchType>('romantic');
  const [partnerName, setPartnerName] = useState('Partner');
  const [partnerDateStr, setPartnerDateStr] = useState('1994-09-22');
  const [partnerTimeStr, setPartnerTimeStr] = useState('11:30');
  const [unknownPartnerTime, setUnknownPartnerTime] = useState(false);
  const [partnerGender, setPartnerGender] = useState<Gender>('male');
  const [partnerCityIdx, setPartnerCityIdx] = useState(0);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const partnerChart = useMemo(() => {
    const parts = partnerDateStr.trim().split(/[-./]/);
    let y = 1994;
    let m = 9;
    let d = 22;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10) || 1994;
        m = parseInt(parts[1], 10) || 9;
        d = parseInt(parts[2], 10) || 22;
      } else {
        d = parseInt(parts[0], 10) || 22;
        m = parseInt(parts[1], 10) || 9;
        y = parseInt(parts[2], 10) || 1994;
      }
    }

    if (unknownPartnerTime || !partnerTimeStr.trim()) {
      return calculateBaZiChart(y, m, d, null, partnerGender);
    }

    const tParts = partnerTimeStr.trim().split(':');
    const hh = parseInt(tParts[0], 10);
    const mm = parseInt(tParts[1], 10) || 0;
    const city = CITY_PRESETS[partnerCityIdx] || CITY_PRESETS[0];

    if (!Number.isNaN(hh) && hh >= 0 && hh <= 23) {
      const solar = convertLocalToTrueSolarTime(y, m, d, hh, mm, city);
      return calculateBaZiChart(
        solar.solarYear,
        solar.solarMonth,
        solar.solarDay,
        solar.shichenBranchIndex,
        partnerGender
      );
    }

    return calculateBaZiChart(y, m, d, null, partnerGender);
  }, [
    partnerDateStr,
    partnerTimeStr,
    unknownPartnerTime,
    partnerGender,
    partnerCityIdx,
  ]);

  const matchResult = useMemo(
    () => compareBaZiCharts(userChart, partnerChart, matchType),
    [userChart, partnerChart, matchType]
  );

  return (
    <View style={{ gap: 14 }}>
      <Section>MatchMaker · Elemental Compatibility</Section>

      {/* Relationship Category Selector: Love, Business, Friends */}
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

      {/* Compact Partner Input Card */}
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
          <TouchableOpacity
            onPress={() =>
              setPartnerGender((g) => (g === 'female' ? 'male' : 'female'))
            }
            style={{
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: colors.surfaceAlt,
              justifyContent: 'center',
            }}
          >
            <T bold size={11}>
              {partnerGender === 'female' ? 'Female' : 'Male'}
            </T>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
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
          <TextInput
            value={unknownPartnerTime ? '' : partnerTimeStr}
            onChangeText={setPartnerTimeStr}
            editable={!unknownPartnerTime}
            placeholder={unknownPartnerTime ? 'Unknown time' : 'HH:MM'}
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
              color: colors.text,
              opacity: unknownPartnerTime ? 0.5 : 1,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={() => setUnknownPartnerTime((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                backgroundColor: unknownPartnerTime ? colors.purple : colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unknownPartnerTime && <Check size={11} color="#FFFFFF" />}
            </View>
            <T muted size={11}>
              Unknown birth time
            </T>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ maxWidth: 175 }}
          >
            <View style={{ flexDirection: 'row', gap: 5 }}>
              {CITY_PRESETS.slice(0, 4).map((c, idx) => (
                <TouchableOpacity
                  key={c.name}
                  onPress={() => setPartnerCityIdx(idx)}
                  style={{
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor:
                      partnerCityIdx === idx ? colors.purpleSoft : colors.surfaceAlt,
                  }}
                >
                  <T
                    bold
                    size={10}
                    style={{
                      color: partnerCityIdx === idx ? colors.purple : colors.muted,
                    }}
                  >
                    {c.name}
                  </T>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Card>

      {/* Tier 1: Compatibility Summary Card */}
      <BaZiTierCard
        eyebrow={`${userName || 'YOU'} & ${partnerName.toUpperCase()}`}
        badgeText={`${matchResult.overallScore}% Match`}
        badgeColor={matchResult.overallScore >= 80 ? '#10B981' : colors.purple}
        title={matchResult.headline}
        summary={matchResult.summary}
        onPressMore={() => setShowBreakdownModal(true)}
        colors={colors}
      />

      {/* Tier 2: Detailed Compatibility Breakdown Modal */}
      <BaZiSheetModal
        visible={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        eyebrow={`${matchType.toUpperCase()} SYNERGY · ${matchResult.overallScore}%`}
        title={`${userName || 'You'} & ${partnerName}`}
        colors={colors}
      >
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[
            { label: 'Day Master', val: matchResult.dayMasterChemistryScore },
            { label: 'Yong Shen', val: matchResult.yongShenSupportScore },
            { label: 'Branches', val: matchResult.elementHarmonyScore },
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
            Growth Areas
          </T>
          {matchResult.challenges.map((c, idx) => (
            <T key={idx} size={13} style={{ lineHeight: 19 }}>
              • {c}
            </T>
          ))}
        </View>

        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.purpleSoft }}>
          <T bold size={11} style={{ color: colors.purple }}>
            BAZI GUIDANCE
          </T>
          <T size={13} style={{ marginTop: 3, lineHeight: 19 }}>
            {matchResult.advice}
          </T>
        </View>
      </BaZiSheetModal>
    </View>
  );
}