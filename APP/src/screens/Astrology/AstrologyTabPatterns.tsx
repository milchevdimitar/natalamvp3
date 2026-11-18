import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import {
  Bookmark,
  Check,
  Share2,
  Sparkles,
  Layers,
  Trash2,
} from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import {
  NatalChartResults,
  PatternAnalysisItem,
  UserCollectionGroup,
} from './astrology.types';
import { buildPatternAnalyses } from './astrology.insights';

export function AstrologyTabPatterns({
  results,
  colors,
  collections,
  savedIds,
  onSavePattern,
  onRemoveCollectionItem,
  onShareText,
}: {
  results: NatalChartResults;
  colors: any;
  collections: UserCollectionGroup[];
  savedIds: Set<string>;
  onSavePattern: (p: PatternAnalysisItem) => void;
  onRemoveCollectionItem: (category: string, itemId: string) => void;
  onShareText: (title: string, body: string) => void;
}) {
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'psyche' | 'relations' | 'destiny'>(
    'all'
  );

  const patterns = useMemo(() => buildPatternAnalyses(results), [results]);

  const filteredPatterns = useMemo(() => {
    if (selectedGroup === 'psyche') {
      return patterns.filter((p) => ['2.1', '2.2', '2.3', '2.4', '2.6', '2.10'].includes(p.code));
    }
    if (selectedGroup === 'relations') {
      return patterns.filter((p) => ['2.7', '2.8', '2.9'].includes(p.code));
    }
    if (selectedGroup === 'destiny') {
      return patterns.filter((p) => ['2.5', '2.11', '2.12', '2.13', '2.14'].includes(p.code));
    }
    return patterns;
  }, [patterns, selectedGroup]);

  return (
    <View style={{ gap: 14 }}>
      {/* Модул 1.14 & 18.8: Swipeable Collections */}
      <Section>My Saved Collections (Swipeable)</Section>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {collections.map((col) => (
            <Card
              key={col.category}
              style={{
                width: 245,
                padding: 12,
                gap: 8,
                borderWidth: 1,
                borderColor: colors.line,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Layers size={14} color={colors.purple} />
                <T bold size={13}>
                  {col.title} ({col.items.length})
                </T>
              </View>

              {col.items.length === 0 ? (
                <T muted size={11}>
                  Натисни иконата за запазване върху всеки Insight, Транзит или Pattern.
                </T>
              ) : (
                <View style={{ gap: 6 }}>
                  {col.items.slice(0, 3).map((it) => (
                    <View
                      key={it.itemId}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: colors.surfaceAlt,
                        padding: 6,
                        borderRadius: 8,
                      }}
                    >
                      <T size={11} numberOfLines={1} style={{ flex: 1 }}>
                        • {it.title}
                      </T>
                      <TouchableOpacity
                        onPress={() => onRemoveCollectionItem(col.category, it.itemId)}
                        style={{ paddingLeft: 6 }}
                      >
                        <Trash2 size={12} color={colors.muted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Филтри за 14-те личностни модела */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Section>Deep Patterns (14 Modules)</Section>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(
            [
              { id: 'all', label: 'All (14)' },
              { id: 'psyche', label: 'Psyche & Roots' },
              { id: 'relations', label: 'Attachment & Love' },
              { id: 'destiny', label: 'Talents & Life Lessons' },
            ] as const
          ).map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedGroup(tab.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: selectedGroup === tab.id ? colors.purple : colors.surfaceAlt,
              }}
            >
              <T
                bold
                size={11}
                style={{ color: selectedGroup === tab.id ? '#FFFFFF' : colors.muted }}
              >
                {tab.label}
              </T>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={{ gap: 10 }}>
        {filteredPatterns.map((pat) => {
          const isSaved = savedIds.has(pat.id);
          return (
            <Card key={pat.id} style={{ padding: 14, gap: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <View style={{ flex: 1 }}>
                  <T bold size={10} style={{ color: colors.gold }}>
                    {pat.code} · {pat.placementBasis}
                  </T>
                  <T bold size={15} style={{ marginTop: 2 }}>
                    {pat.title}
                  </T>
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => onSavePattern(pat)}
                    style={{
                      padding: 7,
                      borderRadius: 8,
                      backgroundColor: isSaved ? colors.purple : colors.surfaceAlt,
                    }}
                  >
                    {isSaved ? (
                      <Check size={14} color="#FFFFFF" />
                    ) : (
                      <Bookmark size={14} color={colors.purple} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      onShareText(pat.title, `${pat.placementBasis}\n\n${pat.deepDive}`)
                    }
                    style={{ padding: 7, borderRadius: 8, backgroundColor: colors.surfaceAlt }}
                  >
                    <Share2 size={14} color={colors.muted} />
                  </TouchableOpacity>
                </View>
              </View>

              <T bold size={12} style={{ color: colors.purple }}>
                {pat.summary}
              </T>
              <T size={13} style={{ lineHeight: 19 }}>
                {pat.deepDive}
              </T>

              <View
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: colors.surfaceAlt,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={13} color={colors.gold} />
                <T size={11} style={{ flex: 1 }}>
                  Ключ за развитие: {pat.growthKey}
                </T>
              </View>
            </Card>
          );
        })}
      </View>
    </View>
  );
}