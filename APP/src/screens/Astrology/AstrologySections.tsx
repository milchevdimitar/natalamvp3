import React from 'react';
import { View } from 'react-native';
import { Sparkles, MapPin, Clock, Calendar, User } from 'lucide-react-native';
import { Card, T, Section, Pill } from '../../components/UI';
import { NatalChartResults, ZodiacPosition } from './astrology.types';
import { degToZodiac } from './astrology.calculations';
import { styles } from './astrology.styles';

export function PrimaryPlacementsRow({
  sunData,
  moonData,
  ascData,
  colors,
}: {
  sunData: ZodiacPosition;
  moonData: ZodiacPosition;
  ascData: ZodiacPosition;
  colors: any;
}) {
  const items = [
    { symbol: '☉', label: 'SUN', data: sunData, color: colors.gold },
    { symbol: '☾', label: 'MOON', data: moonData, color: colors.purple },
    { symbol: '♌', label: 'RISING', data: ascData, color: colors.gold },
  ];

  return (
    <>
      <Section>Primary Placements</Section>
      <View style={styles.placementsRow}>
        {items.map((item) => (
          <Card key={item.label} style={styles.placementCard}>
            <T size={20} style={{ color: item.color }}>
              {item.symbol}
            </T>
            <T muted size={9} style={styles.placementLabel}>
              {item.label}
            </T>
            <T bold size={13}>
              {item.data.sign}
            </T>
            <T muted size={10}>
              {item.data.degFormatted}
            </T>
          </Card>
        ))}
      </View>
    </>
  );
}

export function BirthDetailsCard({
  userName,
  dateStr,
  timeStr,
  cityName,
  colors,
}: {
  userName?: string;
  dateStr: string;
  timeStr: string;
  cityName: string;
  colors: any;
}) {
  return (
    <Card style={styles.birthDetailsCard}>
      <View style={styles.birthDetailsTitleRow}>
        <Sparkles size={16} color={colors.purple} />
        <T bold size={14}>
          Birth Details ({userName || 'User'})
        </T>
      </View>
      <View style={styles.birthDetailsMetaRow}>
        <View style={styles.metaItem}>
          <Calendar size={14} color={colors.muted} />
          <T muted size={12}>
            {dateStr}
          </T>
        </View>
        <View style={styles.metaItem}>
          <Clock size={14} color={colors.muted} />
          <T muted size={12}>
            {timeStr}
          </T>
        </View>
        <View style={styles.metaItem}>
          <MapPin size={14} color={colors.muted} />
          <T muted size={12}>
            {cityName}
          </T>
        </View>
      </View>
    </Card>
  );
}

export function PlanetaryPositionsList({
  results,
  ascData,
  colors,
}: {
  results: NatalChartResults;
  ascData: ZodiacPosition;
  colors: any;
}) {
  const mcData = degToZodiac(results.mc);

  return (
    <>
      <Section>Planetary Positions (Placidus)</Section>
      <View style={styles.positionsList}>
        {/* Ascendant */}
        <Card style={styles.positionCard}>
          <View style={styles.positionRow}>
            <View style={[styles.positionIconBox, { backgroundColor: colors.purpleSoft }]}>
              <T bold size={14} style={{ color: colors.purple }}>
                ASC
              </T>
            </View>
            <View style={{ flex: 1 }}>
              <T bold size={15}>
                Ascendant (ASC)
              </T>
              <T muted size={12}>
                {ascData.sign} {ascData.symbol} · {ascData.degFormatted}
              </T>
            </View>
            <View style={[styles.houseBadge, { backgroundColor: colors.goldSoft }]}>
              <T bold size={10} style={{ color: colors.gold }}>
                House 1
              </T>
            </View>
          </View>
        </Card>

        {/* Midheaven MC */}
        <Card style={styles.positionCard}>
          <View style={styles.positionRow}>
            <View style={[styles.positionIconBox, { backgroundColor: colors.purpleSoft }]}>
              <T bold size={14} style={{ color: colors.purple }}>
                MC
              </T>
            </View>
            <View style={{ flex: 1 }}>
              <T bold size={15}>
                Midheaven (MC)
              </T>
              <T muted size={12}>
                {mcData.sign} {mcData.symbol} · {mcData.degFormatted}
              </T>
            </View>
            <View style={[styles.houseBadge, { backgroundColor: colors.purpleSoft }]}>
              <T bold size={10} style={{ color: colors.purple }}>
                House 10
              </T>
            </View>
          </View>
        </Card>

        {/* Планети */}
        {results.planetPositions.map((p, idx) => {
          const pInfo = degToZodiac(p.deg);
          return (
            <Card key={idx} style={styles.positionCard}>
              <View style={styles.positionRow}>
                <View style={[styles.positionIconBox, { backgroundColor: colors.purpleSoft }]}>
                  <T size={20} style={{ color: colors.purple }}>
                    {p.symbol}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T bold size={15}>
                    {p.name}
                  </T>
                  <T muted size={12}>
                    {pInfo.sign} {pInfo.symbol} · {pInfo.degFormatted}
                  </T>
                </View>
                <View style={[styles.houseBadge, { backgroundColor: colors.surfaceAlt }]}>
                  <T bold size={10} style={{ color: colors.muted }}>
                    House {p.house}
                  </T>
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    </>
  );
}

export function MissingBirthDateEmptyState({
  colors,
  onGoToProfile,
}: {
  colors: any;
  onGoToProfile: () => void;
}) {
  return (
    <Card style={styles.emptyCard}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.purpleSoft }]}>
        <Calendar size={32} color={colors.purple} />
      </View>
      <T bold size={16}>
        Missing Birth Date in Profile
      </T>
      <T muted size={13} style={styles.emptyDescription}>
        No birth date and time found in your profile. Please add them in your settings.
      </T>
      <Pill selected onPress={onGoToProfile}>
        <User size={14} color="#FFFFFF" /> Go to Profile
      </Pill>
    </Card>
  );
}