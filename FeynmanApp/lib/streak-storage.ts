import AsyncStorage from '@react-native-async-storage/async-storage';

function getStorageKey(userId: string): string {
  return `@feynman/streak_${userId}`;
}

const TIME_ZONE = 'Europe/Istanbul';
const MS_PER_DAY = 1000 * 60 * 60 * 24;

type StreakState = {
  count: number;
  lastActivityDate: string | null;
};

function getTodayString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function toDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00+03:00`);
}

function diffInDays(from: string, to: string): number {
  const a = toDate(from);
  const b = toDate(to);
  return Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY);
}

async function readState(userId: string): Promise<StreakState> {
  try {
    const storageKey = getStorageKey(userId);
    const stored = await AsyncStorage.getItem(storageKey);
    if (!stored) {
      return { count: 0, lastActivityDate: null };
    }
    const parsed = JSON.parse(stored) as StreakState;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.count === 'number' &&
      (parsed.lastActivityDate === null || typeof parsed.lastActivityDate === 'string')
    ) {
      return parsed;
    }
    return { count: 0, lastActivityDate: null };
  } catch (error) {
    console.warn('Streak verisi okunamadı', error);
    return { count: 0, lastActivityDate: null };
  }
}

async function writeState(userId: string, state: StreakState) {
  try {
    const storageKey = getStorageKey(userId);
    await AsyncStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn('Streak verisi kaydedilemedi', error);
  }
}

export async function getStreakState(userId: string): Promise<StreakState> {
  const state = await readState(userId);
  const today = getTodayString();

  if (state.lastActivityDate) {
    const diff = diffInDays(state.lastActivityDate, today);
    if (diff > 1) {
      const resetState = { count: 0, lastActivityDate: state.lastActivityDate };
      await writeState(userId, resetState);
      return resetState;
    }
  }

  return state;
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
      console.warn('[Streak Storage] Background sync failed:', error);
    });
}

export async function recordStreakActivity(userId: string): Promise<StreakState> {
  const state = await readState(userId);
  const today = getTodayString();

  if (state.lastActivityDate === today) {
    return state;
  }

  let nextCount = 1;
  if (state.lastActivityDate) {
    const diff = diffInDays(state.lastActivityDate, today);
    if (diff === 1) {
      nextCount = state.count + 1;
    }
  }

  const nextState = { count: nextCount, lastActivityDate: today };
  await writeState(userId, nextState);
  
  // Trigger sync in background (fire-and-forget)
  triggerSync(userId);
  
  // Check avatar unlock conditions in background (fire-and-forget)
  import('./avatar-unlocks')
    .then(({ checkUnlockConditions }) => checkUnlockConditions(userId))
    .catch((error) => {
      console.warn('[Streak Storage] Avatar unlock check failed:', error);
    });
  
  return nextState;
}

/**
 * Set streak state directly (used for sync operations)
 * This bypasses the date checking logic and sets the state as-is
 */
export async function setStreakState(userId: string, state: StreakState): Promise<void> {
  await writeState(userId, state);
}


