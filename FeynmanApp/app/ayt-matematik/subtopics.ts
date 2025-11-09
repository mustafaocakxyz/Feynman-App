export type Subtopic = {
  title: string;
  slug: string;
};

export const trigSubtopics: Subtopic[] = [
  { title: 'Birim Üçgen', slug: 'birim-ucgen' },
  { title: 'Birim Çember', slug: 'birim-cember' },
  { title: 'Sin, Cos ve Tan', slug: 'sin-cos-ve-tan' },
  { title: 'sin^2 + cos^2 = 1', slug: 'sin2-cos2-1' },
];

export const subtopicTitleBySlug: Record<string, string> = trigSubtopics.reduce(
  (acc, subtopic) => {
    acc[subtopic.slug] = subtopic.title;
    return acc;
  },
  {} as Record<string, string>,
);


