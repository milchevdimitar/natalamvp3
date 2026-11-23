import { useState, useRef, useMemo } from 'react';
import { View, Alert } from 'react-native';
import { captureStory } from '../../components/StoryCanvas';
import { saveUserProfile } from '../../services/api';
import { calc } from '../../services/calcApi';
import { UserProfile } from '../../models/User';
import { ITEMS_PER_PAGE, QUESTIONS } from './mbti.data';
import { calculateMbtiResult, resolveCurrentResultData } from './mbti.calculations';

export function useMbtiTest(
  user: UserProfile | null,
  setUser: (u: UserProfile) => Promise<void> | void,
  addStory: (base64Image: string) => Promise<void>
) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const storyCardRef = useRef<React.ComponentRef<typeof View>>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shared, setShared] = useState(false);

  const totalPages = Math.ceil(QUESTIONS.length / ITEMS_PER_PAGE);
  const currentQuestions = useMemo(
    () =>
      QUESTIONS.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
      ),
    [currentPage]
  );

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / QUESTIONS.length) * 100);

  const hasSavedResult = Boolean(user?.mbti?.type);
  const showSavedResult = hasSavedResult && !isRetaking && !isFinished;
  const isPageComplete = currentQuestions.every((q) => answers[q.id] !== undefined);

  const handleSelect = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFinishAndSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing with MongoDB Atlas...');

    const res = await calc<ReturnType<typeof calculateMbtiResult>>('mbti/result', { answers })
      .catch(() => calculateMbtiResult(answers));

    const mbtiPayload = {
      type: res.type,
      percentages: {
        extraversion: res.ratios.EI.first,
        introversion: res.ratios.EI.second,
        intuitive: res.ratios.SN.second,
        observant: res.ratios.SN.first,
        thinking: res.ratios.TF.first,
        feeling: res.ratios.TF.second,
        judging: res.ratios.JP.first,
        prospecting: res.ratios.JP.second,
      },
    };

    if (!user || !user.email) {
      setSyncStatus('No active user session!');
      setIsSyncing(false);
      setIsFinished(true);
      setIsRetaking(false);
      return;
    }

    const updatedUser: UserProfile = {
      ...user,
      mbti: mbtiPayload,
    };

    try {
      await setUser(updatedUser);
      await saveUserProfile(updatedUser);
      setSyncStatus('Successfully saved to database!');
    } catch (error) {
      console.warn('Offline mode: Result saved locally on device.', error);
      setSyncStatus('Saved locally on device.');
    } finally {
      setIsSyncing(false);
      setIsFinished(true);
      setIsRetaking(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentPage(0);
    setIsFinished(false);
    setIsRetaking(true);
    setSyncStatus(null);
  };

  const handleShareToStory = async () => {
    try {
      setIsCapturing(true);

      const base64Image = await captureStory(storyCardRef);

      await addStory(base64Image);

      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch (error) {
      console.error('Грешка при генериране на Story изображението:', error);
      Alert.alert(
        'Грешка',
        'Не съумяхме да споделим сторито. Моля, проверете връзката си със сървъра.'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleNextPage = () => {
    if (isPageComplete) {
      setCurrentPage((p) => p + 1);
    } else {
      Alert.alert('Incomplete Page', 'Please answer all questions on this page!');
    }
  };

  const handleCompletePress = () => {
    if (answeredCount === QUESTIONS.length) {
      handleFinishAndSync();
    } else {
      Alert.alert('Incomplete Test', 'Please answer all 40 questions to see your result!');
    }
  };

  const currentResultData = useMemo(
    () => resolveCurrentResultData(showSavedResult, user, answers),
    [showSavedResult, user, answers]
  );

  return {
    answers,
    currentPage,
    setCurrentPage,
    totalPages,
    currentQuestions,
    answeredCount,
    totalQuestionsCount: QUESTIONS.length,
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
  };
}
