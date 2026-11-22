import React from 'react';
import { View, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import {
  Layers,
  HelpCircle,
  Eye,
  Shuffle,
  PlusCircle,
  Share2,
  Check,
} from 'lucide-react-native';
import { Card, T, Section, Pill } from '../../components/UI';
import { LocalPngTarotCard } from './LocalPngTarotCard';
import { TarotCardData } from './tarot.types';
import { styles } from './tarot.styles';

interface SpreadTarotSectionProps {
  colors: any;
  useFullDeck: boolean;
  question: string;
  onChangeQuestion: (text: string) => void;
  rowsInput: string;
  onChangeRows: (text: string) => void;
  colsInput: string;
  onChangeCols: (text: string) => void;
  rCount: number;
  cCount: number;
  spreadDrawn: boolean;
  drawnCards: TarotCardData[];
  bottomCard: TarotCardData | null;
  revealedIndices: Record<number, boolean>;
  clarifyingCards: Record<number, TarotCardData[]>;
  isCapturing: boolean;
  shared: boolean;
  onDrawSpread: () => void;
  onToggleRevealCard: (idx: number) => void;
  onAddClarification: (idx: number) => void;
  onRevealAll: () => void;
  onShareToStory: () => void;
}

export function SpreadTarotSection({
  colors,
  useFullDeck,
  question,
  onChangeQuestion,
  rowsInput,
  onChangeRows,
  colsInput,
  onChangeCols,
  rCount,
  cCount,
  spreadDrawn,
  drawnCards,
  bottomCard,
  revealedIndices,
  clarifyingCards,
  isCapturing,
  shared,
  onDrawSpread,
  onToggleRevealCard,
  onAddClarification,
  onRevealAll,
  onShareToStory,
}: SpreadTarotSectionProps) {
  return (
    <View style={styles.sectionStack}>
      <Card style={{ gap: 14 }}>
        <View style={{ gap: 6 }}>
          <T muted size={11}>
            1. QUESTION / INTENTION
          </T>
          <View style={[styles.inputContainer, { backgroundColor: colors.surfaceAlt }]}>
            <TextInput
              style={[styles.questionTextInput, { color: colors.text }]}
              value={question}
              onChangeText={onChangeQuestion}
              placeholder="e.g., What energy surrounds my career shift?"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <T muted size={11}>
            2. MATRIX SIZING (ROWS × COLUMNS)
          </T>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <T muted size={10} style={{ marginBottom: 4 }}>
                Rows:
              </T>
              <View style={[styles.matrixInputContainer, { backgroundColor: colors.surfaceAlt }]}>
                <TextInput
                  keyboardType="numeric"
                  style={[styles.matrixTextInput, { color: colors.text }]}
                  value={rowsInput}
                  onChangeText={onChangeRows}
                  placeholder="3"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <T muted size={10} style={{ marginBottom: 4 }}>
                Columns:
              </T>
              <View style={[styles.matrixInputContainer, { backgroundColor: colors.surfaceAlt }]}>
                <TextInput
                  keyboardType="numeric"
                  style={[styles.matrixTextInput, { color: colors.text }]}
                  value={colsInput}
                  onChangeText={onChangeCols}
                  placeholder="3"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
          </View>
          <T muted size={10} style={{ marginTop: 2 }}>
            Total Cards: {rCount * cCount} (of {useFullDeck ? 78 : 22} available)
          </T>
        </View>

        <Pill selected onPress={onDrawSpread}>
          ✦ Shuffle & Deal Spread
        </Pill>
      </Card>

      {spreadDrawn && (
        <>
          <View style={styles.spreadBoardContainer}>
            {question.trim().length > 0 && (
              <Card style={{ gap: 6, backgroundColor: colors.purpleSoft }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <HelpCircle size={16} color={colors.purple} />
                  <T bold size={13} style={{ color: colors.purple }}>
                    Intention Focus:
                  </T>
                </View>
                <T bold size={15}>
                  "{question}"
                </T>
              </Card>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Section>
                Spread Grid ({rCount}×{cCount})
              </Section>
            </View>

            <View style={{ gap: 14 }}>
              {Array.from({ length: rCount }).map((_, rIdx) => (
                <View key={`row-${rIdx}`} style={{ flexDirection: 'row', gap: 10 }}>
                  {Array.from({ length: cCount }).map((__, cIdx) => {
                    const cardIdx = rIdx * cCount + cIdx;
                    const card = drawnCards[cardIdx];
                    const isRevealed = !!revealedIndices[cardIdx];
                    const clarifications = clarifyingCards[cardIdx] || [];

                    if (!card) return null;

                    return (
                      <View key={`card-container-${cardIdx}`} style={{ flex: 1, gap: 6 }}>
                        <TouchableOpacity
                          activeOpacity={0.88}
                          onPress={() => onToggleRevealCard(cardIdx)}
                        >
                          <LocalPngTarotCard
                            card={card}
                            isRevealed={isRevealed}
                            cardIndex={cardIdx}
                            colors={colors}
                            size="medium"
                          />
                        </TouchableOpacity>

                        {isRevealed && (
                          <T
                            bold
                            size={11}
                            style={{ textAlign: 'center', marginTop: 2, color: colors.text }}
                          >
                            {card.name}
                          </T>
                        )}

                        <TouchableOpacity
                          onPress={() => onAddClarification(cardIdx)}
                          style={[styles.clarifyButton, { backgroundColor: colors.purpleSoft }]}
                        >
                          <PlusCircle size={12} color={colors.purple} />
                          <T bold size={9} style={{ color: colors.purple }}>
                            Clarify
                          </T>
                        </TouchableOpacity>

                        {clarifications.length > 0 && (
                          <View style={{ gap: 6, marginTop: 4 }}>
                            {clarifications.map((cCard, cI) => (
                              <View
                                key={`clarify-${cI}`}
                                style={[
                                  styles.clarificationItemBox,
                                  {
                                    backgroundColor: colors.surfaceAlt,
                                    borderColor: colors.gold,
                                  },
                                ]}
                              >
                                <LocalPngTarotCard
                                  card={cCard}
                                  isRevealed
                                  colors={colors}
                                  size="micro"
                                />
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            <Section>Subconscious Foundation</Section>
            {bottomCard && (
              <Card
                style={[
                  styles.foundationCard,
                  { borderColor: colors.gold, backgroundColor: colors.goldSoft },
                ]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Layers size={18} color={colors.gold} />
                    <T bold size={14} style={{ color: colors.gold }}>
                      Bottom of the Deck
                    </T>
                  </View>
                  <Pill>Foundation</Pill>
                </View>

                <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                  <LocalPngTarotCard
                    card={bottomCard}
                    isRevealed
                    colors={colors}
                    size="small"
                  />
                  <View style={{ flex: 1 }}>
                    <T bold size={16}>
                      {bottomCard.name}
                    </T>
                    <T muted size={12} style={{ marginTop: 4, lineHeight: 18 }}>
                      {bottomCard.message}
                    </T>
                  </View>
                </View>
              </Card>
            )}
          </View>

          <View style={styles.spreadActionsRow}>
            <TouchableOpacity
              onPress={onRevealAll}
              style={[styles.revealAllButton, { backgroundColor: colors.purpleSoft }]}
            >
              <Eye size={14} color={colors.purple} />
              <T bold size={12} style={{ color: colors.purple }}>
                Reveal All
              </T>
            </TouchableOpacity>

            <Pill onPress={onDrawSpread}>
              <Shuffle size={14} color={colors.purple} /> Deal New Spread
            </Pill>

            <Pill selected onPress={onShareToStory}>
              {isCapturing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : shared ? (
                <Check size={14} color="#FFF" />
              ) : (
                <Share2 size={14} color="#FFF" />
              )}
              {shared ? 'Added!' : 'Add to story'}
            </Pill>
          </View>
        </>
      )}
    </View>
  );
}