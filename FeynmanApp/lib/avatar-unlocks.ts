import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { VALID_AVATARS, type AvatarId } from './profile-storage';

const STORAGE_KEY_PREFIX = '@feynman/unlocked_avatars_';
const DEFAULT_UNLOCKED = ['1', '2', '3'] as const; // Avatars 1, 2, 3 are unlocked by default

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

// Get unlocked avatars from local storage
async function getLocalUnlockedAvatars(userId: string): Promise<AvatarId[]> {
  try {
    const storageKey = getStorageKey(userId);
    const stored = await AsyncStorage.getItem(storageKey);
    if (!stored) {
      // Return default unlocked avatars
      return [...DEFAULT_UNLOCKED];
    }
    const parsed = JSON.parse(stored) as string[];
    // Validate and filter to only valid avatar IDs
    return parsed.filter((id): id is AvatarId => 
      VALID_AVATARS.includes(id as AvatarId)
    );
  } catch (error) {
    console.warn('Unlocked avatars verisi okunamadı (local)', error);
    return [...DEFAULT_UNLOCKED];
  }
}

// Save unlocked avatars to local storage
async function saveLocalUnlockedAvatars(userId: string, avatarIds: AvatarId[]): Promise<void> {
  try {
    const storageKey = getStorageKey(userId);
    await AsyncStorage.setItem(storageKey, JSON.stringify(avatarIds));
  } catch (error) {
    console.warn('Unlocked avatars verisi kaydedilemedi (local)', error);
    throw error;
  }
}

// Get unlocked avatars from Supabase
async function getRemoteUnlockedAvatars(userId: string): Promise<AvatarId[] | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('unlocked_avatars')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found - return default
        return [...DEFAULT_UNLOCKED];
      }
      throw error;
    }

    if (!data?.unlocked_avatars || !Array.isArray(data.unlocked_avatars)) {
      return [...DEFAULT_UNLOCKED];
    }

    // Validate and filter to only valid avatar IDs
    return data.unlocked_avatars.filter((id): id is AvatarId => 
      VALID_AVATARS.includes(id as AvatarId)
    );
  } catch (error) {
    console.warn('Unlocked avatars verisi okunamadı (remote)', error);
    return null;
  }
}

// Save unlocked avatars to Supabase
async function saveRemoteUnlockedAvatars(userId: string, avatarIds: AvatarId[]): Promise<void> {
  try {
    // First, get existing profile to preserve name field (required by NOT NULL constraint)
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('id', userId)
      .single();

    // Get user's name from auth metadata as fallback
    const { data: { user } } = await supabase.auth.getUser();
    const defaultName = user?.user_metadata?.name || existingProfile?.name || '';

    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: userId,
          name: existingProfile?.name || defaultName,
          unlocked_avatars: avatarIds,
        },
        {
          onConflict: 'id',
        }
      );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn('Unlocked avatars verisi kaydedilemedi (remote)', error);
    throw error;
  }
}

/**
 * Get unlocked avatars (local-first, with remote fallback)
 */
export async function getUnlockedAvatars(userId: string): Promise<AvatarId[]> {
  // Try local first
  const localUnlocked = await getLocalUnlockedAvatars(userId);
  if (localUnlocked.length > 0) {
    return localUnlocked;
  }

  // Fallback to remote
  const remoteUnlocked = await getRemoteUnlockedAvatars(userId);
  if (remoteUnlocked) {
    // Cache locally
    await saveLocalUnlockedAvatars(userId, remoteUnlocked);
    return remoteUnlocked;
  }

  // Return default
  return [...DEFAULT_UNLOCKED];
}

/**
 * Unlock an avatar and sync to remote
 */
export async function unlockAvatar(userId: string, avatarId: AvatarId): Promise<void> {
  if (!VALID_AVATARS.includes(avatarId)) {
    throw new Error(`Invalid avatarId: ${avatarId}`);
  }

  const currentUnlocked = await getUnlockedAvatars(userId);
  
  // If already unlocked, do nothing
  if (currentUnlocked.includes(avatarId)) {
    return;
  }

  // Add to unlocked list
  const updatedUnlocked = [...currentUnlocked, avatarId];
  
  // Save locally first
  await saveLocalUnlockedAvatars(userId, updatedUnlocked);

  // Sync to remote in background
  saveRemoteUnlockedAvatars(userId, updatedUnlocked).catch((error) => {
    console.warn('Avatar unlock sync failed (will retry later)', error);
  });
}

/**
 * Check if an avatar is unlocked
 */
export async function isAvatarUnlocked(userId: string, avatarId: AvatarId): Promise<boolean> {
  const unlocked = await getUnlockedAvatars(userId);
  return unlocked.includes(avatarId);
}

/**
 * Sync unlocked avatars from local to remote (push)
 */
export async function syncUnlockedAvatars(userId: string): Promise<void> {
  try {
    const localUnlocked = await getLocalUnlockedAvatars(userId);
    await saveRemoteUnlockedAvatars(userId, localUnlocked);
  } catch (error) {
    console.warn('Unlocked avatars sync error', error);
    throw error;
  }
}

/**
 * Sync unlocked avatars from remote to local (pull)
 */
export async function pullUnlockedAvatars(userId: string): Promise<AvatarId[]> {
  const remoteUnlocked = await getRemoteUnlockedAvatars(userId);
  if (remoteUnlocked) {
    await saveLocalUnlockedAvatars(userId, remoteUnlocked);
    return remoteUnlocked;
  }

  // No remote data - return local or default
  const localUnlocked = await getLocalUnlockedAvatars(userId);
  return localUnlocked;
}

/**
 * Check unlock conditions and unlock avatars if conditions are met
 * Returns array of newly unlocked avatar IDs
 */
export async function checkUnlockConditions(userId: string): Promise<AvatarId[]> {
  const newlyUnlocked: AvatarId[] = [];

  try {
    // Import dynamically to avoid circular dependencies
    const { getXpState } = await import('./xp-storage');
    const { getStreakState } = await import('./streak-storage');

    // Get current unlocked avatars
    const currentUnlocked = await getUnlockedAvatars(userId);

    // Check Avatar 4: 1000 XP
    if (!currentUnlocked.includes('4')) {
      const xpState = await getXpState(userId);
      if (xpState.total >= 1000) {
        await unlockAvatar(userId, '4');
        newlyUnlocked.push('4');
      }
    }

    // Check Avatar 5: 3-day streak
    if (!currentUnlocked.includes('5')) {
      const streakState = await getStreakState(userId);
      if (streakState.count >= 3) {
        await unlockAvatar(userId, '5');
        newlyUnlocked.push('5');
      }
    }
  } catch (error) {
    console.warn('Avatar unlock condition check failed', error);
  }

  return newlyUnlocked;
}

