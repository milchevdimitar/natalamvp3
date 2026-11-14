import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, CloudUpload } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Card, T, Section, Hero } from '../../components/UI';
import { ChartViewMode } from './astrology.types';
import { degToZodiac } from './astrology.calculations';
import { useAstrologyChart } from './useAstrologyChart';
import { NatalChartWheel } from './NatalChartWheel';
import { NatalChart3DDome } from './NatalChart3DDome';
import {
  PrimaryPlacementsRow,
  BirthDetailsCard,
  PlanetaryPositionsList,
  MissingBirthDateEmptyState,
} from './AstrologySections';
import { styles } from './astrology.styles';

export default function Astrology() {
  const { colors, setPage, user, setUser } = useApp();
  const [viewMode, setViewMode] = useState<ChartViewMode>('2D');

  const { results, userDateInfo, isSyncing, syncStatus } = useAstrologyChart(user, setUser);

  const sunData = results
    ? degToZodiac(results.planetPositions.find((p) => p.name === 'Sun')?.deg || 0)
    : null;
  const moonData = results
    ? degToZodiac(results.planetPositions.find((p) => p.name === 'Moon')?.deg || 0)
    : null;
  const ascData = results ? degToZodiac(results.asc) : null;

  return (
    <>
      <TouchableOpacity onPress={() => setPage('explore')} style={styles.backButton}>
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Back to Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="NATAL CELESTIAL ENGINE"
        first="Your"
        accent="Natal Chart."
        description="Global Placidus calculation system for any city worldwide. View in Classic 2D or Interactive 3D Dome."
      />

      {syncStatus && (
        <View style={[styles.syncBanner, { backgroundColor: colors.purpleSoft }]}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.purple} />
          ) : (
            <CloudUpload size={16} color={colors.purple} />
          )}
          <T size={12} style={{ color: colors.purple }}>
            {syncStatus}
          </T>
        </View>
      )}

      {results && sunData && moonData && ascData ? (
        <>
          <PrimaryPlacementsRow
            sunData={sunData}
            moonData={moonData}
            ascData={ascData}
            colors={colors}
          />

          <View style={styles.chartSectionHeader}>
            <Section>Astronomical Chart</Section>

            <View
              style={[
                styles.switchContainer,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.line },
              ]}
            >
              {(['2D', '3D'] as ChartViewMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setViewMode(mode)}
                  activeOpacity={0.8}
                  style={[
                    styles.switchBtn,
                    viewMode === mode && { backgroundColor: colors.purple },
                  ]}
                >
                  <T bold size={11} style={{ color: viewMode === mode ? '#FFFFFF' : colors.muted }}>
                    {mode === '2D' ? '2D Flat' : '3D Dome'}
                  </T>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Card style={styles.chartCard}>
            {viewMode === '2D' ? (
              <NatalChartWheel results={results} colors={colors} variant="2D" />
            ) : (
              <NatalChart3DDome results={results} colors={colors} />
            )}
          </Card>

          <BirthDetailsCard
            userName={user?.name}
            dateStr={results.dateStr}
            timeStr={results.timeStr}
            cityName={userDateInfo?.cityName || 'Sofia, Bulgaria'}
            colors={colors}
          />

          <PlanetaryPositionsList results={results} ascData={ascData} colors={colors} />
        </>
      ) : (
        <MissingBirthDateEmptyState colors={colors} onGoToProfile={() => setPage('profile')} />
      )}
    </>
  );
}