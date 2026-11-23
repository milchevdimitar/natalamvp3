import { ExploreSystemHeader } from '../ExploreSystemHeader';
import React from 'react';

import { useApp } from '../../context/AppContext';
import { Hero } from '../../components/UI';
import { useMbtiTest } from './useMbtiTest';
import { MbtiQuestionnaireSection } from './MbtiQuestionnaireSection';
import { MbtiResultSection } from './MbtiResultSection';
import { MbtiStoryCard } from './MbtiStoryCard';

export default function MBTI() {
  const { colors, user, setUser, addStory } = useApp();

  const {
    answers,
    currentPage,
    setCurrentPage,
    totalPages,
    currentQuestions,
    answeredCount,
    totalQuestionsCount,
    progressPercent,
    showSavedResult,
    isFinished,
    isSyncing,
    syncStatus,
    isPageComplete,
    storyCardRef,
    isCapturing,
    shared,
    currentResultData,
    handleSelect,
    handleRetake,
    handleShareToStory,
    handleNextPage,
    handleCompletePress,
  } = useMbtiTest(user, setUser, addStory);

  return (
    <>
      <ExploreSystemHeader route="mbti" />

      <Hero
        eyebrow="16 ARCHETYPES"
        first="Discover your"
        accent="inner type."
        description="40 questions with a 7-point scale to assess your cognitive preferences."
      />

      {showSavedResult || isFinished ? (
        <MbtiResultSection
          colors={colors}
          resultData={currentResultData}
          isSyncing={isSyncing}
          syncStatus={syncStatus}
          isCapturing={isCapturing}
          shared={shared}
          onRetake={handleRetake}
          onShareToStory={handleShareToStory}
        />
      ) : (
        <MbtiQuestionnaireSection
          colors={colors}
          answers={answers}
          currentPage={currentPage}
          totalPages={totalPages}
          currentQuestions={currentQuestions}
          answeredCount={answeredCount}
          totalQuestionsCount={totalQuestionsCount}
          progressPercent={progressPercent}
          isPageComplete={isPageComplete}
          onSelectAnswer={handleSelect}
          onPrevPage={() => setCurrentPage((p) => p - 1)}
          onNextPage={handleNextPage}
          onComplete={handleCompletePress}
        />
      )}

      <MbtiStoryCard
        storyRef={storyCardRef}
        resultData={currentResultData}
      />
    </>
  );
}
