import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@feynman/completed-subtopics';

export async function getCompletedSubtopics(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
    return [];
  } catch (error) {
    console.warn('Tamamlanan desenler okunamadı', error);
    return [];
  }
}

export async function markSubtopicCompleted(subtopicSlug: string) {
  try {
    const existing = await getCompletedSubtopics();
    if (existing.includes(subtopicSlug)) {
      return;
    }
    const next = [...existing, subtopicSlug];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Tamamlanan deseni kaydetme başarısız', error);
  }
}


