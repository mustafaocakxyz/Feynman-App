import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import Svg, { Line, Polygon, Rect, Ellipse, Text as SvgText, Defs, Marker, Polyline } from 'react-native-svg';

import { subtopicTitleBySlug } from './subtopics.data';
import { markSubtopicCompleted } from '@/lib/completion-storage';
import { recordStreakActivity, getStreakState } from '@/lib/streak-storage';
import { addXp } from '@/lib/xp-storage';
import { getUnlockedAvatars } from '@/lib/avatar-unlocks';
import { getAvatarSource, type AvatarId } from '@/lib/profile-storage';
import { useXpFeedback } from '@/components/xp-feedback-provider';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { MathText } from '@/components/MathText';
import { useAuth } from '@/contexts/auth-context';
import { FunctionGraph, GraphConfig } from '@/components/FunctionGraph';
import { ProgressDots } from '@/components/ProgressDots';

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

type TeachingPage = {
  type: 'teaching';
  id: string;
  blocks: TeachingBlock[];
};
type QuizChoice = { id: string; label: string };
type MathQuizChoice = { id: string; label: string; isMath: true };
type GraphQuizChoice = { id: string; label: string; graph: GraphConfig };
type QuizPage = {
  type: 'quiz';
  id: string;
  choices: Array<QuizChoice | MathQuizChoice | GraphQuizChoice>;
  correctChoiceId: string;
  blocks?: TeachingBlock[];
  question?: string;
  diagram?: DiagramKind;
  graph?: GraphConfig;
  hint?: string;
  formula?: string;
};
type PlaceholderPage = { type: 'placeholder'; id: string; message?: string };
type CompletionPage = { type: 'completion'; id: string; message?: string };

type LessonPage = TeachingPage | QuizPage | PlaceholderPage | CompletionPage;

type LessonDefinition = {
  title: string;
  pages: LessonPage[];
};

