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
  // TYT Matematik - Pozitif Negatif Sayılar
  {
    id: 'quiz-pozitif-negatif-1',
    subtopicSlug: 'pozitif-negatif-sayilar',
    type: 'quiz',
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
  // TYT Matematik - Denklem Kurma
  {
    id: 'quiz-denklem-kurma-1',
    subtopicSlug: 'denklem-kurma',
    type: 'quiz',
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
  // TYT Matematik - Faktöriyel
  {
    id: 'quiz-faktoriyel-1',
    subtopicSlug: 'faktoriyel',
    type: 'quiz',
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
  // TYT Matematik - Tek & Çift Sayılar
  {
    id: 'quiz-tek-cift-toplama-1',
    subtopicSlug: 'tek-cift-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'a + b toplamı ÇİFT olduğuna göre aşağıdakilerden hangisi doğrudur?',
      },
    ],
    hint: 'Aynı türlerin toplamı ÇİFT olur!',
    choices: [
      { id: 'tek-tek', label: 'a = tek, b = tek' },
      { id: 'tek-cift', label: 'a = tek, b = çift' },
    ],
    correctChoiceId: 'tek-tek',
  },
  {
    id: 'quiz-tek-cift-carpim-1',
    subtopicSlug: 'tek-cift-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'a = tek, b = çift bilgisi veriliyor.',
      },
      {
        kind: 'text',
        content: 'c\'nin türü bilinmiyor.',
      },
      {
        kind: 'text',
        content: 'Aşağıdakilerden hangisi kesinlikle çifttir?',
      },
    ],
    choices: [
      { id: 'a-carpim-c', label: 'a x c' },
      { id: 'b-carpim-c', label: 'b x c' },
    ],
    correctChoiceId: 'b-carpim-c',
  },
  // TYT Matematik - Sayı Kümeleri
  {
    id: 'quiz-sayi-kumeleri-1',
    subtopicSlug: 'sayi-kumeleri',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdaki sayılardan hangisi bir tam sayıdır ANCAK doğal sayı DEĞİLDİR?',
      },
    ],
    choices: [
      { id: 'negative-two', label: '-2' },
      { id: 'five', label: '5' },
    ],
    correctChoiceId: 'negative-two',
  },
  {
    id: 'quiz-sayi-kumeleri-2',
    subtopicSlug: 'sayi-kumeleri',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdakilerden hangisi Rasyonel Sayılar kümesindedir ANCAK Tam Sayılar kümesinde DEĞİLDİR?',
      },
    ],
    choices: [
      { id: 'fifty', label: '50' },
      { id: 'one-point-five', label: '1.5' },
    ],
    correctChoiceId: 'one-point-five',
  },
  // TYT Matematik - Ardışık Sayılar
  {
    id: 'quiz-ardisik-sayilar-1',
    subtopicSlug: 'ardisik-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Ardışık üç tane TEK sayının ilki 5\'e eşitse üçüncüsü kaça eşittir?',
      },
    ],
    choices: [
      { id: 'nine', label: '9' },
      { id: 'seven', label: '7' },
    ],
    correctChoiceId: 'nine',
  },
  {
    id: 'quiz-ardisik-sayilar-2',
    subtopicSlug: 'ardisik-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Ardışık üç tane ÇİFT sayının toplamı 12\'ye eşitse bu sayılar aşağıdakilerden hangisidir?',
      },
    ],
    choices: [
      { id: 'two-four-six', label: '2 - 4 - 6' },
      { id: 'three-five-seven', label: '3 - 5 - 7' },
    ],
    correctChoiceId: 'two-four-six',
  },
  // TYT Matematik - Asal Sayılar
  {
    id: 'quiz-asal-sayilar-1',
    subtopicSlug: 'asal-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdakilerden hangisi bir Asal Sayıdır?',
      },
      {
        kind: 'formula',
        content: '9 \\quad \\text{veya} \\quad 11',
      },
    ],
    choices: [
      { id: 'eleven', label: '11' },
      { id: 'nine', label: '9' },
    ],
    correctChoiceId: 'eleven',
  },
];
