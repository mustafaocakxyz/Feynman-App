import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Valid avatar identifiers: "1", "2", "3", "4", "5"
export const VALID_AVATARS = ['1', '2', '3', '4', '5'] as const;
export type AvatarId = typeof VALID_AVATARS[number];

export type UserProfile = {
  name: string;
  avatarId: AvatarId | null; // "1", "2", "3", "4", "5", or null
};

const STORAGE_KEY_PREFIX = '@feynman/profile_';

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

// Get profile from local storage (primary source)
async function getLocalProfile(userId: string): Promise<UserProfile | null> {
  try {
    const storageKey = getStorageKey(userId);
    const stored = await AsyncStorage.getItem(storageKey);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as UserProfile;
    
    // Validate avatarId
    if (parsed.avatarId && !VALID_AVATARS.includes(parsed.avatarId as AvatarId)) {
      parsed.avatarId = null;
    }
    
    return parsed;
  } catch (error) {
    console.warn('Profile verisi okunamadı (local)', error);
    return null;
  }
}

// Save profile to local storage
async function saveLocalProfile(userId: string, profile: UserProfile): Promise<void> {
  try {
    const storageKey = getStorageKey(userId);
    await AsyncStorage.setItem(storageKey, JSON.stringify(profile));
  } catch (error) {
    console.warn('Profile verisi kaydedilemedi (local)', error);
    throw error;
  }
}

// Get profile from Supabase (cloud source)
async function getRemoteProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('name, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found - user doesn't have a profile yet
        return null;
      }
      throw error;
    }

    // Map avatar_url to avatarId (validate it's a valid identifier)
    let avatarId: AvatarId | null = null;
    if (data.avatar_url && VALID_AVATARS.includes(data.avatar_url as AvatarId)) {
      avatarId = data.avatar_url as AvatarId;
    }

    return {
      name: data.name,
      avatarId,
    };
  } catch (error) {
    console.warn('Profile verisi okunamadı (remote)', error);
    return null;
  }
}

// Save profile to Supabase
async function saveRemoteProfile(userId: string, profile: UserProfile): Promise<void> {
  try {
    // Get user's name from auth metadata as fallback
    const { data: { user } } = await supabase.auth.getUser();
    const defaultName = user?.user_metadata?.name || profile.name || '';

    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: userId,
          name: profile.name || defaultName,
          avatar_url: profile.avatarId, // Store identifier as avatar_url
        },
        {
          onConflict: 'id',
        }
      );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn('Profile verisi kaydedilemedi (remote)', error);
    throw error;
  }
}

/**
 * Get user profile (local-first, with remote fallback)
 * If local exists, returns it immediately.
 * If local doesn't exist, fetches from remote and caches locally.
 */
export async function getProfile(userId: string): Promise<UserProfile> {
  // Try local first
  const localProfile = await getLocalProfile(userId);
  if (localProfile) {
    return localProfile;
  }

  // Fallback to remote
  const remoteProfile = await getRemoteProfile(userId);
  if (remoteProfile) {
    // Cache locally
    await saveLocalProfile(userId, remoteProfile);
    return remoteProfile;
  }

  // No profile exists - return default
  const defaultProfile: UserProfile = {
    name: '',
    avatarId: null,
  };
  return defaultProfile;
}

/**
 * Update user profile (local-first, queue sync)
 * Updates local storage immediately, then syncs to remote in background.
 */
export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  // Validate avatarId if provided
  if (updates.avatarId !== undefined) {
    if (updates.avatarId !== null && !VALID_AVATARS.includes(updates.avatarId)) {
      throw new Error(`Invalid avatarId: ${updates.avatarId}. Must be one of: ${VALID_AVATARS.join(', ')}`);
    }
  }

  // Get current profile
  const currentProfile = await getProfile(userId);
  
  // Merge updates
  const updatedProfile: UserProfile = {
    ...currentProfile,
    ...updates,
  };

  // Save locally first (instant)
  await saveLocalProfile(userId, updatedProfile);

  // Sync to remote in background (don't await - fire and forget)
  syncProfile(userId).catch((error) => {
    console.warn('Profile sync failed (will retry later)', error);
  });

  return updatedProfile;
}

/**
 * Sync profile from local to remote (push)
 * This is called automatically after updates, or can be called manually.
 */
export async function syncProfile(userId: string): Promise<void> {
  try {
    const localProfile = await getLocalProfile(userId);
    if (!localProfile) {
      return; // Nothing to sync
    }

    await saveRemoteProfile(userId, localProfile);
  } catch (error) {
    console.warn('Profile sync error', error);
    throw error; // Re-throw so caller can handle (e.g., add to retry queue)
  }
}

/**
 * Sync profile from remote to local (pull)
 * Useful for initial sync or when you want to ensure local is up-to-date.
 */
export async function pullProfile(userId: string): Promise<UserProfile> {
  const remoteProfile = await getRemoteProfile(userId);
  if (remoteProfile) {
    await saveLocalProfile(userId, remoteProfile);
    return remoteProfile;
  }

  // No remote profile - return local or default
  const localProfile = await getLocalProfile(userId);
  return localProfile || { name: '', avatarId: null };
}

/**
 * Get avatar image source from avatarId
 */
export function getAvatarSource(avatarId: AvatarId | null): any {
  if (!avatarId) {
    return null;
  }

  switch (avatarId) {
    case '1':
      return require('@/assets/images/avatars/avatar1.png');
    case '2':
      return require('@/assets/images/avatars/avatar2.png');
    case '3':
      return require('@/assets/images/avatars/avatar3.png');
    case '4':
      return require('@/assets/images/avatars/avatar4.png');
    case '5':
      return require('@/assets/images/avatars/avatar5.png');
    default:
      return null;
  }
}

