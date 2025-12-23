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

/**
 * Trigger sync in background (non-blocking)
 */
async function triggerSync(userId: string) {
  // Use dynamic import to avoid circular dependencies
  import('./sync-service')
    .then(({ pushProgress }) => pushProgress(userId))
    .catch((error) => {
      // Errors are handled by sync-service (queuing), just log here
      console.warn('[XP Storage] Background sync failed:', error);
    });
}

export async function addXp(userId: string, amount: number): Promise<XpState> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return readState(userId);
  }
  const state = await readState(userId);
  const next = { total: state.total + Math.round(amount) };
  await writeState(userId, next);
  
  // Trigger sync in background (fire-and-forget)
  triggerSync(userId);
  
  // Check avatar unlock conditions in background (fire-and-forget)
  import('./avatar-unlocks')
    .then(({ checkUnlockConditions }) => checkUnlockConditions(userId))
    .catch((error) => {
      console.warn('[XP Storage] Avatar unlock check failed:', error);
    });
  
  return next;
}

/**
 * Set XP total directly (used for sync operations)(x)
 * This bypasses the add logic and sets the total as-is
 */
export async function setXpTotal(userId: string, total: number): Promise<void> {
  if (!Number.isFinite(total) || total < 0) {
    throw new Error(`Invalid XP total: ${total}`);
  }
  await writeState(userId, { total: Math.round(total) });
}