const lessons: Record<string, LessonDefinition> = {
  'pozitif-negatif-sayilar': {
    title: 'Pozitif Negatif Sayılar',
    pages: [
      {
        type: 'teaching',
        id: 'pozitif-negatif-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Matematikte sayıların "işareti" vardır. Sıfırdan büyükler pozitif (+), küçükler ise negatiftir (-).',
          },
          {
            kind: 'text',
            content: 'Çarpma işleminde kural çok basittir:',
          },
          {
            kind: 'text',
            content: 'Aynı işaretler anlaşır (+), zıt işaretler çatışır (-).',
          },
          {
            kind: 'formula',
            content: '(+) \\cdot (+) = (+)',
          },
          {
            kind: 'formula',
            content: '(-) \\cdot (-) = (+)',
          },
          {
            kind: 'formula',
            content: '(+) \\cdot (-) = (-)',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'pozitif-negatif-ornek',
        blocks: [
          {
            kind: 'text',
            content: 'Bir örnek yapalım. İki negatif sayıyı çarparsan sonuç pozitif olur.',
          },
          {
            kind: 'formula',
            content: '(-2) \\cdot (-3) = +6',
          },
          {
            kind: 'text',
            content: 'Ama biri negatif biri pozitifse sonuç negatiftir.',
          },
          {
            kind: 'formula',
            content: '(-2) \\cdot (+3) = -6',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'pozitif-negatif-quiz-1',
        blocks: [
          {
            kind: 'text',
            content: 'Aşağıdaki çarpma işleminin sonucu nedir?',
          },
          {
            kind: 'formula',
            content: '(-4) \\cdot (-5) = ?',
          },
        ],
        hint: 'Aynı işaretler çarpılınca sonuç pozitif olur!',
        choices: [
          { id: 'twenty', label: '20' },
          { id: 'negative-twenty', label: '-20' },
        ],
        correctChoiceId: 'twenty',
      },
      {
        type: 'completion',
        id: 'pozitif-negatif-complete',
      },
    ],
  },
  'denklem-kurma': {
    title: 'Denklem Kurma',
    pages: [
      {
        type: 'teaching',
        id: 'denklem-kurma-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Matematikte bilmediğimiz sayılara "x" deriz.',
          },
          {
            kind: 'text',
            content: 'Eğer soru "Bir sayının 3 fazlası" derse, bunu şöyle yazarız:',
          },
          {
            kind: 'formula',
            content: 'x + 3',
          },
          {
            kind: 'text',
            content: '"Bir sayının 2 katı" derse ise şöyle yazarız:',
          },
          {
            kind: 'formula',
            content: '2x',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'denklem-kurma-uyari-1',
        blocks: [
          {
            kind: 'text',
            content: 'UYARI: Söyleniş sırası çok önemlidir!',
          },
          {
            kind: 'text',
            content: '"Bir sayının 2 katının 1 eksiği"',
          },
          {
            kind: 'formula',
            content: '2x - 1',
          },
          {
            kind: 'text',
            content: 'Önce 2 ile çarptık, sonra 1 çıkardık.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'denklem-kurma-uyari-2',
        blocks: [
          {
            kind: 'text',
            content: 'UYARI: Söyleniş sırası çok önemlidir!',
          },
          {
            kind: 'text',
            content: '"Bir sayının 1 eksiğinin 2 katı:"',
          },
          {
            kind: 'formula',
            content: '(x - 1) \\cdot 2',
          },
          {
            kind: 'text',
            content: 'Önce 1 çıkardık, sonra parantezin tamamını 2 ile çarptık.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'denklem-kurma-quiz-1',
        blocks: [
          {
            kind: 'text',
            content: '"Bir sayının 4 eksiğinin 3 katı" cümlesinin matematikçesi nedir?',
          },
        ],
        hint: 'Sıraya ve paranteze dikkat et!',
        choices: [
          { id: 'three-x-minus-four', label: '3(x-4)' },
          { id: 'three-x-minus-four-wrong', label: '3x-4' },
        ],
        correctChoiceId: 'three-x-minus-four',
      },
      {
        type: 'completion',
        id: 'denklem-kurma-complete',
      },
    ],
  },
  'faktoriyel': {
    title: 'Faktöriyel',
    pages: [
      {
        type: 'teaching',
        id: 'faktoriyel-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Bir sayının yanına ünlem (!) gelirse bu, o sayıdan 1\'e kadar olan sayıları çarp demektir.',
          },
          {
            kind: 'formula',
            content: '4! = 4 \\cdot 3 \\cdot 2 \\cdot 1',
          },
          {
            kind: 'text',
            content: 'Bunun cevabı 24\'tür.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'faktoriyel-kurallar',
        blocks: [
          {
            kind: 'text',
            content: 'Faktöriyellerde iki önemli kural vardır:',
          },
          {
            kind: 'text',
            content: '0 ve 1\'in faktöriyelleri 1\'e eşittir.',
          },
          {
            kind: 'formula',
            content: '0! = 1',
          },
          {
            kind: 'formula',
            content: '1! = 1',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'faktoriyel-quiz-1',
        blocks: [
          {
            kind: 'text',
            content: '3! işleminin sonucu kaçtır?',
          },
          {
            kind: 'formula',
            content: '3! = 3 \\cdot 2 \\cdot 1',
          },
        ],
        choices: [
          { id: 'six', label: '6' },
          { id: 'three', label: '3' },
        ],
        correctChoiceId: 'six',
      },
      {
        type: 'completion',
        id: 'faktoriyel-complete',
      },
    ],
  },
};

const defaultPlaceholderMessage =
  'Bu sayfa yakında. İçerik için hazırlık devam ediyor.';

const defaultCompletionMessage = 'Desen Tamamlandı!';

function getPageDiagram(page?: LessonPage): DiagramKind | undefined {
  if (!page) return undefined;
  if (page.type === 'quiz') return page.diagram;
  return undefined;
}

function getPlaceholderMessage(page: PlaceholderPage) {
  return page.message ?? defaultPlaceholderMessage;
}

function getCompletionMessage(page: CompletionPage) {
  return page.message ?? defaultCompletionMessage;
}

function renderDiagramByKind(kind?: DiagramKind) {
  // TYT doesn't use diagrams yet, but keeping the function for future use
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

function normalizeChoiceLabel(choiceId: string, label: string) {
  return label;
}

function getChoiceVisualState(
  choiceId: string,
  page: QuizPage,
  selectedChoice: string | null,
  isChoiceCorrect: boolean | null,
) {
  const isSelected = selectedChoice === choiceId;
  const isCorrectSelection = isSelected && isChoiceCorrect === true;
  const isIncorrectSelection = isSelected && isChoiceCorrect === false;

  return { isSelected, isCorrectSelection, isIncorrectSelection };
}

export default function TYTSubtopicScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { subtopic } = useLocalSearchParams<{ subtopic?: string }>();
  const segments = useSegments();
  const parentPath = segments.slice(0, Math.max(segments.length - 1, 0)).join('/');
  const completionTarget = parentPath ? `/${parentPath}` : '/';
  const { showXp } = useXpFeedback();
  const { playPositive, playNegative, playCorrect, playCompletion } = useSoundEffects();

  const lesson = useMemo(() => {
    if (!subtopic) return null;
    return lessons[subtopic];
  }, [subtopic]);

  const [pageIndex, setPageIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isChoiceCorrect, setIsChoiceCorrect] = useState<boolean | null>(null);
  const [completionAwarded, setCompletionAwarded] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [completionPageIndex, setCompletionPageIndex] = useState(0);
  const [initialUnlockedAvatars, setInitialUnlockedAvatars] = useState<AvatarId[]>([]);
  const [completionData, setCompletionData] = useState<{
    totalXp: number;
    questionXp: number;
    completionXp: number;
    streakBefore: number;
    streakAfter: number;
    streakIncreased: boolean;
    hasRewards: boolean;
    newlyUnlockedAvatars: Array<{ id: AvatarId; condition: string }>;
  } | null>(null);
  const congratulationsAnim = useRef(new Animated.Value(0)).current;
  const medalAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;

  const effectiveTitle =
    lesson?.title ?? subtopicTitleBySlug[subtopic ?? ''] ?? 'Alt Konu';
  const currentPage = lesson
    ? lesson.pages[Math.min(pageIndex, lesson.pages.length - 1)]
    : null;

  useEffect(() => {
    setSelectedChoice(null);
    setIsChoiceCorrect(null);
    setCompletionAwarded(false);
    if (pageIndex === 0) {
      setSessionXp(0);
      setCompletionData(null);
      setCompletionPageIndex(0);
      if (user?.id) {
        getUnlockedAvatars(user.id).then((unlocked) => {
          setInitialUnlockedAvatars(unlocked);
        });
      }
    }
  }, [pageIndex, currentPage?.id, subtopic, user?.id]);

  useEffect(() => {
    if (currentPage?.type === 'completion' && completionData) {
      congratulationsAnim.setValue(0);
      medalAnim.setValue(0);
      xpAnim.setValue(0);
      streakAnim.setValue(0);

      Animated.timing(congratulationsAnim, {
        toValue: 1,
        duration: 350,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      Animated.timing(medalAnim, {
        toValue: 1,
        duration: 350,
        delay: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      Animated.timing(xpAnim, {
        toValue: 1,
        duration: 350,
        delay: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      if (completionData.streakIncreased) {
        Animated.timing(streakAnim, {
          toValue: 1,
          duration: 350,
          delay: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    } else {
      congratulationsAnim.setValue(0);
      medalAnim.setValue(0);
      xpAnim.setValue(0);
      streakAnim.setValue(0);
    }
  }, [congratulationsAnim, medalAnim, xpAnim, streakAnim, completionData, completionPageIndex, currentPage?.id, currentPage?.type]);

  const createSlideStyle = (animValue: Animated.Value) => ({
    opacity: animValue,
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  });

  const handleAdvance = () => {
    if (!lesson) return;
    const nextIndex = pageIndex + 1;
    if (nextIndex >= lesson.pages.length) {
      router.replace(completionTarget as never);
      return;
    }
    setPageIndex(nextIndex);
  };

  const handleChoiceSelect = async (choiceId: string, page: QuizPage) => {
    if (!user?.id) return;
    const wasCorrect = isChoiceCorrect === true;
    setSelectedChoice(choiceId);
    const isCorrectNow = choiceId === page.correctChoiceId;
    setIsChoiceCorrect(isCorrectNow);
    if (isCorrectNow && !wasCorrect) {
      await addXp(user.id, 10);
      setSessionXp(prev => prev + 10);
      const isQuizPage = page.type === 'quiz';
      showXp(10, {
        showAdvance: isQuizPage,
        onAdvance: isQuizPage ? handleAdvance : undefined,
      });
      await playCorrect();
    } else if (!isCorrectNow) {
      await playNegative();
    }
  };

  const handleCompletionPress = async () => {
    router.replace(completionTarget as never);
  };

  const handleAdvanceToRewards = () => {
    if (completionData?.hasRewards) {
      setCompletionPageIndex(1);
    } else {
      handleCompletionPress();
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const maybeAwardCompletionXp = async () => {
      if (
        completionAwarded ||
        !lesson ||
        currentPage?.type !== 'completion'
      ) {
        return;
      }

      const streakBefore = await getStreakState(user.id);
      
      let xpAmount = 0;
      if (typeof subtopic === 'string') {
        const isNew = await markSubtopicCompleted(user.id, subtopic);
        xpAmount = isNew ? 20 : 5;
      }
      
      const streakAfter = await recordStreakActivity(user.id);
      
      if (xpAmount > 0) {
        await addXp(user.id, xpAmount);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const finalUnlockedAvatars = await getUnlockedAvatars(user.id);
      
      const newlyUnlockedIds = finalUnlockedAvatars.filter(
        id => !initialUnlockedAvatars.includes(id)
      );
      
      const newlyUnlockedAvatars = newlyUnlockedIds.map((id) => {
        let condition = '';
        if (id === '4') {
          condition = '1000XP topla';
        } else if (id === '5') {
          condition = '3 günlük seri yakala';
        }
        return { id, condition };
      });
      
      const questionXp = sessionXp;
      const completionXp = xpAmount;
      const totalXp = questionXp + completionXp;
      const streakIncreased = streakAfter.count > streakBefore.count;
      
      const hasRewards = newlyUnlockedAvatars.length > 0;
      
      if (!cancelled) {
        setCompletionData({
          totalXp,
          questionXp,
          completionXp,
          streakBefore: streakBefore.count,
          streakAfter: streakAfter.count,
          streakIncreased,
          hasRewards,
          newlyUnlockedAvatars,
        });
        setCompletionAwarded(true);
        await playCompletion();
      }
    };

    maybeAwardCompletionXp();

    return () => {
      cancelled = true;
    };
  }, [completionAwarded, currentPage?.id, currentPage?.type, lesson, playCompletion, sessionXp, subtopic, user?.id]);

  const isLastPage = lesson ? pageIndex >= lesson.pages.length - 1 : true;
  const showAdvanceButton =
    lesson &&
    currentPage?.type !== 'completion' &&
    currentPage?.type !== 'quiz' &&
    !isLastPage;

  const isCompletionPage = currentPage?.type === 'completion';
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 32) }]}>
        {!isCompletionPage && (
          <View style={styles.topRow}>
            <Pressable
              style={styles.navButton}
              onPress={() => router.back()}>
              <Text style={styles.navButtonText}>{'‹'} Geri</Text>
            </Pressable>
            <Pressable
              style={styles.navButton}
              onPress={() => router.push('/')}>
              <Text style={styles.navButtonText}>⌂ Ana Sayfa</Text>
            </Pressable>
          </View>
        )}

        {!isCompletionPage && (
          <>
            <Text style={styles.headline}>{effectiveTitle}</Text>
            {lesson && lesson.pages.length > 0 && (
              <ProgressDots totalPages={lesson.pages.length} currentPageIndex={pageIndex} />
            )}
          </>
        )}

        {lesson && currentPage?.type === 'teaching' && (
          <View style={styles.pageCard}>
            {currentPage.blocks.map((block, index) =>
              renderTeachingBlock(block, index),
            )}
          </View>
        )}

        {lesson && currentPage?.type === 'quiz' && (
          <View style={styles.pageCard}>
            {currentPage.blocks ? (
              <>
                {currentPage.blocks.map((block, index) =>
                  renderTeachingBlock(block, index),
                )}
                {currentPage.hint && (
                  <View style={styles.hintCard}>
                    {currentPage.hint.includes('\\') ? (
                      <MathText latex={currentPage.hint} widthFactor={0.7} fontSize={18} textAlign="left" />
                    ) : (
                      <Text style={styles.hintText}>{currentPage.hint}</Text>
                    )}
                  </View>
                )}
              </>
            ) : (
              <>
                {renderDiagram(getPageDiagram(currentPage))}
                {currentPage.graph && (
                  <View style={styles.diagramCard}>
                    <FunctionGraph config={currentPage.graph} />
                  </View>
                )}
                {currentPage.formula && (
                  <View style={styles.formulaCard}>
                    <MathText
                      latex={currentPage.formula}
                      widthFactor={0.75}
                      fontSize={20}
                      textAlign="center"
                    />
                  </View>
                )}
                {currentPage.question && (
                  <Text style={styles.bodyText}>{currentPage.question}</Text>
                )}
                {currentPage.hint && (
                  <View style={styles.hintCard}>
                    {currentPage.hint.includes('\\') ? (
                      <MathText latex={currentPage.hint} widthFactor={0.7} fontSize={18} textAlign="left" />
                    ) : (
                      <Text style={styles.hintText}>{currentPage.hint}</Text>
                    )}
                  </View>
                )}
              </>
            )}
            <View style={styles.quizChoices}>
              {currentPage.choices.map((choice) => {
                const {
                  isSelected,
                  isCorrectSelection,
                  isIncorrectSelection,
                } = getChoiceVisualState(
                  choice.id,
                  currentPage,
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
                      void handleChoiceSelect(choice.id, currentPage);
                    }}>
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
                        {normalizeChoiceLabel(choice.id, choice.label)}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
            {isChoiceCorrect === false && (
              <Pressable
                style={[styles.secondaryButton]}
                onPress={() => {
                  setSelectedChoice(null);
                  setIsChoiceCorrect(null);
                }}>
                <Text style={styles.secondaryButtonText}>Tekrar dene</Text>
              </Pressable>
            )}
          </View>
        )}

        {lesson && currentPage?.type === 'placeholder' && (
          <View style={styles.pageCard}>
            <Text style={styles.bodyTextMuted}>
              {getPlaceholderMessage(currentPage)}
            </Text>
          </View>
        )}

        {lesson && currentPage?.type === 'completion' && completionData && (
          <>
            {completionPageIndex === 0 && (
              <View style={styles.pageCard}>
                <Animated.View style={[styles.rewardSection, styles.congratulationsBox, createSlideStyle(congratulationsAnim)]}>
                  <Text style={styles.completionTitle}>
                    🎉 TEBRİKLER
                  </Text>
                  <Text style={styles.completionSubtitle}>
                    Desen Tamamlandı!
                  </Text>
                </Animated.View>

                <Animated.View style={[styles.medalContainer, createSlideStyle(medalAnim)]}>
                  <Image
                    source={require('@/assets/images/7.png')}
                    style={styles.medalImage}
                    resizeMode="contain"
                  />
                </Animated.View>

                <Animated.View style={[styles.rewardSection, createSlideStyle(xpAnim)]}>
                  <Text style={styles.rewardSectionTitle}>BU MODÜLDE TOPLAM</Text>
                  <Text style={styles.rewardMainValue}>
                    ⭐ {completionData.totalXp} XP Kazandın!
                  </Text>
                </Animated.View>

                {completionData.streakIncreased && (
                  <Animated.View style={[styles.rewardSection, createSlideStyle(streakAnim)]}>
                    <Text style={styles.rewardSectionTitle}>🔥 SERİ</Text>
                    <Text style={styles.rewardMainValue}>
                      Seriniz: {completionData.streakAfter} gün
                    </Text>
                  </Animated.View>
                )}

                <Pressable
                  style={styles.primaryButton}
                  onPress={completionData.hasRewards ? handleAdvanceToRewards : handleCompletionPress}>
                  <Text style={styles.primaryButtonText}>
                    {completionData.hasRewards ? 'İlerle' : 'Bitir'}
                  </Text>
                </Pressable>
              </View>
            )}

            {completionPageIndex === 1 && completionData.hasRewards && (
              <View style={styles.pageCard}>
                <Text style={styles.completionTitle}>🎁 YENİ KAZANÇLAR</Text>
                
                {completionData.newlyUnlockedAvatars.map((avatar) => {
                  const avatarSource = getAvatarSource(avatar.id);
                  return (
                    <View key={avatar.id} style={styles.rewardSection}>
                      {avatarSource && (
                        <Image
                          source={avatarSource}
                          style={styles.unlockedAvatarImage}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={styles.rewardMainValue}>
                        🎉 Yeni avatar açıldı!
                      </Text>
                      <Text style={styles.rewardBreakdown}>
                        {avatar.condition}
                      </Text>
                    </View>
                  );
                })}

                <Pressable
                  style={styles.primaryButton}
                  onPress={handleCompletionPress}>
                  <Text style={styles.primaryButtonText}>Bitir</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {showAdvanceButton && (
          <Pressable style={styles.primaryButton} onPress={handleAdvance}>
            <Text style={styles.primaryButtonText}>İlerle</Text>
          </Pressable>
        )}

        {!lesson && (
          <View style={styles.pageCard}>
            <Text style={styles.bodyTextMuted}>
              Bu alt konu için henüz içerik tanımlanmadı.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createShadowStyle = (
  shadowColor: string,
  shadowOpacity: number,
  shadowRadius: number,
  shadowOffset: { width: number; height: number },
  elevation?: number,
) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px ${shadowColor}${Math.round(shadowOpacity * 255).toString(16).padStart(2, '0')}`,
    };
  }
  return {
    shadowColor,
    shadowOpacity,
    shadowRadius,
    shadowOffset,
    elevation: elevation || shadowRadius,
  };
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 24,
    backgroundColor: '#ffffff',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    ...createShadowStyle('#0f172a', 0.12, 8, { width: 0, height: 4 }, 5),
  },
  navButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Montserrat_700Bold',
  },
  headline: {
    fontSize: 32,
    color: '#0f172a',
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  pageCard: {
    borderRadius: 24,
    backgroundColor: '#f9fafb',
    padding: 24,
    gap: 24,
    ...createShadowStyle('#0f172a', 0.12, 12, { width: 0, height: 6 }, 8),
  },
  diagramCard: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    overflow: 'hidden',
  },
  formulaCard: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    borderWidth: 2,
    borderColor: '#ddd6fe',
  },
  formulaText: {
    fontSize: 18,
    color: '#4c1d95',
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    fontFamily: 'Montserrat_700Bold',
  },
  hintText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#2563eb',
    fontFamily: 'Montserrat_700Bold',
  },
  hintCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignSelf: 'stretch',
  },
  quizChoices: {
    gap: 12,
  },
  choiceButton: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  choiceButtonPressed: {
    backgroundColor: '#eff6ff',
  },
  choiceButtonSelected: {
    borderColor: '#2563eb',
  },
  choiceButtonCorrect: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  choiceButtonIncorrect: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  choiceText: {
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  choiceTextCorrect: {
    color: '#166534',
  },
  choiceTextIncorrect: {
    color: '#991b1b',
  },
  choiceGraphContainer: {
    alignItems: 'center',
    gap: 8,
  },
  choiceLabel: {
    fontSize: 14,
    color: '#1f2937',
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  choiceGraph: {
    width: '100%',
    height: 200,
    minHeight: 200,
  },
  bodyTextMuted: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6b7280',
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 8,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: '#2563eb',
    ...createShadowStyle('#1d4ed8', 0.22, 10, { width: 0, height: 6 }, 8),
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Montserrat_700Bold',
  },
  secondaryButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#b91c1c',
    fontFamily: 'Montserrat_700Bold',
  },
  completionTitle: {
    fontSize: 28,
    textAlign: 'center',
    color: '#111827',
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 20,
    textAlign: 'center',
    color: '#6b7280',
    fontFamily: 'Montserrat_700Bold',
  },
  rewardSection: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    ...createShadowStyle('#0f172a', 0.1, 8, { width: 0, height: 4 }, 4),
  },
  congratulationsBox: {
    marginTop: -8,
  },
  rewardSectionTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Montserrat_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  rewardMainValue: {
    fontSize: 24,
    color: '#111827',
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  rewardBreakdown: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  rewardItem: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 8,
  },
  unlockedAvatarImage: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  medalContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  medalImage: {
    width: 200,
    height: 200,
  },
});
