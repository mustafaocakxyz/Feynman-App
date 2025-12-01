import { useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { useOnlineStatus } from './use-online-status';
import { syncProgress, processSyncQueue } from '@/lib/sync-service';
import { syncProfile } from '@/lib/profile-storage';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const INITIAL_SYNC_DELAY = 2000; // 2 seconds after mount

// Helper to get app state (works on web and native)
const getAppState = (): AppStateStatus => {
  if (Platform.OS === 'web') {
    return document.hidden ? 'background' : 'active';
  }
  return AppState.currentState;
};

/**
 * Hook to manage automatic syncing
 * - Syncs on mount (if online)
 * - Syncs periodically in background
 * - Processes queue when coming back online
 * - Syncs when app comes to foreground
 */
export function useSync() {
  const { user } = useAuth();
  const { isOnline, checkOnlineStatus } = useOnlineStatus();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(getAppState());
  const lastSyncRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  /**
   * Perform a full sync (profile + progress)
   */
  const performSync = useCallback(async () => {
    if (!user?.id || isSyncingRef.current) {
      return;
    }

    if (!isOnline) {
      // Check again in case status is stale
      await checkOnlineStatus();
      if (!isOnline) {
        return;
      }
    }

    isSyncingRef.current = true;
    try {
      // Sync profile and progress in parallel
      await Promise.allSettled([
        syncProfile(user.id),
        syncProgress(user.id),
      ]);

      // Process any queued operations
      await processSyncQueue(user.id);

      lastSyncRef.current = Date.now();
    } catch (error) {
      console.warn('[Sync Hook] Sync failed:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [user?.id, isOnline, checkOnlineStatus]);

  /**
   * Handle app state changes (foreground/background)
   */
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web: Use visibilitychange event
      const handleVisibilityChange = () => {
        const nextAppState = getAppState();
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App came to foreground - sync if online
          if (isOnline && user?.id) {
            performSync();
          }
        }
        appStateRef.current = nextAppState;
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      // Native: Use AppState
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App came to foreground - sync if online
          if (isOnline && user?.id) {
            performSync();
          }
        }
        appStateRef.current = nextAppState;
      });

      return () => {
        subscription.remove();
      };
    }
  }, [isOnline, user?.id, performSync]);

  /**
   * Handle coming back online - process queue immediately
   */
  useEffect(() => {
    if (isOnline && user?.id) {
      // When coming back online, process queue immediately
      processSyncQueue(user.id).catch(console.error);
      
      // Then perform full sync after a short delay
      const timeout = setTimeout(() => {
        performSync();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [isOnline, user?.id, performSync]);

  /**
   * Initial sync on mount (delayed)
   */
  useEffect(() => {
    if (!user?.id) return;

    const timeout = setTimeout(() => {
      if (isOnline) {
        performSync();
      }
    }, INITIAL_SYNC_DELAY);

    return () => clearTimeout(timeout);
  }, [user?.id, isOnline, performSync]);

  /**
   * Periodic background sync
   */
  useEffect(() => {
    if (!user?.id) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up interval for periodic sync
    intervalRef.current = setInterval(() => {
      // Only sync if online and app is active
      if (isOnline && getAppState() === 'active') {
        performSync();
      }
    }, SYNC_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.id, isOnline, performSync]);

  return {
    performSync,
    lastSyncTime: lastSyncRef.current,
    isOnline,
  };
}

