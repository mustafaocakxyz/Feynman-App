import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import Svg, { Line, Polygon, Text as SvgText } from 'react-native-svg';

import { subtopicTitleBySlug } from './subtopics';
import { markSubtopicCompleted } from '@/lib/completion-storage';

type DiagramKind = 'unit-triangle' | 'three-four-five';

type TeachingPage = {
  type: 'teaching';
  id: string;
  body?: string;
  diagram?: DiagramKind;
  formula?: string;
};
type QuizChoice = { id: string; label: string };
type QuizPage = {
  type: 'quiz';
  id: string;
  question: string;
  choices: QuizChoice[];
  correctChoiceId: string;
  diagram?: DiagramKind;
  hint?: string;
};
type PlaceholderPage = { type: 'placeholder'; id: string; message?: string };
type CompletionPage = { type: 'completion'; id: string; message?: string };

type LessonPage = TeachingPage | QuizPage | PlaceholderPage | CompletionPage;

type LessonDefinition = {
  title: string;
  pages: LessonPage[];
};

const lessons: Record<string, LessonDefinition> = {
  'birim-ucgen': {
    title: 'Birim Üçgen',
    pages: [
      {
        type: 'teaching',
        id: 'intro-triangle',
        diagram: 'unit-triangle',
        body:
          'Birim üçgende hipotenüs 1 birimdir. Komşu kenar cos a, karşı kenar ise sin a olarak adlandırılır.',
      },
      {
        type: 'quiz',
        id: 'triangle-quiz-1',
        question: 'Açının karşısındaki kenar nedir?',
        choices: [
          { id: 'sina', label: 'sin a' },
          { id: 'cosa', label: 'cos a' },
          { id: 'one', label: '1' },
        ],
        correctChoiceId: 'sina',
        diagram: 'unit-triangle',
        hint: 'İpucu: sin a = karşı kenar / hipotenüs',
      },
      {
        type: 'completion',
        id: 'birim-ucgen-complete',
      },
    ],
  },
  'sin-cos-ve-tan': {
    title: 'Sin, Cos ve Tan',
    pages: [
      {
        type: 'teaching',
        id: 'intro-sin-definition',
        formula: 'sin a = karşı kenar / hipotenüs',
      },
      {
        type: 'quiz',
        id: 'sin-definition-quiz',
        question: 'sin a kaça eşittir?',
        hint: 'İpucu: sin a = karşı kenar / hipotenüs',
        diagram: 'three-four-five',
        choices: [
          { id: 'three-five', label: '3 / 5' },
          { id: 'four-five', label: '4 / 5' },
          { id: 'one', label: '1' },
        ],
        correctChoiceId: 'three-five',
      },
      {
        type: 'teaching',
        id: 'cos-definition',
        formula: 'cos a = komşu kenar / hipotenüs',
      },
      {
        type: 'quiz',
        id: 'cos-definition-quiz',
        question: 'cos a kaça eşittir?',
        hint: 'İpucu: cos a = komşu kenar / hipotenüs',
        diagram: 'three-four-five',
        choices: [
          { id: 'three-five', label: '3 / 5' },
          { id: 'four-five', label: '4 / 5' },
          { id: 'one', label: '1' },
        ],
        correctChoiceId: 'four-five',
      },
      {
        type: 'teaching',
        id: 'tan-definition',
        formula: 'tan a = karşı kenar / komşu kenar',
      },
      {
        type: 'quiz',
        id: 'tan-definition-quiz',
        question: 'tan a kaça eşittir?',
        hint: 'İpucu: tan a = karşı kenar / komşu kenar',
        diagram: 'three-four-five',
        choices: [
          { id: 'three-four', label: '3 / 4' },
          { id: 'four-three', label: '4 / 3' },
          { id: 'one', label: '1' },
        ],
        correctChoiceId: 'three-four',
      },
      {
        type: 'completion',
        id: 'sin-cos-ve-tan-complete',
      },
    ],
  },
  'logaritma-dummy': {
    title: 'Dummy Subtopic',
    pages: [
      {
        type: 'teaching',
        id: 'dummy-logaritma',
        body: 'Bu sayfa yer tutucu bir sayfadır.',
      },
      {
        type: 'completion',
        id: 'logaritma-dummy-complete',
      },
    ],
  },
  'limit-dummy': {
    title: 'Dummy Subtopic',
    pages: [
      {
        type: 'teaching',
        id: 'dummy-limit',
        body: 'Bu sayfa yer tutucu bir sayfadır.',
      },
      {
        type: 'completion',
        id: 'limit-dummy-complete',
      },
    ],
  },
  'turev-dummy': {
    title: 'Dummy Subtopic',
    pages: [
      {
        type: 'teaching',
        id: 'dummy-turev',
        body: 'Bu sayfa yer tutucu bir sayfadır.',
      },
      {
        type: 'completion',
        id: 'turev-dummy-complete',
      },
    ],
  },
  'integral-dummy': {
    title: 'Dummy Subtopic',
    pages: [
      {
        type: 'teaching',
        id: 'dummy-integral',
        body: 'Bu sayfa yer tutucu bir sayfadır.',
      },
      {
        type: 'completion',
        id: 'integral-dummy-complete',
      },
    ],
  },
};

