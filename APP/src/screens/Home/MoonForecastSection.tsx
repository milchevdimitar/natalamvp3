import React, { useState, useMemo } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Card, T, Section, Pill } from '../../components/UI';
import {
  getFallbackRawLongitudes,
  getMoonPhaseData,
  getZodiacInfo,
} from './home.calculations';
import { styles } from './home.styles';

export function MoonForecastSection({ colors }: { colors: any }) {
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const forecast = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() + i * 86400000);
      const phaseData = getMoonPhaseData(d);
      return {
        dayName: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...phaseData,
      };
    });
  }, []);

  const selectedMoonPhase = useMemo(
    () => getMoonPhaseData(selectedCalendarDate),
    [selectedCalendarDate]
  );

  const selectedMoonZodiac = useMemo(() => {
    const raw = getFallbackRawLongitudes(selectedCalendarDate);
    return getZodiacInfo(raw.Moon);
  }, [selectedCalendarDate]);

  const calendarGrid = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysArray: Array<Date | null> = [];
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      daysArray.push(new Date(year, month, day));
    }
    return { daysArray };
  }, [currentMonthDate]);

  const changeMonth = (offset: number) => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + offset, 1)
    );
  };

  return (
    <View style={styles.forecastSectionWrapper}>
      <View style={styles.sectionHeaderRow}>
        <Section>Moon 7-Day Forecast</Section>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowCalendarModal(true)}
          style={{ padding: 4 }}
        >
          <Calendar size={18} color={colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.forecastScrollContent}
      >
        {forecast.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.forecastCard,
              {
                backgroundColor: item.isSpecial ? colors.surfaceAlt : colors.surface,
                borderColor: item.isSpecial ? colors.gold : colors.line,
              },
            ]}
          >
            <T bold size={12} style={{ color: item.dayName === 'Today' ? colors.gold : colors.text }}>
              {item.dayName}
            </T>
            <T muted size={9} style={{ marginBottom: 6 }}>
              {item.dateStr}
            </T>

            <T size={26} style={{ marginVertical: 4 }}>
              {item.symbol}
            </T>

            <T bold size={11} style={{ color: colors.text, textAlign: 'center', height: 28 }}>
              {item.phaseName}
            </T>

            <View style={styles.forecastIllumPill}>
              <T bold size={9} style={{ color: colors.gold }}>
                {item.illuminated}% illum
              </T>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showCalendarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCalendarModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.encyclopediaModalSheet,
              { backgroundColor: colors.surface, borderColor: colors.gold },
            ]}
          >
            <View style={styles.calendarHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Calendar size={20} color={colors.gold} />
                <T bold size={18} style={{ color: colors.text }}>
                  Cosmic Moon Calendar
                </T>
              </View>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <X color={colors.text} size={22} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.calendarMonthSwitcher,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.line },
              ]}
            >
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <ChevronLeft size={22} color={colors.gold} />
              </TouchableOpacity>
              <T bold size={16} style={{ color: colors.gold }}>
                {currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </T>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <ChevronRight size={22} color={colors.gold} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekdaysRow}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, i) => (
                <T key={i} bold size={12} style={{ color: colors.purple, width: 38, textAlign: 'center' }}>
                  {day}
                </T>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarGrid.daysArray.map((dateObj, idx) => {
                if (!dateObj) {
                  return <View key={`empty-${idx}`} style={{ width: '14.28%', height: 42 }} />;
                }

                const isSelected = dateObj.toDateString() === selectedCalendarDate.toDateString();
                const isToday = dateObj.toDateString() === new Date().toDateString();
                const dayMoon = getMoonPhaseData(dateObj);

                return (
                  <TouchableOpacity
                    key={dateObj.toISOString()}
                    onPress={() => setSelectedCalendarDate(dateObj)}
                    style={[
                      styles.calendarDayCell,
                      {
                        backgroundColor: isSelected
                          ? colors.gold
                          : isToday
                          ? colors.purpleSoft
                          : 'transparent',
                        borderWidth: isSelected ? 0 : isToday ? 1 : 0,
                        borderColor: colors.purple,
                      },
                    ]}
                  >
                    <T
                      bold={isSelected || isToday}
                      size={12}
                      style={{ color: isSelected ? '#000' : colors.text }}
                    >
                      {dateObj.getDate()}
                    </T>
                    <T size={10}>{dayMoon.symbol}</T>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Card style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.gold, padding: 14 }}>
              <T bold size={13} style={{ color: colors.gold, marginBottom: 6 }}>
                ✦{' '}
                {selectedCalendarDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </T>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <T size={32}>{selectedMoonPhase.symbol}</T>
                  <View>
                    <T bold size={15} style={{ color: colors.text }}>
                      {selectedMoonPhase.phaseName}
                    </T>
                    <T muted size={11}>
                      {selectedMoonPhase.illuminated}% Illuminated · Age: {selectedMoonPhase.ageInDays}d
                    </T>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <T bold size={18} style={{ color: colors.gold }}>
                    {selectedMoonZodiac.symbol} {selectedMoonZodiac.sign}
                  </T>
                  <T muted size={11}>
                    {selectedMoonZodiac.degree}° in Sign
                  </T>
                </View>
              </View>
            </Card>

            <Pill selected onPress={() => setShowCalendarModal(false)}>
              ✦ Close Moon Calendar
            </Pill>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}