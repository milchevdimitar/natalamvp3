import { ExploreSystemHeader } from '../ExploreSystemHeader';
import React from 'react';
import { SegmentedControl } from '../../components/SegmentedControl';

import { useApp } from '../../context/AppContext';
import { saveSystemActivity } from '../../services/systemActivity';
import { Hero } from '../../components/UI';
import { useTarotReading } from './useTarotReading';
import { DailyTarotSection } from './DailyTarotSection';
import { SpreadTarotSection } from './SpreadTarotSection';
import { TarotAltarStoryCard } from './TarotAltarStoryCard';

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
    layout,
    setLayout,
    remainingCount,
    question,
    dealtQuestion,
    setQuestion,
    spreadDrawn,
    drawnCards,
    bottomCard,
    revealedIndices,
    clarifyingCards,
    dailyCard,
    dailyBusy,
    dailyError,
    rCount,
    cCount,
    singleCardForStory,
    handleShareToStory,
    handleDrawSpread,
    handleAddClarification,
    revealCard,
    handleRevealAll,
    handleDrawDaily,
  } = useTarotReading(addStory, (value, detail) => {
    if (user?.email) void saveSystemActivity(user.email, 'tarot', { value, detail }).catch(console.warn);
  }, user?.email);

  const modes = [{ value: 'daily', label: 'Daily card' }, { value: 'spread', label: 'Custom spread' }] as const;

  return (
    <>
      <ExploreSystemHeader route="tarot" />

      <Hero
        eyebrow="CARDS OF THE UNSEEN"
        first="Tarot"
        accent="Sanctuary."
        description="Follow a quiet question into the cards. Draw one for a moment of clarity, or lay out a spread to explore what lies beneath."
      />

      <SegmentedControl label="Reading mode" options={modes} value={mode} onChange={setMode} disabled={isCapturing} />

      {mode === 'daily' && (
        <DailyTarotSection
          colors={colors}
          dailyCard={dailyCard}
          busy={dailyBusy}
          error={dailyError}
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

      {mode === 'spread' && (
        <SpreadTarotSection
          colors={colors}
          useFullDeck={useFullDeck}
          question={question}
          dealtQuestion={dealtQuestion}
          onChangeQuestion={setQuestion}
          layout={layout}
          onChangeLayout={setLayout}
          onChangeDeck={setUseFullDeck}
          remainingCount={remainingCount}
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
          onRevealCard={revealCard}
          onAddClarification={handleAddClarification}
          onRevealAll={handleRevealAll}
          onShareToStory={handleShareToStory}
        />
      )}

      <TarotAltarStoryCard
        storyRef={tarotAltarStoryRef}
        mode={mode}
        question={dealtQuestion}
        singleCardForStory={singleCardForStory}
        drawnCards={drawnCards}
        bottomCard={bottomCard}
        rCount={rCount}
        cCount={cCount}
      />
    </>
  );
}
