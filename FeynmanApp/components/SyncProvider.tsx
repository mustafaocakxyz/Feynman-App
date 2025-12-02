import { ReactNode } from 'react';
import { useSync } from '@/hooks/use-sync';

/**
 * Provider component that initializes automatic syncing
 * Should be placed inside AuthProvider to have access to user
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  // This hook handles all sync logic (initial sync, periodic sync, queue processing)
  // Hooks must be called unconditionally - the hook itself is defensive
  useSync();

  return <>{children}</>;
}

