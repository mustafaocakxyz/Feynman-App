import AsyncStorage from '@react-native-async-storage/async-storage';

function getStorageKey(userId: string): string {
  return `@feynman/xp_${userId}`;
}

type XpState = {
  total: number;
};

async function readState(userId: string): Promise<XpState> {
  try {
    const storageKey = getStorageKey(userId);
    const stored = await AsyncStorage.getItem(storageKey);
    if (!stored) {
      return { total: 0 };
    }
    const parsed = JSON.parse(stored) as XpState;
    if (parsed && typeof parsed.total === 'number') {
      return parsed;
    }
  } catch (error) {
    console.warn('XP verisi okunamadı', error);
  }
  return { total: 0 };
}

async function writeState(userId: string, state: XpState) {
  try {
    const storageKey = getStorageKey(userId);
    await AsyncStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn('XP verisi kaydedilemedi', error);
  }
}

export async function getXpState(userId: string): Promise<XpState> {
  return readState(userId);
}

export async function addXp(userId: string, amount: number): Promise<XpState> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return readState(userId);
  }
  const state = await readState(userId);
  const next = { total: state.total + Math.round(amount) };
  await writeState(userId, next);
  return next;
}


