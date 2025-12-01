import { supabase } from './supabase';
import { queueSyncOperation, getSyncQueueForUser, removeSyncOperations } from './sync-queue';
import { getCompletedSubtopics } from './completion-storage';
import { getStreakState } from './streak-storage';
import { getXpState } from './xp-storage';

type UserProgress = {
  completed_subtopics: string[];
  xp_total: number;
  streak_count: number;
  streak_last_date: string | null;
};

type RemoteProgress = {
  completed_subtopics: string[];
  xp_total: number;
  streak_count: number;
  streak_last_date: string | null;
  updated_at: string;
  last_synced_at: string;
};

/**
 * Get progress from local storage
 */
async function getLocalProgress(userId: string): Promise<UserProgress> {
  const [completed, streakState, xpState] = await Promise.all([
    getCompletedSubtopics(userId),
    getStreakState(userId),
    getXpState(userId),
  ]);

  return {
    completed_subtopics: completed,
    xp_total: xpState.total,
    streak_count: streakState.count,
    streak_last_date: streakState.lastActivityDate,
  };
}

/**
 * Get progress from Supabase (remote)
 */
async function getRemoteProgress(userId: string): Promise<RemoteProgress | null> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('completed_subtopics, xp_total, streak_count, streak_last_date, updated_at, last_synced_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found - user doesn't have progress yet
        return null;
      }
      throw error;
    }

    return {
      completed_subtopics: (data.completed_subtopics as string[]) || [],
      xp_total: data.xp_total || 0,
      streak_count: data.streak_count || 0,
      streak_last_date: data.streak_last_date || null,
      updated_at: data.updated_at,
      last_synced_at: data.last_synced_at,
    };
  } catch (error) {
    console.warn('Remote progress fetch failed', error);
    throw error;
  }
}

/**
 * Save progress to Supabase (remote)
 */
async function saveRemoteProgress(userId: string, progress: UserProgress): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          completed_subtopics: progress.completed_subtopics,
          xp_total: progress.xp_total,
          streak_count: progress.streak_count,
          streak_last_date: progress.streak_last_date,
          last_synced_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select();

    if (error) {
      console.error('[Sync] Supabase error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }
  } catch (error) {
    console.error('[Sync] Remote progress save failed:', error);
    throw error;
  }
}

/**
 * Resolve conflicts between local and remote progress
 * Strategy: Last-Write-Wins with intelligent merging
 */
function resolveProgressConflict(
  local: UserProgress,
  remote: RemoteProgress
): UserProgress {
  const localTimestamp = Date.now(); // We don't have local timestamp, use current
  const remoteTimestamp = new Date(remote.updated_at).getTime();

  // If remote is newer, merge intelligently
  if (remoteTimestamp > localTimestamp) {
    return {
      // Merge completed subtopics (union of both arrays)
      completed_subtopics: [
        ...new Set([...local.completed_subtopics, ...remote.completed_subtopics]),
      ],
      // Take maximum XP (user might have earned XP on another device)
      xp_total: Math.max(local.xp_total, remote.xp_total),
      // Take maximum streak (user might have longer streak on another device)
      streak_count: Math.max(local.streak_count, remote.streak_count),
      // Take the more recent streak date
      streak_last_date: chooseMostRecentDate(local.streak_last_date, remote.streak_last_date),
    };
  }

  // Local is newer or equal, use local but merge arrays
  return {
    completed_subtopics: [
      ...new Set([...local.completed_subtopics, ...remote.completed_subtopics]),
    ],
    xp_total: Math.max(local.xp_total, remote.xp_total),
    streak_count: Math.max(local.streak_count, remote.streak_count),
    streak_last_date: chooseMostRecentDate(local.streak_last_date, remote.streak_last_date),
  };
}

/**
 * Helper to choose the most recent date
 */
function chooseMostRecentDate(date1: string | null, date2: string | null): string | null {
  if (!date1) return date2;
  if (!date2) return date1;
  return date1 > date2 ? date1 : date2;
}

