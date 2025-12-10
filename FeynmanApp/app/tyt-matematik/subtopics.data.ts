export type Subtopic = {
  title: string;
  slug: string;
};

export const topicSubtopicsEntries: Array<[string, Subtopic[]]> = [
  [
    'Temel Kavramlar',
    [
      { title: 'Pozitif Negatif Sayılar', slug: 'pozitif-negatif-sayilar' },
      { title: 'Denklem Kurma', slug: 'denklem-kurma' },
      { title: 'Faktöriyel', slug: 'faktoriyel' },
      { title: 'Tek & Çift Sayılar', slug: 'tek-cift-sayilar' },
      { title: 'Sayı Kümeleri', slug: 'sayi-kumeleri' },
      { title: 'Ardışık Sayılar', slug: 'ardisik-sayilar' },
      { title: 'Asal Sayılar', slug: 'asal-sayilar' },
    ],
  ],
];

export const topicSubtopics = Object.fromEntries(topicSubtopicsEntries);

const allSubtopics = topicSubtopicsEntries.flatMap(([, list]) => list);

export const subtopicTitleBySlug: Record<string, string> = allSubtopics.reduce(
  (acc, subtopic) => {
    acc[subtopic.slug] = subtopic.title;
    return acc;
  },
  {} as Record<string, string>,
);
