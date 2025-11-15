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
import { recordStreakActivity } from '@/lib/streak-storage';
import { addXp } from '@/lib/xp-storage';
import { useXpFeedback } from '@/components/xp-feedback-provider';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { MathText } from '@/components/MathText';

type DiagramKind = 'unit-triangle' | 'three-four-five';

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
    };

type TeachingPage = {
  type: 'teaching';
  id: string;
  blocks: TeachingBlock[];
};
type QuizChoice = { id: string; label: string };
type MathQuizChoice = { id: string; label: string; isMath: true };
type QuizPage = {
  type: 'quiz';
  id: string;
  question: string;
  choices: Array<QuizChoice | MathQuizChoice>;
  correctChoiceId: string;
  diagram?: DiagramKind;
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
  'birim-ucgen': {
    title: 'Birim Üçgen',
    pages: [
      {
        type: 'teaching',
        id: 'intro-triangle',
        blocks: [
          { kind: 'diagram', diagram: 'unit-triangle' },
          {
            kind: 'text',
            content:
              'Birim üçgende hipotenüs 1 birimdir. Komşu kenar cos a, karşı kenar ise sin a olarak adlandırılır.',
          },
        ],
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
        blocks: [{ kind: 'formula', content: 'sin a = karşı kenar / hipotenüs' }],
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
        blocks: [{ kind: 'formula', content: 'cos a = komşu kenar / hipotenüs' }],
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
        blocks: [{ kind: 'formula', content: 'tan a = karşı kenar / komşu kenar' }],
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
  'sin2-cos2-1': {
    title: 'sin^2 + cos^2 = 1',
    pages: [
      {
        type: 'teaching',
        id: 'identity-intro',
        blocks: [
          { kind: 'diagram', diagram: 'unit-triangle' },
          {
            kind: 'text',
            content:
              "Birim üçgen'i hatırlayalım: hipotenüsü 1'e eşit olan ve kenarları sin a ve cos a olan bir dik üçgen. Bu üçgene Pisagor teoremini uygularsak ne olur?",
          },
          {
            kind: 'hint',
            content: '\\text{Pisagor Teoremi: } a^2 + b^2 = c^2',
            widthFactor: 0.7,
            fontSize: 18,
            textAlign: 'left',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'identity-quiz',
        question:
          'Yukarıdaki üçgene Pisagor teoremini uygularsak hangi denklemi elde ederiz?',
        diagram: 'unit-triangle',
        hint: '\\text{Pisagor teoremi: } a^2 + b^2 = c^2',
        choices: [
          { id: 'identity-correct', label: '\\sin^2(a) + \\cos^2(a) = 1', isMath: true },
          { id: 'identity-wrong', label: '\\sin(a) - \\cos(a) = 3', isMath: true },
        ],
        correctChoiceId: 'identity-correct',
      },
      {
        type: 'teaching',
        id: 'identity-practice',
        blocks: [
          { kind: 'formula', content: '\\sin^2(a) + \\cos^2(a) = 1' },
          {
            kind: 'text',
            content:
              'Yukarıdaki eşitliği çokça kullanacaksın. Örneğin sorular senden aşağıdakine benzer denklemleri sadeleştirmeni isteyecek:',
          },
          { kind: 'formula', content: '\\frac{3\\sin^2(a) + 3\\cos^2(a)}{3}' },
          {
            kind: 'text',
            content:
              'Başta karmaşık görünse de öğrendiğin eşitliği kullanarak bunun 1 olduğunu görebilirsin.',
          },
          { kind: 'formula', content: '\\frac{3(\\sin^2(a) + \\cos^2(a))}{3}' },
          { kind: 'formula', content: '\\frac{3 \\cdot 1}{3} = 1' },
        ],
      },
      {
        type: 'teaching',
        id: 'identity-rearrange',
        blocks: [
          {
            kind: 'text',
            content:
              'Bu formül ilk haliyle faydalı olsa da sorularda karşına ilk haliyle çıkmayabilir.',
          },
          {
            kind: 'text',
            content:
              'Örneğin sadece sin^2(a) veya 1 görürsen ne yapmalısın?\n\nÇok basit, formüldeki terimleri diğer tarafa at ve soruda gördüğüne benzer terimi elde etmeye çalış.',
          },
          { kind: 'formula', content: '\\sin^2(a) = 1 - \\cos^2(a)' },
          { kind: 'formula', content: '\\cos^2(a) = 1 - \\sin^2(a)' },
          { kind: 'formula', content: '1 = \\sin^2(a) + \\cos^2(a)' },
        ],
      },
      {
        type: 'completion',
        id: 'identity-complete',
      },
    ],
  },
  'logaritma-nedir': {
    title: 'Logaritma nedir?',
    pages: [
      {
        type: 'teaching',
        id: 'logaritma-giris',
        blocks: [
          { kind: 'text', content: 'Üslü sayıları hatırlayalım:' },
          { kind: 'formula', content: '2^3 = 2 \\times 2 \\times 2 = 8' },
          { kind: 'formula', content: '3^2 = 3 \\times 3 = 9' },
        ],
      },
      {
        type: 'teaching',
        id: 'logaritma-giris-2',
        blocks: [
          {
            kind: 'text',
            content: 'Logaritma üslü sayılara benzer özel bir fonksiyondur. Birkaç örnek:',
          },
          { kind: 'formula', content: '\\log_2 8 = 3' },
          {
            kind: 'text',
            content:
              "Yukarıda gördüğün ifade 'logaritma 2 tabanında 8' diye okunur. 2'nin kaçıncı kuvvetinin 8'e eşit olduğunun cevabı verir. (Elbette bu cevap 3'tür!)",
          },
          { kind: 'formula', content: '2^3 = 8' },
          { kind: 'text', content: "Üslü sayılardaki 'üs' ve 'sonuç' yer değiştiriyor!" },
        ],
      },
      {
        type: 'quiz',
        id: 'logaritma-quiz-1',
        formula: '\\log_2(8) = ?',
        question: 'Yukarıdaki logaritmik ifadenin cevabı nedir?',
        hint: "2'nin kaçıncı kuvveti 8'e eşittir?",
        choices: [
          { id: 'three', label: '3' },
          { id: 'eleven', label: '11' },
        ],
        correctChoiceId: 'three',
      },
      {
        type: 'quiz',
        id: 'logaritma-quiz-2',
        formula: '\\log_3(9) = ?',
        question: 'Yukarıdaki logaritmik ifadenin cevabı nedir?',
        hint: "3'ün kaçıncı kuvveti 9'a eşittir?",
        choices: [
          { id: 'two', label: '2' },
          { id: 'zero', label: '0' },
        ],
        correctChoiceId: 'two',
      },
      {
        type: 'completion',
        id: 'logaritma-nedir-complete',
      },
    ],
  },
  'logaritmik-ifadeleri-toplama': {
    title: 'Logaritmik İfadeleri Toplama',
    pages: [
      {
        type: 'teaching',
        id: 'logaritma-toplama-giris',
        blocks: [
          {
            kind: 'text',
            content: 'Aşağıda iki logaritmik ifadenin toplamını görüyorsun.',
          },
          { kind: 'formula', content: '\\log_2(4) + \\log_2(8)' },
          {
            kind: 'text',
            content: 'Bu sorunun cevabı ne olmalı?',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'logaritma-toplama-quiz-1',
        formula: '\\log_2(4) + \\log_2(8)',
        question: 'Yukarıdaki ifadelerin toplamı kaça eşittir?',
        hint: "Bir önceki desende öğrendiklerini kullan!",
        choices: [
          { id: 'five', label: '5' },
          { id: 'minus-two', label: '-2' },
        ],
        correctChoiceId: 'five',
      },
      {
        type: 'teaching',
        id: 'logaritma-toplama-kural',
        blocks: [
          {
            kind: 'text',
            content:
              'Logaritmik ifadeler toplam halinde verildiğinde onları tek bir logaritmik ifadede toplayabilir ve içeriklerini çarpabilirsin.',
          },
          { kind: 'formula', content: '\\log_2(4) + \\log_2(8)' },
          { kind: 'formula', content: '\\log_2(4 \\times 8)' },
          { kind: 'formula', content: '\\log_2(32)' },
          {
            kind: 'text',
            content: 'Peki bu ulaştığımız ifade kaça eşit? Sonuç değişti mi?',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'logaritma-toplama-quiz-2',
        formula: '\\log_2(32)',
        question: 'Yukarıdaki logaritmik ifade kaça eşittir?',
        hint: "2'nin kaçıncı kuvveti 32'ye eşittir?",
        choices: [
          { id: 'five', label: '5' },
          { id: 'minus-three', label: '-3' },
        ],
        correctChoiceId: 'five',
      },
      {
        type: 'teaching',
        id: 'logaritma-toplama-ters',
        blocks: [
          {
            kind: 'text',
            content: 'Evet, sonuç değişmedi!',
          },
          { kind: 'formula', content: '\\log_2(4) + \\log_2(8) = \\log_2(32)' },
          {
            kind: 'text',
            content:
              'Bunun tam tersini de yapabilirsin. Yani tek bir logaritmik ifadeyi birden fazla logaritmik ifadeye parçalayabilirsin.',
          },
          { kind: 'formula', content: '\\log_2(16) = \\log_2(2) + \\log_2(8)' },
          { kind: 'formula', content: '\\log_2(100) = \\log_2(10) + \\log_2(10)' },
        ],
      },
      {
        type: 'quiz',
        id: 'logaritma-toplama-quiz-3',
        formula: '\\log_2(10) + \\log_2(10)',
        question: 'Yukarıdaki toplam aşağıdakilerden hangisine eşittir?',
        hint: 'Logaritmaların içindeki sayıları birbiriyle çarp!',
        choices: [
          { id: 'log100', label: '\\log_2(100)', isMath: true },
          { id: 'five', label: '5' },
          { id: 'two', label: '2' },
        ],
        correctChoiceId: 'log100',
      },
      {
        type: 'quiz',
        id: 'logaritma-toplama-quiz-4',
        formula: '\\log_2(16)',
        question: 'Yukarıdaki ifadeyi aşağıdakilerden hangisi gibi parçalayabilirsin?',
        hint: "Parçaların içindeki sayıların çarpımları 16'ya eşit olmalı!",
        choices: [
          { id: 'log4-plus-log4', label: '\\log_2(4) + \\log_2(4)', isMath: true },
          { id: 'log3-plus-log10', label: '\\log_2(3) + \\log_2(10)', isMath: true },
        ],
        correctChoiceId: 'log4-plus-log4',
      },
      {
        type: 'teaching',
        id: 'logaritma-toplama-uyari',
        blocks: [
          {
            kind: 'text',
            content: 'Bir uyarıyla bölümü sonlandıralım.',
          },
          {
            kind: 'text',
            content: '⚠️ TABANLARI AYNI OLMAYAN İFADELER TOPLANAMAZ ⚠️',
          },
          { kind: 'formula', content: '\\log_2(8) + \\log_3(8)' },
          {
            kind: 'text',
            content: 'Yukarıda gördüğün ifadeyi tek bir ifadeye ÇEVİREMEZSİN.',
          },
          {
            kind: 'text',
            content: 'Bu bölümde öğrendiğin kural yalnızca tabanları aynı olan ifadeler için geçerlidir.',
          },
        ],
      },
      {
        type: 'completion',
        id: 'logaritmik-ifadeleri-toplama-complete',
      },
    ],
  },
  'logaritmik-ifadeleri-cikarma': {
    title: 'Logaritmilk İfadeleri Çıkarma',
    pages: [
      {
        type: 'teaching',
        id: 'logaritma-cikarma-giris',
        blocks: [
          {
            kind: 'text',
            content: 'Aşağıda iki logaritmik ifadenin farkını görüyorsun',
          },
          { kind: 'formula', content: '\\log_2(8) - \\log_2(4)' },
          {
            kind: 'text',
            content: 'Bu işlemdeki logaritmik ifadelerin 3 ve 2 olduklarını biliyoruz.',
          },
          {
            kind: 'text',
            content: 'Bu yüzden cevap da 1 olmalı.',
          },
          { kind: 'formula', content: '\\log_2(8) - \\log_2(4) = 1' },
        ],
      },
      {
        type: 'teaching',
        id: 'logaritma-cikarma-kural',
        blocks: [
          {
            kind: 'text',
            content:
              'Logaritmik ifadeler çıkarma halinde verildiğinde onları tek bir logaritmik ifadede toplayabilir ve içeriklerini bölebilirsin.',
          },
          { kind: 'formula', content: '\\log_2(8) - \\log_2(4)' },
          { kind: 'formula', content: '\\log_2(8 / 4)' },
          { kind: 'formula', content: '\\log_2(2) = 1' },
          {
            kind: 'text',
            content: 'Gördün mü? Sonuç aynı!',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'logaritma-cikarma-quiz-1',
        formula: '\\log_2(8) - \\log_2(4)',
        question: 'Yukarıdaki işlemin sonucu nedir?',
        hint: 'İki ifadenin içeriğini birbirine bölebilirsin!',
        choices: [
          { id: 'one', label: '1' },
          { id: 'log4', label: '\\log_2(4)', isMath: true },
        ],
        correctChoiceId: 'one',
      },
      {
        type: 'quiz',
        id: 'logaritma-cikarma-quiz-2',
        formula: '\\log_2(20) - \\log_2(5)',
        question: 'Yukarıdaki işlemin sonucu nedir?',
        hint: "20'yi 5'e bölersen 4 elde edersin, 2'nin 2. kuvveti!",
        choices: [
          { id: 'two', label: '2' },
          { id: 'log10', label: '\\log_2(10)', isMath: true },
        ],
        correctChoiceId: 'two',
      },
      {
        type: 'teaching',
        id: 'logaritma-cikarma-uyari',
        blocks: [
          {
            kind: 'text',
            content: 'Bir uyarıyla bölümü sonlandıralım.',
          },
          {
            kind: 'text',
            content: '⚠️ TABANLARI AYNI OLMAYAN İFADELER BİRBİRİNDEN ÇIKARILAMAZ ⚠️',
          },
          { kind: 'formula', content: '\\log_2(8) - \\log_3(8)' },
          {
            kind: 'text',
            content: 'Yukarıda gördüğün ifadeyi tek bir ifadeye ÇEVİREMEZSİN.',
          },
          {
            kind: 'text',
            content: 'Bu bölümde öğrendiğin kural yalnızca tabanları aynı olan ifadeler için geçerlidir.',
          },
        ],
      },
      {
        type: 'completion',
        id: 'logaritmik-ifadeleri-cikarma-complete',
      },
    ],
  },
  'ussu-basa-carpi-olarak-getirme': {
    title: 'Üssü Başa Çarpı Olarak Getirme',
    pages: [
      {
        type: 'teaching',
        id: 'ussu-basa-carpi-giris',
        blocks: [
          { kind: 'formula', content: '\\log_2(8)' },
          {
            kind: 'text',
            content: "Yukarıdaki ifadede bulunan 8'i başka nasıl ifade edebilirim?",
          },
          { kind: 'formula', content: '8 = 2^3' },
          {
            kind: 'text',
            content: 'Öyleyse ifademizi şu şekilde yazabiliriz:',
          },
          { kind: 'formula', content: '\\log_2(8) = \\log_2(2^3)' },
        ],
      },
      {
        type: 'teaching',
        id: 'ussu-basa-carpi-kural',
        blocks: [
          { kind: 'formula', content: '\\log_2(8) = \\log_2(2^3)' },
          {
            kind: 'text',
            content: 'Logaritmik ifadelerde üsleri başa çarpı olarak getirebilirsin.',
          },
          { kind: 'formula', content: '\\log_2(2^3) = 3 \\times \\log_2(2)' },
          {
            kind: 'text',
            content: 'Böylece bazı ifadeler çok daha kolay hale gelir!',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'ussu-basa-carpi-quiz-1',
        formula: '\\log_3(9)',
        question: 'Yukarıdaki ifadenin eşiti aşağıdakilerden hangisidir?',
        hint: "9'u 3'ün karesi olarak yazabilirsin!",
        choices: [
          { id: 'two-times-log3', label: '2 \\times \\log_3(3)', isMath: true },
          { id: 'log8', label: '\\log_2(8)', isMath: true },
        ],
        correctChoiceId: 'two-times-log3',
      },
      {
        type: 'quiz',
        id: 'ussu-basa-carpi-quiz-2',
        formula: '\\log_2(8) + \\log_3(9)',
        question: 'Yukarıdaki ifadenin eşiti aşağıdakilerden hangisidir?',
        choices: [
          { id: 'three-times-log2-plus-two-times-log3', label: '3 \\times \\log_2(2) + 2 \\times \\log_3(3)', isMath: true },
          { id: 'eight-times-log2-plus-nine-times-log3', label: '8 \\times \\log_2(2) + 9 \\times \\log_3(3)', isMath: true },
        ],
        correctChoiceId: 'three-times-log2-plus-two-times-log3',
      },
      {
        type: 'completion',
        id: 'ussu-basa-carpi-olarak-getirme-complete',
      },
    ],
  },
  'logaritma-dummy': {
    title: 'Dummy Subtopic',
    pages: [
      {
        type: 'teaching',
        id: 'dummy-logaritma',
        blocks: [{ kind: 'text', content: 'Bu sayfa yer tutucu bir sayfadır.' }],
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
        blocks: [{ kind: 'text', content: 'Bu sayfa yer tutucu bir sayfadır.' }],
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
        blocks: [{ kind: 'text', content: 'Bu sayfa yer tutucu bir sayfadır.' }],
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
        blocks: [{ kind: 'text', content: 'Bu sayfa yer tutucu bir sayfadır.' }],
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
    default:
      return null;
  }
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
  const { showXp } = useXpFeedback();
  const { playPositive, playNegative } = useSoundEffects();

  const lesson = useMemo(() => {
    if (!subtopic) return null;
    return lessons[subtopic];
  }, [subtopic]);

  const [pageIndex, setPageIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isChoiceCorrect, setIsChoiceCorrect] = useState<boolean | null>(null);
  const [completionAwarded, setCompletionAwarded] = useState(false);

  const effectiveTitle =
    lesson?.title ?? subtopicTitleBySlug[subtopic ?? ''] ?? 'Alt Konu';
  const currentPage = lesson
    ? lesson.pages[Math.min(pageIndex, lesson.pages.length - 1)]
    : null;

  useEffect(() => {
    setSelectedChoice(null);
    setIsChoiceCorrect(null);
    setCompletionAwarded(false);
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

  const handleChoiceSelect = async (choiceId: string, page: QuizPage) => {
    const wasCorrect = isChoiceCorrect === true;
    setSelectedChoice(choiceId);
    const isCorrectNow = choiceId === page.correctChoiceId;
    setIsChoiceCorrect(isCorrectNow);
    if (isCorrectNow && !wasCorrect) {
      await addXp(10);
      showXp(10);
      await playPositive();
    } else if (!isCorrectNow) {
      await playNegative();
    }
  };

  const handleCompletionPress = async () => {
    router.replace(completionTarget as never);
  };

  useEffect(() => {
    let cancelled = false;
    const maybeAwardCompletionXp = async () => {
      if (
        completionAwarded ||
        !lesson ||
        currentPage?.type !== 'completion'
      ) {
        return;
      }

      let xpAmount = 0;
      if (typeof subtopic === 'string') {
        const isNew = await markSubtopicCompleted(subtopic);
        xpAmount = isNew ? 20 : 5;
      }
      await recordStreakActivity();
      if (xpAmount > 0) {
        await addXp(xpAmount);
        showXp(xpAmount);
        await playPositive();
      }
      if (!cancelled) {
        setCompletionAwarded(true);
      }
    };

    maybeAwardCompletionXp();

    return () => {
      cancelled = true;
    };
  }, [completionAwarded, currentPage?.id, currentPage?.type, lesson, playPositive, showXp, subtopic]);

  const isLastPage = lesson ? pageIndex >= lesson.pages.length - 1 : true;
  const showAdvanceButton =
    lesson &&
    currentPage?.type !== 'completion' &&
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
            {currentPage.blocks.map((block, index) =>
              renderTeachingBlock(block, index),
            )}
          </View>
        )}

        {lesson && currentPage?.type === 'quiz' && (
          <View style={styles.pageCard}>
            {renderDiagram(getPageDiagram(currentPage))}
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
            <Text style={styles.bodyText}>{currentPage.question}</Text>
            {currentPage.hint && (
              <View style={styles.hintCard}>
                {currentPage.hint.includes('\\') ? (
                  <MathText latex={currentPage.hint} widthFactor={0.7} fontSize={18} textAlign="left" />
                ) : (
                  <Text style={styles.hintText}>{currentPage.hint}</Text>
                )}
              </View>
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
                    {('isMath' in choice && choice.isMath) || choice.label.includes('\\') ? (
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