/**
 * Save progress to local storage (updates all three storage files)
 */
async function saveLocalProgress(userId: string, progress: UserProgress): Promise<void> {
  // Import storage functions
  const { markSubtopicCompleted } = await import('./completion-storage');
  const { setStreakState } = await import('./streak-storage');
  const { addXp } = await import('./xp-storage');

  // Update completions (add any missing ones)
  const currentCompleted = await getCompletedSubtopics(userId);
  for (const subtopic of progress.completed_subtopics) {
    if (!currentCompleted.includes(subtopic)) {
      await markSubtopicCompleted(userId, subtopic);
    }
  }

  // Update streak state directly (used for sync)
  await setStreakState(userId, {
    count: progress.streak_count,
    lastActivityDate: progress.streak_last_date,
  });

  // Update XP (set directly to match synced value)
  const { setXpTotal } = await import('./xp-storage');
  await setXpTotal(userId, progress.xp_total);
}

/**
 * Push local progress to remote (cloud)
 */
export async function pushProgress(userId: string): Promise<void> {
  try {
    // Verify we have an active session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('No active session for sync');
    }
    
    // Verify userId matches session user
    if (session.user.id !== userId) {
      throw new Error(`User ID mismatch: session=${session.user.id}, requested=${userId}`);
    }
    
    const local = await getLocalProgress(userId);
    await saveRemoteProgress(userId, local);
  } catch (error) {
    console.error('[Sync] pushProgress failed, queueing for retry:', error);
    // Queue for retry if network fails
    try {
      await queueSyncOperation({
        type: 'progress',
        userId,
        data: { action: 'push' },
      });
      console.log('[Sync] Operation queued for retry');
    } catch (queueError) {
      console.error('[Sync] Failed to queue operation:', queueError);
    }
    throw error;
  }
}

/**
 * Pull remote progress and merge with local
 */
export async function pullProgress(userId: string): Promise<void> {
  try {
    const remote = await getRemoteProgress(userId);
    if (!remote) {
      // No remote progress exists, push local instead
      await pushProgress(userId);
      return;
    }

    const local = await getLocalProgress(userId);
    const merged = resolveProgressConflict(local, remote);
    
    // Save merged data to local storage
    await saveLocalProgress(userId, merged);
    
    // If merged differs from remote, push the merged version
    if (JSON.stringify(merged) !== JSON.stringify(remote)) {
      await saveRemoteProgress(userId, merged);
    }
  } catch (error) {
    console.warn('Progress pull failed', error);
    throw error;
  }
}

/**
 * Bidirectional sync: Pull first, then push local changes
 * This ensures we get latest remote data, then update with local changes
 */
export async function syncProgress(userId: string): Promise<void> {
  try {
    // First, pull and merge remote changes
    await pullProgress(userId);
    
    // Then, push local changes (in case local has newer data)
    await pushProgress(userId);
  } catch (error) {
    console.warn('Progress sync failed', error);
    // Queue for retry
    await queueSyncOperation({
      type: 'progress',
      userId,
      data: { action: 'sync' },
    });
    throw error;
  }
}

/**
 * Process queued sync operations
 * Call this when connection is restored
 */
export async function processSyncQueue(userId: string): Promise<void> {
  try {
    const queue = await getSyncQueueForUser(userId);
    const progressOps = queue.filter((op) => op.type === 'progress');

    const processedIds: string[] = [];

    for (const operation of progressOps) {
      try {
        await syncProgress(userId);
        processedIds.push(operation.id);
      } catch (error) {
        console.warn(`Sync operation ${operation.id} failed`, error);
        // Keep in queue for next retry
      }
    }

    // Remove successfully processed operations
    if (processedIds.length > 0) {
      await removeSyncOperations(processedIds);
    }
  } catch (error) {
    console.warn('Sync queue processing failed', error);
    throw error;
  }
}

