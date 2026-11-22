import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { MapPin, Search, X, ChevronDown } from 'lucide-react-native';
import { T } from './UI';
import { searchCities, CityLocation } from '../services/locationService';

interface Props {
  selectedCity: CityLocation | null;
  onSelectCity: (city: CityLocation) => void;
  colors: any;
}

export function CitySearchPicker({ selectedCity, onSelectCity, colors }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const requestCounter = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bgColor = colors?.bg || colors?.background || '#0D0B1A';
  const lineColor = colors?.line || colors?.border || 'rgba(255, 255, 255, 0.12)';

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const executeSearch = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      requestCounter.current += 1;
      setResults([]);
      setErrorMsg(null);
      setLoading(false);
      return;
    }

    const reqId = ++requestCounter.current;
    setLoading(true);
    setErrorMsg(null);

    try {
      const cities = await searchCities(trimmed);
      if (reqId === requestCounter.current) {
        setResults(cities);
      }
    } catch (err: any) {
      if (reqId === requestCounter.current) {
        setResults([]);
        setErrorMsg(err?.message || 'Error searching cities');
      }
    } finally {
      if (reqId === requestCounter.current) {
        setLoading(false);
      }
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.trim().length < 2) {
      setResults([]);
      setErrorMsg(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(() => {
      executeSearch(text);
    }, 200);
  };

  const handleOpen = () => {
    const initialQuery = selectedCity?.name || 'Sofia';
    setQuery(initialQuery);
    setModalVisible(true);
    executeSearch(initialQuery);
  };

  const handleSelect = (city: CityLocation) => {
    onSelectCity(city);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <T muted size={11} style={{ marginBottom: 6 }}>
        BIRTH PLACE / CITY
      </T>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleOpen}
        style={[
          styles.inputWrapper,
          { backgroundColor: colors.surfaceAlt, borderColor: lineColor },
        ]}
      >
        <MapPin size={18} color={colors.gold} />
        <View style={{ flex: 1 }}>
          {selectedCity ? (
            <T bold size={14} style={{ color: colors.text }} numberOfLines={1}>
              {selectedCity.name}, {selectedCity.country}
            </T>
          ) : (
            <T size={14} style={{ color: colors.muted }}>
              Select city of birth...
            </T>
          )}
        </View>
        <ChevronDown size={18} color={colors.muted} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: bgColor,
              paddingTop:
                Platform.OS === 'web'
                  ? 24
                  : Math.max((StatusBar.currentHeight || 0) + 12, 44),
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <T bold size={17} style={{ color: colors.text }}>
              Place of Birth
            </T>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.purple,
              },
            ]}
          >
            <Search size={18} color={colors.gold} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Enter city (e.g. Sofia, London, New York)..."
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text }]}
            />
            {loading ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              query.length > 0 && (
                <TouchableOpacity onPress={() => handleQueryChange('')}>
                  <X size={16} color={colors.muted} />
                </TouchableOpacity>
              )
            )}
          </View>

          <FlatList
            data={results}
            keyExtractor={(item, index) =>
              `${item.name}-${item.country}-${item.lat}-${item.lng}-${index}`
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyBox}>
                  <T
                    muted
                    size={13}
                    style={{
                      textAlign: 'center',
                      color: errorMsg ? '#f87171' : colors.muted,
                    }}
                  >
                    {errorMsg
                      ? `Search error: ${errorMsg}`
                      : query.trim().length < 2
                      ? 'Type at least 2 characters to search for a city.'
                      : 'No cities found matching your search.'}
                  </T>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleSelect(item)}
                style={[
                  styles.cityItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: lineColor,
                  },
                ]}
              >
                <MapPin size={18} color={colors.purple} />
                <View style={{ flex: 1 }}>
                  <T bold size={14} style={{ color: colors.text }}>
                    {item.name}
                  </T>
                  <T muted size={12}>
                    {item.region ? `${item.region}, ` : ''}
                    {item.country} ({item.lat.toFixed(2)}°, {item.lng.toFixed(2)}°)
                  </T>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

export default CitySearchPicker;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  listContent: {
    gap: 8,
    paddingBottom: 260,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyBox: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
});