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
  'tek-cift-sayilar': {
    title: 'Tek & Çift Sayılar',
    pages: [
      {
        type: 'teaching',
        id: 'tek-cift-intro',
        blocks: [
          {
            kind: 'text',
            content: '2\'ye tam bölünen sayılar ÇİFT, bölünemeyenler TEK sayıdır.',
          },
          {
            kind: 'text',
            content: 'Çiftler:',
          },
          {
            kind: 'formula',
            content: '0, 2, 4, 6...',
          },
          {
            kind: 'text',
            content: 'Tekler:',
          },
          {
            kind: 'formula',
            content: '1, 3, 5, 7...',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'tek-cift-sorular',
        blocks: [
          {
            kind: 'text',
            content: 'Sorularda iki sayının toplamı verilir ve "Hangisi kesinlikle çifttir?" veya "Hangisi tek olabilir?" gibi sorular sorulur.',
          },
          {
            kind: 'text',
            content: 'Bu sorularda bilmen gereken en önemli kural şudur:',
          },
          {
            kind: 'text',
            content: 'İki aynı türü toplarsan sonuç ÇİFT olur.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'tek-cift-toplama-kurallari',
        blocks: [
          {
            kind: 'text',
            content: 'Kural: İki aynı türü toplarsan sonuç ÇİFT olur.',
          },
          {
            kind: 'text',
            content: 'Tek + Tek = Çift',
          },
          {
            kind: 'formula',
            content: '3 + 5 = 8',
          },
          {
            kind: 'text',
            content: 'Çift + Çift = Çift',
          },
          {
            kind: 'formula',
            content: '2 + 4 = 6',
          },
          {
            kind: 'text',
            content: 'İki farklı tür toplanırsa sonuç TEK olur.',
          },
          {
            kind: 'text',
            content: 'Tek + Çift = Tek',
          },
          {
            kind: 'formula',
            content: '3 + 4 = 7',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'tek-cift-toplama-quiz-1',
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
        type: 'teaching',
        id: 'tek-cift-carpim-giris',
        blocks: [
          {
            kind: 'text',
            content: 'Sorularda çarpım işlemi de verilebilir ve "Hangisi kesinlikle çifttir?" veya "Hangisi tek olabilir?" gibi sorular sorulabilir.',
          },
          {
            kind: 'text',
            content: 'Çarpım için en önemli kural ise şudur:',
          },
          {
            kind: 'text',
            content: 'Çarpımda ÇİFT varsa sonuç ÇİFTtir.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'tek-cift-carpim-kurallari',
        blocks: [
          {
            kind: 'text',
            content: 'Çarpımda ÇİFT varsa sonuç ÇİFTtir.',
          },
          {
            kind: 'text',
            content: 'Tek x Çift = Çift',
          },
          {
            kind: 'formula',
            content: '3 \\times 2 = 6',
          },
          {
            kind: 'text',
            content: 'Çift x Çift = Çift',
          },
          {
            kind: 'formula',
            content: '2 \\times 2 = 4',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'tek-cift-carpim-quiz-1',
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
      {
        type: 'completion',
        id: 'tek-cift-complete',
      },
    ],
  },
  'sayi-kumeleri': {
    title: 'Sayı Kümeleri',
    pages: [
      {
        type: 'teaching',
        id: 'sayi-kumeleri-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Sayılar özelliklerine göre gruplara ayrılırlar. Bu gruplara "Sayı Kümeleri" denir.',
          },
          {
            kind: 'text',
            content: 'Sayma sayıları, doğal sayılar, tam sayılar, rasyonel sayılar ve çok daha fazlası...',
          },
          {
            kind: 'text',
            content: 'Örneğin sayma sayıları saymak için kullandığımız sayılardır ve 1\'den başlayıp sonsuza kadar giderler.',
          },
          {
            kind: 'formula',
            content: 'S = \\{1, 2, 3, ...\\}',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'sayi-kumeleri-dogal-tam',
        blocks: [
          {
            kind: 'text',
            content: 'Bir başka tanıdık sayı kümesi ise "Doğal Sayılar"dır.',
          },
          {
            kind: 'text',
            content: 'Doğal Sayılar 0\'dan başlar ve sonsuza kadar gider.',
          },
          {
            kind: 'formula',
            content: '\\mathbb{N} = \\{0, 1, 2, 3, ...\\}',
          },
          {
            kind: 'text',
            content: '"Tam Sayılar" kümesi ise negatif sayıları da içerir:',
          },
          {
            kind: 'formula',
            content: '\\mathbb{Z} = \\{..., -2, -1, 0, 1, 2, ...\\}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'sayi-kumeleri-quiz-1',
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
        type: 'teaching',
        id: 'sayi-kumeleri-rasyonel',
        blocks: [
          {
            kind: 'text',
            content: '"Rasyonel Sayılar" ise tam sayıları ve küsüratlı (kesirli) sayıları içinde barındıran daha büyük bir sayı kümesidir.',
          },
          {
            kind: 'text',
            content: 'Aşağıdaki örneklerin hepsi rasyonel sayılar kümesindedir:',
          },
          {
            kind: 'formula',
            content: '-5, -4, 0, 3, 77, 1000',
          },
          {
            kind: 'formula',
            content: '\\frac{5}{3}, 0.93, \\frac{1}{10}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'sayi-kumeleri-quiz-2',
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
      {
        type: 'completion',
        id: 'sayi-kumeleri-complete',
      },
    ],
  },
  'ardisik-sayilar': {
    title: 'Ardışık Sayılar',
    pages: [
      {
        type: 'teaching',
        id: 'ardisik-sayilar-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Arka arkaya, belli bir kurala göre gelen sayılara ardışık sayılar denir.',
          },
          {
            kind: 'text',
            content: 'Bunları "örüntüler" gibi düşünebilirsin.',
          },
          {
            kind: 'text',
            content: 'En basit hali birer birer artanlardır:',
          },
          {
            kind: 'formula',
            content: '1, 2, 3, 4...',
          },
          {
            kind: 'text',
            content: 'Daha "matematiksel" bir gösterim yapalım:',
          },
          {
            kind: 'formula',
            content: 'n, n+1, n+2, ...',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'ardisik-sayilar-tek-cift',
        blocks: [
          {
            kind: 'text',
            content: 'Soru bize "ardışık ÇİFT sayılar" veya "ardışık TEK sayılar" derse bu sefer sayıların 2\'şer 2\'şer arttığını bilmliyiz.',
          },
          {
            kind: 'text',
            content: 'Ardışık TEK sayılar:',
          },
          {
            kind: 'formula',
            content: '1, 3, 5, ...',
          },
          {
            kind: 'text',
            content: 'Ardışık ÇİFT sayılar:',
          },
          {
            kind: 'formula',
            content: '2, 4, 6, ...',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'ardisik-sayilar-quiz-1',
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
        type: 'quiz',
        id: 'ardisik-sayilar-quiz-2',
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
      {
        type: 'completion',
        id: 'ardisik-sayilar-complete',
      },
    ],
  },
  'asal-sayilar': {
    title: 'Asal Sayılar',
    pages: [
      {
        type: 'teaching',
        id: 'asal-sayilar-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Sadece 1\'e ve kendisine bölünebilen, 1\'den büyük doğal sayılara "Asal Sayı" denir.',
          },
          {
            kind: 'formula',
            content: '2, 3, 5, 7, 11, 13...',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'asal-sayilar-kritik',
        blocks: [
          {
            kind: 'text',
            content: 'İki kritik bilgi:',
          },
          {
            kind: 'text',
            content: '1) En küçük asal sayı 2\'dir. (1 asal değildir!)',
          },
          {
            kind: 'text',
            content: '2) Çift olup asal olan tek sayı 2\'dir. Başka çift asal sayı yoktur.',
          },
          {
            kind: 'text',
            content: 'Çünkü 2\'den büyük çift sayıların hepsi kendisine, 1\'e ve 2\'ye bölünür! Bu da "asallığı" bozar.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'asal-sayilar-quiz-1',
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
      {
        type: 'completion',
        id: 'asal-sayilar-complete',
      },
    ],
  },
  'basamak-kavrami': {
    title: 'Basamak Kavramı',
    pages: [
      {
        type: 'teaching',
        id: 'basamak-kavrami-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Birler, onlar ve yüzler basamağının neler olduğunu ilkokulda öğrenmiştik.',
          },
          {
            kind: 'text',
            content: 'Sayıları bu basamaklarına göre çözümleyebiliriz.',
          },
          {
            kind: 'text',
            content: 'Örneğin 246 sayısı aynı zamanda şuna eşittir:',
          },
          {
            kind: 'formula',
            content: '246 = 200 + 40 + 6',
          },
          {
            kind: 'text',
            content: 'Bunu da şu şekilde yazabiliriz:',
          },
          {
            kind: 'formula',
            content: '246 = 2 \\cdot 100 + 4 \\cdot 10 + 6 \\cdot 1',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'basamak-kavrami-genel',
        blocks: [
          {
            kind: 'formula',
            content: '246 = 2 \\cdot 100 + 4 \\cdot 10 + 6 \\cdot 1',
          },
          {
            kind: 'text',
            content: 'Bu örneği bütün sayılar için genelleştirebiliriz:',
          },
          {
            kind: 'formula',
            content: 'ABC = A \\cdot 100 + B \\cdot 10 + C \\cdot 1',
          },
          {
            kind: 'text',
            content: 'Sayılar iki basamaklı olduğunda da şöyle yaparız:',
          },
          {
            kind: 'formula',
            content: 'AB = A \\cdot 10 + B \\cdot 1',
          },
          {
            kind: 'text',
            content: 'Yani AB sayısını gördüğünde aklına "10 tane A ve 1 tane B" gelmeli.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'basamak-kavrami-quiz-1',
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
        type: 'quiz',
        id: 'basamak-kavrami-quiz-2',
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
        type: 'teaching',
        id: 'basamak-kavrami-toplama',
        blocks: [
          {
            kind: 'text',
            content: 'Peki AB ve BA iki basamaklı sayılarını toplarsam sonucu ne olur?',
          },
          {
            kind: 'formula',
            content: 'AB + BA = ?',
          },
          {
            kind: 'text',
            content: 'Bunun için iki sayıyı da çözümlemeliyiz:',
          },
          {
            kind: 'formula',
            content: 'AB = 10A + B',
          },
          {
            kind: 'formula',
            content: 'BA = 10B + A',
          },
          {
            kind: 'text',
            content: 'Sonra da ikisini toplamalıyız:',
          },
          {
            kind: 'formula',
            content: '10A + B + 10B + A',
          },
          {
            kind: 'formula',
            content: '11A + 11B',
          },
          {
            kind: 'formula',
            content: '11(A + B)',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'basamak-kavrami-quiz-3',
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
      {
        type: 'completion',
        id: 'basamak-kavrami-complete',
      },
    ],
  },
  'bolunebilme-kurallari': {
    title: 'Bölünebilme Kuralları',
    pages: [
      {
        type: 'teaching',
        id: 'bolunebilme-kurallari-2-5-10',
        blocks: [
          {
            kind: 'text',
            content: '2, 5 ve 10 sayılarının bölünebilme kuralları yalnızca "son basamakla" ilgilidir.',
          },
          {
            kind: 'text',
            content: 'Sayının 2 ile bölünebilmesi için son basamak çift olmalıdır.',
          },
          {
            kind: 'text',
            content: 'Sayının 5 ile bölünebilmesi için son basamak "0" veya "5" olmalıdır.',
          },
          {
            kind: 'text',
            content: 'Sayının 10 ile bölünebilmesi için son basamak "0" olmalıdır.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'bolunebilme-kurallari-quiz-1',
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
        type: 'teaching',
        id: 'bolunebilme-kurallari-3-9',
        blocks: [
          {
            kind: 'text',
            content: '3 ve 9 ile bölünebilme kuralları ise sayının rakamları toplamı ile ilgilidir.',
          },
          {
            kind: 'text',
            content: 'Sayının 3 ile bölünebilmesi için rakamları toplamı 3\'ün katı olmalıdır. Örneğin 123 sayısı:',
          },
          {
            kind: 'formula',
            content: '123 \\rightarrow 1 + 2 + 3 = 6',
          },
          {
            kind: 'text',
            content: 'Sayının 9 ile bölünebilmesi için rakamları toplamı 9\'un katı olmalıdır. Örneğin 225 sayısı:',
          },
          {
            kind: 'formula',
            content: '225 \\rightarrow 2 + 2 + 5 = 9',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'bolunebilme-kurallari-quiz-2',
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
      {
        type: 'completion',
        id: 'bolunebilme-kurallari-complete',
      },
    ],
  },
  'bolunebilme-kurallari-2': {
    title: 'Bölünebilme Kuralları 2',
    pages: [
      {
        type: 'teaching',
        id: 'bolunebilme-kurallari-2-4-8',
        blocks: [
          {
            kind: 'text',
            content: 'Bu modülde 4, 6, 8 ve 11 ile bölünebilme kurallarını öğreneceğiz.',
          },
          {
            kind: 'text',
            content: 'Bir sayının 4 ile bölünebilmesi için son İKİ basamağının 4\'ün katı olması gerekir.',
          },
          {
            kind: 'text',
            content: 'Örnekler:',
          },
          {
            kind: 'formula',
            content: '16, 516, 9916',
          },
          {
            kind: 'text',
            content: 'Bir sayının 8 ile bölünebilmesi için son ÜÇ basamağının 8\'in katı olması gerekir.',
          },
          {
            kind: 'text',
            content: 'Örnekler:',
          },
          {
            kind: 'formula',
            content: '160, 5160, ...',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'bolunebilme-kurallari-2-quiz-1',
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
        type: 'teaching',
        id: 'bolunebilme-kurallari-2-6',
        blocks: [
          {
            kind: 'text',
            content: '6 ile bölünebilme kuralı gayet basittir: Bir sayı hem 2 hem de 3\'e bölünüyorsa 6\'ya da bölünür.',
          },
          {
            kind: 'text',
            content: 'Çünkü 2 ve 3, 6\'nın çarpanlarıdır.',
          },
          {
            kind: 'text',
            content: 'Örnekler:',
          },
          {
            kind: 'formula',
            content: '6, 12, 18, 24...',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'bolunebilme-kurallari-2-quiz-2',
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
        type: 'teaching',
        id: 'bolunebilme-kurallari-2-11',
        blocks: [
          {
            kind: 'text',
            content: 'Bir sayının 11 ile bölünüp bölünemeyeceğini bulmak için sayının en sağından en soluna doğru sırasıyla (+) ve (-) yerleştiririz.',
          },
          {
            kind: 'formula',
            content: '625 \\rightarrow +6 -2 +5',
          },
          {
            kind: 'text',
            content: 'Sonrasında başlarında (+) olanları toplayıp (-) olanları ondan çıkarırız.',
          },
          {
            kind: 'formula',
            content: '+6 +5 -2 = 9',
          },
          {
            kind: 'text',
            content: 'Eğer sonuç 11\'in katı ise (0, 11, 22...) o zaman sayı 11 ile bölünür.',
          },
          {
            kind: 'text',
            content: '625 örneğinde sayı 9 çıktı, yani 625 sayısı 11 ile bölünmüyor!',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'bolunebilme-kurallari-2-quiz-3',
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
      {
        type: 'completion',
        id: 'bolunebilme-kurallari-2-complete',
      },
    ],
  },
  'kalan-bulma-mantigi': {
    title: 'Kalan Bulma Mantığı',
    pages: [
      {
        type: 'teaching',
        id: 'kalan-bulma-mantigi-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Şu ana kadar hep tam bölünen sayıları inceledik ancak tam bölünemeyen sayıları da ifade edebilmeliyiz:',
          },
          {
            kind: 'text',
            content: 'Örneğin 10 sayısını 3 ile bölersek ne olur?',
          },
          {
            kind: 'text',
            content: '10 sayısının içinde 3 tane 3 bulabiliriz, geriye ise 1 kalır.',
          },
          {
            kind: 'formula',
            content: '10 = 3 \\cdot 3 + 1',
          },
          {
            kind: 'text',
            content: 'Yani 10 sayısının 3 ile bölümünden kalanı 1\'dir.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'kalan-bulma-mantigi-quiz-1',
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
        type: 'teaching',
        id: 'kalan-bulma-mantigi-formul',
        blocks: [
          {
            kind: 'text',
            content: 'Bu kalan durumunu matematiksel şekilde ifade edelim.',
          },
          {
            kind: 'text',
            content: 'Sayımız A olsun ve B ile bölünüyor olsun.',
          },
          {
            kind: 'text',
            content: 'A\'nın içinde C tane B olsun ve bölümden kalan da K olsun.',
          },
          {
            kind: 'formula',
            content: 'A = B \\cdot C + K',
          },
          {
            kind: 'text',
            content: 'Bölünen (A) = Bölen (B) çarpı Sonuç (C) artı Kalan (K)',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'kalan-bulma-mantigi-quiz-2',
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
        type: 'teaching',
        id: 'kalan-bulma-mantigi-kural',
        blocks: [
          {
            kind: 'text',
            content: 'Önemli bir kural ile kapatalım:',
          },
          {
            kind: 'text',
            content: 'Kalan her zaman bölenden KÜÇÜK olmalıdır',
          },
          {
            kind: 'formula',
            content: 'Kalan < Bölen',
          },
          {
            kind: 'text',
            content: 'Düşün: Bir sayının 8 ile bölümünden kalan 12 olabilir mi?',
          },
          {
            kind: 'text',
            content: 'Olamaz! Çünkü o 12\'yi de 8\'e bölebiliriz ve kalan 4 olur.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'kalan-bulma-mantigi-quiz-3',
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
      {
        type: 'completion',
        id: 'kalan-bulma-mantigi-complete',
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
