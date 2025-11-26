export type Subtopic = {
  title: string;
  slug: string;
};

export const topicSubtopicsEntries: Array<[string, Subtopic[]]> = [
  [
    'Fonksiyonlar',
    [
      { title: 'Fonksiyon nedir?', slug: 'fonksiyon-nedir' },
      { title: 'Tanım ve Görüntü kümesi', slug: 'tanim-ve-goruntu-kumesi' },
      { title: 'f(x) Yazmadığında Değer Bulma', slug: 'deger-bulma' },
      { title: 'Fonksiyon Çeşitleri (Sabit ve Birim)', slug: 'fonksiyon-cesitleri' },
      { title: 'Fonksiyon Çeşitleri 2 (Birebir ve Örten)', slug: 'fonksiyon-cesitleri-2' },
      { title: 'Fonksiyon Çeşitleri 3 (Tek ve Çift)', slug: 'fonksiyon-cesitleri-3' },
      { title: 'Fonksiyon Grafikleri', slug: 'fonksiyon-grafikleri' },
      { title: 'Bileşke Fonksiyon', slug: 'bileske-fonksiyon' },
      { title: 'Ters Fonksiyon', slug: 'ters-fonksiyon' },
    ],
  ],
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
      { title: 'Tanımla İlgili Kurallar', slug: 'tanimla-ilgili-kurallar' },
    ],
  ],
  [
    'Limit & Süreklilik',
    [
      { title: 'Limit nedir?', slug: 'limit-nedir' },
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

