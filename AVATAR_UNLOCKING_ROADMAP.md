# Avatar Unlocking System - Roadmap

## What I Need From You

1. **12 new avatar images** (avatar4.png through avatar15.png)
   - Place in: `FeynmanApp/assets/images/avatars/`
   - Same format/size as existing avatars

2. **Unlock conditions** for each avatar (e.g., "Complete 5 subtopics", "Reach 1000 XP", "7-day streak")

## Supabase Changes Required

### New Table: `unlocked_avatars`
```sql
CREATE TABLE unlocked_avatars (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  avatar_ids TEXT[] DEFAULT '{}', -- Array of unlocked avatar IDs: ["1", "2", "4", "7"]
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE unlocked_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own unlocked avatars"
  ON unlocked_avatars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own unlocked avatars"
  ON unlocked_avatars FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unlocked avatars"
  ON unlocked_avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Alternative (Simpler):** Add `unlocked_avatars TEXT[]` column to existing `user_profiles` table instead of new table.

## What I Will Implement

### 1. **Avatar System Expansion**
- Update `VALID_AVATARS` to include IDs 1-15
- Update `getAvatarSource()` to handle all 15 avatars
- Create unlock condition checker functions

### 2. **Unlock Storage (`lib/avatar-unlocks.ts`)**
- `getUnlockedAvatars(userId)` - Get array of unlocked avatar IDs
- `unlockAvatar(userId, avatarId)` - Unlock and sync to Supabase
- `checkUnlockConditions(userId)` - Check achievements and unlock avatars
- Local + Supabase sync (similar to profile/XP/streak)

### 3. **Profile Page Updates**
- Display all 15 avatars in grid
- Show colored (unlocked) vs gray (locked) states
- Only allow selecting unlocked avatars
- Update `AvatarPicker` component

### 4. **Completion Page Rewards**
- Check for newly unlocked avatars after subtopic completion
- Display unlocked avatars in rewards page (Page 2)
- Show animation/notification for new unlocks

### 5. **Unlock Conditions Logic**
- Track: subtopic completions, total XP, streak days, etc.
- Auto-check on: subtopic completion, XP gain, streak update
- Store unlock conditions as configurable rules

## Implementation Order

1. Supabase schema update (you do this)
2. Avatar system expansion (add 12 avatars to code)
3. Unlock storage system
4. Profile page avatar grid
5. Unlock condition checking
6. Completion page rewards display

## Estimated Files to Modify/Create

- `lib/avatar-unlocks.ts` (NEW)
- `lib/profile-storage.ts` (UPDATE - expand VALID_AVATARS)
- `components/AvatarPicker.tsx` (UPDATE - show locked state)
- `app/(tabs)/profil.tsx` (UPDATE - grid display)
- `app/ayt-matematik/[subtopic].tsx` (UPDATE - check unlocks on completion)
- `lib/sync-service.ts` (UPDATE - sync unlocks)

