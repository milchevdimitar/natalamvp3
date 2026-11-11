// CitySearchPicker.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MapPin, Search } from 'lucide-react-native';
import { T } from './UI';
import { searchCities, CityLocation } from '../services/locationService';

interface Props {
  selectedCity: CityLocation | null;
  onSelectCity: (city: CityLocation) => void;
  colors: any;
}

export function CitySearchPicker({ selectedCity, onSelectCity, colors }: Props) {
  const [query, setQuery] = useState(selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : '');
  const [results, setResults] = useState<CityLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    const cities = await searchCities(text);
    setResults(cities);
    setLoading(false);
  };

  const handleSelect = (city: CityLocation) => {
    setQuery(`${city.name}, ${city.country}`);
    onSelectCity(city);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <T muted size={11} style={{ marginBottom: 6 }}>
        BIRTH PLACE / CITY
      </T>

      <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.line }]}>
        <MapPin size={18} color={colors.gold} />
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder="Search any city (e.g. London, Plovdiv, Tokyo)..."
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
        />
        {loading && <ActivityIndicator size="small" color={colors.gold} />}
      </View>

      {isOpen && results.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.purple }]}>
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                style={[styles.dropdownItem, { borderBottomColor: colors.line }]}
              >
                <T bold size={13} style={{ color: colors.text }}>
                  {item.name}
                </T>
                <T muted size={11}>
                  {item.country} ({item.lat.toFixed(2)}°, {item.lng.toFixed(2)}°)
                </T>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1000,
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
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  dropdown: {
    position: 'absolute',
    top: 75,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderRadius: 14,
    borderWidth: 1.5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 2000,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
});