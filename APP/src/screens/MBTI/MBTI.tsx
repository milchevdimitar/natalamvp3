import React from 'react';
import { TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { T, Hero } from '../../components/UI';
import { useMbtiTest } from './useMbtiTest';
import { MbtiQuestionnaireSection } from './MbtiQuestionnaireSection';
import { MbtiResultSection } from './MbtiResultSection';
import { MbtiStoryCard } from './MbtiStoryCard';
import { styles } from './mbti.styles';

export default function MBTI() {
  const { colors, setPage, user, setUser, addStory } = useApp();

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
      <TouchableOpacity
        onPress={() => setPage('explore')}
        style={styles.backButton}
      >
        <ArrowLeft size={18} color={colors.purple} />
        <T bold size={13} style={{ color: colors.purple }}>
          Back to Explore
        </T>
      </TouchableOpacity>

      <Hero
        eyebrow="YOUR PERSONALITY ATLAS · MBTI"
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
          onNavigateExplore={() => setPage('explore')}
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