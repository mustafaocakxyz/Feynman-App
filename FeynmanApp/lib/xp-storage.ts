import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@feynman/xp';

type XpState = {
  total: number;
};

async function readState(): Promise<XpState> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
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

async function writeState(state: XpState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('XP verisi kaydedilemedi', error);
  }
}

export async function getXpState(): Promise<XpState> {
  return readState();
}

export async function addXp(amount: number): Promise<XpState> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return readState();
  }
  const state = await readState();
  const next = { total: state.total + Math.round(amount) };
  await writeState(next);
  return next;
}


