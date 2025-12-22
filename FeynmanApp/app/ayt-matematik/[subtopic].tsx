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
import * as Haptics from 'expo-haptics';

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
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

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
  | { kind: 'graph'; config: GraphConfig }
  | {
      kind: 'image';
      source: any; // require() result or URI string
      width?: number;
      height?: number;
      resizeMode?: 'contain' | 'cover' | 'stretch' | 'center' | 'repeat';
      alt?: string;
    };

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
  // New block-based rendering (preferred)
  blocks?: TeachingBlock[];
  // Legacy fields (for backward compatibility)
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
  'tanimla-ilgili-kurallar': {
    title: 'Tanımla İlgili Kurallar',
    pages: [
      {
        type: 'teaching',
        id: 'tanimla-kurallar-giris',
        blocks: [
          { kind: 'formula', content: '\\log_a b = x' },
          {
            kind: 'text',
            content: 'Yukarıda logaritmanın en basit halini görüyorsun.',
          },
          {
            kind: 'text',
            content:
              'Logaritmanın tabanına veya içeriğine istediğimiz her değeri yazamayız.',
          },
          {
            kind: 'text',
            content: 'Bu modülde bu sayılara dair kuralları öğreneceksin.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'tanimla-kurallar-taban',
        blocks: [
          { kind: 'formula', content: '\\log_a b = x' },
          {
            kind: 'text',
            content:
              'Logaritmanın tabanında bulunan a değeri daima pozitif olmalıdır.',
          },
          { kind: 'formula', content: 'a > 0' },
          {
            kind: 'text',
            content:
              'Eğer bu kural olmasaydı ve a negatif olabilseydi o zaman logaritma fonksiyonu sürekli ve düzgün bir fonksiyon olmazdı (bunu ileride daha detaylı öğreneceğiz.)',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'tanimla-kurallar-icerik',
        blocks: [
          { kind: 'formula', content: '\\log_a b = x' },
          {
            kind: 'text',
            content:
              'Tabanda bulunan a değeri daima pozitif olduğu için logaritmanın içeriğinde bulunan b değeri de daima pozitif olmalıdır.',
          },
          { kind: 'formula', content: 'b > 0' },
          {
            kind: 'text',
            content: 'Şimdi biraz egzersiz yapalım.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'tanimla-kurallar-quiz-1',
        formula: '\\log_a b = x',
        question: 'a değeri aşağıdakilerden hangisi olamaz?',
        choices: [
          { id: 'three', label: '3' },
          { id: 'minus-two', label: '-2' },
          { id: 'five', label: '5' },
        ],
        correctChoiceId: 'minus-two',
      },
      {
        type: 'quiz',
        id: 'tanimla-kurallar-quiz-2',
        formula: '\\log_a b = x',
        question: 'b değeri aşağıdakilerden hangisi olamaz?',
        choices: [
          { id: 'eight', label: '8' },
          { id: 'minus-seven', label: '-7' },
          { id: 'nine', label: '9' },
        ],
        correctChoiceId: 'minus-seven',
      },
      {
        type: 'teaching',
        id: 'tanimla-kurallar-bir-kural',
        blocks: [
          { kind: 'formula', content: '\\log_a b = x' },
          {
            kind: 'text',
            content: "Tabandaki a değeri 1'e eşit olmamalıdır.",
          },
          { kind: 'formula', content: 'a \\neq 1' },
          {
            kind: 'text',
            content:
              "Eğer a değeri 1'e eşit olabilseydi o zaman fonksiyonumuzun karşısına istediğimiz değeri yazabilirdik ve bu da fonksiyon tanımına uymazdı.",
          },
          { kind: 'formula', content: '\\log_1 1 = 5, \\quad 1^5 = 1' },
          { kind: 'formula', content: '\\log_1 1 = 100, \\quad 1^{100} = 1' },
          {
            kind: 'text',
            content: "Bu yüzden taban 1'e eşit olmamalıdır.",
          },
        ],
      },
      {
        type: 'quiz',
        id: 'tanimla-kurallar-quiz-3',
        question: 'Aşağıdakilerden hangisi geçerli bir logaritmik fonksiyon değildir?',
        hint: 'Şıkların sayısal değerlerini bulmayı dene, ikinci şıkkın imkansız olduğunu göreceksin!',
        choices: [
          { id: 'log2-8', label: '\\log_2(8)', isMath: true },
          { id: 'log1-5', label: '\\log_1(5)', isMath: true },
        ],
        correctChoiceId: 'log1-5',
      },
      {
        type: 'quiz',
        id: 'tanimla-kurallar-quiz-4',
        formula: '\\log_{(x-2)} b',
        question: 'Yukarıdaki ifadenin tanımlı olabilmesi için x hangi değeri alabilir?',
        hint: 'Yerine koyup kurallarımızı ihlal edip etmediğin kontrol et!',
        choices: [
          { id: 'two', label: '2' },
          { id: 'three', label: '3' },
          { id: 'four', label: '4' },
        ],
        correctChoiceId: 'four',
      },
      {
        type: 'completion',
        id: 'tanimla-ilgili-kurallar-complete',
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
  'limit-nedir': {
    title: 'Limit nedir?',
    pages: [
      {
        type: 'teaching',
        id: 'limit-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Limit kavramı bir grafikte "yaklaşılan noktayı" ifade etmek için kullanılır.',
          },
          { kind: 'text', content: 'Aşağıdaki grafiği inceleyelim.' },
          {
            kind: 'graph',
            config: {
              functions: [{ formula: 'x^2 + 1', color: '#2563eb' }],
              xDomain: [0, 2],
              yDomain: [0, 5],
              showGrid: true,
              showAxes: true,
              highlightPoints: [{ x: 1, y: 2, color: '#f97316' }],
              approach: {
                x: 1,
                direction: 'both',
                showArrows: true,
                highlightSegment: true,
                arrowColor: '#f97316',
                highlightColor: '#f97316',
                label: 'x → 1',
              },
            },
          },
          {
            kind: 'text',
            content: "x değerimiz 1'e yaklaştıkça y değerimiz de 2'ye yaklaşıyor.",
          },
          {
            kind: 'text',
            content: "Öyleyse bu fonksiyonun 1 noktasındaki limiti 2'ye eşittir.",
          },
        ],
      },
      {
        type: 'teaching',
        id: 'limit-second-example',
        blocks: [
          { kind: 'text', content: 'Bir başka grafiğe bakalım.' },
          {
            kind: 'graph',
            config: {
              functions: [{ formula: 'x', color: '#2563eb' }],
              xDomain: [0, 5],
              yDomain: [0, 5],
              showGrid: true,
              showAxes: true,
              highlightPoints: [{ x: 3, y: 3, color: '#f97316' }],
              approach: {
                x: 3,
                direction: 'both',
                showArrows: true,
                highlightSegment: true,
                arrowColor: '#f97316',
                highlightColor: '#f97316',
                label: 'x → 3',
              },
            },
          },
          {
            kind: 'text',
            content: 'Bu fonksiyon x = 3 noktasında 3 değerine yaklaşıyor.',
          },
          {
            kind: 'text',
            content:
              'Bunu Türkçe değil de matematiksel olarak ifade etmek istersek şöyle diyoruz:',
          },
          {
            kind: 'formula',
            content: '\\lim_{x \\to 3} f(x) = 3',
          },
          {
            kind: 'text',
            content:
              'Yukarıdaki ifadenin Türkçesi şudur: "x değeri 3\'e yaklaşırken f(x) fonksiyonu 3\'e yaklaşır."',
          },
          {
            kind: 'text',
            content:
              'Veya şöyle diyebiliriz: "f(x) fonksiyonunun x = 3 noktasındaki limiti 3\'tür."',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'limit-quiz-1',
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
          { id: 'two', label: '2' },
          { id: 'thirteen', label: '13' },
        ],
        correctChoiceId: 'two',
      },
      {
        type: 'completion',
        id: 'limit-nedir-complete',
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
        
        {/* Input box */}
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
        
        {/* Arrow from input to machine */}
        <Line
          x1="70"
          y1="75"
          x2="130"
          y2="75"
          stroke="#0f172a"
          strokeWidth={3}
          markerEnd="url(#arrowhead-function)"
        />
        
        {/* Function machine box */}
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
        
        {/* Arrow from machine to output */}
        <Line
          x1="270"
          y1="75"
          x2="330"
          y2="75"
          stroke="#0f172a"
          strokeWidth={3}
          markerEnd="url(#arrowhead-function)"
        />
        
        {/* Output box */}
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
        
        {/* Left oval - Set A */}
        <Ellipse
          cx="100"
          cy="100"
          rx="60"
          ry="80"
          fill="none"
          stroke="#2563eb"
          strokeWidth={3}
        />
        <SvgText
          x="100"
          y="30"
          fill="#1e40af"
          fontSize="18"
          fontWeight="bold"
          textAnchor="middle">
          A
        </SvgText>
        
        {/* Elements in Set A */}
        <SvgText
          x="100"
          y="70"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          a
        </SvgText>
        <SvgText
          x="100"
          y="100"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          b
        </SvgText>
        <SvgText
          x="100"
          y="130"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          c
        </SvgText>
        
        {/* Right oval - Set B */}
        <Ellipse
          cx="300"
          cy="100"
          rx="60"
          ry="80"
          fill="none"
          stroke="#dc2626"
          strokeWidth={3}
        />
        <SvgText
          x="300"
          y="30"
          fill="#991b1b"
          fontSize="18"
          fontWeight="bold"
          textAnchor="middle">
          B
        </SvgText>
        
        {/* Elements in Set B */}
        <SvgText
          x="300"
          y="70"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          1
        </SvgText>
        <SvgText
          x="300"
          y="100"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          2
        </SvgText>
        <SvgText
          x="300"
          y="130"
          fill="#0f172a"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle">
          3
        </SvgText>
        
        {/* Arrows from A to B */}
        <Line
          x1="160"
          y1="70"
          x2="240"
          y2="70"
          stroke="#0f172a"
          strokeWidth={2}
          markerEnd="url(#arrowhead-mapping)"
        />
        <Line
          x1="160"
          y1="100"
          x2="240"
          y2="100"
          stroke="#0f172a"
          strokeWidth={2}
          markerEnd="url(#arrowhead-mapping)"
        />
        <Line
          x1="160"
          y1="130"
          x2="240"
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

function renderTeachingBlock(block: TeachingBlock, index: number, colors: typeof Colors.light) {
  switch (block.kind) {
    case 'diagram':
      return (
        <View key={`diagram-${block.diagram}-${index}`} style={[styles.diagramCard, { backgroundColor: colors.cardBackground }]}>
          {renderDiagramByKind(block.diagram)}
        </View>
      );
    case 'text':
      return (
        <Text key={`text-${index}`} style={[styles.bodyText, { color: colors.text }]}>
          {block.content}
        </Text>
      );
    case 'formula':
      return (
        <View key={`formula-${index}`} style={[styles.formulaCard, { backgroundColor: colors.formulaBackground, borderColor: colors.formulaBorder }]}>
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
        <View key={`hint-${index}`} style={[styles.hintCard, { backgroundColor: colors.hintBackground, borderColor: colors.hintBorder }]}>
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
        <View key={`graph-${index}`} style={[styles.diagramCard, { backgroundColor: colors.cardBackground }]}>
          <FunctionGraph config={block.config} />
        </View>
      );
    case 'image': {
      const imageStyle: any = { ...styles.blockImage };
      if (block.width !== undefined) imageStyle.width = block.width;
      if (block.height !== undefined) imageStyle.height = block.height;
      return (
        <View key={`image-${index}`} style={[styles.imageCard, { backgroundColor: colors.cardBackground }]}>
          <Image
            source={block.source}
            style={imageStyle}
            resizeMode={block.resizeMode || 'contain'}
            accessibilityLabel={block.alt}
          />
        </View>
      );
    }
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
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = Colors[theme as 'light' | 'dark'];
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
  const [sessionXp, setSessionXp] = useState(0); // Track XP earned from questions
  const [completionPageIndex, setCompletionPageIndex] = useState(0); // 0 = summary, 1 = rewards
  const [initialUnlockedAvatars, setInitialUnlockedAvatars] = useState<AvatarId[]>([]); // Unlocked avatars at subtopic start
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
    // Reset session XP and completion page when starting a new subtopic
    if (pageIndex === 0) {
      setSessionXp(0);
      setCompletionData(null);
      setCompletionPageIndex(0);
      // Store initial unlocked avatars when starting a new subtopic
      if (user?.id) {
        getUnlockedAvatars(user.id).then((unlocked) => {
          setInitialUnlockedAvatars(unlocked);
        });
      }
    }
  }, [pageIndex, currentPage?.id, subtopic, user?.id]);

  // Animate completion elements with staggered delays
  useEffect(() => {
    if (currentPage?.type === 'completion' && completionData) {
      // Reset all animations
      congratulationsAnim.setValue(0);
      medalAnim.setValue(0);
      xpAnim.setValue(0);
      streakAnim.setValue(0);

      // Animate congratulations box (0.3s delay)
      Animated.timing(congratulationsAnim, {
        toValue: 1,
        duration: 350,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Animate medal image (0.6s delay)
      Animated.timing(medalAnim, {
        toValue: 1,
        duration: 350,
        delay: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Animate XP info box (0.9s delay)
      Animated.timing(xpAnim, {
        toValue: 1,
        duration: 350,
        delay: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Animate streak box (1.2s delay) - only if streak increased
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

  const handleAdvance = async () => {
    try {
      // Light haptic feedback for navigation/advance button
      if (Platform.OS === 'web') {
        await Haptics.selectionAsync();
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Silently fail if haptics aren't available
    }
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
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Silently fail if haptics aren't available
      }
      await addXp(user.id, 10);
      setSessionXp(prev => prev + 10); // Track XP for completion summary
      // Show XP panel with advance button for quiz questions
      const isQuizPage = page.type === 'quiz';
      showXp(10, {
        showAdvance: isQuizPage,
        onAdvance: isQuizPage ? handleAdvance : undefined,
      });
      await playCorrect();
    } else if (!isCorrectNow) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Silently fail if haptics aren't available
      }
      await playNegative();
    }
  };

  const handleCompletionPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      // Silently fail if haptics aren't available
    }
    router.replace(completionTarget as never);
  };

  const handleAdvanceToRewards = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      // Silently fail if haptics aren't available
    }
    // Move to rewards page if rewards exist
    if (completionData?.hasRewards) {
      setCompletionPageIndex(1);
    } else {
      // No rewards, go directly to finish
      await handleCompletionPress();
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

      // Get streak before updating
      const streakBefore = await getStreakState(user.id);
      
      let xpAmount = 0;
      if (typeof subtopic === 'string') {
        const isNew = await markSubtopicCompleted(user.id, subtopic);
        xpAmount = isNew ? 20 : 5;
      }
      
      // Update streak and get new value
      const streakAfter = await recordStreakActivity(user.id);
      
      if (xpAmount > 0) {
        await addXp(user.id, xpAmount);
        // Don't show XP toast here - will show in completion summary
      }
      
      // Wait a bit for background unlock checks from addXp/recordStreakActivity to complete
      await new Promise(resolve => setTimeout(resolve, 200)); // Give time for background unlocks
      
      // Get current unlocked avatars after all updates
      const finalUnlockedAvatars = await getUnlockedAvatars(user.id);
      
      // Find avatars that were unlocked during THIS subtopic session
      const newlyUnlockedIds = finalUnlockedAvatars.filter(
        id => !initialUnlockedAvatars.includes(id)
      );
      
      // Map to display format
      const newlyUnlockedAvatars = newlyUnlockedIds.map((id) => {
        let condition = '';
        if (id === '4') {
          condition = '1000XP topla';
        } else if (id === '5') {
          condition = '3 günlük seri yakala';
        }
        return { id, condition };
      });
      
      // Calculate completion data for summary page
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
  // Show advance button separately only for non-quiz pages
  // Quiz pages show advance button inside XP panel
  const showAdvanceButton =
    lesson &&
    currentPage?.type !== 'completion' &&
    currentPage?.type !== 'quiz' &&
    !isLastPage;

  const isCompletionPage = currentPage?.type === 'completion';
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 32), backgroundColor: colors.background }]}>
        {!isCompletionPage && (
          <View style={styles.topRow}>
            <Pressable
              style={[styles.navButton, { backgroundColor: colors.cardBackgroundSecondary }]}
              onPress={async () => {
                try {
                  if (Platform.OS === 'web') {
                    await Haptics.selectionAsync();
                  } else {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                } catch (error) {
                  // Silently fail if haptics aren't available
                }
                router.back();
              }}>
              <Text style={[styles.navButtonText, { color: colors.text }]}>{'‹'} Geri</Text>
            </Pressable>
            <Pressable
              style={[styles.navButton, { backgroundColor: colors.cardBackgroundSecondary }]}
              onPress={async () => {
                try {
                  if (Platform.OS === 'web') {
                    await Haptics.selectionAsync();
                  } else {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                } catch (error) {
                  // Silently fail if haptics aren't available
                }
                router.push('/');
              }}>
              <Text style={[styles.navButtonText, { color: colors.text }]}>⌂ Ana Sayfa</Text>
            </Pressable>
          </View>
        )}

        {!isCompletionPage && (
          <>
            <Text style={[styles.headline, { color: colors.text }]}>{effectiveTitle}</Text>
            {lesson && lesson.pages.length > 0 && (
              <ProgressDots totalPages={lesson.pages.length} currentPageIndex={pageIndex} />
            )}
          </>
        )}

        {lesson && currentPage?.type === 'teaching' && (
          <View style={[styles.pageCard, { backgroundColor: colors.cardBackground }]}>
            {currentPage.blocks.map((block, index) =>
              renderTeachingBlock(block, index, colors),
            )}
          </View>
        )}

        {lesson && currentPage?.type === 'quiz' && (
          <View style={[styles.pageCard, { backgroundColor: colors.cardBackground }]}>
            {currentPage.blocks ? (
              // New block-based rendering
              <>
                {currentPage.blocks.map((block, index) =>
                  renderTeachingBlock(block, index, colors),
                )}
                {currentPage.hint && (
                  <View style={[styles.hintCard, { backgroundColor: colors.hintBackground, borderColor: colors.hintBorder }]}>
                    {currentPage.hint.includes('\\') ? (
                      <MathText latex={currentPage.hint} widthFactor={0.7} fontSize={18} textAlign="left" />
                    ) : (
                      <Text style={[styles.hintText, { color: colors.hintText }]}>{currentPage.hint}</Text>
                    )}
                  </View>
                )}
              </>
            ) : (
              // Legacy rendering (backward compatibility)
              <>
                {renderDiagram(getPageDiagram(currentPage))}
                {currentPage.graph && (
                  <View style={[styles.diagramCard, { backgroundColor: colors.cardBackground }]}>
                    <FunctionGraph config={currentPage.graph} />
                  </View>
                )}
                {currentPage.formula && (
                  <View style={[styles.formulaCard, { backgroundColor: colors.formulaBackground, borderColor: colors.formulaBorder }]}>
                    <MathText
                      latex={currentPage.formula}
                      widthFactor={0.75}
                      fontSize={20}
                      textAlign="center"
                    />
                  </View>
                )}
                {currentPage.question && (
                  <Text style={[styles.bodyText, { color: colors.text }]}>{currentPage.question}</Text>
                )}
                {currentPage.hint && (
                  <View style={[styles.hintCard, { backgroundColor: colors.hintBackground, borderColor: colors.hintBorder }]}>
                    {currentPage.hint.includes('\\') ? (
                      <MathText latex={currentPage.hint} widthFactor={0.7} fontSize={18} textAlign="left" />
                    ) : (
                      <Text style={[styles.hintText, { color: colors.hintText }]}>{currentPage.hint}</Text>
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
                      { backgroundColor: colors.quizChoiceBackground, borderColor: colors.quizChoiceBorder },
                      isSelected && { borderColor: colors.quizChoiceSelected },
                      isCorrectSelection && {
                        backgroundColor: colors.quizChoiceCorrect,
                        borderColor: colors.quizChoiceCorrectBorder,
                      },
                      isIncorrectSelection && {
                        backgroundColor: colors.quizChoiceIncorrect,
                        borderColor: colors.quizChoiceIncorrectBorder,
                      },
                      pressed && !isSelected && { backgroundColor: colors.cardBackgroundSecondary },
                    ]}
                    onPress={() => {
                      void handleChoiceSelect(choice.id, currentPage);
                    }}>
                    {'graph' in choice ? (
                      <View style={styles.choiceGraphContainer}>
                        <Text
                          style={[
                            styles.choiceLabel,
                            { color: colors.text },
                            isCorrectSelection && { color: colors.success },
                            isIncorrectSelection && { color: colors.error },
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
                          { color: colors.text },
                          isCorrectSelection && { color: colors.success },
                          isIncorrectSelection && { color: colors.error },
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
                style={[styles.secondaryButton, { borderColor: colors.error }]}
                onPress={() => {
                  setSelectedChoice(null);
                  setIsChoiceCorrect(null);
                }}>
                <Text style={[styles.secondaryButtonText, { color: colors.error }]}>Tekrar dene</Text>
              </Pressable>
            )}
          </View>
        )}

        {lesson && currentPage?.type === 'placeholder' && (
          <View style={[styles.pageCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.bodyTextMuted, { color: colors.textSecondary }]}>
              {getPlaceholderMessage(currentPage)}
            </Text>
          </View>
        )}

        {lesson && currentPage?.type === 'completion' && completionData && (
          <>
            {/* Completion Summary Page (Page 1) */}
            {completionPageIndex === 0 && (
              <View style={[styles.pageCard, { backgroundColor: colors.cardBackground }]}>
                {/* Congratulations Header Box */}
                <Animated.View style={[styles.rewardSection, styles.congratulationsBox, createSlideStyle(congratulationsAnim)]}>
                  <Text style={[styles.completionTitle, { color: colors.text }]}>
                    🎉 TEBRİKLER
                  </Text>
                  <Text style={[styles.completionSubtitle, { color: colors.textSecondary }]}>
                    Desen Tamamlandı!
                  </Text>
                </Animated.View>

                {/* Medal Image */}
                <Animated.View style={[styles.medalContainer, createSlideStyle(medalAnim)]}>
                  <Image
                    source={require('@/assets/images/7.png')}
                    style={styles.medalImage}
                    resizeMode="contain"
                  />
                </Animated.View>

                {/* XP Summary Section */}
                <Animated.View style={[styles.rewardSection, { backgroundColor: colors.cardBackground }, createSlideStyle(xpAnim)]}>
                  <Text style={[styles.rewardSectionTitle, { color: colors.textSecondary }]}>BU MODÜLDE TOPLAM</Text>
                  <Text style={[styles.rewardMainValue, { color: colors.text }]}>
                    ⭐ {completionData.totalXp} XP Kazandın!
                  </Text>
                </Animated.View>

                {/* Streak Section (only if streak increased) */}
                {completionData.streakIncreased && (
                  <Animated.View style={[styles.rewardSection, { backgroundColor: colors.cardBackground }, createSlideStyle(streakAnim)]}>
                    <Text style={[styles.rewardSectionTitle, { color: colors.textSecondary }]}>🔥 SERİ</Text>
                    <Text style={[styles.rewardMainValue, { color: colors.text }]}>
                      Seriniz: {completionData.streakAfter} gün
                    </Text>
                  </Animated.View>
                )}

                {/* Button: İlerle if rewards exist, Bitir if not */}
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={completionData.hasRewards ? handleAdvanceToRewards : handleCompletionPress}>
                  <Text style={styles.primaryButtonText}>
                    {completionData.hasRewards ? 'İlerle' : 'Bitir'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Rewards Page (Page 2) - Only shown if rewards exist */}
            {completionPageIndex === 1 && completionData.hasRewards && (
              <View style={[styles.pageCard, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.completionTitle, { color: colors.text }]}>🎁 YENİ KAZANÇLAR</Text>
                
                {/* Newly unlocked avatars */}
                {completionData.newlyUnlockedAvatars.map((avatar) => {
                  const avatarSource = getAvatarSource(avatar.id);
                  return (
                    <View key={avatar.id} style={[styles.rewardSection, { backgroundColor: colors.cardBackground }]}>
                      {avatarSource && (
                        <Image
                          source={avatarSource}
                          style={styles.unlockedAvatarImage}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={[styles.rewardMainValue, { color: colors.text }]}>
                        🎉 Yeni avatar açıldı!
                      </Text>
                      <Text style={[styles.rewardBreakdown, { color: colors.textSecondary }]}>
                        {avatar.condition}
                      </Text>
                    </View>
                  );
                })}

                <Pressable
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleCompletionPress}>
                  <Text style={styles.primaryButtonText}>Bitir</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {showAdvanceButton && (
          <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleAdvance}>
            <Text style={styles.primaryButtonText}>İlerle</Text>
          </Pressable>
        )}

        {!lesson && (
          <View style={[styles.pageCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.bodyTextMuted, { color: colors.textSecondary }]}>
              Bu alt konu için henüz içerik tanımlanmadı.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function to create shadow styles compatible with web
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
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 24,
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
    ...createShadowStyle('#0f172a', 0.12, 8, { width: 0, height: 4 }, 5),
  },
  navButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  headline: {
    fontSize: 32,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  pageCard: {
    borderRadius: 24,
    padding: 24,
    gap: 24,
    ...createShadowStyle('#0f172a', 0.12, 12, { width: 0, height: 6 }, 8),
  },
  diagramCard: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  blockImage: {
    width: '100%',
    maxWidth: '100%',
    aspectRatio: 1,
  },
  formulaCard: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Montserrat_700Bold',
  },
  hintText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Montserrat_700Bold',
  },
  hintCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'stretch',
  },
  quizChoices: {
    gap: 12,
  },
  choiceButton: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 2,
  },
  choiceText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  choiceGraphContainer: {
    alignItems: 'center',
    gap: 8,
  },
  choiceLabel: {
    fontSize: 14,
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
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  completionTitle: {
    fontSize: 28,
    textAlign: 'center',
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'Montserrat_700Bold',
  },
  rewardSection: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    ...createShadowStyle('#0f172a', 0.1, 8, { width: 0, height: 4 }, 4),
  },
  congratulationsBox: {
    marginTop: -8,
  },
  rewardSectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  rewardMainValue: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  rewardBreakdown: {
    fontSize: 14,
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