const defaultPlaceholderMessage =
  'Bu sayfa yakında. İçerik için hazırlık devam ediyor.';

const defaultCompletionMessage = 'Desen Tamamlandı!';

function getPageDiagram(page?: LessonPage): DiagramKind | undefined {
  if (!page) return undefined;
  if (page.type === 'teaching') return page.diagram;
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
          fontWeight="bold"
          >
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

  return null;
}

function renderDiagram(kind?: DiagramKind) {
  if (!kind) return null;
  return <View style={styles.diagramCard}>{renderDiagramByKind(kind)}</View>;
}

function normalizeChoiceLabel(choiceId: string, label: string) {
  if (choiceId === 'three-five') return '3 / 5';
  if (choiceId === 'four-five') return '4 / 5';
  if (choiceId === 'three-four') return '3 / 4';
  if (choiceId === 'four-three') return '4 / 3';
  if (choiceId === 'one') return '1';
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

export default function AYTSubtopicScreen() {
  const router = useRouter();
  const { subtopic } = useLocalSearchParams<{ subtopic?: string }>();
  const segments = useSegments();
  const parentPath = segments.slice(0, Math.max(segments.length - 1, 0)).join('/');
  const completionTarget = parentPath ? `/${parentPath}` : '/';

  const lesson = useMemo(() => {
    if (!subtopic) return null;
    return lessons[subtopic];
  }, [subtopic]);

  const [pageIndex, setPageIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isChoiceCorrect, setIsChoiceCorrect] = useState<boolean | null>(null);

  const effectiveTitle =
    lesson?.title ?? subtopicTitleBySlug[subtopic ?? ''] ?? 'Alt Konu';
  const currentPage = lesson
    ? lesson.pages[Math.min(pageIndex, lesson.pages.length - 1)]
    : null;

  useEffect(() => {
    setSelectedChoice(null);
    setIsChoiceCorrect(null);
  }, [pageIndex, currentPage?.id]);

  const handleAdvance = () => {
    if (!lesson) return;
    const nextIndex = pageIndex + 1;
    if (nextIndex >= lesson.pages.length) {
      router.replace(completionTarget as never);
      return;
    }
    setPageIndex(nextIndex);
  };

  const handleChoiceSelect = (choiceId: string, page: QuizPage) => {
    setSelectedChoice(choiceId);
    setIsChoiceCorrect(choiceId === page.correctChoiceId);
  };

  const handleCompletionPress = async () => {
    if (typeof subtopic === 'string') {
      await markSubtopicCompleted(subtopic);
    }
    router.replace(completionTarget as never);
  };

  const isLastPage = lesson ? pageIndex >= lesson.pages.length - 1 : true;
  const showAdvanceButton =
    lesson &&
    ((currentPage?.type !== 'quiz' && !isLastPage) ||
      (currentPage?.type === 'quiz' && isChoiceCorrect === true));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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

        <Text style={styles.headline}>{effectiveTitle}</Text>

        {lesson && currentPage?.type === 'teaching' && (
          <View style={styles.pageCard}>
            {renderDiagram(getPageDiagram(currentPage))}
            {currentPage.formula && (
              <View style={styles.formulaCard}>
                <Text style={styles.formulaText}>{currentPage.formula}</Text>
              </View>
            )}
            {currentPage.body && (
              <Text style={styles.bodyText}>{currentPage.body}</Text>
            )}
          </View>
        )}

        {lesson && currentPage?.type === 'quiz' && (
          <View style={styles.pageCard}>
            {renderDiagram(getPageDiagram(currentPage))}
            <Text style={styles.bodyText}>{currentPage.question}</Text>
            {currentPage.hint && (
              <Text style={styles.hintText}>{currentPage.hint}</Text>
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
                    onPress={() =>
                      handleChoiceSelect(choice.id, currentPage)
                    }>
                    <Text
                      style={[
                        styles.choiceText,
                        isCorrectSelection && styles.choiceTextCorrect,
                        isIncorrectSelection && styles.choiceTextIncorrect,
                      ]}>
                      {normalizeChoiceLabel(choice.id, choice.label)}
                    </Text>
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

        {lesson && currentPage?.type === 'completion' && (
          <View style={styles.pageCard}>
            <Text style={styles.completionTitle}>
              {getCompletionMessage(currentPage)}
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={handleCompletionPress}>
              <Text style={styles.primaryButtonText}>Bitir</Text>
            </Pressable>
          </View>
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
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
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
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
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
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
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
  },
});


