import {
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Svg, { Line, Polygon, Rect, Ellipse, Text as SvgText, Defs, Marker, Polyline } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '@/contexts/auth-context';
import { getCompletedSubtopics } from '@/lib/completion-storage';
import { addXp } from '@/lib/xp-storage';
import { getRandomQuizPages, hasEnoughQuizzes, getAvailableQuizCount } from '@/lib/quiz-utils';
import { QuizModePage } from '@/lib/quiz-mode-data';
import { useXpFeedback } from '@/components/xp-feedback-provider';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { MathText } from '@/components/MathText';
import { FunctionGraph, GraphConfig } from '@/components/FunctionGraph';
import { Colors } from '@/constants/theme';

type DiagramKind = 'unit-triangle' | 'three-four-five' | 'function-machine' | 'domain-range-mapping';

type TeachingBlock =
  | { kind: 'text'; content: string }
  | {
      kind: 'formula';
      content: string;
      widthFactor?: number;
      fontSize?: number;
      textAlign?: 'left' | 'center' | 'right';
    }
  | { kind: 'diagram'; diagram: DiagramKind }
  | {
      kind: 'hint';
      content: string;
      widthFactor?: number;
      fontSize?: number;
      textAlign?: 'left' | 'center' | 'right';
    }
  | { kind: 'graph'; config: GraphConfig };

type QuizChoice = { id: string; label: string };
type MathQuizChoice = { id: string; label: string; isMath: true };
type GraphQuizChoice = { id: string; label: string; graph: GraphConfig };

type QuizState = 'idle' | 'playing' | 'gameOver' | 'completed';

function renderDiagramByKind(kind: DiagramKind) {
  if (kind === 'unit-triangle') {
    return (
      <Svg viewBox="0 0 240 200" width="100%" height="100%">
        <Polygon
          points="20,180 220,180 220,20"
          fill="#dbeafe"
          stroke="#1d4ed8"
          strokeWidth={2}
        />
        <Line
          x1="20"
          y1="180"
          x2="220"
          y2="20"
          stroke="#1d4ed8"
          strokeWidth={2.5}
        />
        <SvgText
          x="130"
          y="105"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold">
          1
        </SvgText>
        <SvgText
          x="120"
          y="192"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold">
          cos a
        </SvgText>
        <SvgText
          x="230"
          y="100"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          transform="rotate(-90 230,100)">
          sin a
        </SvgText>
        <SvgText
          x="42"
          y="170"
          fill="#2563eb"
          fontSize="16"
          fontWeight="bold">
          a
        </SvgText>
      </Svg>
    );
  }

  if (kind === 'three-four-five') {
    return (
      <Svg viewBox="0 0 240 200" width="100%" height="100%">
        <Polygon
          points="40,180 200,180 200,70"
          fill="#fef3c7"
          stroke="#f59e0b"
          strokeWidth={2.5}
        />
        <Line
          x1="40"
          y1="180"
          x2="200"
          y2="70"
          stroke="#f59e0b"
          strokeWidth={3}
        />
        <SvgText
          x="130"
          y="198"
          fill="#92400e"
          fontSize="16"
          fontWeight="bold">
          4
        </SvgText>
        <SvgText
          x="205"
          y="130"
          fill="#92400e"
          fontSize="16"
          fontWeight="bold">
          3
        </SvgText>
        <SvgText
          x="130"
          y="110"
          fill="#b45309"
          fontSize="16"
          fontWeight="bold">
          5
        </SvgText>
        <SvgText
          x="70"
          y="174"
          fill="#b45309"
          fontSize="16"
          fontWeight="bold">
          a
        </SvgText>
      </Svg>
    );
  }

  if (kind === 'function-machine') {
    return (
      <Svg viewBox="0 0 400 150" width="100%" height="100%">
        <Defs>
          <Marker
            id="arrowhead-function"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto">
            <Polyline points="0,0 10,3 0,6" fill="#0f172a" stroke="#0f172a" strokeWidth={0.5} />
          </Marker>
        </Defs>
        
        <Polygon
          points="30,50 70,50 70,100 30,100"
          fill="none"
          stroke="#0f172a"
          strokeWidth={3}
        />
        <SvgText
          x="50"
          y="75"
          fill="#0f172a"
          fontSize="24"
          fontWeight="bold"
          textAnchor="middle">
          3
        </SvgText>
        
        <Line
          x1="70"
          y1="75"
          x2="130"
          y2="75"
          stroke="#0f172a"
          strokeWidth={3}
          markerEnd="url(#arrowhead-function)"
        />
        
        <Rect
          x="130"
          y="40"
          width="140"
          height="70"
          fill="#e0f2fe"
          stroke="#1d4ed8"
          strokeWidth={3}
          rx="5"
        />
        <SvgText
          x="200"
          y="80"
          fill="#1d4ed8"
          fontSize="18"
          fontWeight="bold"
          textAnchor="middle">
          5 × x
        </SvgText>
        
        <Line
          x1="270"
          y1="75"
          x2="330"
          y2="75"
          stroke="#0f172a"
          strokeWidth={3}
          markerEnd="url(#arrowhead-function)"
        />
        
        <Polygon
          points="330,50 370,50 370,100 330,100"
          fill="none"
          stroke="#0f172a"
          strokeWidth={3}
        />
        <SvgText
          x="350"
          y="75"
          fill="#0f172a"
          fontSize="24"
          fontWeight="bold"
          textAnchor="middle">
          15
        </SvgText>
      </Svg>
    );
  }

  if (kind === 'domain-range-mapping') {
    return (
      <Svg viewBox="0 0 400 200" width="100%" height="100%">
        <Defs>
          <Marker
            id="arrowhead-mapping"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto">
            <Polyline points="0,0 10,3 0,6" fill="#0f172a" stroke="#0f172a" strokeWidth={0.5} />
          </Marker>
        </Defs>
        
        <Rect
          x="20"
          y="40"
          width="120"
          height="120"
          fill="#dbeafe"
          stroke="#1d4ed8"
          strokeWidth={2}
          rx="5"
        />
        <SvgText
          x="80"
          y="30"
          fill="#1d4ed8"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle">
          A (Tanım)
        </SvgText>
        
        <Rect
          x="260"
          y="40"
          width="120"
          height="120"
          fill="#fef3c7"
          stroke="#f59e0b"
          strokeWidth={2}
          rx="5"
        />
        <SvgText
          x="320"
          y="30"
          fill="#f59e0b"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle">
          B (Görüntü)
        </SvgText>
        
        <SvgText
          x="80"
          y="70"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          1
        </SvgText>
        <SvgText
          x="80"
          y="100"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          2
        </SvgText>
        <SvgText
          x="80"
          y="130"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          3
        </SvgText>
        
        <SvgText
          x="320"
          y="70"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          1
        </SvgText>
        <SvgText
          x="320"
          y="100"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          2
        </SvgText>
        <SvgText
          x="320"
          y="130"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          3
        </SvgText>
        
        <Line
          x1="140"
          y1="70"
          x2="260"
          y2="70"
          stroke="#0f172a"
          strokeWidth={2}
          markerEnd="url(#arrowhead-mapping)"
        />
        <Line
          x1="140"
          y1="100"
          x2="260"
          y2="100"
          stroke="#0f172a"
          strokeWidth={2}
          markerEnd="url(#arrowhead-mapping)"
        />
        <Line
          x1="140"
          y1="130"
          x2="260"
          y2="130"
          stroke="#0f172a"
          strokeWidth={2}
          markerEnd="url(#arrowhead-mapping)"
        />
      </Svg>
    );
  }

  return null;
}

function renderDiagram(kind?: DiagramKind) {
  if (!kind) return null;
  return <View style={styles.diagramCard}>{renderDiagramByKind(kind)}</View>;
}

function renderTeachingBlock(block: TeachingBlock, index: number) {
  switch (block.kind) {
    case 'diagram':
      return (
        <View key={`diagram-${block.diagram}-${index}`} style={styles.diagramCard}>
          {renderDiagramByKind(block.diagram)}
        </View>
      );
    case 'text':
      return (
        <Text key={`text-${index}`} style={styles.bodyText}>
          {block.content}
        </Text>
      );
    case 'formula':
      return (
        <View key={`formula-${index}`} style={styles.formulaCard}>
          <MathText
            latex={block.content}
            widthFactor={block.widthFactor ?? 0.75}
            fontSize={block.fontSize ?? 20}
            textAlign={block.textAlign ?? 'center'}
          />
        </View>
      );
    case 'hint':
      return (
        <View key={`hint-${index}`} style={styles.hintCard}>
          <MathText
            latex={block.content}
            widthFactor={block.widthFactor ?? 0.7}
            fontSize={block.fontSize ?? 18}
            textAlign={block.textAlign ?? 'left'}
          />
        </View>
      );
    case 'graph':
      return (
        <View key={`graph-${index}`} style={styles.diagramCard}>
          <FunctionGraph config={block.config} />
        </View>
      );
    default:
      return null;
  }
}

function getChoiceVisualState(
  choiceId: string,
  page: QuizModePage,
  selectedChoice: string | null,
  isChoiceCorrect: boolean | null,
) {
  const isSelected = selectedChoice === choiceId;
  const isCorrectSelection = isSelected && isChoiceCorrect === true;
  const isIncorrectSelection = isSelected && isChoiceCorrect === false;

  return { isSelected, isCorrectSelection, isIncorrectSelection };
}

function getPageDiagram(page?: QuizModePage): DiagramKind | undefined {
  if (!page) return undefined;
  return page.diagram;
}

export default function QuizScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showXp } = useXpFeedback();
  const { playCorrect, playNegative, playCompletion } = useSoundEffects();

  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [selectedQuizzes, setSelectedQuizzes] = useState<QuizModePage[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isChoiceCorrect, setIsChoiceCorrect] = useState<boolean | null>(null);
  const [sessionXp, setSessionXp] = useState(0);
  const [completedSubtopics, setCompletedSubtopics] = useState<string[]>([]);
  const [availableQuizCount, setAvailableQuizCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      
      const loadCompletedSubtopics = async () => {
        const completed = await getCompletedSubtopics(user.id);
        setCompletedSubtopics(completed);
        const count = getAvailableQuizCount(completed);
        setAvailableQuizCount(count);
      };

      loadCompletedSubtopics();
    }, [user?.id]),
  );

  const handleStartQuiz = () => {
    if (!user?.id) return;
    
    const quizzes = getRandomQuizPages(completedSubtopics, 3);
    if (quizzes.length < 3) {
      // Not enough quizzes available
      return;
    }

    setSelectedQuizzes(quizzes);
    setCurrentQuestionIndex(0);
    setSelectedChoice(null);
    setIsChoiceCorrect(null);
    setSessionXp(0);
    setQuizState('playing');
  };

  const handleChoiceSelect = async (choiceId: string, page: QuizModePage) => {
    if (!user?.id || quizState !== 'playing') return;
    
    setSelectedChoice(choiceId);
    const isCorrect = choiceId === page.correctChoiceId;
    setIsChoiceCorrect(isCorrect);

    if (isCorrect) {
      // Correct answer: +10 XP
      await addXp(user.id, 10);
      setSessionXp(prev => prev + 10);
      showXp(10);
      await playCorrect();

      // Move to next question after a delay
      setTimeout(() => {
        if (currentQuestionIndex < selectedQuizzes.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedChoice(null);
          setIsChoiceCorrect(null);
        } else {
          // Quiz completed!
          handleQuizCompletion();
        }
      }, 1500);
    } else {
      // Wrong answer: Game Over
      await playNegative();
      setTimeout(() => {
        setQuizState('gameOver');
      }, 1000);
    }
  };

  const handleQuizCompletion = async () => {
    if (!user?.id) return;
    
    // Award completion bonus: +20 XP
    await addXp(user.id, 20);
    setSessionXp(prev => prev + 20);
    showXp(20);
    await playCompletion();
    
    setQuizState('completed');
  };

  const handleGameOverReturn = () => {
    setQuizState('idle');
    setSelectedQuizzes([]);
    setCurrentQuestionIndex(0);
    setSelectedChoice(null);
    setIsChoiceCorrect(null);
    setSessionXp(0);
  };

  const handleCompletedReturn = () => {
    setQuizState('idle');
    setSelectedQuizzes([]);
    setCurrentQuestionIndex(0);
    setSelectedChoice(null);
    setIsChoiceCorrect(null);
    setSessionXp(0);
  };

  const currentQuiz = selectedQuizzes[currentQuestionIndex];
  const hasEnough = hasEnoughQuizzes(completedSubtopics);

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 32) }]}>
        {quizState === 'idle' && (
          <View style={styles.idleContainer}>
            <Text style={styles.title}>Quiz Modu</Text>
            <Text style={styles.subtitle}>
              Tamamladığın konulardan rastgele sorular çöz, ödüller kazan!
            </Text>
            
            <Image
              source={require('@/assets/images/quiz.png')}
              style={styles.quizImage}
              resizeMode="contain"
            />
            
            {!hasEnough ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  Quiz başlatmak için en az 3 konu tamamlaman gerekiyor.
                </Text>
                <Text style={styles.warningSubtext}>
                  Şu anda {availableQuizCount} soru mevcut.
                </Text>
              </View>
            ) : (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  {availableQuizCount} soru mevcut
                </Text>
                <Text style={styles.infoSubtext}>
                  Her doğru cevap: +10 XP{'\n'}
                  Quiz tamamlama: +20 XP
                </Text>
              </View>
            )}

            <Pressable
              style={[styles.startButton, !hasEnough && styles.startButtonDisabled]}
              onPress={handleStartQuiz}
              disabled={!hasEnough}>
              <Text style={styles.startButtonText}>Quiz Başlat</Text>
            </Pressable>
          </View>
        )}

        {quizState === 'playing' && currentQuiz && (
          <View style={styles.quizContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentQuestionIndex + 1) / selectedQuizzes.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.questionCounter}>
              Soru {currentQuestionIndex + 1} / {selectedQuizzes.length}
            </Text>

            <View style={styles.pageCard}>
              {currentQuiz.blocks ? (
                <>
                  {currentQuiz.blocks.map((block, index) => renderTeachingBlock(block, index))}
                  {currentQuiz.hint && (
                    <View style={styles.hintCard}>
                      {currentQuiz.hint.includes('\\') ? (
                        <MathText latex={currentQuiz.hint} widthFactor={0.7} fontSize={18} textAlign="left" />
                      ) : (
                        <Text style={styles.hintText}>{currentQuiz.hint}</Text>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <>
                  {renderDiagram(getPageDiagram(currentQuiz))}
                  {currentQuiz.graph && (
                    <View style={styles.diagramCard}>
                      <FunctionGraph config={currentQuiz.graph} />
                    </View>
                  )}
                  {currentQuiz.formula && (
                    <View style={styles.formulaCard}>
                      <MathText
                        latex={currentQuiz.formula}
                        widthFactor={0.75}
                        fontSize={20}
                        textAlign="center"
                      />
                    </View>
                  )}
                  {currentQuiz.question && (
                    <Text style={styles.bodyText}>{currentQuiz.question}</Text>
                  )}
                  {currentQuiz.hint && (
                    <View style={styles.hintCard}>
                      {currentQuiz.hint.includes('\\') ? (
                        <MathText latex={currentQuiz.hint} widthFactor={0.7} fontSize={18} textAlign="left" />
                      ) : (
                        <Text style={styles.hintText}>{currentQuiz.hint}</Text>
                      )}
                    </View>
                  )}
                </>
              )}

              <View style={styles.quizChoices}>
                {currentQuiz.choices.map((choice) => {
                  const {
                    isSelected,
                    isCorrectSelection,
                    isIncorrectSelection,
                  } = getChoiceVisualState(
                    choice.id,
                    currentQuiz,
                    selectedChoice,
                    isChoiceCorrect,
                  );
                  return (
                    <Pressable
                      key={choice.id}
                      style={({ pressed }) => [
                        styles.choiceButton,
                        isSelected && styles.choiceButtonSelected,
                        isCorrectSelection && styles.choiceButtonCorrect,
                        isIncorrectSelection && styles.choiceButtonIncorrect,
                        pressed && !isSelected && styles.choiceButtonPressed,
                      ]}
                      onPress={() => {
                        void handleChoiceSelect(choice.id, currentQuiz);
                      }}
                      disabled={selectedChoice !== null}>
                      {'graph' in choice ? (
                        <View style={styles.choiceGraphContainer}>
                          <Text
                            style={[
                              styles.choiceLabel,
                              isCorrectSelection && styles.choiceTextCorrect,
                              isIncorrectSelection && styles.choiceTextIncorrect,
                            ]}>
                            {choice.label}
                          </Text>
                          <View style={styles.choiceGraph}>
                            <FunctionGraph config={choice.graph} />
                          </View>
                        </View>
                      ) : ('isMath' in choice && choice.isMath) || choice.label.includes('\\') ? (
                        <MathText latex={choice.label} widthFactor={0.85} fontSize={24} />
                      ) : (
                        <Text
                          style={[
                            styles.choiceText,
                            isCorrectSelection && styles.choiceTextCorrect,
                            isIncorrectSelection && styles.choiceTextIncorrect,
                          ]}>
                          {choice.label}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {quizState === 'gameOver' && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverTitle}>❌ Oyun Bitti</Text>
            <Text style={styles.gameOverText}>
              Yanlış cevap verdin. Quiz sona erdi.
            </Text>
            <Text style={styles.gameOverXp}>
              Bu quiz'te kazandığın XP: {sessionXp}
            </Text>
            <Pressable style={styles.returnButton} onPress={handleGameOverReturn}>
              <Text style={styles.returnButtonText}>Quiz Sayfasına Dön</Text>
            </Pressable>
          </View>
        )}

        {quizState === 'completed' && (
          <View style={styles.completedContainer}>
            <Text style={styles.completedTitle}>🎉 Tebrikler</Text>
            <Text style={styles.completedText}>
              Tüm soruları doğru cevapladın!
            </Text>
            <Text style={styles.completedXp}>
              Toplam Kazanç: {sessionXp} XP
            </Text>
            <Pressable style={styles.returnButton} onPress={handleCompletedReturn}>
              <Text style={styles.returnButtonText}>Quiz Sayfasına Dön</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  idleContainer: {
    alignItems: 'center',
    gap: 24,
  },
  title: {
    fontSize: 32,
    color: '#0f172a',
    fontFamily: 'Montserrat_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'Montserrat_400Regular',
  },
  quizImage: {
    width: '100%',
    height: 280,
    marginVertical: 16,
  },
  warningBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    fontSize: 16,
    color: '#991b1b',
    textAlign: 'center',
    fontFamily: 'Montserrat_700Bold',
  },
  warningSubtext: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    fontFamily: 'Montserrat_400Regular',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderColor: '#93c5fd',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#1e40af',
    textAlign: 'center',
    fontFamily: 'Montserrat_700Bold',
  },
  infoSubtext: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
    fontFamily: 'Montserrat_400Regular',
  },
  startButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  startButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
  },
  quizContainer: {
    gap: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  questionCounter: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'Montserrat_600SemiBold',
  },
  pageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    fontFamily: 'Montserrat_400Regular',
  },
  formulaCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  diagramCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
  },
  hintCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  hintText: {
    fontSize: 14,
    color: '#92400e',
    fontFamily: 'Montserrat_400Regular',
  },
  quizChoices: {
    gap: 12,
    marginTop: 8,
  },
  choiceButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  choiceButtonSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  choiceButtonCorrect: {
    borderColor: '#16a34a',
    backgroundColor: '#dcfce7',
  },
  choiceButtonIncorrect: {
    borderColor: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  choiceButtonPressed: {
    backgroundColor: '#f3f4f6',
  },
  choiceText: {
    fontSize: 18,
    color: '#1f2937',
    fontFamily: 'Montserrat_600SemiBold',
  },
  choiceTextCorrect: {
    color: '#16a34a',
  },
  choiceTextIncorrect: {
    color: '#dc2626',
  },
  choiceLabel: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
    fontFamily: 'Montserrat_600SemiBold',
  },
  choiceGraphContainer: {
    width: '100%',
    alignItems: 'center',
  },
  choiceGraph: {
    width: '100%',
    height: 150,
  },
  gameOverContainer: {
    alignItems: 'center',
    gap: 24,
    paddingVertical: 40,
  },
  gameOverTitle: {
    fontSize: 32,
    color: '#dc2626',
    fontFamily: 'Montserrat_700Bold',
  },
  gameOverText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'Montserrat_400Regular',
  },
  gameOverXp: {
    fontSize: 16,
    color: '#2563eb',
    fontFamily: 'Montserrat_600SemiBold',
  },
  completedContainer: {
    alignItems: 'center',
    gap: 24,
    paddingVertical: 40,
  },
  completedTitle: {
    fontSize: 32,
    color: '#16a34a',
    fontFamily: 'Montserrat_700Bold',
  },
  completedText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'Montserrat_400Regular',
  },
  completedXp: {
    fontSize: 20,
    color: '#2563eb',
    fontFamily: 'Montserrat_700Bold',
  },
  returnButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  returnButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
  },
});
