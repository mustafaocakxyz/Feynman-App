# Authentication & User-Specific Data Implementation Roadmap

## ✅ Step 1: Branch Setup (COMPLETED)
- [x] Switch to main branch
- [x] Pull latest changes from main
- [x] Create and switch to `authentication` branch

---

## Step 2: Install Dependencies

### 2.1 Install Supabase Client
```bash
cd FeynmanApp
npm install @supabase/supabase-js
```

### 2.2 Create Environment Variables File
- Create `.env` file in `FeynmanApp/` directory
- Add Supabase URL and anon key (you will provide these)

---

## Step 3: Supabase Client Setup

### 3.1 Create Supabase Client Configuration
**File**: `FeynmanApp/lib/supabase.ts`
- Initialize Supabase client with environment variables
- Export client instance

### 3.2 Configure Environment Variables Loading
- Install `react-native-dotenv` or use Expo's built-in env support
- Update `app.json` or `babel.config.js` if needed

---

## Step 4: Authentication Service Layer

### 4.1 Create Authentication Context
**File**: `FeynmanApp/contexts/auth-context.tsx`
- Create React Context for auth state
- Manage: `user`, `session`, `loading`, `initialized`
- Provide: `signUp()`, `signIn()`, `signOut()`, `getCurrentUser()`
- Listen to Supabase auth state changes

### 4.2 Create Auth Hook
**File**: `FeynmanApp/hooks/use-auth.ts` (optional wrapper)
- Hook to access auth context
- Returns: `{ user, session, loading, signUp, signIn, signOut }`

---

## Step 5: Update Storage Functions for User-Specific Keys

### 5.1 Update XP Storage
**File**: `FeynmanApp/lib/xp-storage.ts`
- Modify `getXpState()` to accept `userId: string`
- Modify `addXp()` to accept `userId: string`
- Change storage keys: `xp_${userId}`

### 5.2 Update Streak Storage
**File**: `FeynmanApp/lib/streak-storage.ts`
- Modify `getStreak()` to accept `userId: string`
- Modify `recordActivity()` to accept `userId: string`
- Modify `resetStreak()` to accept `userId: string`
- Change storage keys: `streak_${userId}`, `lastActivity_${userId}`

### 5.3 Update Completion Storage
**File**: `FeynmanApp/lib/completion-storage.ts`
- Modify `getCompletedSubtopics()` to accept `userId: string`
- Modify `markSubtopicCompleted()` to accept `userId: string`
- Change storage keys: `completed_subtopics_${userId}`

---

## Step 6: Create Authentication UI Components

### 6.1 Welcome Screen
**File**: `FeynmanApp/app/(auth)/welcome.tsx`
- Display welcome message
- Two buttons: "Giriş Yap" (Login), "Kayıt Ol" (Register)
- Navigate to respective screens

### 6.2 Login Screen
**File**: `FeynmanApp/app/(auth)/login.tsx`
- Email input field
- Password input field
- "Giriş Yap" button
- Error message display
- Loading state during login
- Navigation back to welcome
- Navigate to home on success

### 6.3 Register Screen
**File**: `FeynmanApp/app/(auth)/register.tsx`
- Name input field
- Email input field
- Password input field
- "Kayıt Ol" button
- Error message display
- Loading state during registration
- Navigation back to welcome
- Auto-login after successful registration
- Navigate to home on success

### 6.4 Auth Layout
**File**: `FeynmanApp/app/(auth)/_layout.tsx`
- Create auth group layout
- Stack navigator for auth screens

---

## Step 7: Update Root Layout for Auth Routing

### 7.1 Update Root Layout
**File**: `FeynmanApp/app/_layout.tsx`
- Wrap app with `AuthProvider`
- Check auth state on app initialization
- Show loading screen while checking auth
- Redirect authenticated users from auth screens to home
- Redirect unauthenticated users to welcome screen

### 7.2 Create Auth Provider Component
**File**: `FeynmanApp/components/auth-provider.tsx` (optional)
- Wrapper for AuthContext.Provider
- Handle initialization logic

---

## Step 8: Update Existing Screens for User-Specific Data

### 8.1 Update Home Screen
**File**: `FeynmanApp/app/index.tsx`
- Get `userId` from auth context
- Update all storage calls to include `userId`:
  - `getCompletedSubtopics(userId)`
  - `getStreak(userId)`
  - `getXpState(userId)`
- Add logout button/option (optional)

### 8.2 Update Topic List Screen
**File**: `FeynmanApp/app/ayt-matematik/index.tsx`
- Get `userId` from auth context
- Update `getCompletedSubtopics(userId)` calls

### 8.3 Update Subtopic Lesson Screen
**File**: `FeynmanApp/app/ayt-matematik/[subtopic].tsx`
- Get `userId` from auth context
- Update all storage calls to include `userId`:
  - `markSubtopicCompleted(userId, ...)`
  - `addXp(userId, amount)`
  - `recordActivity(userId)`

---

## Step 9: Route Protection

### 9.1 Protect Main App Routes
- Ensure all main app screens (home, topics, subtopics) require authentication
- Redirect to welcome if not authenticated

### 9.2 Protect Auth Routes
- Redirect authenticated users away from auth screens
- If user is logged in and tries to access welcome/login/register, redirect to home

---

## Step 10: Error Handling & Loading States

### 10.1 Error Messages
- Display Turkish error messages for:
  - Wrong credentials
  - Email already exists
  - Weak password
  - Network errors
  - Invalid email format

### 10.2 Loading States
- Show loading indicators during:
  - Login process
  - Registration process
  - Initial auth check
- Disable buttons during auth operations

---

## Step 11: Testing & Verification

### 11.1 Test Authentication Flow
- [ ] Register new user
- [ ] Login with existing user
- [ ] Logout
- [ ] Login again (session persistence)

### 11.2 Test User-Specific Data
- [ ] Register User A, complete subtopic, earn XP
- [ ] Logout
- [ ] Register/Login User B, verify no User A data visible
- [ ] Login User A again, verify their data is still there

### 11.3 Test Edge Cases
- [ ] Wrong credentials (error handling)
- [ ] Email already exists (error handling)
- [ ] Network error (error handling)
- [ ] App restart (session persistence)

---

## Step 12: Cleanup & Documentation

### 12.1 Code Cleanup
- Remove unused code
- Add comments where needed
- Ensure consistent code style

### 12.2 Update Documentation
- Update README if needed
- Document environment variables setup

---

## Implementation Order (Recommended)

1. **Step 2-3**: Supabase setup (requires your credentials)
2. **Step 4**: Auth service layer (foundation)
3. **Step 5**: Update storage for user-specific keys (critical for data isolation)
4. **Step 6**: Create UI screens
5. **Step 7**: Update root layout for routing
6. **Step 8**: Update existing screens to use userId
7. **Step 9**: Add route protection
8. **Step 10**: Polish error handling
9. **Step 11**: Test everything
10. **Step 12**: Cleanup

---

## What You Need to Provide

1. **Supabase Project URL** (e.g., `https://xxxxx.supabase.co`)
2. **Supabase Anon/Public Key**
3. **Confirmation**: Email/Password auth is enabled in Supabase Dashboard
4. **Optional**: Any custom email templates or auth settings

---

## Notes

- All gamification data (XP, streak, completions) will remain in AsyncStorage with user-specific keys
- No database tables needed for MVP (only Supabase Auth)
- User's `name` will be stored in `user_metadata` during registration
- Session persists across app restarts automatically via Supabase

