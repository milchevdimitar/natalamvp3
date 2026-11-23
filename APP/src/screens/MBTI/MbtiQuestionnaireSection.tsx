import { BackButton } from '../../components/BackButton';
import React from 'react';
import { View } from 'react-native';
import { Card, T, Pill, Progress } from '../../components/UI';
import { Question } from './mbti.types';
import { styles } from './mbti.styles';
import { LikertScale } from './LikertScale';

interface MbtiQuestionnaireSectionProps {
  colors: any;
  answers: Record<number, number>;
  currentPage: number;
  totalPages: number;
  currentQuestions: Question[];
  answeredCount: number;
  totalQuestionsCount: number;
  progressPercent: number;
  isPageComplete: boolean;
  onSelectAnswer: (questionId: number, value: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onComplete: () => void;
}

export function MbtiQuestionnaireSection({
  colors,
  answers,
  currentPage,
  totalPages,
  currentQuestions,
  answeredCount,
  totalQuestionsCount,
  progressPercent,
  isPageComplete,
  onSelectAnswer,
  onPrevPage,
  onNextPage,
  onComplete,
}: MbtiQuestionnaireSectionProps) {
  return (
    <>
      <Card style={styles.progressCard}>
        <View style={styles.progressHeaderRow}>
          <T bold size={13}>
            Progress: {answeredCount} of {totalQuestionsCount} questions
          </T>
          <T bold size={12} style={{ color: colors.purple }}>
            {progressPercent}%
          </T>
        </View>
        <Progress value={progressPercent} color={colors.purple} />
        <T muted size={11}>
          Page {currentPage + 1} of {totalPages}
        </T>
      </Card>

      <View style={styles.questionsList}>
        {currentQuestions.map((q) => {
          const currentVal = answers[q.id];
          return (
            <Card key={q.id} style={styles.questionCard}>
              <View style={styles.questionHeaderRow}>
                <View
                  style={[
                    styles.questionNumberBadge,
                    { backgroundColor: colors.purpleSoft },
                  ]}
                >
                  <T bold size={12} style={{ color: colors.purple }}>
                    {q.id}
                  </T>
                </View>
                <T bold size={14} style={styles.questionText}>
                  {q.text}
                </T>
              </View>

              <View style={{ gap: 6 }}>
                <View style={styles.scaleLabelsRow}>
                  <T muted size={10} style={[styles.scaleLabel, styles.scaleEndLabel, styles.scaleFirstLabel]}>
                    Disagree
                  </T>
                  <T muted size={10} style={styles.scaleLabel}>
                    Neutral
                  </T>
                  <T muted size={10} style={[styles.scaleLabel, styles.scaleEndLabel, styles.scaleLastLabel]}>
                    Agree
                  </T>
                </View>

                <LikertScale value={currentVal} colors={colors} onChange={(value) => onSelectAnswer(q.id, value)} />
              </View>
            </Card>
          );
        })}
      </View>

      <View style={styles.paginationRow}>
        {currentPage > 0 ? (
          <BackButton onPress={onPrevPage} label="Previous questions" />
        ) : (
          <View />
        )}

        {currentPage < totalPages - 1 ? (
          <Pill selected={isPageComplete} onPress={onNextPage}>
            Next →
          </Pill>
        ) : (
          <Pill
            selected={answeredCount === totalQuestionsCount}
            onPress={onComplete}
          >
            ✦ Complete & View Result
          </Pill>
        )}
      </View>
    </>
  );
}