import { GraphConfig } from '@/components/FunctionGraph';

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

export type QuizModePage = {
  id: string;
  subtopicSlug: string; // Links to completed subtopics
  type: 'quiz';
  choices: Array<QuizChoice | MathQuizChoice | GraphQuizChoice>;
  correctChoiceId: string;
  // New block-based rendering (preferred)
  blocks?: TeachingBlock[];
  // Legacy fields (for backward compatibility)
  question?: string;
  diagram?: DiagramKind;
  graph?: GraphConfig;
  hint?: string;
  formula?: string;
};

export const quizModePages: QuizModePage[] = [
  // Fonksiyon nedir? quizzes
  {
    id: 'quiz-fonksiyon-1',
    subtopicSlug: 'fonksiyon-nedir',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Sıra sende! Aşağıdaki fonksiyon makinesi giren sayıyı 10 ile çarpıyor.',
      },
      { kind: 'formula', content: 'f(x) = 10x' },
      {
        kind: 'text',
        content: 'Bu fonksiyona 5 sayısı girerse ne olur?',
      },
      { kind: 'formula', content: 'f(5) = ?' },
    ],
    choices: [
      { id: 'fifty', label: '50' },
      { id: 'fifteen', label: '15' },
    ],
    correctChoiceId: 'fifty',
  },
  {
    id: 'quiz-fonksiyon-2',
    subtopicSlug: 'fonksiyon-nedir',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Şimdi kuralımız biraz daha detaylı. Önce çarp, sonra çıkar.',
      },
      { kind: 'formula', content: 'f(x) = 3x - 1' },
      {
        kind: 'text',
        content: 'Bu fonksiyona 3 sayısını koyarsak ne olur?',
      },
      { kind: 'formula', content: 'f(3) = ?' },
    ],
    choices: [
      { id: 'eight', label: '8' },
      { id: 'seven', label: '7' },
    ],
    correctChoiceId: 'eight',
  },
  // Tanım ve Görüntü kümesi quizzes
  {
    id: 'quiz-tanim-goruntu-1',
    subtopicSlug: 'tanim-ve-goruntu-kumesi',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Tanım kümemiz A = {2, 3} olsun. Fonksiyonumuz ise aşağıdaki fonksiyon olsun.',
      },
      { kind: 'formula', content: 'f(x) = x^2' },
      {
        kind: 'text',
        content: 'Görüntü kümesi (sonuçlar) ne olur?',
      },
    ],
    choices: [
      { id: 'four-nine', label: '\\{4, 9\\}', isMath: true },
      { id: 'two-three', label: '\\{2, 3\\}', isMath: true },
    ],
    correctChoiceId: 'four-nine',
  },
  // Sin, Cos ve Tan quizzes
  {
    id: 'quiz-sin-cos-1',
    subtopicSlug: 'sin-cos-ve-tan',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Birim üçgende, 30° açısı için sin değeri nedir?',
      },
      { kind: 'diagram', diagram: 'unit-triangle' },
    ],
    choices: [
      { id: 'half', label: '\\frac{1}{2}', isMath: true },
      { id: 'root-three-over-two', label: '\\frac{\\sqrt{3}}{2}', isMath: true },
    ],
    correctChoiceId: 'half',
  },
  {
    id: 'quiz-sin-cos-2',
    subtopicSlug: 'sin-cos-ve-tan',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Birim üçgende, 60° açısı için cos değeri nedir?',
      },
      { kind: 'diagram', diagram: 'unit-triangle' },
    ],
    choices: [
      { id: 'half-cos', label: '\\frac{1}{2}', isMath: true },
      { id: 'root-three-over-two-cos', label: '\\frac{\\sqrt{3}}{2}', isMath: true },
    ],
    correctChoiceId: 'half-cos',
  },
  // Logaritma nedir? quizzes
  {
    id: 'quiz-logaritma-1',
    subtopicSlug: 'logaritma-nedir',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'log₂(8) değeri nedir?',
      },
      { kind: 'formula', content: 'log_2(8) = ?' },
    ],
    choices: [
      { id: 'three', label: '3' },
      { id: 'four', label: '4' },
    ],
    correctChoiceId: 'three',
  },
  {
    id: 'quiz-logaritma-2',
    subtopicSlug: 'logaritma-nedir',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'log₁₀(100) değeri nedir?',
      },
      { kind: 'formula', content: 'log_{10}(100) = ?' },
    ],
    choices: [
      { id: 'two', label: '2' },
      { id: 'ten', label: '10' },
    ],
    correctChoiceId: 'two',
  },
  // Limit nedir? quizzes
  {
    id: 'quiz-limit-1',
    subtopicSlug: 'limit-nedir',
    type: 'quiz',
    graph: {
      functions: [{ formula: 'x', color: '#2563eb' }],
      xDomain: [0, 5],
      yDomain: [0, 5],
      showGrid: true,
      showAxes: true,
      highlightPoints: [{ x: 2, y: 2, color: '#f97316' }],
      approach: {
        x: 2,
        direction: 'both',
        showArrows: true,
        highlightSegment: true,
        arrowColor: '#f97316',
        highlightColor: '#f97316',
        label: 'x → 2',
      },
    },
    formula: '\\lim_{x \\to 2} f(x) = ?',
    question: 'Yukarıdaki fonksiyonun x = 2 noktasındaki limiti nedir?',
    choices: [
      { id: 'two-limit', label: '2' },
      { id: 'thirteen', label: '13' },
    ],
    correctChoiceId: 'two-limit',
  },
];
