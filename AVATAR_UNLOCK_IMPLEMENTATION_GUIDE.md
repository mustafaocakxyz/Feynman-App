# Avatar Unlocking Implementation Guide

## Current Setup
- ✅ 5 avatars available (avatar1.png - avatar5.png)
- ✅ Avatars 1, 2, 3 unlocked by default
- ✅ Avatar 4: Unlock at 1000 XP
- ✅ Avatar 5: Unlock at 3-day streak

---

## Step 1: Supabase Schema Update

**You need to do this first:**

Run this SQL in your Supabase SQL Editor:

```sql
-- Add unlocked_avatars column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS unlocked_avatars TEXT[] DEFAULT ARRAY['1', '2', '3'];

-- Set default for existing users (unlock avatars 1, 2, 3)
UPDATE user_profiles 
SET unlocked_avatars = ARRAY['1', '2', '3'] 
WHERE unlocked_avatars IS NULL;
```

**Why:** This stores which avatars each user has unlocked. Default avatars (1, 2, 3) are unlocked for everyone.

---

## Step 2: Update Avatar System (I'll do this)

**Files to modify:**
- `lib/profile-storage.ts`
  - Update `VALID_AVATARS` to `['1', '2', '3', '4', '5']`
  - Update `getAvatarSource()` to handle avatars 4 and 5

---

## Step 3: Create Unlock Storage System (I'll do this)

**New file:** `lib/avatar-unlocks.ts`

**Functions:**
- `getUnlockedAvatars(userId)` - Get array of unlocked avatar IDs from local/remote
- `unlockAvatar(userId, avatarId)` - Unlock an avatar and sync
- `checkUnlockConditions(userId)` - Check XP/streak and unlock avatars
- Local + Supabase sync (similar to profile/XP/streak pattern)

---

## Step 4: Create Unlock Condition Checker (I'll do this)

**Logic:**
- Avatar 4: Check if user has ≥ 1000 XP
- Avatar 5: Check if user has ≥ 3 day streak
- Run checks after: XP gain, streak update, subtopic completion

**Where to trigger:**
- After XP is added (`lib/xp-storage.ts` - after `addXp`)
- After streak is updated (`lib/streak-storage.ts` - after `recordStreakActivity`)
- After subtopic completion (`app/ayt-matematik/[subtopic].tsx` - in completion useEffect)

---

## Step 5: Update Profile Page (I'll do this)

**File:** `app/(tabs)/profil.tsx`

**Changes:**
- Display all 5 avatars in a grid
- Show unlocked avatars in color
- Show locked avatars in grayscale (with lock icon overlay)
- Only allow selecting unlocked avatars
- Update `AvatarPicker` component to show locked state

---

## Step 6: Update Completion Page Rewards (I'll do this)

**File:** `app/ayt-matematik/[subtopic].tsx`

**Changes:**
- After subtopic completion, check for newly unlocked avatars
- If new unlocks exist, set `hasRewards: true` in `completionData`
- Display unlocked avatars in rewards page (Page 2)
- Show animation/notification for new unlocks

---

## Step 7: Update AvatarPicker Component (I'll do this)

**File:** `components/AvatarPicker.tsx`

**Changes:**
- Show all 5 avatars
- Display locked avatars in grayscale
- Disable selection for locked avatars
- Show unlock condition hint for locked avatars

---

## Implementation Order

1. **You:** Run Supabase SQL (Step 1)
2. **Me:** Steps 2-7 (all code changes)

---

## Questions Before I Start:

1. **Supabase:** Can you confirm you'll run the SQL from Step 1? (Or should I provide a migration file?)

2. **Unlock Display:** When avatar 4 or 5 unlocks, should we:
   - Show a notification/toast?
   - Display in completion rewards page?
   - Both?

3. **Locked Avatar Display:** For locked avatars in profile page:
   - Grayscale filter?
   - Lock icon overlay?
   - Both?

4. **Unlock Timing:** Should we check unlock conditions:
   - Only on subtopic completion?
   - Also on XP gain and streak update?
   - All of the above?

Let me know your preferences and I'll proceed with the implementation!

