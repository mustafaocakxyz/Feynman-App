export type Subtopic = {
  title: string;
  slug: string;
};

export const topicSubtopicsEntries: Array<[string, Subtopic[]]> = [
  [
    'Trigonometri',
    [
      { title: 'Sin, Cos ve Tan', slug: 'sin-cos-ve-tan' },
      { title: 'Birim Üçgen', slug: 'birim-ucgen' },
      { title: 'sin^2 + cos^2 = 1', slug: 'sin2-cos2-1' },
      { title: 'Birim Çember', slug: 'birim-cember' },
    ],
  ],
  [
    'Logaritma & Diziler',
    [
      { title: 'Logaritma nedir?', slug: 'logaritma-nedir' },
      { title: 'Logaritmik İfadeleri Toplama', slug: 'logaritmik-ifadeleri-toplama' },
      { title: 'Logaritmilk İfadeleri Çıkarma', slug: 'logaritmik-ifadeleri-cikarma' },
      { title: 'Üssü Başa Çarpı Olarak Getirme', slug: 'ussu-basa-carpi-olarak-getirme' },
    ],
  ],
  [
    'Limit & Süreklilik',
    [
      { title: 'Dummy Subtopic', slug: 'limit-dummy' },
    ],
  ],
  [
    'Türev',
    [
      { title: 'Dummy Subtopic', slug: 'turev-dummy' },
    ],
  ],
  [
    'İntegral',
    [
      { title: 'Dummy Subtopic', slug: 'integral-dummy' },
    ],
  ],
];

export const topicSubtopics = Object.fromEntries(topicSubtopicsEntries);

export const trigSubtopics = topicSubtopics['Trigonometri'];

const allSubtopics = topicSubtopicsEntries.flatMap(([, list]) => list);

export const subtopicTitleBySlug: Record<string, string> = allSubtopics.reduce(
  (acc, subtopic) => {
    acc[subtopic.slug] = subtopic.title;
    return acc;
  },
  {} as Record<string, string>,
);

