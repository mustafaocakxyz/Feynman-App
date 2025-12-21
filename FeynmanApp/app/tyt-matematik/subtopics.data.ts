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
  [
    'Basamak Kavramı',
    [
      { title: 'Basamak Kavramı', slug: 'basamak-kavrami' },
    ],
  ],
  [
    'Bölme Bölünebilme',
    [
      { title: 'Bölünebilme Kuralları', slug: 'bolunebilme-kurallari' },
      { title: 'Bölünebilme Kuralları 2', slug: 'bolunebilme-kurallari-2' },
      { title: 'Kalan Bulma Mantığı', slug: 'kalan-bulma-mantigi' },
    ],
  ],
  [
    'Rasyonel Sayılar',
    [
      { title: 'Rasyonel Sayılar', slug: 'rasyonel-sayilar' },
      { title: 'Genişletme ve Sadeleştirme', slug: 'genisletme-sadelestirme' },
      { title: 'Rasyonel Sayılarda İşlemler', slug: 'rasyonel-sayilarda-islemler' },
    ],
  ],
  [
    '1. Dereceden Denklemler',
    [
      { title: 'Bir Bilinmeyenli Denklemler', slug: 'bir-bilinmeyenli-denklemler' },
      { title: 'İki Bilinmeyenli Denklemler', slug: 'iki-bilinmeyenli-denklemler' },
      { title: 'İki Bilinmeyenli Denklemler (Devam)', slug: 'iki-bilinmeyenli-denklemler-devam' },
    ],
  ],
  [
    'Eşitsizlikler',
    [
      { title: 'Eşitsizlikler', slug: 'esitsizlikler' },
      { title: 'Eşitsizliğin Yön Değiştirmesi', slug: 'esitsizligin-yon-degistirmesi' },
    ],
  ],
  [
    'Mutlak Değer',
    [
      { title: 'Mutlak Değer', slug: 'mutlak-deger' },
      { title: 'Mutlak Değerli Eşitsizlikler', slug: 'mutlak-degerli-esitsizlikler' },
    ],
  ],
  [
    'Üslü Sayılar',
    [
      { title: 'Üslü Sayılar', slug: 'uslu-sayilar' },
      { title: 'Negatif Sayılar', slug: 'negatif-sayilar' },
      { title: 'Sadeleştirme ve Parçalama', slug: 'sadelestirme-ve-parcalama' },
      { title: 'Üslü Sayılarda İşlemler', slug: 'uslu-sayilarla-ilgili-kurallar' },
    ],
  ],
  [
    'Köklü Sayılar',
    [
      { title: 'Köklü Sayılar', slug: 'koklu-sayilar' },
      { title: 'Köklü Sayılarla İşlemler', slug: 'koklu-sayilarla-islemler' },
    ],
  ],
  [
    'Çarpanlara Ayırma',
    [
      { title: 'Ortak Parantez', slug: 'ortak-parantez' },
      { title: 'Tam Kare ve İki Kare Farkı', slug: 'tam-kare-ve-iki-kare-farki' },
      { title: 'Çarpanlara Ayrıma', slug: 'carpanlara-ayirma' },
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
