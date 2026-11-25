import React, { useMemo, useState } from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { Layers, Trash2, ChevronRight } from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import {
  NatalChartResults,
  PatternAnalysisItem,
  UserCollectionGroup,
} from './astrology.types';
import { buildPatternAnalyses } from './astrology.insights';
import { DetailSheetModal, TieredSummaryCard } from './AstrologyDetailModal';

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
  const [selectedGroup, setSelectedGroup] = useState<'psyche' | 'relations' | 'destiny'>('psyche');
  const [selectedPattern, setSelectedPattern] = useState<PatternAnalysisItem | null>(null);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);

  const patterns = useMemo(() => buildPatternAnalyses(results), [results]);

  const totalSavedCount = useMemo(
    () => collections.reduce((acc, c) => acc + c.items.length, 0),
    [collections]
  );

  const filteredPatterns = useMemo(() => {
    if (selectedGroup === 'psyche') {
      return patterns.filter((p) => ['2.1', '2.2', '2.3', '2.4', '2.6', '2.10'].includes(p.code));
    }
    if (selectedGroup === 'relations') {
      return patterns.filter((p) => ['2.7', '2.8', '2.9'].includes(p.code));
    }
    return patterns.filter((p) => ['2.5', '2.11', '2.12', '2.13', '2.14'].includes(p.code));
  }, [patterns, selectedGroup]);

  return (
    <View style={{ gap: 14 }}>
      {/* Ниво 1: Компактна лента за запазени колекции */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => setShowCollectionsModal(true)}>
        <Card
          style={{
            padding: 14,
            borderRadius: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Layers size={18} color={colors.purple} />
            <View>
              <T bold size={14}>
                Saved Collections ({totalSavedCount})
              </T>
              <T muted size={11}>
                Insights, transits, patterns & classes you bookmarked
              </T>
            </View>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Card>
      </TouchableOpacity>

      {/* Ниво 1: 3 ясни тематични нива вместо 14 дълги блока */}
      <Section>Life Patterns</Section>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {(
          [
            { id: 'psyche', label: 'Psyche & Roots (6)' },
            { id: 'relations', label: 'Love & Bonds (3)' },
            { id: 'destiny', label: 'Destiny & Gifts (5)' },
          ] as const
        ).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setSelectedGroup(tab.id)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: 'center',
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

      <View style={{ gap: 10 }}>
        {filteredPatterns.map((pat) => (
          <TieredSummaryCard
            key={pat.id}
            tag={pat.placementBasis}
            title={pat.title}
            summary={pat.summary}
            onPressMore={() => setSelectedPattern(pat)}
            colors={colors}
          />
        ))}
      </View>

      {/* Ниво 2: Детайлен модал за избран Pattern */}
      <DetailSheetModal
        visible={Boolean(selectedPattern)}
        onClose={() => setSelectedPattern(null)}
        eyebrow={selectedPattern?.placementBasis}
        title={selectedPattern?.title || ''}
        colors={colors}
        isSaved={selectedPattern ? savedIds.has(selectedPattern.id) : false}
        onSave={selectedPattern ? () => onSavePattern(selectedPattern) : undefined}
        onShare={
          selectedPattern
            ? () =>
                onShareText(
                  selectedPattern.title,
                  `${selectedPattern.placementBasis}\n\n${selectedPattern.deepDive}\n\nGrowth Key: ${selectedPattern.growthKey}`
                )
            : undefined
        }
      >
        {selectedPattern && (
          <>
            <T bold size={14} style={{ color: colors.purple }}>
              {selectedPattern.summary}
            </T>
            <T size={14} style={{ lineHeight: 22 }}>
              {selectedPattern.deepDive}
            </T>
            <View
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.purpleSoft,
                gap: 4,
              }}
            >
              <T bold size={11} style={{ color: colors.purple }}>
                GROWTH KEY
              </T>
              <T size={13} style={{ lineHeight: 19 }}>
                {selectedPattern.growthKey}
              </T>
            </View>
          </>
        )}
      </DetailSheetModal>

      {/* Ниво 2: Модал за Swipeable Collections */}
      <DetailSheetModal
        visible={showCollectionsModal}
        onClose={() => setShowCollectionsModal(false)}
        eyebrow="YOUR LIBRARY"
        title="Saved Collections"
        colors={colors}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {collections.map((col) => (
              <View
                key={col.category}
                style={{
                  width: 240,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: colors.surfaceAlt,
                  gap: 8,
                }}
              >
                <T bold size={13}>
                  {col.title} ({col.items.length})
                </T>
                {col.items.length === 0 ? (
                  <T muted size={11}>
                    No items saved in this collection yet.
                  </T>
                ) : (
                  col.items.map((it) => (
                    <View
                      key={it.itemId}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: colors.surface,
                      }}
                    >
                      <T size={11} numberOfLines={1} style={{ flex: 1 }}>
                        {it.title}
                      </T>
                      <TouchableOpacity
                        onPress={() => onRemoveCollectionItem(col.category, it.itemId)}
                        style={{ paddingLeft: 8 }}
                      >
                        <Trash2 size={13} color={colors.muted} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </DetailSheetModal>
    </View>
  );
}