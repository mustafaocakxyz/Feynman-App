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
  // TYT Matematik - Basamak Kavramı
  {
    id: 'quiz-basamak-kavrami-1',
    subtopicSlug: 'basamak-kavrami',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: '73 iki basamaklı sayısının matematiksel çözümlemesi hangisidir?',
      },
      {
        kind: 'formula',
        content: '73 = ?',
      },
    ],
    choices: [
      { id: 'seven-times-ten-plus-three', label: '7 \\cdot 10 + 3', isMath: true },
      { id: 'seven-plus-three', label: '7 + 3', isMath: true },
    ],
    correctChoiceId: 'seven-times-ten-plus-three',
  },
  {
    id: 'quiz-basamak-kavrami-2',
    subtopicSlug: 'basamak-kavrami',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'ABC üç basamaklı sayısının matematiksel çözümlemesi hangisidir?',
      },
      {
        kind: 'formula',
        content: 'ABC = ?',
      },
    ],
    choices: [
      { id: 'hundred-a-plus-ten-b-plus-c', label: '100A + 10B + C', isMath: true },
      { id: 'a-plus-b-plus-c', label: 'A + B + C', isMath: true },
    ],
    correctChoiceId: 'hundred-a-plus-ten-b-plus-c',
  },
  {
    id: 'quiz-basamak-kavrami-3',
    subtopicSlug: 'basamak-kavrami',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'AB ve BA iki basamaklı sayılardır. Toplamları 66 olduğuna göre rakamları toplamı (A+B) kaçtır?',
      },
      {
        kind: 'formula',
        content: 'AB + BA = 66',
      },
      {
        kind: 'formula',
        content: 'A+B=?',
      },
    ],
    choices: [
      { id: 'six', label: '6' },
      { id: 'eleven', label: '11' },
    ],
    correctChoiceId: 'six',
  },
  // TYT Matematik - Bölünebilme Kuralları
  {
    id: 'quiz-bolunebilme-kurallari-1',
    subtopicSlug: 'bolunebilme-kurallari',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdaki sayılardan hangisi 2, 5 ve 10 sayılarının hepsine bölünebilir?',
      },
    ],
    choices: [
      { id: 'twenty-five', label: '25' },
      { id: 'twenty', label: '20' },
    ],
    correctChoiceId: 'twenty',
  },
  {
    id: 'quiz-bolunebilme-kurallari-2',
    subtopicSlug: 'bolunebilme-kurallari',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdakilerden hangisi 3 ile bölünür ancak 9 ile BÖLÜNEMEZ?',
      },
    ],
    hint: '9 ile bölünmek için rakamlar toplamının 3\'ün katı olması yetmez, çünkü 6 ve 12 gibi sayılar da 3\'ün katıdır ama 9\'un katı değildir!',
    choices: [
      { id: 'four-fifty', label: '450' },
      { id: 'one-twenty-three', label: '123' },
    ],
    correctChoiceId: 'one-twenty-three',
  },
  // TYT Matematik - Bölünebilme Kuralları 2
  {
    id: 'quiz-bolunebilme-kurallari-2-1',
    subtopicSlug: 'bolunebilme-kurallari-2',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdakilerden hangisi 2 ile bölünür ancak 4 ile bölünemez?',
      },
    ],
    choices: [
      { id: 'fourteen', label: '14' },
      { id: 'forty-four', label: '44' },
    ],
    correctChoiceId: 'fourteen',
  },
  {
    id: 'quiz-bolunebilme-kurallari-2-2',
    subtopicSlug: 'bolunebilme-kurallari-2',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdakilerden hangisi 6 ile bölünebilen bir sayıdır?',
      },
    ],
    hint: 'Hangisi hem 2 hem de 3\'e bölünebilir?',
    choices: [
      { id: 'twenty-six', label: '26' },
      { id: 'twenty-four', label: '24' },
    ],
    correctChoiceId: 'twenty-four',
  },
  {
    id: 'quiz-bolunebilme-kurallari-2-3',
    subtopicSlug: 'bolunebilme-kurallari-2',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdaki sayılardan hangisi 11 ile bölünebilir?',
      },
    ],
    hint: 'Sağdan sola (+) ve (-) ler yerleştir ve işlemin sonucuna bak. 0 veya 11\'in katları olmalı!',
    choices: [
      { id: 'one-twenty-three', label: '123' },
      { id: 'four-zero-seven', label: '407' },
    ],
    correctChoiceId: 'four-zero-seven',
  },
  // TYT Matematik - Kalan Bulma Mantığı
  {
    id: 'quiz-kalan-bulma-mantigi-1',
    subtopicSlug: 'kalan-bulma-mantigi',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: '14 sayısının 4 ile bölümünden kalan kaçtır?',
      },
    ],
    choices: [
      { id: 'one', label: '1' },
      { id: 'two', label: '2' },
    ],
    correctChoiceId: 'two',
  },
  {
    id: 'quiz-kalan-bulma-mantigi-2',
    subtopicSlug: 'kalan-bulma-mantigi',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Bir A sayısını 4\'e böldüğümüzde bölüm 5, kalan 3 oluyor. A sayısı kaçtır?',
      },
      {
        kind: 'formula',
        content: 'A = 4 \\cdot 5 + 3',
      },
    ],
    choices: [
      { id: 'twenty-three', label: '23' },
      { id: 'seventeen', label: '17' },
    ],
    correctChoiceId: 'twenty-three',
  },
  {
    id: 'quiz-kalan-bulma-mantigi-3',
    subtopicSlug: 'kalan-bulma-mantigi',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Bir sayıyı 6\'ya böldüğünde kalan aşağıdakilerden hangisi OLAMAZ?',
      },
    ],
    choices: [
      { id: 'eight', label: '8' },
      { id: 'three', label: '3' },
    ],
    correctChoiceId: 'eight',
  },
  // TYT Matematik - Rasyonel Sayılar
  {
    id: 'quiz-rasyonel-sayilar-1',
    subtopicSlug: 'rasyonel-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdaki ifade doğru mu, yanlış mı?',
      },
      {
        kind: 'text',
        content: '"Bütün tam sayılar aynı zamanda rasyonel sayıdır."',
      },
    ],
    choices: [
      { id: 'dogru', label: 'Doğru' },
      { id: 'yanlis', label: 'Yanlış' },
    ],
    correctChoiceId: 'dogru',
  },
  {
    id: 'quiz-rasyonel-sayilar-2',
    subtopicSlug: 'rasyonel-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdaki rasyonel sayının ondalık gösterimi nedir?',
      },
      {
        kind: 'formula',
        content: '\\frac{1}{2}',
      },
    ],
    hint: 'Pay ve paydayı 5 ile çarpmayı dene!',
    choices: [
      { id: 'zero-eight', label: '0,8' },
      { id: 'zero-five', label: '0,5' },
    ],
    correctChoiceId: 'zero-five',
  },
  // TYT Matematik - Genişletme ve Sadeleştirme
  {
    id: 'quiz-genisletme-sadelestirme-1',
    subtopicSlug: 'genisletme-sadelestirme',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdaki genişletmelerden hangisi HATALIDIR?',
      },
    ],
    choices: [
      { id: 'two-three-four-six', label: '\\frac{2}{3} = \\frac{4}{6}' },
      { id: 'two-three-five-six', label: '\\frac{2}{3} = \\frac{5}{6}' },
    ],
    correctChoiceId: 'two-three-five-six',
  },
  {
    id: 'quiz-genisletme-sadelestirme-2',
    subtopicSlug: 'genisletme-sadelestirme',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: '5 / 10 sayısının sadeleştirilmiş hali aşağıdakilerden hangisidir?',
      },
      {
        kind: 'formula',
        content: '\\frac{5}{10} \\rightarrow ?',
      },
    ],
    choices: [
      { id: 'one-two', label: '\\frac{1}{2}' },
      { id: 'four-three', label: '\\frac{4}{3}' },
    ],
    correctChoiceId: 'one-two',
  },
  // TYT Matematik - Rasyonel Sayılarda İşlemler
  {
    id: 'quiz-rasyonel-sayilarda-islemler-1',
    subtopicSlug: 'rasyonel-sayilarda-islemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\frac{1}{2} + \\frac{1}{3}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu nedir?',
      },
    ],
    choices: [
      { id: 'one-six', label: '\\frac{1}{6}' },
      { id: 'five-six', label: '\\frac{5}{6}' },
    ],
    correctChoiceId: 'five-six',
  },
  {
    id: 'quiz-rasyonel-sayilarda-islemler-2',
    subtopicSlug: 'rasyonel-sayilarda-islemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\frac{1}{2} + \\frac{1}{4}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu nedir?',
      },
    ],
    choices: [
      { id: 'five-four', label: '\\frac{5}{4}' },
      { id: 'three-four', label: '\\frac{3}{4}' },
    ],
    correctChoiceId: 'three-four',
  },
  {
    id: 'quiz-rasyonel-sayilarda-islemler-3',
    subtopicSlug: 'rasyonel-sayilarda-islemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\frac{1}{2} - \\frac{1}{4}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu nedir?',
      },
    ],
    hint: 'Çıkarma işlemi de tamamen aynı mantıkla çalışır! Paydaları eşitle, payları birbirinden çıkar!',
    choices: [
      { id: 'three-four-sub', label: '\\frac{3}{4}' },
      { id: 'one-four', label: '\\frac{1}{4}' },
    ],
    correctChoiceId: 'one-four',
  },
  {
    id: 'quiz-rasyonel-sayilarda-islemler-4',
    subtopicSlug: 'rasyonel-sayilarda-islemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\frac{1}{2} \\cdot \\frac{3}{5}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki çarpma işleminin sonucu nedir?',
      },
    ],
    choices: [
      { id: 'three-five', label: '\\frac{3}{5}' },
      { id: 'three-ten', label: '\\frac{3}{10}' },
    ],
    correctChoiceId: 'three-ten',
  },
  {
    id: 'quiz-rasyonel-sayilarda-islemler-5',
    subtopicSlug: 'rasyonel-sayilarda-islemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\frac{1}{5} \\div \\frac{2}{6}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki bölme işleminin sonucu nedir?',
      },
    ],
    choices: [
      { id: 'two-thirty', label: '\\frac{2}{30}' },
      { id: 'six-ten', label: '\\frac{6}{10}' },
    ],
    correctChoiceId: 'six-ten',
  },
  // TYT Matematik - Bir Bilinmeyenli Denklemler
  {
    id: 'quiz-bir-bilinmeyenli-denklemler-1',
    subtopicSlug: 'bir-bilinmeyenli-denklemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: 'x - 3 = 0',
      },
      {
        kind: 'text',
        content: 'x yerine ne koyarsak yukarıdaki denklem sağlanır?',
      },
    ],
    choices: [
      { id: 'five', label: '5' },
      { id: 'three', label: '3' },
    ],
    correctChoiceId: 'three',
  },
  {
    id: 'quiz-bir-bilinmeyenli-denklemler-2',
    subtopicSlug: 'bir-bilinmeyenli-denklemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '2x = 8',
      },
      {
        kind: 'text',
        content: 'x yerine ne koyarsak yukarıdaki denklem sağlanır?',
      },
    ],
    choices: [
      { id: 'four', label: '4' },
      { id: 'two', label: '2' },
    ],
    correctChoiceId: 'four',
  },
  {
    id: 'quiz-bir-bilinmeyenli-denklemler-3',
    subtopicSlug: 'bir-bilinmeyenli-denklemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '3 \\cdot x = 12',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki denklemde x değeri kaça eşittir?',
      },
    ],
    choices: [
      { id: 'four-mul', label: '4' },
      { id: 'six-mul', label: '6' },
    ],
    correctChoiceId: 'four-mul',
  },
  {
    id: 'quiz-bir-bilinmeyenli-denklemler-4',
    subtopicSlug: 'bir-bilinmeyenli-denklemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\frac{x}{10} = 5',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki denklemde x değeri kaça eşittir?',
      },
    ],
    choices: [
      { id: 'five-div', label: '5' },
      { id: 'fifty', label: '50' },
    ],
    correctChoiceId: 'fifty',
  },
  // TYT Matematik - Eşitsizlikler
  {
    id: 'quiz-esitsizlikler-1',
    subtopicSlug: 'esitsizlikler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: 'x > 1',
      },
      {
        kind: 'formula',
        content: 'x < 3',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki bilgilere göre x aşağıdakilerden hangisi olabilir?',
      },
    ],
    choices: [
      { id: 'two', label: '2' },
      { id: 'four', label: '4' },
    ],
    correctChoiceId: 'two',
  },
  {
    id: 'quiz-esitsizlikler-2',
    subtopicSlug: 'esitsizlikler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '2x > 6',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki ifadeye göre aşağıdakilerden hangisi doğrudur?',
      },
    ],
    choices: [
      { id: 'x-lt-2', label: 'x < 2' },
      { id: 'x-gt-3', label: 'x > 3' },
    ],
    correctChoiceId: 'x-gt-3',
  },
  {
    id: 'quiz-esitsizlikler-3',
    subtopicSlug: 'esitsizlikler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '3x < 9',
      },
      {
        kind: 'formula',
        content: 'x > 1',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki bilgilere göre x aşağıdakilerden hangisi olmalıdır?',
      },
    ],
    choices: [
      { id: 'three', label: '3' },
      { id: 'two-combined', label: '2' },
    ],
    correctChoiceId: 'two-combined',
  },
  // TYT Matematik - Eşitsizliğin Yön Değiştirmesi
  {
    id: 'quiz-esitsizligin-yon-degistirmesi-1',
    subtopicSlug: 'esitsizligin-yon-degistirmesi',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: 'x < -5',
      },
      {
        kind: 'formula',
        content: '-2x \\, ? \\, 10',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki eşitsizliklerde "?" yerine ne gelmelidir?',
      },
    ],
    choices: [
      { id: 'greater-than', label: '>' },
      { id: 'equals', label: '=' },
    ],
    correctChoiceId: 'greater-than',
  },
  {
    id: 'quiz-esitsizligin-yon-degistirmesi-2',
    subtopicSlug: 'esitsizligin-yon-degistirmesi',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\frac{x}{4} > \\frac{3}{5}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki eşitsizliğin yönü değişmiş hali hangisidir?',
      },
    ],
    choices: [
      { id: 'four-over-x-lt', label: '\\frac{4}{x} < \\frac{5}{3}' },
      { id: 'x-over-four-lt', label: '\\frac{x}{4} < \\frac{3}{5}' },
    ],
    correctChoiceId: 'four-over-x-lt',
  },
  // TYT Matematik - Mutlak Değer
  {
    id: 'quiz-mutlak-deger-1',
    subtopicSlug: 'mutlak-deger',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '|x| = 7',
      },
      {
        kind: 'text',
        content: 'x sayısı aşağıdakilerden hangisi olabilir?',
      },
    ],
    choices: [
      { id: 'five', label: '5' },
      { id: 'minus-seven', label: '-7' },
    ],
    correctChoiceId: 'minus-seven',
  },
  {
    id: 'quiz-mutlak-deger-2',
    subtopicSlug: 'mutlak-deger',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '|x| = 3',
      },
      {
        kind: 'text',
        content: 'x sayısını mutlak değeri 3\'e eşit olduğuna göre aşağıdaki işlemin sonucu hangisi olabilir?',
      },
      {
        kind: 'formula',
        content: 'x + 5 = ?',
      },
    ],
    choices: [
      { id: 'two', label: '2' },
      { id: 'five', label: '5' },
    ],
    correctChoiceId: 'two',
  },
  {
    id: 'quiz-mutlak-deger-3',
    subtopicSlug: 'mutlak-deger',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '|x - 4|',
      },
      {
        kind: 'text',
        content: 'x sayısı 4\'ten küçük olduğuna göre yukarıdaki ifadenin eşiti hangisidir?',
      },
    ],
    choices: [
      { id: 'minus-x-plus-four', label: '-x + 4' },
      { id: 'x-minus-four', label: 'x - 4' },
    ],
    correctChoiceId: 'minus-x-plus-four',
  },
  {
    id: 'quiz-mutlak-deger-4',
    subtopicSlug: 'mutlak-deger',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '|x - 3| + 2 = 5',
      },
      {
        kind: 'text',
        content: 'Yukarıda verilen denkleme göre x\'in alabileceği değerler hangileridir?',
      },
    ],
    choices: [
      { id: 'six-and-zero', label: '6 ve 0' },
      { id: 'three-and-minus-three', label: '3 ve -3' },
    ],
    correctChoiceId: 'six-and-zero',
  },
  // TYT Matematik - Mutlak Değerli Eşitsizlikler
  {
    id: 'quiz-mutlak-degerli-esitsizlikler-1',
    subtopicSlug: 'mutlak-degerli-esitsizlikler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '|x| < 5',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki eşitsizliğin eşiti aşağıdakilerden hangisidir?',
      },
    ],
    choices: [
      { id: 'minus-five-x-five', label: '-5 < x < 5' },
      { id: 'zero-x-five', label: '0 < x < 5' },
    ],
    correctChoiceId: 'minus-five-x-five',
  },
  {
    id: 'quiz-mutlak-degerli-esitsizlikler-2',
    subtopicSlug: 'mutlak-degerli-esitsizlikler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '|x + 2| < 3',
      },
      {
        kind: 'text',
        content: 'x sayısının değer aralığı aşağıdakilerden hangisinde doğru verilmiştir?',
      },
    ],
    choices: [
      { id: 'minus-three-x-three', label: '-3 < x < 3' },
      { id: 'minus-five-x-one', label: '-5 < x < 1' },
    ],
    correctChoiceId: 'minus-five-x-one',
  },
  // TYT Matematik - Üslü Sayılar
  {
    id: 'quiz-uslu-sayilar-1',
    subtopicSlug: 'uslu-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '3^{2} = ?',
      },
    ],
    hint: '3 sayısını 2 defa yan yana koy ve çarp!',
    choices: [
      { id: 'nine', label: '9' },
      { id: 'six', label: '6' },
    ],
    correctChoiceId: 'nine',
  },
  {
    id: 'quiz-uslu-sayilar-2',
    subtopicSlug: 'uslu-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '2^{a} = 3^{b}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki denkleme göre a ve b değerleri kaça eşit olmalıdır?',
      },
    ],
    choices: [
      { id: 'a3-b2', label: 'a = 3, b = 2' },
      { id: 'a0-b0', label: 'a = 0, b = 0' },
    ],
    correctChoiceId: 'a0-b0',
  },
  // TYT Matematik - Negatif Sayılar
  {
    id: 'quiz-negatif-sayilar-1',
    subtopicSlug: 'negatif-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '(-2)^{x}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu POZİTİF olduğuna göre x aşağıdakilerden hangisi olabilir?',
      },
    ],
    choices: [
      { id: 'two', label: '2' },
      { id: 'three', label: '3' },
    ],
    correctChoiceId: 'two',
  },
  {
    id: 'quiz-negatif-sayilar-2',
    subtopicSlug: 'negatif-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdaki işlemlerden hangisinin sonucu KESİNLİKLE NEGATİFTİR?',
      },
    ],
    choices: [
      { id: 'parantez-minus-two', label: '(-2)^{x}', isMath: true },
      { id: 'minus-two-power-x', label: '-2^{x}', isMath: true },
    ],
    correctChoiceId: 'minus-two-power-x',
  },
  {
    id: 'quiz-negatif-sayilar-3',
    subtopicSlug: 'negatif-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '2^{-3} = ?',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu kaçtır?',
      },
    ],
    choices: [
      { id: 'one-eighth', label: '\\frac{1}{8}' },
      { id: 'minus-eight', label: '-8' },
    ],
    correctChoiceId: 'one-eighth',
  },
  // TYT Matematik - Sadeleştirme ve Parçalama
  {
    id: 'quiz-sadelestirme-ve-parcalama-1',
    subtopicSlug: 'sadelestirme-ve-parcalama',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '9^{2}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki ifadenin eşiti aşağıdakilerden hangisidir?',
      },
    ],
    choices: [
      { id: 'three-to-two', label: '3^{2}', isMath: true },
      { id: 'three-to-four', label: '3^{4}', isMath: true },
    ],
    correctChoiceId: 'three-to-four',
  },
  {
    id: 'quiz-sadelestirme-ve-parcalama-2',
    subtopicSlug: 'sadelestirme-ve-parcalama',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '12^{2}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki ifadenin parçalara ayrılmış hali hangisidir?',
      },
    ],
    choices: [
      { id: 'six-times-two', label: '6 \\times 2', isMath: true },
      { id: 'six-squared-times-two-squared', label: '6^{2} \\times 2^{2}', isMath: true },
    ],
    correctChoiceId: 'six-squared-times-two-squared',
  },
  {
    id: 'quiz-sadelestirme-ve-parcalama-3',
    subtopicSlug: 'sadelestirme-ve-parcalama',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '10^{3}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki ifadenin parçalara ayrılmış hali hangisidir?',
      },
    ],
    choices: [
      { id: 'five-squared-times-two-squared', label: '5^{2} \\times 2^{2}', isMath: true },
      { id: 'five-cubed-times-two-cubed', label: '5^{3} \\times 2^{3}', isMath: true },
    ],
    correctChoiceId: 'five-cubed-times-two-cubed',
  },
  // TYT Matematik - Köklü Sayılar
  {
    id: 'quiz-koklu-sayilar-1',
    subtopicSlug: 'koklu-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\sqrt{36} = ?',
      },
    ],
    choices: [
      { id: 'six', label: '6' },
      { id: 'twelve', label: '12' },
    ],
    correctChoiceId: 'six',
  },
  {
    id: 'quiz-koklu-sayilar-2',
    subtopicSlug: 'koklu-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\sqrt{18} = ?',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki ifadenin en sade hali hangisidir?',
      },
    ],
    choices: [
      { id: 'three-root-two', label: '3\\sqrt{2}', isMath: true },
      { id: 'six-root-three', label: '6\\sqrt{3}', isMath: true },
    ],
    correctChoiceId: 'three-root-two',
  },
  {
    id: 'quiz-koklu-sayilar-3',
    subtopicSlug: 'koklu-sayilar',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\sqrt{50} = ?',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki ifadenin en sade hali hangisidir?',
      },
    ],
    choices: [
      { id: 'five-root-two', label: '5\\sqrt{2}', isMath: true },
      { id: 'two-root-five', label: '2\\sqrt{5}', isMath: true },
    ],
    correctChoiceId: 'five-root-two',
  },
  // TYT Matematik - Köklü Sayılarla İşlemler
  {
    id: 'quiz-koklu-sayilarla-islemler-1',
    subtopicSlug: 'koklu-sayilarla-islemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '2\\sqrt{2} + 3\\sqrt{2} = ?',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu kaçtır?',
      },
    ],
    choices: [
      { id: 'five-root-four', label: '5\\sqrt{4}', isMath: true },
      { id: 'five-root-two', label: '5\\sqrt{2}', isMath: true },
    ],
    correctChoiceId: 'five-root-two',
  },
  {
    id: 'quiz-koklu-sayilarla-islemler-2',
    subtopicSlug: 'koklu-sayilarla-islemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\sqrt{50} \\times \\sqrt{2} = ?',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu nedir?',
      },
    ],
    choices: [
      { id: 'hundred', label: '100' },
      { id: 'ten', label: '10' },
    ],
    correctChoiceId: 'ten',
  },
  {
    id: 'quiz-koklu-sayilarla-islemler-3',
    subtopicSlug: 'koklu-sayilarla-islemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '3\\sqrt{2} \\times \\sqrt{2} = ?',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu nedir?',
      },
    ],
    choices: [
      { id: 'three-root-two', label: '3\\sqrt{2}', isMath: true },
      { id: 'six', label: '6' },
    ],
    correctChoiceId: 'six',
  },
  // TYT Matematik - Ortak Parantez
  {
    id: 'quiz-ortak-parantez-1',
    subtopicSlug: 'ortak-parantez',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '5x - 20 = ?',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki ifadenin çarpanlarına ayrılmış hali aşağıdakilerden hangisidir?',
      },
    ],
    choices: [
      { id: 'five-x-minus-four', label: '5(x - 4)', isMath: true },
      { id: 'five-x-minus-twenty', label: '5(x - 20)', isMath: true },
    ],
    correctChoiceId: 'five-x-minus-four',
  },
  {
    id: 'quiz-ortak-parantez-2',
    subtopicSlug: 'ortak-parantez',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '5x^{2} - 20x',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki ifadenin çarpanlarına ayrılmış hali aşağıdakilerden hangisidir?',
      },
    ],
    choices: [
      { id: 'five-x-x-minus-four', label: '5x(x - 4)', isMath: true },
      { id: 'five-x-minus-four-only', label: '5(x - 4)', isMath: true },
    ],
    correctChoiceId: 'five-x-x-minus-four',
  },
  {
    id: 'quiz-ortak-parantez-3',
    subtopicSlug: 'ortak-parantez',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: 'x^{3} + 7x^{2} + 4x',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki ifadenin çarpanlarına ayrılmış hali aşağıdakilerden hangisidir?',
      },
    ],
    choices: [
      { id: 'x-x-squared-plus-seven-x-plus-four', label: 'x(x^{2} + 7x + 4)', isMath: true },
      { id: 'four-x-wrong', label: '4x(x + 2x + 1)', isMath: true },
    ],
    correctChoiceId: 'x-x-squared-plus-seven-x-plus-four',
  },
  // TYT Matematik - İki Bilinmeyenli Denklemler
  {
    id: 'quiz-iki-bilinmeyenli-denklemler-1',
    subtopicSlug: 'iki-bilinmeyenli-denklemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '2x + 2y = 10',
      },
      {
        kind: 'formula',
        content: '3x - 2y = 0',
      },
      {
        kind: 'text',
        content: 'Denklemleri alt alta toplayarak x ve y değerlerini bul.',
      },
    ],
    choices: [
      { id: 'x2-y3', label: 'x = 2, y = 3' },
      { id: 'x5-y4', label: 'x = 5, y = 4' },
    ],
    correctChoiceId: 'x2-y3',
  },
  {
    id: 'quiz-iki-bilinmeyenli-denklemler-2',
    subtopicSlug: 'iki-bilinmeyenli-denklemler',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '2x + 2y = 10',
      },
      {
        kind: 'formula',
        content: 'x - y = 3',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki denklemlere göre x ve y değerlerini bul!',
      },
    ],
    hint: 'Aşağıdaki denklemi 2 ile çarp, sonrasında "yok etme metodu" uygula!',
    choices: [
      { id: 'x4-y1', label: 'x = 4, y = 1' },
      { id: 'x2-y2', label: 'x = 2, y = 2' },
    ],
    correctChoiceId: 'x4-y1',
  },
  // TYT Matematik - İki Bilinmeyenli Denklemler (Devam)
  {
    id: 'quiz-iki-bilinmeyenli-denklemler-devam-1',
    subtopicSlug: 'iki-bilinmeyenli-denklemler-devam',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: 'y = 2x',
      },
      {
        kind: 'formula',
        content: 'x + y = 9',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki denklemleri sağlayan x ve y değerlerini bul.',
      },
    ],
    choices: [
      { id: 'x2-y4', label: 'x = 2, y = 4' },
      { id: 'x3-y6', label: 'x = 3, y = 6' },
    ],
    correctChoiceId: 'x3-y6',
  },
  {
    id: 'quiz-iki-bilinmeyenli-denklemler-devam-2',
    subtopicSlug: 'iki-bilinmeyenli-denklemler-devam',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '5x = 2y - 3',
      },
      {
        kind: 'formula',
        content: '2x + 4y = 18',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki denklemleri sağlayan x ve y değerlerini bulun.',
      },
    ],
    hint: '4y yerine bulduğumuz sonucu yaz ve x değerini bul!',
    choices: [
      { id: 'x1-y4', label: 'x = 1, y = 4' },
      { id: 'x3-y3', label: 'x = 3, y = 3' },
    ],
    correctChoiceId: 'x1-y4',
  },
  {
    id: 'quiz-iki-bilinmeyenli-denklemler-devam-3',
    subtopicSlug: 'iki-bilinmeyenli-denklemler-devam',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '2x = 2y + 4',
      },
      {
        kind: 'formula',
        content: 'x + 4y = 2',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki denklemleri sağlayan x ve y değerlerini bul.',
      },
    ],
    hint: 'Yukarıdaki denklemde 4\'ü karşıya at ve denklemi 2 ile çarp!',
    choices: [
      { id: 'x2-y0', label: 'x = 2, y = 0' },
      { id: 'x2-y2', label: 'x = 2, y = 2' },
    ],
    correctChoiceId: 'x2-y0',
  },
  // TYT Matematik - Üslü Sayılarda İşlemler
  {
    id: 'quiz-uslu-sayilarla-ilgili-kurallar-1',
    subtopicSlug: 'uslu-sayilarla-ilgili-kurallar',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '2^{4} \\times 2^{1} \\times 2^{-3} = ?',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu kaçtır?',
      },
    ],
    choices: [
      { id: 'two', label: '2' },
      { id: 'four', label: '4' },
    ],
    correctChoiceId: 'four',
  },
  {
    id: 'quiz-uslu-sayilarla-ilgili-kurallar-2',
    subtopicSlug: 'uslu-sayilarla-ilgili-kurallar',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '\\frac{2^{4}}{2^{2}}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu kaçtır?',
      },
    ],
    choices: [
      { id: 'four-div', label: '4' },
      { id: 'two-div', label: '2' },
    ],
    correctChoiceId: 'four-div',
  },
  // TYT Matematik - Tam Kare ve İki Kare Farkı
  {
    id: 'quiz-tam-kare-ve-iki-kare-farki-1',
    subtopicSlug: 'tam-kare-ve-iki-kare-farki',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '2002^{2} - 2001^{2}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu nedir?',
      },
    ],
    choices: [
      { id: 'one', label: '1' },
      { id: 'four-thousand-three', label: '4003' },
    ],
    correctChoiceId: 'four-thousand-three',
  },
  {
    id: 'quiz-tam-kare-ve-iki-kare-farki-2',
    subtopicSlug: 'tam-kare-ve-iki-kare-farki',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '(x + y)^{2} = x^{2} + 4x + 4',
      },
      {
        kind: 'text',
        content: 'Buna göre y değeri kaça eşittir?',
      },
    ],
    choices: [
      { id: 'four', label: '4' },
      { id: 'two', label: '2' },
    ],
    correctChoiceId: 'two',
  },
  {
    id: 'quiz-tam-kare-ve-iki-kare-farki-3',
    subtopicSlug: 'tam-kare-ve-iki-kare-farki',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: '(x - y)^{2} = x^{2} - 8y + y^{2}',
      },
      {
        kind: 'text',
        content: 'Buna göre x değeri kaça eşittir?',
      },
    ],
    choices: [
      { id: 'four-x', label: '4' },
      { id: 'eight-x', label: '8' },
    ],
    correctChoiceId: 'four-x',
  },
  // TYT Matematik - Çarpanlara Ayırma
  {
    id: 'quiz-carpanlara-ayirma-1',
    subtopicSlug: 'carpanlara-ayirma',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: 'x^{2} + 6x + 5',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki ifade çarpanlarına nasıl ayrılır?',
      },
    ],
    hint: 'Çarpımları 5, toplamları 6 olan iki sayı bul!',
    choices: [
      { id: 'x-plus-five-x-plus-one', label: '(x+5)(x+1)', isMath: true },
      { id: 'x-plus-two-x-plus-four', label: '(x+2)(x+4)', isMath: true },
    ],
    correctChoiceId: 'x-plus-five-x-plus-one',
  },
  {
    id: 'quiz-carpanlara-ayirma-2',
    subtopicSlug: 'carpanlara-ayirma',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: 'x^{2} - 4x - 5',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki ifade çarpanlarına nasıl ayrılır?',
      },
    ],
    hint: 'Çarpımları -5, toplamları -4 olan iki sayı bul!',
    choices: [
      { id: 'x-minus-five-x-plus-one', label: '(x-5)(x+1)', isMath: true },
      { id: 'x-plus-two-x-minus-four', label: '(x+2)(x-4)', isMath: true },
    ],
    correctChoiceId: 'x-minus-five-x-plus-one',
  },
  // TYT Matematik - f(x) Yazmadığında Değer Bulma
  {
    id: 'quiz-deger-bulma-1',
    subtopicSlug: 'deger-bulma',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdaki fonksiyona bak.',
      },
      { kind: 'formula', content: 'f(x-3) = 2x + 5' },
      {
        kind: 'text',
        content: 'f(4)\'ü bulmak için x yerine hangi sayıyı yazmalısın?',
      },
      { kind: 'formula', content: 'x - 3 = 4 \\quad \\Rightarrow \\quad x = ?' },
    ],
    choices: [
      { id: 'seven', label: '7' },
      { id: 'four', label: '4' },
    ],
    correctChoiceId: 'seven',
  },
  {
    id: 'quiz-deger-bulma-2',
    subtopicSlug: 'deger-bulma',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Harika, x yerine 7 yazmalıyız!',
      },
      {
        kind: 'text',
        content: 'Şimdi sonucu da bulalım. Aşağıdaki fonksiyonda x yerine 7 yazdığında sağ taraf (yani sonuç) ne çıkacaktır?',
      },
      { kind: 'formula', content: 'f(x-3) = 2x + 5' },
    ],
    choices: [
      { id: 'nineteen', label: '19' },
      { id: 'eight', label: '8' },
    ],
    correctChoiceId: 'nineteen',
  },
  {
    id: 'quiz-deger-bulma-3',
    subtopicSlug: 'deger-bulma',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Bir tane daha yapalım. Aşağıdaki fonksiyona bak:',
      },
      { kind: 'formula', content: 'f(2x) = x + 7' },
      {
        kind: 'text',
        content: 'Bu fonksiyonda f(4) kaça eşittir?',
      },
    ],
    hint: 'x yerine ne yazarsan fonksiyonun içi 4 olur? Sağ tarafta o değeri kullan, 4\'ü değil!',
    choices: [
      { id: 'nine', label: '9' },
      { id: 'eleven', label: '11' },
    ],
    correctChoiceId: 'nine',
  },
  // TYT Matematik - Fonksiyon Çeşitleri
  {
    id: 'quiz-fonksiyon-cesitleri-1',
    subtopicSlug: 'fonksiyon-cesitleri',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(x) = 10' },
      {
        kind: 'text',
        content: 'Yukarıdaki fonksiyonda x yerine 1 yazıldığında sonuç ne olur?',
      },
      { kind: 'formula', content: 'f(1) = ?' },
    ],
    choices: [
      { id: 'ten', label: '10' },
      { id: 'seven', label: '7' },
    ],
    correctChoiceId: 'ten',
  },
  {
    id: 'quiz-fonksiyon-cesitleri-2',
    subtopicSlug: 'fonksiyon-cesitleri',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'f fonksiyonu birim fonksiyondur. Buna göre aşağıdaki işlemin sonucu kaçtır?',
      },
      { kind: 'formula', content: 'f(2024) = ?' },
    ],
    choices: [
      { id: 'twenty-twenty-four', label: '2024' },
      { id: 'one', label: '1' },
    ],
    correctChoiceId: 'twenty-twenty-four',
  },
  // TYT Matematik - Doğrusal Fonksiyon
  {
    id: 'quiz-dogrusal-fonksiyon-1',
    subtopicSlug: 'dogrusal-fonksiyon',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'f(x) doğrusal bir fonksiyon olduğuna göre aşağıdakilerden hangisi f(x) olabilir?',
      },
    ],
    choices: [
      { id: 'three-x-plus-four', label: '3x + 4', isMath: true },
      { id: 'x-squared-plus-x-plus-six', label: 'x^2 + x + 6', isMath: true },
    ],
    correctChoiceId: 'three-x-plus-four',
  },
  {
    id: 'quiz-dogrusal-fonksiyon-2',
    subtopicSlug: 'dogrusal-fonksiyon',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(1) = 6 , f(2) = 10' },
      {
        kind: 'text',
        content: 'f(x) doğrusal bir fonksiyon olduğuna göre f(3) değeri kaça eşittir?',
      },
    ],
    hint: 'f(x) fonksiyonunda x arttıkça sonuç da düzenli aralıklarla artar!',
    choices: [
      { id: 'fourteen', label: '14' },
      { id: 'twelve', label: '12' },
    ],
    correctChoiceId: 'fourteen',
  },
  {
    id: 'quiz-dogrusal-fonksiyon-3',
    subtopicSlug: 'dogrusal-fonksiyon',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(0) = 2 , f(1) = 4' },
      {
        kind: 'text',
        content: 'f(x) doğrusal bir fonksiyon olduğuna göre f(x) aşağıdakilerden hangisidir?',
      },
    ],
    choices: [
      { id: 'two-x-plus-two', label: 'f(x) = 2x + 2', isMath: true },
      { id: 'three-x-plus-two', label: 'f(x) = 3x + 2', isMath: true },
    ],
    correctChoiceId: 'two-x-plus-two',
  },
  // TYT Matematik - Parçalı Fonksiyon
  {
    id: 'quiz-parcali-fonksiyon-1',
    subtopicSlug: 'parcali-fonksiyon',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: 'f(x) = \\begin{cases} 3x & x < 0 \\\\ x+4 & x \\ge 0 \\end{cases}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki bilgilere göre f(4) kaça eşittir?',
      },
    ],
    choices: [
      { id: 'twelve', label: '12' },
      { id: 'eight', label: '8' },
    ],
    correctChoiceId: 'eight',
  },
  {
    id: 'quiz-parcali-fonksiyon-2',
    subtopicSlug: 'parcali-fonksiyon',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: 'f(x) = \\begin{cases} 5 & x < 0 \\\\ 3 & x \\ge 0 \\end{cases}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki bilgilere göre f(4) kaça eşittir?',
      },
    ],
    choices: [
      { id: 'five', label: '5' },
      { id: 'three', label: '3' },
    ],
    correctChoiceId: 'three',
  },
  {
    id: 'quiz-parcali-fonksiyon-3',
    subtopicSlug: 'parcali-fonksiyon',
    type: 'quiz',
    blocks: [
      {
        kind: 'formula',
        content: 'f(x) = \\begin{cases} 2x & x < 0 \\\\ x-1 & x \\ge 0 \\end{cases}',
      },
      {
        kind: 'text',
        content: 'Yukarıdaki bilgilere göre f(-2) kaça eşittir?',
      },
    ],
    choices: [
      { id: 'minus-three', label: '-3' },
      { id: 'minus-four', label: '-4' },
    ],
    correctChoiceId: 'minus-four',
  },
  // TYT Matematik - Çift Fonksiyonlar
  {
    id: 'quiz-fonksiyon-cift-1',
    subtopicSlug: 'fonksiyon-cesitleri-3',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(x) = f(-x)' },
      {
        kind: 'text',
        content: 'Yukarıdaki f fonksiyonu ne gibi bir fonksiyon olabilir?',
      },
    ],
    hint: 'Şıklardaki fonksiyonların yerine 2 ve -2 koy, sonuçların değişip değişmediğine bak!',
    choices: [
      { id: 'x-squared', label: 'x^2', isMath: true },
      { id: 'x-plus-one', label: 'x + 1', isMath: true },
    ],
    correctChoiceId: 'x-squared',
  },
  {
    id: 'quiz-fonksiyon-cift-2',
    subtopicSlug: 'fonksiyon-cesitleri-3',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdaki fonksiyonlardan hangisi çift fonksiyon DEĞİLDİR?',
      },
    ],
    choices: [
      { id: 'x-squared-only', label: 'x^2', isMath: true },
      { id: 'x-cubed-plus-3x', label: 'x^3 + 3x', isMath: true },
    ],
    correctChoiceId: 'x-cubed-plus-3x',
  },
  // TYT Matematik - Tek Fonksiyonlar
  {
    id: 'quiz-tek-fonksiyon-1',
    subtopicSlug: 'tek-fonksiyonlar',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdaki fonksiyonlardan hangisi tek fonksiyondur?',
      },
    ],
    hint: 'Fonksiyonlardan hangisi 2 ve -2 için FARKLI sonuçlar verir?',
    choices: [
      { id: 'x-squared', label: 'x^2', isMath: true },
      { id: 'x-cubed-plus-x', label: 'x^3 + x', isMath: true },
    ],
    correctChoiceId: 'x-cubed-plus-x',
  },
  {
    id: 'quiz-tek-fonksiyon-2',
    subtopicSlug: 'tek-fonksiyonlar',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdaki fonksiyonlardan hangisi TEK fonksiyondur?',
      },
    ],
    choices: [
      { id: 'x-squared-plus-5', label: 'f(x) = x^2 + 5', isMath: true },
      { id: 'x-cubed-plus-3x', label: 'f(x) = x^3 + 3x', isMath: true },
    ],
    correctChoiceId: 'x-cubed-plus-3x',
  },
  {
    id: 'quiz-tek-fonksiyon-3',
    subtopicSlug: 'tek-fonksiyonlar',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'Aşağıdakilerden hangisi TEK fonksiyon grafiği olabilir?',
      },
    ],
    choices: [
      {
        id: 'x-squared-plus-2-graph',
        label: 'x^2 + 2 grafiği',
        graph: {
          functions: [{ formula: 'x^2 + 2', color: '#dc2626' }],
          xDomain: [-2, 2],
          yDomain: [0, 6],
          showGrid: true,
          showAxes: true,
        },
      },
      {
        id: 'x-cubed-graph',
        label: 'x^3 grafiği',
        graph: {
          functions: [{ formula: 'x^3', color: '#2563eb' }],
          xDomain: [-2, 2],
          yDomain: [-8, 8],
          showGrid: true,
          showAxes: true,
        },
      },
    ],
    correctChoiceId: 'x-cubed-graph',
  },
  // TYT Matematik - Fonksiyonlarda Dört İşlem
  {
    id: 'quiz-fonksiyonlarda-dort-islem-1',
    subtopicSlug: 'fonksiyonlarda-dort-islem',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(x) = x , g(x) = 4' },
      { kind: 'formula', content: '(f \\cdot g)(x) = ?' },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu nedir?',
      },
    ],
    choices: [
      { id: 'four-x', label: '4x', isMath: true },
      { id: 'x-plus-four', label: 'x + 4', isMath: true },
    ],
    correctChoiceId: 'four-x',
  },
  {
    id: 'quiz-fonksiyonlarda-dort-islem-2',
    subtopicSlug: 'fonksiyonlarda-dort-islem',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(x) = 2x , g(x) = x + 4' },
      { kind: 'formula', content: '(f - g)(x) = ?' },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu nedir?',
      },
    ],
    choices: [
      { id: 'x-minus-four', label: 'x - 4', isMath: true },
      { id: 'three-x-plus-four', label: '3x + 4', isMath: true },
    ],
    correctChoiceId: 'x-minus-four',
  },
  {
    id: 'quiz-fonksiyonlarda-dort-islem-3',
    subtopicSlug: 'fonksiyonlarda-dort-islem',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(x) = x + 1 , g(x) = 4x' },
      { kind: 'formula', content: '(f \\div g)(x) = ?' },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu nedir?',
      },
    ],
    choices: [
      { id: 'x-plus-one-over-four-x', label: '\\frac{x + 1}{4x}', isMath: true },
      { id: 'x-plus-four-wrong', label: 'x + 4', isMath: true },
    ],
    correctChoiceId: 'x-plus-one-over-four-x',
  },
  {
    id: 'quiz-fonksiyonlarda-dort-islem-4',
    subtopicSlug: 'fonksiyonlarda-dort-islem',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(x) = x + 2 , g(x) = 4' },
      { kind: 'formula', content: '(f \\cdot g)(3) = ?' },
      {
        kind: 'text',
        content: 'Yukarıdaki işlemin sonucu nedir?',
      },
    ],
    choices: [
      { id: 'twenty', label: '20' },
      { id: 'twelve', label: '12' },
    ],
    correctChoiceId: 'twenty',
  },
  // TYT Matematik - Bileşke Fonksiyon
  {
    id: 'quiz-bileske-fonksiyon-1',
    subtopicSlug: 'bileske-fonksiyon',
    type: 'quiz',
    blocks: [
      {
        kind: 'text',
        content: 'g(3) = 4 ve f(4) = 10 ise;',
      },
      { kind: 'formula', content: '(f \\circ g)(3) = ?' },
    ],
    choices: [
      { id: 'ten', label: '10' },
      { id: 'four', label: '4' },
    ],
    correctChoiceId: 'ten',
  },
  {
    id: 'quiz-bileske-fonksiyon-2',
    subtopicSlug: 'bileske-fonksiyon',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(x) = x + 2 , g(x) = 2x' },
      { kind: 'formula', content: '(f \\circ g)(x) = ?' },
    ],
    choices: [
      { id: 'two-x-plus-two', label: '2x + 2', isMath: true },
      { id: 'two-x', label: '2x', isMath: true },
    ],
    correctChoiceId: 'two-x-plus-two',
  },
  {
    id: 'quiz-bileske-fonksiyon-3',
    subtopicSlug: 'bileske-fonksiyon',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(x) = x + 2 , g(x) = 2x' },
      { kind: 'formula', content: '(f \\circ g)(3) = ?' },
    ],
    choices: [
      { id: 'eight', label: '8' },
      { id: 'five', label: '5' },
    ],
    correctChoiceId: 'eight',
  },
  // TYT Matematik - Ters Fonksiyon
  {
    id: 'quiz-ters-fonksiyon-1',
    subtopicSlug: 'ters-fonksiyon',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(2) = 7' },
      { kind: 'formula', content: 'f^{-1}(7) = ?' },
      {
        kind: 'text',
        content: 'Yukarıdaki f(x) fonksiyonunun tersine 7 verirsek sonuç ne gelir?',
      },
    ],
    choices: [
      { id: 'seven', label: '7' },
      { id: 'two', label: '2' },
    ],
    correctChoiceId: 'two',
  },
  {
    id: 'quiz-ters-fonksiyon-2',
    subtopicSlug: 'ters-fonksiyon',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(x) = x + 5' },
      { kind: 'formula', content: 'f^{-1}(7) = ?' },
      {
        kind: 'text',
        content: 'Yukarıdaki f(x) fonksiyonunun tersine 7 verirsek sonuç ne gelir?',
      },
    ],
    hint: 'f(x)\'e hangi değeri vererek 7 elde ederiz?',
    choices: [
      { id: 'seven-wrong', label: '7' },
      { id: 'two-correct', label: '2' },
    ],
    correctChoiceId: 'two-correct',
  },
  {
    id: 'quiz-ters-fonksiyon-3',
    subtopicSlug: 'ters-fonksiyon',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(x) = x - 4' },
      {
        kind: 'text',
        content: 'Yukarıdaki f(x) fonksiyonunun tersini bulunuz.',
      },
    ],
    hint: 'f(x) yerine y yaz, x\'i yalnız bırak, sonra y yerine x ve x yerine f^{-1}(x) yaz!',
    choices: [
      { id: 'x-plus-four', label: 'x + 4', isMath: true },
      { id: 'four-minus-x', label: '4 - x', isMath: true },
    ],
    correctChoiceId: 'x-plus-four',
  },
  {
    id: 'quiz-ters-fonksiyon-4',
    subtopicSlug: 'ters-fonksiyon',
    type: 'quiz',
    blocks: [
      { kind: 'formula', content: 'f(x) = 4x' },
      {
        kind: 'text',
        content: 'Yukarıdaki f(x) fonksiyonunun tersini bulunuz.',
      },
    ],
    hint: 'f(x) yerine y yaz, x\'i yalnız bırak, sonra y yerine x ve x yerine f^{-1}(x) yaz!',
    choices: [
      { id: 'x-over-four', label: '\\frac{x}{4}', isMath: true },
      { id: 'four-minus-x-wrong', label: '4 - x', isMath: true },
    ],
    correctChoiceId: 'x-over-four',
  },
];
