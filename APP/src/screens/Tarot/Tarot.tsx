import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Card, T, Pill, Hero } from '../../components/UI';
import { useTarotReading } from './useTarotReading';
import { DailyTarotSection } from './DailyTarotSection';
import { SpreadTarotSection } from './SpreadTarotSection';
import { TarotAltarStoryCard } from './TarotAltarStoryCard';
import { styles } from './tarot.styles';

export default function Tarot() {
  const { colors, setPage, addStory } = useApp();

  const {
    mode,
    setMode,
    useFullDeck,
    setUseFullDeck,
    tarotAltarStoryRef,
    isCapturing,
    shared,
    rowsInput,
    setRowsInput,
    colsInput,
    setColsInput,
    question,
    setQuestion,
    spreadDrawn,
    drawnCards,
    bottomCard,
    revealedIndices,
    clarifyingCards,
    dailyDrawn,
    dailyCard,
    rCount,
    cCount,
    singleCardForStory,
    handleShareToStory,
    handleDrawSpread,
    handleAddClarification,
    toggleRevealCard,
    handleRevealAll,
    handleDrawDaily,
  } = useTarotReading(addStory);

  return (
    <>
      <TouchableOpacity onPress={() => setPage('explore')} style={styles.backButton}>
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Back to Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="LOCAL PNG DECK · 78 CARDS"
        first="Tarot"
        accent="Sanctuary."
        description="High-definition PNG tarot cards rendered directly from local image assets."
      />

      {/* Deck Selection */}
      <Card style={styles.deckCard}>
        <View style={styles.deckRow}>
          <T bold size={13}>
            Deck Selection:
          </T>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pill selected={useFullDeck} onPress={() => setUseFullDeck(true)}>
              Full Deck (78)
            </Pill>
            <Pill selected={!useFullDeck} onPress={() => setUseFullDeck(false)}>
              Major Arcana (22)
            </Pill>
          </View>
        </View>
      </Card>

      {/* Mode Switch */}
      <View style={styles.modeSwitchRow}>
        <Pill selected={mode === 'daily'} onPress={() => setMode('daily')}>
          ✦ Daily Card
        </Pill>
        <Pill selected={mode === 'spread'} onPress={() => setMode('spread')}>
          🔮 Custom Spread Matrix
        </Pill>
      </View>

      {mode === 'daily' && (
        <DailyTarotSection
          colors={colors}
          useFullDeck={useFullDeck}
          dailyDrawn={dailyDrawn}
          dailyCard={dailyCard}
          isCapturing={isCapturing}
          shared={shared}
          onDrawDaily={handleDrawDaily}
          onShareToStory={handleShareToStory}
        />
      )}

      {mode === 'spread' && (
        <SpreadTarotSection
          colors={colors}
          useFullDeck={useFullDeck}
          question={question}
          onChangeQuestion={setQuestion}
          rowsInput={rowsInput}
          onChangeRows={setRowsInput}
          colsInput={colsInput}
          onChangeCols={setColsInput}
          rCount={rCount}
          cCount={cCount}
          spreadDrawn={spreadDrawn}
          drawnCards={drawnCards}
          bottomCard={bottomCard}
          revealedIndices={revealedIndices}
          clarifyingCards={clarifyingCards}
          isCapturing={isCapturing}
          shared={shared}
          onDrawSpread={handleDrawSpread}
          onToggleRevealCard={toggleRevealCard}
          onAddClarification={handleAddClarification}
          onRevealAll={handleRevealAll}
          onShareToStory={handleShareToStory}
        />
      )}

      <TarotAltarStoryCard
        storyRef={tarotAltarStoryRef}
        colors={colors}
        mode={mode}
        question={question}
        singleCardForStory={singleCardForStory}
        drawnCards={drawnCards}
        bottomCard={bottomCard}
        rCount={rCount}
        cCount={cCount}
      />
    </>
  );
}