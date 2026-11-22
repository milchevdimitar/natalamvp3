import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, T, Pill, Progress } from '../../components/UI';
import { Question } from './mbti.types';
import { styles } from './mbti.styles';

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

const SCALE_VALUES = [1, 2, 3, 4, 5, 6, 7];

function getScaleCircleSize(val: number): number {
  if (val === 1 || val === 7) return 32;
  if (val === 2 || val === 6) return 28;
  if (val === 3 || val === 5) return 24;
  return 22;
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
                  <T muted size={10}>
                    Disagree
                  </T>
                  <T muted size={10}>
                    Neutral
                  </T>
                  <T muted size={10}>
                    Agree
                  </T>
                </View>

                <View
                  style={[
                    styles.scaleButtonsPill,
                    { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  {SCALE_VALUES.map((val) => {
                    const isSelected = currentVal === val;
                    const size = getScaleCircleSize(val);

                    return (
                      <TouchableOpacity
                        key={val}
                        onPress={() => onSelectAnswer(q.id, val)}
                        style={[
                          styles.scaleCircle,
                          {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            backgroundColor: isSelected
                              ? colors.purple
                              : val === 4
                              ? colors.line
                              : colors.surface,
                            borderWidth: isSelected ? 0 : 1,
                            borderColor: isSelected ? 'transparent' : colors.line,
                          },
                        ]}
                      >
                        <T
                          bold={isSelected}
                          size={11}
                          style={{ color: isSelected ? '#FFFFFF' : colors.muted }}
                        >
                          {val}
                        </T>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      <View style={styles.paginationRow}>
        {currentPage > 0 ? (
          <Pill onPress={onPrevPage}>← Previous</Pill>
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