import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Eye, Layers, Plus, Share2 } from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import { DetailScreen } from '../Home/CelestialDetails';
import { useReducedMotion } from '../Home/CosmicBackground';
import { TarotArtworkCard } from './TarotArtworkCard';
import type { TarotCardData } from './tarot.types';
import { MAX_CLARIFIERS, SPREAD_MAX_COLUMNS, SPREAD_MAX_ROWS, type SpreadLayout } from './useTarotReading';

interface Props {
  colors: any;
  useFullDeck: boolean;
  question: string;
  dealtQuestion: string;
  onChangeQuestion: (text: string) => void;
  layout: SpreadLayout;
  onChangeLayout: (layout: SpreadLayout) => void;
  onChangeDeck: (full: boolean) => void;
  remainingCount: number;
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
  onRevealCard: (idx: number) => void;
  onAddClarification: (idx: number) => number | null;
  onRevealAll: () => void;
  onShareToStory: () => void;
}

function CardReader({ colors, cards, position, active, select, onClose, onClarify, canClarify, limitReached }: {
  colors: any; cards: TarotCardData[]; position: number; active: number; select: (index: number) => void;
  onClose: () => void; onClarify: () => void; canClarify: boolean; limitReached: boolean;
}) {
  const reduced = useReducedMotion();
  const offset = useRef(new Animated.Value(0)).current;
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const appearance = useRef(new Animated.Value(1)).current;
  const card = cards[active] ?? cards[0];
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    appearance.setValue(reduced ? 1 : 0);
    if (reduced) return;
    const animation = Animated.timing(appearance, { toValue: 1, duration: 230, useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [appearance, card.id, reduced]);

  return <DetailScreen title={`Position ${position + 1}`} onClose={onClose} offset={offset} reduced={reduced} darkBottom>
    <ScrollView ref={scroll} contentContainerStyle={ui.reader}>
      <Animated.View style={[ui.reading, { opacity: appearance, transform: [{ translateY: appearance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
        <View style={ui.fullCard}><TarotArtworkCard card={card} isRevealed colors={colors} size="large" /></View>
        <T bold size={12} style={ui.readerLabel}>{active ? `Clarifier ${active}` : 'Main card'}</T>
        <T bold size={23} style={ui.readerTitle}>{card.name}</T>
        <T size={15} style={ui.readerText}>{card.message}</T>
      </Animated.View>
    </ScrollView>
    <View style={ui.readerActions}>
      {cards.length > 1 && <View style={ui.stackSection}>
        <T bold size={13} style={ui.readerTitle}>Cards in this stack</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.stack}>
          {cards.map((item, index) => (
            <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: index === active }}
              accessibilityLabel={`${index ? 'Clarifier ' + index : 'Main card'}, ${item.name}`}
              onPress={() => select(index)} style={[ui.stackSlot, index > 0 && ui.overlap]}>
              <View pointerEvents="none" style={[ui.stackFace, index === active && ui.stackActive]}>
                <TarotArtworkCard card={item} isRevealed colors={colors} size="medium" />
              </View>
              <T bold size={10} style={[ui.stackLabel, index === active && ui.stackLabelActive]}>{index ? `+${index}` : 'Main'}</T>
            </Pressable>
          ))}
        </ScrollView>
      </View>}

      <Pressable accessibilityRole="button" disabled={!canClarify} onPress={onClarify} style={[ui.clarify, !canClarify && ui.inactive]}>
        <Plus size={19} color="#211638" />
        <T bold size={14} style={ui.clarifyText}>{limitReached ? 'Clarifier limit reached' : canClarify ? 'Draw a clarifier' : 'No cards left'}</T>
      </Pressable>
    </View>
  </DetailScreen>;
}

export function SpreadTarotSection(props: Props) {
  const {
    colors, useFullDeck, question, dealtQuestion, onChangeQuestion, layout, onChangeLayout, onChangeDeck, remainingCount,
    rCount, cCount, spreadDrawn, drawnCards, bottomCard, revealedIndices, clarifyingCards, isCapturing, shared,
    onDrawSpread, onRevealCard, onAddClarification, onRevealAll, onShareToStory,
  } = props;
  const [editing, setEditing] = useState(false);
  const [inspected, setInspected] = useState<number | null>(null);
  const [activeCard, setActiveCard] = useState(0);
  const reduced = useReducedMotion();
  const dealt = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!drawnCards.length) return;
    dealt.setValue(reduced ? 1 : 0);
    if (reduced) return;
    const animation = Animated.timing(dealt, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [dealt, drawnCards, reduced]);

  const showSetup = !spreadDrawn || editing;
  const stack = inspected === null ? [] : [drawnCards[inspected], ...(clarifyingCards[inspected] ?? [])].filter(Boolean);
  const openPosition = (index: number) => {
    if (!revealedIndices[index]) {
      onRevealCard(index);
      return;
    }
    setActiveCard(0);
    setInspected(index);
  };

  return <View style={ui.screen}>
    {showSetup ? <Card style={ui.setup}>
      <T bold size={17}>Build your spread</T>
      <TextInput accessibilityLabel="Your intention" value={question} onChangeText={onChangeQuestion}
        placeholder="Your intention (optional)" placeholderTextColor={colors.muted} maxLength={180}
        style={[ui.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surfaceAlt }]} />
      <View style={ui.row}>
        <T bold size={14}>Choose a layout</T>
        <T muted size={12}>{layout.rows * layout.columns} cards</T>
      </View>
      <T muted size={12}>Tap the bottom-right card to choose the size.</T>
      <View style={ui.layoutGrid}>
        {Array.from({ length: SPREAD_MAX_ROWS }, (_, row) => <View key={row} style={ui.gridRow}>
          {Array.from({ length: SPREAD_MAX_COLUMNS }, (_, column) => {
            const selected = row + 1 === layout.rows && column + 1 === layout.columns;
            const included = row < layout.rows && column < layout.columns;
            return <Pressable key={column} accessibilityRole="button" accessibilityState={{ selected }}
              accessibilityLabel={`${row + 1} rows, ${column + 1} columns`}
              onPress={() => onChangeLayout({ rows: row + 1, columns: column + 1 })}
              style={[ui.cell, { backgroundColor: included ? colors.purpleSoft : colors.surfaceAlt, borderColor: selected ? colors.purple : colors.line }]}>
              <Layers size={17} color={included ? colors.purple : colors.muted} />
            </Pressable>;
          })}
        </View>)}
      </View>
      <View style={ui.gridRow}>
        {([true, false] as const).map((full) => <Pressable key={String(full)} accessibilityRole="button"
          accessibilityState={{ selected: useFullDeck === full }} onPress={() => onChangeDeck(full)}
          style={[ui.deckOption, { borderColor: useFullDeck === full ? colors.purple : colors.line, backgroundColor: useFullDeck === full ? colors.purpleSoft : colors.surfaceAlt }]}>
          <T bold size={12}>{full ? 'Full deck' : 'Major Arcana'}</T>
        </Pressable>)}
      </View>
      <Pressable accessibilityRole="button" disabled={isCapturing} onPress={() => { onDrawSpread(); setEditing(false); }}
        style={[ui.primary, { backgroundColor: colors.action }]}><T bold size={14} style={ui.white}>Deal {layout.rows * layout.columns} cards</T></Pressable>
      {spreadDrawn && <Pressable accessibilityRole="button" onPress={() => setEditing(false)} style={ui.link}><T muted size={13} style={ui.center}>Back to current spread</T></Pressable>}
    </Card> : <>
      <View style={ui.row}>
        <Section>Your spread</Section>
        <Pressable accessibilityRole="button" disabled={isCapturing} onPress={() => setEditing(true)} style={ui.link}>
          <T bold size={13} style={{ color: colors.purple }}>New spread</T>
        </Pressable>
      </View>
      {!!dealtQuestion && <T muted size={13}>{dealtQuestion}</T>}
      <T muted size={12}>Tap to reveal a card, then tap again to read its meaning or draw a clarifier.</T>
      <Animated.View style={[ui.board, { opacity: dealt }]}>
        {Array.from({ length: rCount }, (_, row) => <View key={row} style={ui.gridRow}>
          {drawnCards.slice(row * cCount, (row + 1) * cCount).map((card, column) => {
            const index = row * cCount + column;
            const count = clarifyingCards[index]?.length ?? 0;
            const revealed = !!revealedIndices[index];
            return <Pressable key={card.id} accessibilityRole="button"
              accessibilityLabel={revealed ? `Position ${index + 1}, ${card.name}, ${count} clarifiers` : `Reveal position ${index + 1}`}
              onPress={() => openPosition(index)} style={({ pressed }) => [ui.tile, pressed && ui.inactive]}>
              <View style={ui.deckTile}>
                {count > 0 && <View style={[ui.stackEdge, { borderColor: colors.purple, backgroundColor: colors.purpleSoft }]} />}
                <TarotArtworkCard card={card} isRevealed={revealed} cardIndex={index} colors={colors} />
              </View>
              <T bold size={11} style={ui.center}>{revealed ? card.name : `Card ${index + 1}`}</T>
              {count > 0 && <T muted size={11} style={ui.center}>+{count} {count === 1 ? 'clarifier' : 'clarifiers'}</T>}
            </Pressable>;
          })}
        </View>)}
      </Animated.View>

      {bottomCard && <Card style={ui.foundation}>
        <TarotArtworkCard card={bottomCard} isRevealed colors={colors} size="small" />
        <View style={ui.copy}><T muted size={12}>Bottom of the deck</T><T bold size={15}>{bottomCard.name}</T><T muted size={13}>{bottomCard.message}</T></View>
      </Card>}
      <View style={ui.gridRow}>
        <Pressable accessibilityRole="button" disabled={isCapturing} onPress={onRevealAll} style={[ui.action, { backgroundColor: colors.surfaceAlt }]}>
          <Eye size={17} color={colors.purple} /><T bold size={13}>Reveal all</T>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={isCapturing || shared} onPress={onShareToStory} style={[ui.action, { backgroundColor: colors.purpleSoft }]}>
          {isCapturing ? <ActivityIndicator size="small" color={colors.purple} /> : <Share2 size={17} color={colors.purple} />}
          <T bold size={13}>{shared ? 'Added to Story' : 'Add to Story'}</T>
        </Pressable>
      </View>
    </>}

    {inspected !== null && stack.length > 0 && <CardReader colors={colors} cards={stack} position={inspected} active={activeCard}
      select={setActiveCard} onClose={() => setInspected(null)} limitReached={stack.length - 1 >= MAX_CLARIFIERS}
      canClarify={remainingCount > 0 && stack.length - 1 < MAX_CLARIFIERS}
      onClarify={() => { const next = onAddClarification(inspected); if (next !== null) setActiveCard(next); }} />}
  </View>;
}

const ui = StyleSheet.create({
  screen: { gap: 12, marginBottom: 34 },
  setup: { gap: 12, padding: 17 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8 },
  layoutGrid: { gap: 7 },
  cell: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13 },
  deckOption: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  primary: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  white: { color: '#fff' },
  link: { minHeight: 44, justifyContent: 'center' },
  board: { gap: 13, width: '100%', maxWidth: 520, alignSelf: 'center' },
  tile: { flex: 1, minWidth: 0, maxWidth: 190, gap: 5 },
  deckTile: { paddingRight: 4 },
  stackEdge: { position: 'absolute', top: 4, bottom: -3, left: 5, right: 0, borderWidth: 1, borderRadius: 8 },
  center: { textAlign: 'center' },
  foundation: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 5 },
  action: { flex: 1, minHeight: 46, paddingHorizontal: 7, borderRadius: 13, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  reader: { padding: 20, paddingBottom: 32, gap: 18, width: '100%', maxWidth: 520, alignSelf: 'center' },
  readerActions: { gap: 8, paddingHorizontal: 20, paddingBottom: 10, width: '100%', maxWidth: 520, alignSelf: 'center' },
  reading: { alignItems: 'center', gap: 8 },
  fullCard: { width: '77%', maxWidth: 212, alignSelf: 'center' },
  readerLabel: { color: '#e9ca98' },
  readerTitle: { color: '#f8f4ff', textAlign: 'center' },
  readerText: { color: '#d9d3f0', lineHeight: 22, textAlign: 'center' },
  stackSection: { gap: 9, alignItems: 'center' },
  stack: { paddingHorizontal: 12, paddingVertical: 5 },
  stackSlot: { width: 60, alignItems: 'center' },
  overlap: { marginLeft: -15 },
  stackFace: { width: 58, borderWidth: 2, borderColor: 'transparent', borderRadius: 10 },
  stackActive: { borderColor: '#f0cc94' },
  stackLabel: { color: '#d9d3f0', paddingVertical: 5 },
  stackLabelActive: { color: '#f0cc94' },
  clarify: { minHeight: 48, paddingHorizontal: 16, borderRadius: 22, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0cc94' },
  clarifyText: { color: '#211638' },
  inactive: { opacity: 0.52 },
});
