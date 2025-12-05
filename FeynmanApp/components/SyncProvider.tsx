import { ReactNode } from 'react';
import { useSync } from '@/hooks/use-sync';

/**
 * Provider component that initializes automatic syncing
 * Should be placed inside AuthProvider to have access to user
 * 
 * TEMPORARILY DISABLED: Comment out useSync to test if sync is causing crashes
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  // TEMPORARILY DISABLED FOR TESTING
  // If app works without this, we know sync is the issue
  // useSync();

  return <>{children}</>;
}

