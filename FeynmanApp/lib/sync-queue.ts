import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_QUEUE_KEY = '@feynman/sync-queue';

export type SyncOperation = {
  id: string;
  type: 'progress' | 'profile';
  userId: string;
  timestamp: number;
  data: unknown;
};

/**
 * Add an operation to the sync queue
 * This is called when a write operation fails due to network issues
 */
export async function queueSyncOperation(operation: Omit<SyncOperation, 'id' | 'timestamp'>): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const newOperation: SyncOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    queue.push(newOperation);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn('Sync operation queue failed', error);
    throw error;
  }
}

/**
 * Get all queued sync operations
 */
export async function getSyncQueue(): Promise<SyncOperation[]> {
  try {
    const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn('Sync queue read failed', error);
    return [];
  }
}

/**
 * Remove operations from the queue (after successful sync)
 */
export async function removeSyncOperations(operationIds: string[]): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filtered = queue.filter((op) => !operationIds.includes(op.id));
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn('Sync queue update failed', error);
    throw error;
  }
}

/**
 * Clear all sync operations for a specific user
 * Useful when user logs out
 */
export async function clearSyncQueueForUser(userId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filtered = queue.filter((op) => op.userId !== userId);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn('Sync queue clear failed', error);
    throw error;
  }
}

/**
 * Clear entire sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.warn('Sync queue clear failed', error);
    throw error;
  }
}

/**
 * Get queued operations for a specific user
 */
export async function getSyncQueueForUser(userId: string): Promise<SyncOperation[]> {
  const queue = await getSyncQueue();
  return queue.filter((op) => op.userId === userId);
}

