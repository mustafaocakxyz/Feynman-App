import AsyncStorage from '@react-native-async-storage/async-storage';

function getStorageKey(userId: string): string {
  return `@feynman/completed-subtopics_${userId}`;
}

export async function getCompletedSubtopics(userId: string): Promise<string[]> {
  try {
    const storageKey = getStorageKey(userId);
    const stored = await AsyncStorage.getItem(storageKey);
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

export async function markSubtopicCompleted(
  userId: string,
  subtopicSlug: string,
): Promise<boolean> {
  try {
    const existing = await getCompletedSubtopics(userId);
    if (existing.includes(subtopicSlug)) {
      return false;
    }
    const next = [...existing, subtopicSlug];
    const storageKey = getStorageKey(userId);
    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    return true;
  } catch (error) {
    console.warn('Tamamlanan deseni kaydetme başarısız', error);
    return false;
  }
}


