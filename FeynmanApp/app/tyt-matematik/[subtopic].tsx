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
  'rasyonel-sayilar': {
    title: 'Rasyonel Sayılar',
    pages: [
      {
        type: 'teaching',
        id: 'rasyonel-sayilar-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Kesirli sayıları öğrenmiştik, "Rasyonel Sayılar" da onlara çok benzer.',
          },
          {
            kind: 'text',
            content: 'Bu sayıların hepsini "pay" ve "payda" cinsinden yazabiliriz.',
          },
          {
            kind: 'formula',
            content: '\\frac{\\text{Pay}}{\\text{Payda}}',
          },
          {
            kind: 'text',
            content: 'Aşağıdakilerden hepsi birer "rasyonel sayı"dır:',
          },
          {
            kind: 'formula',
            content: '\\frac{2}{3}, \\quad \\frac{4}{10}, \\quad -\\frac{5}{8}',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'rasyonel-sayilar-tam-sayilar',
        blocks: [
          {
            kind: 'text',
            content: 'Tam sayılar da birer rasyonel sayıdır.',
          },
          {
            kind: 'formula',
            content: '-2, \\quad -1, \\quad 0, \\quad 1, \\quad 2',
          },
          {
            kind: 'text',
            content: 'Bu sayıları "pay" ve "payda" cinsinden yazmak istersek hepsinin paydasına gizli bir "1" getirebiliriz.',
          },
          {
            kind: 'formula',
            content: '-\\frac{2}{1}, \\quad -\\frac{1}{1}, \\quad \\frac{0}{1}, \\quad \\frac{1}{1}, \\quad \\frac{2}{1}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'rasyonel-sayilar-quiz-1',
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
        type: 'teaching',
        id: 'rasyonel-sayilar-ondalik-1',
        blocks: [
          {
            kind: 'text',
            content: 'Paydasında 10, 100, ... olan rasyonel sayıları ondalık sayı şeklinde gösterebiliriz.',
          },
          {
            kind: 'text',
            content: 'Bazı örnekler:',
          },
          {
            kind: 'formula',
            content: '\\frac{2}{10} = 0,2',
          },
          {
            kind: 'formula',
            content: '\\frac{25}{100} = 0,25',
          },
          {
            kind: 'formula',
            content: '\\frac{32}{1000} = 0,032',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'rasyonel-sayilar-ondalik-2',
        blocks: [
          {
            kind: 'text',
            content: 'Bazı sayıların paydasında 10 veya 100 bulunmasa da ondalık gösterimleri istenebilir.',
          },
          {
            kind: 'text',
            content: 'Bu durumlarda sayımızı "genişletmeliyiz":',
          },
          {
            kind: 'text',
            content: 'Genişletme işlemi sayının üstünü ve altını aynı değerle çarparak yapılır:',
          },
          {
            kind: 'formula',
            content: '\\frac{2}{5} \\rightarrow \\frac{2}{5} \\cdot \\frac{2}{2} = \\frac{4}{10}',
          },
          {
            kind: 'formula',
            content: '\\frac{4}{10} = 0,4',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'rasyonel-sayilar-quiz-2',
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
      {
        type: 'completion',
        id: 'rasyonel-sayilar-complete',
      },
    ],
  },
  'genisletme-sadelestirme': {
    title: 'Genişletme ve Sadeleştirme',
    pages: [
      {
        type: 'teaching',
        id: 'genisletme-sadelestirme-genisletme',
        blocks: [
          {
            kind: 'text',
            content: 'Bir önceki modülde genişletmeyi öğrenmiştik.',
          },
          {
            kind: 'text',
            content: 'Sayının pay ve paydasını aynı değerle çarparak aynı sayının farklı bir gösterimini elde edebilirsin:',
          },
          {
            kind: 'formula',
            content: '\\frac{2}{5} = \\frac{4}{10}',
          },
          {
            kind: 'formula',
            content: '\\frac{4}{3} = \\frac{12}{9}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'genisletme-sadelestirme-quiz-1',
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
        type: 'teaching',
        id: 'genisletme-sadelestirme-sadelestirme',
        blocks: [
          {
            kind: 'text',
            content: 'Genişletmenin tersi olan "sadeleştirme" çok işimize yarar.',
          },
          {
            kind: 'text',
            content: 'Sadeleştirme yaparken payı ve paydayı aynı sayıya "böleriz".',
          },
          {
            kind: 'text',
            content: 'Örnekler:',
          },
          {
            kind: 'formula',
            content: '\\frac{4}{8} = \\frac{2}{4} = \\frac{1}{2}',
          },
          {
            kind: 'formula',
            content: '\\frac{3}{9} = \\frac{1}{3}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'genisletme-sadelestirme-quiz-2',
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
      {
        type: 'completion',
        id: 'genisletme-sadelestirme-complete',
      },
    ],
  },
  'rasyonel-sayilarda-islemler': {
    title: 'Rasyonel Sayılarda İşlemler',
    pages: [
      {
        type: 'teaching',
        id: 'rasyonel-sayilarda-islemler-toplama-cikarma',
        blocks: [
          {
            kind: 'text',
            content: 'Rasyonel sayılarda toplama veya çıkarma yapabilmek için paydaların eşit olması şarttır.',
          },
          {
            kind: 'formula',
            content: '\\frac{1}{2} + \\frac{1}{3}',
          },
          {
            kind: 'text',
            content: 'Paydalar (2 ve 3) eşit değil. Onları ortak bir sayıda (6) buluşturmalıyız.',
          },
          {
            kind: 'formula',
            content: '\\frac{1}{2} = \\frac{3}{6}',
          },
          {
            kind: 'formula',
            content: '\\frac{1}{3} = \\frac{2}{6}',
          },
          {
            kind: 'text',
            content: 'Artık payları toplayabiliriz:',
          },
          {
            kind: 'formula',
            content: '\\frac{3}{6} + \\frac{2}{6}',
          },
          {
            kind: 'formula',
            content: '\\frac{3 + 2}{6} = \\frac{5}{6}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'rasyonel-sayilarda-islemler-quiz-1',
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
        type: 'quiz',
        id: 'rasyonel-sayilarda-islemler-quiz-2',
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
        type: 'quiz',
        id: 'rasyonel-sayilarda-islemler-quiz-3',
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
        type: 'teaching',
        id: 'rasyonel-sayilarda-islemler-carpma',
        blocks: [
          {
            kind: 'text',
            content: 'Çarpma işlemi en kolayıdır.',
          },
          {
            kind: 'text',
            content: 'Payda eşitlemeyiz, payları ve paydaları ayrı ayrı çarparız. Hepsi bu!',
          },
          {
            kind: 'formula',
            content: '\\frac{2}{3} \\cdot \\frac{4}{3} = \\frac{8}{9}',
          },
          {
            kind: 'formula',
            content: '\\frac{1}{5} \\cdot \\frac{2}{10} = \\frac{2}{50}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'rasyonel-sayilarda-islemler-quiz-4',
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
        type: 'teaching',
        id: 'rasyonel-sayilarda-islemler-bolme',
        blocks: [
          {
            kind: 'text',
            content: 'Bölme işleminin özel bir kuralı vardır.',
          },
          {
            kind: 'text',
            content: 'Birinci sayıyı aynen yazar, ikinci sayıyı ise ters çevirip çarparız.',
          },
          {
            kind: 'formula',
            content: '\\frac{3}{5} \\div \\frac{2}{4}',
          },
          {
            kind: 'text',
            content: 'İlk sayıyı aynen bırakıyor, ikinci sayıyı ise ters çevirip çarpıyoruz.',
          },
          {
            kind: 'formula',
            content: '\\frac{3}{5} \\cdot \\frac{4}{2}',
          },
          {
            kind: 'formula',
            content: '\\frac{12}{10}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'rasyonel-sayilarda-islemler-quiz-5',
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
      {
        type: 'completion',
        id: 'rasyonel-sayilarda-islemler-complete',
      },
    ],
  },
  'bir-bilinmeyenli-denklemler': {
    title: 'Bir Bilinmeyenli Denklemler',
    pages: [
      {
        type: 'teaching',
        id: 'bir-bilinmeyenli-denklemler-intro',
        blocks: [
          {
            kind: 'formula',
            content: 'x - 5 = 0',
          },
          {
            kind: 'text',
            content: 'Bu denklemlerin hepsinde sorman gereken soru şudur:',
          },
          {
            kind: 'text',
            content: 'x yerine ne koyarsam bu denklem sağlanır?',
          },
          {
            kind: 'formula',
            content: 'x = 5',
          },
          {
            kind: 'text',
            content: 'Yukarıdaki örnek için gereken x değeri 5\'tir.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'bir-bilinmeyenli-denklemler-quiz-1',
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
        type: 'quiz',
        id: 'bir-bilinmeyenli-denklemler-quiz-2',
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
        type: 'teaching',
        id: 'bir-bilinmeyenli-denklemler-karsi-tarafa-atma',
        blocks: [
          {
            kind: 'text',
            content: 'Bu denklemlerin hepsini rahatça çözebilmek için "karşı tarafa atmayı" kullanmalısın.',
          },
          {
            kind: 'formula',
            content: 'x - 5 = 3',
          },
          {
            kind: 'text',
            content: 'Yukarıdaki denklemde sol tarafta olan (-5) değeri sağ tarafa (+5) olarak geçebilir.',
          },
          {
            kind: 'formula',
            content: 'x = 3 + 5',
          },
          {
            kind: 'text',
            content: '(+) sayılar da karşıya (-) olarak geçebilir.',
          },
          {
            kind: 'formula',
            content: 'x + 4 = 10',
          },
          {
            kind: 'formula',
            content: 'x = 10 - 4',
          },
          {
            kind: 'text',
            content: 'Böylece x = 6 bulabiliriz.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'bir-bilinmeyenli-denklemler-carpma-bolme',
        blocks: [
          {
            kind: 'text',
            content: 'Çarpma ve bölme işlemleri de tersine dönüşerek karşı tarafa geçebilir.',
          },
          {
            kind: 'formula',
            content: '2 \\cdot x = 6',
          },
          {
            kind: 'formula',
            content: 'x = \\frac{6}{2}',
          },
          {
            kind: 'text',
            content: 'Bunun tam tersini de yapabilirdik:',
          },
          {
            kind: 'formula',
            content: '\\frac{x}{3} = 10',
          },
          {
            kind: 'formula',
            content: 'x = 10 \\cdot 3',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'bir-bilinmeyenli-denklemler-quiz-3',
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
        type: 'quiz',
        id: 'bir-bilinmeyenli-denklemler-quiz-4',
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
      {
        type: 'completion',
        id: 'bir-bilinmeyenli-denklemler-complete',
      },
    ],
  },
  'iki-bilinmeyenli-denklemler': {
    title: 'İki Bilinmeyenli Denklemler',
    pages: [
      {
        type: 'teaching',
        id: 'iki-bilinmeyenli-denklemler-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Bazı sorularda sadece x\'i değil, ikinci bir bilinmeyeni de bulmanız istenebilir.',
          },
          {
            kind: 'text',
            content: 'Örneğin:',
          },
          {
            kind: 'formula',
            content: '5x + 3y = 12',
          },
          {
            kind: 'formula',
            content: '3x - 3y = 4',
          },
          {
            kind: 'formula',
            content: 'x = ? , \\quad y = ?',
          },
          {
            kind: 'text',
            content: 'Bu tarz soruları yapabilmek için iki teknik kullanıyoruz.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'iki-bilinmeyenli-denklemler-yok-etme-1',
        blocks: [
          {
            kind: 'text',
            content: 'Öncelikle "Yok Etme Metodu"ndan başlayalım.',
          },
          {
            kind: 'formula',
            content: '5x + 3y = 12',
          },
          {
            kind: 'formula',
            content: '3x - 3y = 4',
          },
          {
            kind: 'text',
            content: 'Bu iki denklemi alt alta toplarsan ne olur?',
          },
          {
            kind: 'formula',
            content: '5x + 3x = 8x',
          },
          {
            kind: 'formula',
            content: '3y - 3y = 0',
          },
          {
            kind: 'formula',
            content: '12 + 4 = 16',
          },
          {
            kind: 'text',
            content: 'Gördüğün üzere alt alta toplama sonucunda bilinmeyenlerden sadece x kaldı. Şimdi x\'i bulalım.',
          },
          {
            kind: 'formula',
            content: '8x = 16',
          },
          {
            kind: 'formula',
            content: 'x = 2',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'iki-bilinmeyenli-denklemler-yok-etme-2',
        blocks: [
          {
            kind: 'text',
            content: 'Bulduğumuz x değerini denklemde yerine yazarak y\'yi bulalım.',
          },
          {
            kind: 'formula',
            content: '5x + 3y = 12',
          },
          {
            kind: 'formula',
            content: 'x = 2',
          },
          {
            kind: 'formula',
            content: '5 \\cdot 2 + 3y = 12',
          },
          {
            kind: 'formula',
            content: '10 + 3y = 12',
          },
          {
            kind: 'formula',
            content: '3y = 12 - 10',
          },
          {
            kind: 'formula',
            content: '3y = 2',
          },
          {
            kind: 'formula',
            content: 'y = \\frac{2}{3}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'iki-bilinmeyenli-denklemler-quiz-1',
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
        type: 'teaching',
        id: 'iki-bilinmeyenli-denklemler-carpma',
        blocks: [
          {
            kind: 'text',
            content: 'Bazen denklemler "yok etmeye" hazır biçimde verilmeyebilir.',
          },
          {
            kind: 'text',
            content: 'Bu durumda denklemleri bazı sayılarla çarpmamız ve "yok etmeye" uygun hale getirmemiz gerekir.',
          },
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
            content: 'Bu halleriyle denklemleri yok etmemiz mümkün değil.',
          },
          {
            kind: 'text',
            content: 'Ancak alttaki denklemi (2) ile çarparsak yok etmeye uygun hale gelir.',
          },
          {
            kind: 'formula',
            content: '2x + 2y = 10',
          },
          {
            kind: 'formula',
            content: '2x - 2y = 6',
          },
          {
            kind: 'text',
            content: 'Buradan gerisini biliyorsun, sayfayı ilerletip soruyu çözebilirsin!',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'iki-bilinmeyenli-denklemler-quiz-2',
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
      {
        type: 'completion',
        id: 'iki-bilinmeyenli-denklemler-complete',
      },
    ],
  },
   'iki-bilinmeyenli-denklemler-devam': {
    title: 'İki Bilinmeyenli Denklemler (Devam)',
    pages: [
      {
        type: 'teaching',
        id: 'iki-bilinmeyenli-denklemler-devam-yerine-koyma',
        blocks: [
          {
            kind: 'text',
            content: 'İki bilinmeyenli denklemlerde kullanabileceğimiz bir metot "Yerine Koyma Metodu"dur.',
          },
          {
            kind: 'text',
            content: 'Örneğe bakalım:',
          },
          {
            kind: 'formula',
            content: 'y = x - 2',
          },
          {
            kind: 'formula',
            content: 'x + y = 8',
          },
          {
            kind: 'text',
            content: 'Bu gibi sorularda y gördüğümüz her yere x cinsinden karşılığını yazabiliriz.',
          },
          {
            kind: 'formula',
            content: 'x + y = 8',
          },
          {
            kind: 'formula',
            content: 'x + (x - 2) = 8',
          },
          {
            kind: 'formula',
            content: '2x - 2 = 8',
          },
          {
            kind: 'formula',
            content: '2x = 10',
          },
          {
            kind: 'formula',
            content: 'x = 5',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'iki-bilinmeyenli-denklemler-devam-quiz-1',
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
        type: 'teaching',
        id: 'iki-bilinmeyenli-denklemler-devam-zor-ornek',
        blocks: [
          {
            kind: 'text',
            content: 'Sorular her zaman "yerine koyma metodu"nu kolayca uygulayabileceğin şekilde sorulmayabilir.',
          },
          {
            kind: 'text',
            content: 'Örneğe bakalım:',
          },
          {
            kind: 'formula',
            content: '5x = 2y - 3',
          },
          {
            kind: 'formula',
            content: '2x + 4y = 15',
          },
          {
            kind: 'text',
            content: 'Bu denklemlerde ne yerine koyabiliyoruz ne de yok edebiliyoruz.',
          },
          {
            kind: 'text',
            content: 'Böyle sorularda biraz daha uğraşmamız gerekecek.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'iki-bilinmeyenli-denklemler-devam-manipulasyon',
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
            content: 'Öncelikle ilk denklemde "2y" ifadesini yalnız bırakmak için (-3)\'ü karşıya atalım.',
          },
          {
            kind: 'formula',
            content: '5x + 3 = 2y',
          },
          {
            kind: 'text',
            content: 'Sonra da bu denklemi 2 ile çarpalım.',
          },
          {
            kind: 'formula',
            content: '10x + 6 = 4y',
          },
          {
            kind: 'text',
            content: 'Artık ikinci denklemde "4y" gördüğümüz yere "10x + 6" yazabiliriz!',
          },
          {
            kind: 'text',
            content: 'Buradan sonrasını sana bırakıyorum.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'iki-bilinmeyenli-denklemler-devam-quiz-2',
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
        type: 'quiz',
        id: 'iki-bilinmeyenli-denklemler-devam-quiz-3',
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
      {
        type: 'completion',
        id: 'iki-bilinmeyenli-denklemler-devam-complete',
      },
    ],
  },
  'esitsizlikler': {
    title: 'Eşitsizlikler',
    pages: [
      {
        type: 'teaching',
        id: 'esitsizlikler-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Denklemlerde "x" için tek bir değer bulmuştuk.',
          },
          {
            kind: 'text',
            content: 'Eşitsizliklerde ise "x" için bir değer aralığı bulmayı hedefliyoruz.',
          },
          {
            kind: 'text',
            content: 'Aşağıdaki ifadelerin Türkçe karşılıklarını anlaman çok önemli!',
          },
          {
            kind: 'formula',
            content: 'x < 4',
          },
          {
            kind: 'text',
            content: 'Bu ifade "x 4\'ten küçüktür" anlamına gelir.',
          },
          {
            kind: 'text',
            content: 'Yani x = 0, 1, 2 veya 3 olabilir ancak 4 veya 5 olamaz.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'esitsizlikler-isaretler',
        blocks: [
          {
            kind: 'formula',
            content: 'x < 4',
          },
          {
            kind: 'text',
            content: 'Bu ifade "x 4\'ten küçüktür" anlamına gelir.',
          },
          {
            kind: 'formula',
            content: 'x > 5',
          },
          {
            kind: 'text',
            content: 'Bu ifade "x, 5\'ten büyüktür" anlamına gelir.',
          },
          {
            kind: 'formula',
            content: 'x \\leq 6',
          },
          {
            kind: 'text',
            content: 'Bu ifade "x 6\'ya eşit veya 6\'dan küçüktür" anlamına gelir.',
          },
          {
            kind: 'formula',
            content: 'x \\geq 3',
          },
          {
            kind: 'text',
            content: 'Bu ifade "x, 3\'e eşit veya 3\'ten büyüktür" anlamına gelir.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'esitsizlikler-quiz-1',
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
        type: 'teaching',
        id: 'esitsizlikler-islemler',
        blocks: [
          {
            kind: 'text',
            content: 'Denklemlerde yaptığımız her şeyi (karşıya atma, sayı ile çarpma vb.) eşitsizliklerde de yapabiliriz.',
          },
          {
            kind: 'text',
            content: 'Karşıya atma örneği görelim:',
          },
          {
            kind: 'formula',
            content: 'x - 3 < 4',
          },
          {
            kind: 'formula',
            content: 'x < 3 + 4',
          },
          {
            kind: 'formula',
            content: 'x < 7',
          },
          {
            kind: 'text',
            content: 'Şimdi de çarpma durumunu görelim.',
          },
          {
            kind: 'formula',
            content: 'x < 5',
          },
          {
            kind: 'formula',
            content: '2 \\cdot x < 2 \\cdot 5',
          },
          {
            kind: 'formula',
            content: '2x < 10',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'esitsizlikler-quiz-2',
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
        type: 'quiz',
        id: 'esitsizlikler-quiz-3',
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
      {
        type: 'completion',
        id: 'esitsizlikler-complete',
      },
    ],
  },
  'esitsizligin-yon-degistirmesi': {
    title: 'Eşitsizliğin Yön Değiştirmesi',
    pages: [
      {
        type: 'teaching',
        id: 'esitsizligin-yon-degistirmesi-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Eşitsizlikleri istediğimiz hale getirmeye çalışırken karşı tarafa atma veya eşitsizliği bir sayıyla çarpma / bölme gibi teknikler kullanıyoruz.',
          },
          {
            kind: 'text',
            content: 'Ancak bunu yaparken dikkatli olmalıyız.',
          },
          {
            kind: 'text',
            content: 'Çünkü sayıları ters çevirirsen veya (-) sayılar ile çarpım yaparsan eşitsizlik YÖN DEĞİŞTİRİR.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'esitsizligin-yon-degistirmesi-negatif-carpma',
        blocks: [
          {
            kind: 'text',
            content: 'Aşağıdaki örneğe bakalım:',
          },
          {
            kind: 'formula',
            content: 'x < -3',
          },
          {
            kind: 'text',
            content: 'Bu eşitsizliğin her iki tarafını da (-) ile çarparsan aradaki "<" işareti YÖN DEĞİŞTİRİR.',
          },
          {
            kind: 'formula',
            content: '-x > 3',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'esitsizligin-yon-degistirmesi-quiz-1',
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
        type: 'teaching',
        id: 'esitsizligin-yon-degistirmesi-kesir',
        blocks: [
          {
            kind: 'text',
            content: 'Kesir halindeki sayılarda da benzer bir durum vardır.',
          },
          {
            kind: 'formula',
            content: '\\frac{x}{3} > \\frac{5}{2}',
          },
          {
            kind: 'text',
            content: 'Eğer her iki tarafın da pay ve paydalarının yerini değiştirirsen eşitsizlik YÖN DEĞİŞTİRİR.',
          },
          {
            kind: 'formula',
            content: '\\frac{3}{x} < \\frac{2}{5}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'esitsizligin-yon-degistirmesi-quiz-2',
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
      {
        type: 'completion',
        id: 'esitsizligin-yon-degistirmesi-complete',
      },
    ],
  },
  'mutlak-deger': {
    title: 'Mutlak Değer',
    pages: [
      {
        type: 'teaching',
        id: 'mutlak-deger-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Bir sayının mutlak değeri o sayının 0\'a olan uzaklığını ifade eder.',
          },
          {
            kind: 'text',
            content: 'Mutlak değer şöyle gösterilir:',
          },
          {
            kind: 'formula',
            content: '|x| = 5',
          },
          {
            kind: 'text',
            content: 'Yukarıdaki ifade "x sayısının mutlak değeri 5\'e eşittir" demektir.',
          },
          {
            kind: 'text',
            content: 'Bu durumda x sayısının 0\'a uzaklığı 5 birimdir. Öyleyse x 5 veya -5 olmalıdır.',
          },
          {
            kind: 'formula',
            content: '|5| = 5 , \\quad |-5| = 5',
          },
          {
            kind: 'text',
            content: 'Uzaklığı ifade ettiği için mutlak değer ASLA NEGATİF OLAMAZ.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'mutlak-deger-quiz-1',
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
        type: 'quiz',
        id: 'mutlak-deger-quiz-2',
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
        type: 'teaching',
        id: 'mutlak-deger-ifade',
        blocks: [
          {
            kind: 'text',
            content: 'Mutlak değerin içinde tek bir sayı yerine bir ifade de yer alabilir. Örneğin;',
          },
          {
            kind: 'formula',
            content: '|x - 3|',
          },
          {
            kind: 'text',
            content: 'Yukarıdaki gibi ifadeler iki şekilde dışarı çıkabilir.',
          },
          {
            kind: 'text',
            content: 'Eğer x sayısı 3\'ten büyükse içerisi pozitiftir, o yüzden ifade aynen dışarı çıkar:',
          },
          {
            kind: 'formula',
            content: '|x - 3| = x - 3',
          },
          {
            kind: 'text',
            content: 'Eğer x sayısı 3\'ten küçükse içerisi negatiftir, o yüzden ifade (-) ile çarpılıp dışarı çıkar',
          },
          {
            kind: 'formula',
            content: '|x - 3| = -x + 3',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'mutlak-deger-quiz-3',
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
        type: 'quiz',
        id: 'mutlak-deger-quiz-4',
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
      {
        type: 'completion',
        id: 'mutlak-deger-complete',
      },
    ],
  },
  'mutlak-degerli-esitsizlikler': {
    title: 'Mutlak Değerli Eşitsizlikler',
    pages: [
      {
        type: 'teaching',
        id: 'mutlak-degerli-esitsizlikler-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Mutlak değerli eşitsizlikler şuna benzer:',
          },
          {
            kind: 'formula',
            content: '|x| < 7',
          },
          {
            kind: 'text',
            content: 'Bu ifadenin üzerine düşünelim.',
          },
          {
            kind: 'text',
            content: 'x = 5 olabilir. x = 3 olabilir. x = -3 de olabilir!',
          },
          {
            kind: 'text',
            content: 'Öyleyse mutlak değerli eşitsizliklerde ifadeyi dışarı çıkarırken pozitif ve negatif sınırları beraber ifade etmeliyiz:',
          },
          {
            kind: 'formula',
            content: '-7 < x < 7',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'mutlak-degerli-esitsizlikler-quiz-1',
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
        type: 'teaching',
        id: 'mutlak-degerli-esitsizlikler-ifade',
        blocks: [
          {
            kind: 'text',
            content: 'x tek başına verilmezse ne olur?',
          },
          {
            kind: 'formula',
            content: '|x - 3| < 7',
          },
          {
            kind: 'text',
            content: '(x - 3) ifadesine dokunmadan aynı şekilde dışarı çıkararak başlayacağız.',
          },
          {
            kind: 'formula',
            content: '-7 < x - 3 < 7',
          },
          {
            kind: 'text',
            content: 'Sonrasında her tarafa +3 ekleyeceğiz:',
          },
          {
            kind: 'formula',
            content: '-4 < x < 11',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'mutlak-degerli-esitsizlikler-quiz-2',
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
      {
        type: 'completion',
        id: 'mutlak-degerli-esitsizlikler-complete',
      },
    ],
  },
  'uslu-sayilar': {
    title: 'Üslü Sayılar',
    pages: [
      {
        type: 'teaching',
        id: 'uslu-sayilar-intro',
        blocks: [
          {
            kind: 'formula',
            content: '2^{3}',
          },
          {
            kind: 'text',
            content: 'Yukarıdaki ifadenin Türkçesi şu şekildedir:',
          },
          {
            kind: 'text',
            content: '"2\'nin 3. kuvveti"',
          },
          {
            kind: 'text',
            content: 'Bu ifade "2\'yi yan yana 3 defa koy ve hepsini çarp" demektir.',
          },
          {
            kind: 'formula',
            content: '2^{3} = 2 \\times 2 \\times 2',
          },
          {
            kind: 'text',
            content: 'Bu da 8\'e eşittir.',
          },
          {
            kind: 'formula',
            content: '2^{3} = 8',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'uslu-sayilar-quiz-1',
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
        type: 'teaching',
        id: 'uslu-sayilar-kurallar',
        blocks: [
          {
            kind: 'text',
            content: 'KURAL #1: Herhangi bir sayının 0. kuvveti 1\'e eşittir.',
          },
          {
            kind: 'formula',
            content: 'x^{0} = 1',
          },
          {
            kind: 'text',
            content: 'KURAL #2: 1 sayısının bütün kuvvetleri yine 1\'e eşittir.',
          },
          {
            kind: 'formula',
            content: '1^{x} = 1',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'uslu-sayilar-quiz-2',
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
      {
        type: 'completion',
        id: 'uslu-sayilar-complete',
      },
    ],
  },
  'negatif-sayilar': {
    title: 'Negatif Sayılar',
    pages: [
      {
        type: 'teaching',
        id: 'negatif-sayilar-intro',
        blocks: [
          {
            kind: 'formula',
            content: '(-2)^{2}',
          },
          {
            kind: 'text',
            content: 'Yukarıdaki ifadeye göre iki adet (-2) sayısını yan yana koyup çarpmalıyız.',
          },
          {
            kind: 'formula',
            content: '(-2) \\times (-2) = 4',
          },
          {
            kind: 'text',
            content: 'Unutma! (-) ile (-) çarpılırsa sonuç (+) olur.',
          },
          {
            kind: 'text',
            content: 'Ancak 3 tane (-2)\'yi yan yana çarparsak işler değişir:',
          },
          {
            kind: 'formula',
            content: '(-2)^{3} = (-2) \\times (-2) \\times (-2) = -8',
          },
          {
            kind: 'text',
            content: 'Bu sefer sonuç negatif çıkar.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'negatif-sayilar-kural',
        blocks: [
          {
            kind: 'text',
            content: 'Sonucun (-) mi yoksa (+) mı çıkacağını her seferinde bilebilmek için şu genel kuralı ezberleyelim:',
          },
          {
            kind: 'text',
            content: '(-) sayıların üssü ÇİFT olursa sonuç POZİTİF olur.',
          },
          {
            kind: 'formula',
            content: '(-2)^{4} = 16',
          },
          {
            kind: 'text',
            content: '(-) sayıların üssü TEK olursa sonuç NEGATİF olur.',
          },
          {
            kind: 'formula',
            content: '(-2)^{3} = -8',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'negatif-sayilar-quiz-1',
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
        type: 'teaching',
        id: 'negatif-sayilar-parantez',
        blocks: [
          {
            kind: 'text',
            content: 'ÖNEMLİ KURAL: Bütün bu öğrendiklerinin geçerli olması için (-) sayılar parantezle kapatılmış olmalıdır.',
          },
          {
            kind: 'text',
            content: 'Eğer parantez yoksa sonuç kesinlikle negatiftir.',
          },
          {
            kind: 'formula',
            content: '-2^{2} = -4',
          },
          {
            kind: 'formula',
            content: '(-2)^{2} = 4',
          },
          {
            kind: 'text',
            content: 'Gördüğün gibi parantezler sonucu etkiler!',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'negatif-sayilar-quiz-2',
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
        type: 'teaching',
        id: 'negatif-sayilar-negatif-us',
        blocks: [
          {
            kind: 'text',
            content: 'Son olarak negatif üsleri öğrenelim:',
          },
          {
            kind: 'text',
            content: 'Negatif üsler sayının pay ve paydasının yerini değiştirir:',
          },
          {
            kind: 'formula',
            content: '3^{-1} = \\frac{1}{3}',
          },
          {
            kind: 'formula',
            content: '2^{-2} = \\frac{1}{2^{2}} = \\frac{1}{4}',
          },
          {
            kind: 'text',
            content: 'Üssün negatif olması sonucun işaretini ETKİLEMEZ!',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'negatif-sayilar-quiz-3',
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
      {
        type: 'completion',
        id: 'negatif-sayilar-complete',
      },
    ],
  },
  'sadelestirme-ve-parcalama': {
    title: 'Sadeleştirme ve Parçalama',
    pages: [
      {
        type: 'teaching',
        id: 'sadelestirme-ve-parcalama-sadelestirme',
        blocks: [
          {
            kind: 'text',
            content: 'Üslü sayıları sadeleştirebilir ve genişletebilirsin.',
          },
          {
            kind: 'formula',
            content: '4^{2}',
          },
          {
            kind: 'text',
            content: '4\'ün aynı zamanda 2\'nin karesi olduğunu biliyoruz.',
          },
          {
            kind: 'formula',
            content: '(2^{2})^{2}',
          },
          {
            kind: 'text',
            content: 'Üssün üssü birbiriyle çarpılır.',
          },
          {
            kind: 'formula',
            content: '2^{2 \\times 2} = 2^{4}',
          },
          {
            kind: 'text',
            content: 'Sonuç olarak:',
          },
          {
            kind: 'formula',
            content: '4^{2} = 2^{4}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'sadelestirme-ve-parcalama-quiz-1',
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
        type: 'teaching',
        id: 'sadelestirme-ve-parcalama-parcalama',
        blocks: [
          {
            kind: 'text',
            content: 'Şimdi de parçalamayı öğrenelim:',
          },
          {
            kind: 'formula',
            content: '6^{2}',
          },
          {
            kind: 'text',
            content: '6 sayısının 2 x 3 olduğunu biliyoruz.',
          },
          {
            kind: 'formula',
            content: '6 = 2 \\times 3',
          },
          {
            kind: 'text',
            content: 'O zaman 6\'nın kuvvetini 2 ve 3\'ün üstüne de yazabiliriz!',
          },
          {
            kind: 'formula',
            content: '6^{2} = 2^{2} \\times 3^{2}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'sadelestirme-ve-parcalama-quiz-2',
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
        type: 'quiz',
        id: 'sadelestirme-ve-parcalama-quiz-3',
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
      {
        type: 'completion',
        id: 'sadelestirme-ve-parcalama-complete',
      },
    ],
  },
  'uslu-sayilarla-ilgili-kurallar': {
    title: 'Üslü Sayılarda İşlemler',
    pages: [
      {
        type: 'teaching',
        id: 'uslu-sayilarla-ilgili-kurallar-carpma',
        blocks: [
          {
            kind: 'text',
            content: 'Üslü sayılar birbiriyle çarpıldığı zaman tabanlar aynı ise üsleri toplayabilirsin:',
          },
          {
            kind: 'formula',
            content: '2^{2} \\times 2^{3} = 2^{5}',
          },
          {
            kind: 'formula',
            content: '3^{3} \\times 3^{-1} = 3^{2}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'uslu-sayilarla-ilgili-kurallar-quiz-1',
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
        type: 'teaching',
        id: 'uslu-sayilarla-ilgili-kurallar-bolme',
        blocks: [
          {
            kind: 'text',
            content: 'Üslü sayılar birbirine bölündüğünde tabanlar aynıysa üsleri birbirinden çıkarabilirsin.',
          },
          {
            kind: 'formula',
            content: '\\frac{2^{3}}{2^{2}} = 2^{3 - 2} = 2',
          },
          {
            kind: 'formula',
            content: '\\frac{3^{2}}{3^{4}} = 3^{2 - 4} = 3^{-2}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'uslu-sayilarla-ilgili-kurallar-quiz-2',
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
      {
        type: 'completion',
        id: 'uslu-sayilarla-ilgili-kurallar-complete',
      },
    ],
  },
  'koklu-sayilar': {
    title: 'Köklü Sayılar',
    pages: [
      {
        type: 'teaching',
        id: 'koklu-sayilar-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Karekök, "karesini alma" işleminin tersidir.',
          },
          {
            kind: 'formula',
            content: '\\sqrt{25} = ?',
          },
          {
            kind: 'text',
            content: 'Bu sembol şu soruyu sorar: "Hangi sayının karesi 25\'e eşittir?"',
          },
          {
            kind: 'text',
            content: 'Cevap 5\'tir.',
          },
          {
            kind: 'formula',
            content: '\\sqrt{25} = 5',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'koklu-sayilar-quiz-1',
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
        type: 'teaching',
        id: 'koklu-sayilar-carpanlara-ayirma',
        blocks: [
          {
            kind: 'text',
            content: 'Bazı sayılar tam kare değildir (Örneğin 12).',
          },
          {
            kind: 'text',
            content: 'Bunları kök dışına çıkarmak için çarpanlarına ayırırız.',
          },
          {
            kind: 'formula',
            content: '\\sqrt{12} = \\sqrt{4 \\cdot 3}',
          },
          {
            kind: 'text',
            content: '4 sayısı 2\'nin karesi olduğu için 2 olarak dışarı çıkar.',
          },
          {
            kind: 'text',
            content: 'Ama 3 içeride kalır.',
          },
          {
            kind: 'formula',
            content: '\\sqrt{12} = 2\\sqrt{3}',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'koklu-sayilar-quiz-2',
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
        type: 'quiz',
        id: 'koklu-sayilar-quiz-3',
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
      {
        type: 'completion',
        id: 'koklu-sayilar-complete',
      },
    ],
  },
  'koklu-sayilarla-islemler': {
    title: 'Köklü Sayılarla İşlemler',
    pages: [
      {
        type: 'teaching',
        id: 'koklu-sayilarla-islemler-toplama',
        blocks: [
          {
            kind: 'text',
            content: 'Köklü sayılarda toplama yapmak için kök içlerinin AYNI olması şarttır.',
          },
          {
            kind: 'formula',
            content: '2\\sqrt{3} + 5\\sqrt{3} = 7\\sqrt{3}',
          },
          {
            kind: 'text',
            content: 'Kökün içi ise asla toplanmaz!',
          },
          {
            kind: 'formula',
            content: '\\sqrt{2} + \\sqrt{3}',
          },
          {
            kind: 'text',
            content: 'Yukarıdaki ifade öylece kalır.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'koklu-sayilarla-islemler-quiz-1',
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
        type: 'teaching',
        id: 'koklu-sayilarla-islemler-carpma-bolme',
        blocks: [
          {
            kind: 'text',
            content: 'Çarpma işlemi çok daha rahattır. Kök içlerinin aynı olmasına gerek yoktur.',
          },
          {
            kind: 'formula',
            content: '\\sqrt{2} \\times \\sqrt{3} = \\sqrt{6}',
          },
          {
            kind: 'text',
            content: 'Bölme işlemi de öyledir.',
          },
          {
            kind: 'formula',
            content: '\\frac{\\sqrt{12}}{\\sqrt{4}} = \\sqrt{3}',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'koklu-sayilarla-islemler-ayni-sayi',
        blocks: [
          {
            kind: 'text',
            content: 'Eğer kök içinde aynı sayı iki defa çarpılırsa kök ortadan kaybolur.',
          },
          {
            kind: 'formula',
            content: '\\sqrt{2} \\times \\sqrt{2} = 2',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'koklu-sayilarla-islemler-quiz-2',
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
        type: 'quiz',
        id: 'koklu-sayilarla-islemler-quiz-3',
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
      {
        type: 'completion',
        id: 'koklu-sayilarla-islemler-complete',
      },
    ],
  },
  'ortak-parantez': {
    title: 'Ortak Parantez',
    pages: [
      {
        type: 'teaching',
        id: 'ortak-parantez-temel',
        blocks: [
          {
            kind: 'text',
            content: 'Çarpanlara ayırmanın en temel kuralı: "Hepsinde ortak olan ne?" sorusunu sormaktır.',
          },
          {
            kind: 'formula',
            content: '2x + 6',
          },
          {
            kind: 'text',
            content: 'Her iki terimde de "2" çarpanı gizlidir. (6 = 2×3\'tür).',
          },
          {
            kind: 'text',
            content: 'Bütün bu ifadeyi 2 parantezine alabiliriz:',
          },
          {
            kind: 'formula',
            content: '2(x + 3)',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'ortak-parantez-harf',
        blocks: [
          {
            kind: 'text',
            content: 'Bazen ortak olan şey bir harftir. Üssü en küçük olan paranteze alınır.',
          },
          {
            kind: 'formula',
            content: 'x^{3} + x^{2}',
          },
          {
            kind: 'text',
            content: 'Burada her terimde de (x²) vardır.',
          },
          {
            kind: 'formula',
            content: 'x^{2}(x + 1)',
          },
          {
            kind: 'text',
            content: 'Kontrol et: İçeri dağıtınca aynısı oluyor mu? Evet!',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'ortak-parantez-quiz-1',
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
        type: 'quiz',
        id: 'ortak-parantez-quiz-2',
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
        type: 'quiz',
        id: 'ortak-parantez-quiz-3',
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
      {
        type: 'completion',
        id: 'ortak-parantez-complete',
      },
    ],
  },
  'tam-kare-ve-iki-kare-farki': {
    title: 'Tam Kare ve İki Kare Farkı',
    pages: [
      {
        type: 'teaching',
        id: 'tam-kare-ve-iki-kare-farki-intro',
        blocks: [
          {
            kind: 'text',
            content: 'İki sayının kareleri birbirinden çıkarılıyorsa işlem yapmak zor olabilir:',
          },
          {
            kind: 'formula',
            content: '2026^{2} - 2024^{2}',
          },
          {
            kind: 'text',
            content: 'Yukarıdaki sayıların karelerini hesaplamak çok zordur.',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'tam-kare-ve-iki-kare-farki-formul',
        blocks: [
          {
            kind: 'formula',
            content: '2026^{2} - 2024^{2}',
          },
          {
            kind: 'text',
            content: 'Sonucu bulmak için "İki Kare Farkı" formülünü kullanabiliriz:',
          },
          {
            kind: 'formula',
            content: 'x^{2} - y^{2} = (x - y) \\cdot (x + y)',
          },
          {
            kind: 'text',
            content: 'Artık işlem çok daha basit!',
          },
          {
            kind: 'formula',
            content: '(2026 - 2024) \\cdot (2026 + 2024)',
          },
          {
            kind: 'formula',
            content: '(2) \\cdot (4050) = 8100',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'tam-kare-ve-iki-kare-farki-quiz-1',
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
        type: 'teaching',
        id: 'tam-kare-ve-iki-kare-farki-tam-kare-toplam',
        blocks: [
          {
            kind: 'text',
            content: 'Şimdi de tam kare toplamı formülümüzü öğrenelim:',
          },
          {
            kind: 'formula',
            content: '(x + y)^{2} = x^{2} + 2xy + y^{2}',
          },
          {
            kind: 'text',
            content: 'Tekerlememiz şöyle:',
          },
          {
            kind: 'text',
            content: '1. Birincinin karesi',
          },
          {
            kind: 'text',
            content: '2. Birinci ile ikincinin çarpımının 2 katı (Unutma!)',
          },
          {
            kind: 'text',
            content: '3. İkincinin karesi',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'tam-kare-ve-iki-kare-farki-quiz-2',
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
        type: 'teaching',
        id: 'tam-kare-ve-iki-kare-farki-tam-kare-fark',
        blocks: [
          {
            kind: 'text',
            content: 'Eğer kare parantezin içerisinde (+) yerine (-) varsa formül ufak bir değişime uğrar:',
          },
          {
            kind: 'formula',
            content: '(x - y)^{2} = x^{2} - 2xy + y^{2}',
          },
          {
            kind: 'text',
            content: 'Kareli terimlerde değişim yok.',
          },
          {
            kind: 'text',
            content: '"Birinci ile ikincinin çarpımının iki katı" teriminin başına (-) gelir.',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'tam-kare-ve-iki-kare-farki-quiz-3',
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
      {
        type: 'completion',
        id: 'tam-kare-ve-iki-kare-farki-complete',
      },
    ],
  },
  'carpanlara-ayirma': {
    title: 'Çarpanlara Ayırma',
    pages: [
      {
        type: 'teaching',
        id: 'carpanlara-ayirma-intro',
        blocks: [
          {
            kind: 'text',
            content: 'Aşağıdakine benzer ifadeler şu ana kadar öğrendiklerimize uymaz:',
          },
          {
            kind: 'formula',
            content: 'x^{2} + 5x + 6',
          },
          {
            kind: 'text',
            content: 'Bu ifadeleri çarpanlarına ayırmak için iki sayıya ihtiyacımız vardır:',
          },
          {
            kind: 'text',
            content: '1) Bu sayıların çarpımları 6 etmelidir.',
          },
          {
            kind: 'text',
            content: '2) Bu sayıların toplamları 5 etmelidir.',
          },
          {
            kind: 'text',
            content: 'Bu sayılar 2 ve 3\'tür!',
          },
        ],
      },
      {
        type: 'teaching',
        id: 'carpanlara-ayirma-ornek',
        blocks: [
          {
            kind: 'formula',
            content: 'x^{2} + 5x + 6',
          },
          {
            kind: 'text',
            content: 'Bu denklem için 2 ve 3 sayılarını bulduktan sonra çarpanları şöyle yazarız:',
          },
          {
            kind: 'formula',
            content: '(x + 2)(x + 3)',
          },
          {
            kind: 'text',
            content: 'Aşağıdaki örneğe bakalım.',
          },
          {
            kind: 'formula',
            content: 'x^{2} + 7x + 8',
          },
          {
            kind: 'text',
            content: 'Çarpımları 8\'e, toplamları ise 7\'ye eşit olan iki sayı 7 ve 1\'dir.',
          },
          {
            kind: 'text',
            content: 'Öyleyse çarpanlarımız şunlar olmalıdır:',
          },
          {
            kind: 'formula',
            content: '(x + 7)(x + 1)',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'carpanlara-ayirma-quiz-1',
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
        type: 'teaching',
        id: 'carpanlara-ayirma-negatif',
        blocks: [
          {
            kind: 'text',
            content: 'Negatif sayılar da bu kuralla uyumludur.',
          },
          {
            kind: 'formula',
            content: 'x^{2} - 3x - 10',
          },
          {
            kind: 'text',
            content: 'Yukarıdaki denklem için çarpımları -10, toplamları ise -3 olan iki sayı bulmalıyız.',
          },
          {
            kind: 'text',
            content: 'Bu sayılar (+2) ve (-5)\'tir.',
          },
          {
            kind: 'formula',
            content: '(x + 2)(x - 5)',
          },
        ],
      },
      {
        type: 'quiz',
        id: 'carpanlara-ayirma-quiz-2',
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
      {
        type: 'completion',
        id: 'carpanlara-ayirma-complete',
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
      setSessionXp(prev => prev + 10);
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
    if (completionData?.hasRewards) {
      setCompletionPageIndex(1);
    } else {
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
            {completionPageIndex === 0 && (
              <View style={[styles.pageCard, { backgroundColor: colors.cardBackground }]}>
                <Animated.View style={[styles.rewardSection, styles.congratulationsBox, createSlideStyle(congratulationsAnim)]}>
                  <Text style={[styles.completionTitle, { color: colors.text }]}>
                    🎉 TEBRİKLER
                  </Text>
                  <Text style={[styles.completionSubtitle, { color: colors.textSecondary }]}>
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

                <Animated.View style={[styles.rewardSection, { backgroundColor: colors.cardBackground }, createSlideStyle(xpAnim)]}>
                  <Text style={[styles.rewardSectionTitle, { color: colors.textSecondary }]}>BU MODÜLDE TOPLAM</Text>
                  <Text style={[styles.rewardMainValue, { color: colors.text }]}>
                    ⭐ {completionData.totalXp} XP Kazandın!
                  </Text>
                </Animated.View>

                {completionData.streakIncreased && (
                  <Animated.View style={[styles.rewardSection, { backgroundColor: colors.cardBackground }, createSlideStyle(streakAnim)]}>
                    <Text style={[styles.rewardSectionTitle, { color: colors.textSecondary }]}>🔥 SERİ</Text>
                    <Text style={[styles.rewardMainValue, { color: colors.text }]}>
                      Seriniz: {completionData.streakAfter} gün
                    </Text>
                  </Animated.View>
                )}

                <Pressable
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={completionData.hasRewards ? handleAdvanceToRewards : handleCompletionPress}>
                  <Text style={styles.primaryButtonText}>
                    {completionData.hasRewards ? 'İlerle' : 'Bitir'}
                  </Text>
                </Pressable>
              </View>
            )}

            {completionPageIndex === 1 && completionData.hasRewards && (
              <View style={[styles.pageCard, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.completionTitle, { color: colors.text }]}>🎁 YENİ KAZANÇLAR</Text>
                
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
