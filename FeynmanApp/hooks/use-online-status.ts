import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook to track online/offline status
 * Uses navigator.onLine for web and verifies with a lightweight Supabase check
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Check if we're actually online by attempting a lightweight Supabase operation
   */
  const checkOnlineStatus = useCallback(async () => {
    // Quick check: navigator.onLine (web only, may not be reliable)
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setIsOnline(false);
      return;
    }

    setIsChecking(true);
    try {
      // Try to get the current session (lightweight operation)
      // This verifies we can actually reach Supabase, not just that navigator thinks we're online
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        // If we get certain errors, we might be offline
        // But some errors (like auth errors) don't mean we're offline
        // So we check if it's a network-related error
        const isNetworkError = error.message.toLowerCase().includes('network') ||
                               error.message.toLowerCase().includes('fetch') ||
                               error.message.toLowerCase().includes('timeout');
        
        setIsOnline(!isNetworkError);
      } else {
        setIsOnline(true);
      }
    } catch (error) {
      // Network errors in catch usually mean we're offline
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  }, []); // No dependencies - this function is stable

  useEffect(() => {
    // Initial check
    checkOnlineStatus();

    // Listen to online/offline events (web)
    if (typeof window !== 'undefined') {
      const handleOnline = () => {
        // Verify with actual network request
        checkOnlineStatus();
      };
      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Periodic check (every 30 seconds) to verify real connectivity
      const interval = setInterval(() => {
        checkOnlineStatus();
      }, 30000);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(interval);
      };
    }
  }, [checkOnlineStatus]); // Now it's safe to include in dependencies

  // Ensure we always return a valid object with all expected properties
  return {
    isOnline: isOnline ?? true,
    isChecking: isChecking ?? false,
    checkOnlineStatus: checkOnlineStatus ?? (async () => {
      // Fallback no-op function if checkOnlineStatus is somehow undefined
      console.warn('[useOnlineStatus] checkOnlineStatus is undefined, using fallback');
    }),
  };
}

