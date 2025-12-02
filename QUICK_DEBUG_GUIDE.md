# Quick Debug Guide - Find the Crash Issue

## 🔍 Step 1: Open Android Studio Logcat

1. **Launch Android Studio**
2. **Start your emulator** (if not already running)
3. **Open Logcat**:
   - Bottom of Android Studio window
   - Or: `View` → `Tool Windows` → `Logcat`

## 🔍 Step 2: Install Your APK

1. **Drag and drop your APK** onto the emulator window, OR
2. **Use terminal** (if ADB is in PATH):
   ```bash
   adb install path/to/FeynmanApp.apk
   ```

## 🔍 Step 3: Filter Logcat

1. **In Logcat, use filter:** `package:com.feynmanapp`
2. **Or search for:** `ReactNative|FATAL|Exception|Error`

## 🔍 Step 4: Launch App & Watch Logs

1. **Tap the app icon** on the emulator
2. **Watch Logcat immediately** - errors appear in real-time
3. **Look for these patterns:**

### ✅ Good Signs (App is Loading):
```
[RootLayout] Starting app initialization...
[RootLayout] Color scheme loaded
[RootLayout] Fonts loaded: true
[AuthProvider] Initializing...
```

### ❌ Bad Signs (Crash Indicators):
```
FATAL EXCEPTION
ReactNativeJS: Error: ...
AndroidRuntime: java.lang.RuntimeException
Unable to load asset
Native module not found
```

## 🔍 Step 5: Copy the Error

1. **Find the first ERROR or FATAL line**
2. **Scroll up** to see full stack trace
3. **Select and copy** all related lines (20-30 lines usually)
4. **Share with me** - I'll help fix it!

---

## 🛠️ What the New Code Does

### ErrorBoundary
- Catches React component crashes
- Shows error screen instead of crashing
- Displays error details in development mode

### Logging
- Tracks each initialization step
- Shows where the crash occurs
- Makes debugging easier

### Defensive Handling
- App continues even if some features fail
- Network errors don't crash the app
- Missing modules are handled gracefully

---

## 🎯 Common Issues to Check

1. **Audio Files**: Are `positive.mp3` and `negative.mp3` in `assets/sounds/`?
2. **Fonts**: Is `Montserrat_700Bold` loading correctly?
3. **Supabase**: Is network connection available on emulator?
4. **Native Modules**: Are all Expo modules properly installed?

---

## 📋 Next Steps

1. **Rebuild with new code:**
   ```bash
   cd FeynmanApp
   eas build --platform android --profile preview
   ```

2. **Install on emulator and check Logcat**

3. **Share the error logs with me!**

The logs will tell us exactly what's failing! 🎯

