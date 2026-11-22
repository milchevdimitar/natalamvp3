import React from 'react';
import { Pressable, View, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { saveSystemActivity } from '../../services/systemActivity';
import { Card, T, Hero } from '../../components/UI';
import { useTarotReading } from './useTarotReading';
import { DailyTarotSection } from './DailyTarotSection';
import { SpreadTarotSection } from './SpreadTarotSection';
import { TarotAltarStoryCard } from './TarotAltarStoryCard';
import { styles } from './tarot.styles';

export default function Tarot() {
  const { colors, setPage, addStory, user, setSelectedChat } = useApp();

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
  } = useTarotReading(addStory, (value, detail) => {
    if (user?.email) void saveSystemActivity(user.email, 'tarot', { value, detail }).catch(console.warn);
  });

  const modes = [{ value: 'daily', label: 'Daily card' }, { value: 'spread', label: 'Custom spread' }] as const;
  const decks = [{ value: true, label: 'Full deck (78)' }, { value: false, label: 'Major Arcana (22)' }] as const;
  const readingOptions = (
    <View style={styles.readingOptions}>
      {[
        { label: 'Reading mode', options: modes.map(({ value, label }) => ({ label, selected: mode === value, choose: () => setMode(value) })) },
        { label: 'Tarot deck', options: decks.map(({ value, label }) => ({ label, selected: useFullDeck === value, choose: () => setUseFullDeck(value) })) },
      ].map(({ label, options }) => (
        <View key={label} accessibilityLabel={label} style={[styles.optionTrack, { backgroundColor: colors.surfaceAlt, borderColor: colors.line }]}>
          {options.map(({ label: option, selected, choose }) => (
            <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected }} disabled={isCapturing} onPress={choose}
              style={[styles.option, selected && { backgroundColor: colors.purpleSoft }]}>
              <T size={12} bold={selected} muted={!selected} style={{ textAlign: 'center' }}>{option}</T>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <>
      <TouchableOpacity onPress={() => setPage('explore')} style={styles.backButton}>
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Back to Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="CARDS OF THE UNSEEN"
        first="Tarot"
        accent="Sanctuary."
        description="Follow a quiet question into the cards. Draw one for a moment of clarity, or lay out a spread to explore what lies beneath."
      />

      {mode === 'daily' && (
        <DailyTarotSection
          colors={colors}
          dailyCard={dailyCard}
          controls={readingOptions}
          isCapturing={isCapturing}
          shared={shared}
          onDrawDaily={handleDrawDaily}
          onShareMessage={(draftMessage) => {
            setSelectedChat({ draftMessage });
            setPage('chat');
          }}
          onShareToStory={handleShareToStory}
        />
      )}

      {mode === 'spread' && <Card style={styles.spreadOptions}>{readingOptions}</Card>}

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
