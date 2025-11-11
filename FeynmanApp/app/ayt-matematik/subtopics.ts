export type Subtopic = {
  title: string;
  slug: string;
};

export const topicSubtopicsEntries: Array<[string, Subtopic[]]> = [
  [
    'Trigonometri',
    [
      { title: 'Birim Üçgen', slug: 'birim-ucgen' },
      { title: 'Birim Çember', slug: 'birim-cember' },
      { title: 'Sin, Cos ve Tan', slug: 'sin-cos-ve-tan' },
      { title: 'sin^2 + cos^2 = 1', slug: 'sin2-cos2-1' },
    ],
  ],
  [
    'Logaritma & Diziler',
    [
      { title: 'Dummy Subtopic', slug: 'logaritma-dummy' },
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

