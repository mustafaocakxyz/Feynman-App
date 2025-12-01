import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { pullProfile, syncProfile } from '../lib/profile-storage';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);

      // Sync profile on initial session load
      if (session?.user?.id) {
        syncUserProfile(session.user.id).catch(console.error);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);

      // Sync profile on auth state change (login/logout)
      if (session?.user?.id) {
        syncUserProfile(session.user.id).catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to sync user profile
  const syncUserProfile = async (userId: string) => {
    try {
      // Pull from remote first to get latest data, then sync local to remote
      await pullProfile(userId);
      // Then sync local changes (if any) back to remote
      await syncProfile(userId);
    } catch (error) {
      console.warn('Profile sync failed on auth state change', error);
      // Don't throw - this is a background operation
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      // Create profile in database if signup successful
      if (!error && data.user?.id) {
        try {
          await syncProfile(data.user.id); // This will create the profile if it doesn't exist
        } catch (profileError) {
          console.warn('Profile creation failed after signup', profileError);
          // Don't fail signup if profile creation fails - it will be retried on next login
        }
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

