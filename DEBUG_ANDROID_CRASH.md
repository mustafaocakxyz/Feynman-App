# How to Debug Android Crashes with Android Studio

## Step 1: Open Logcat in Android Studio

1. **Launch Android Studio**
2. **Open Logcat tab** (bottom of the screen)
   - If you don't see it: `View` → `Tool Windows` → `Logcat`
   - Or click the "Logcat" button at the bottom

## Step 2: Filter Logs for Your App

1. **In Logcat, set filter to:**
   - Package name: `com.feynmanapp`
   - Or use regex: `com.feynmanapp|ReactNative|ReactNativeJS`

2. **Set log level to:** `Error` or `Verbose` (to see all logs)

3. **You can also search for:**
   - `FATAL`
   - `Exception`
   - `Error`
   - `ReactNativeJS`

## Step 3: Install and Launch Your App

1. **Install your APK** on the emulator:
   - Drag and drop the APK onto the emulator, OR
   - Use: `adb install path/to/your-app.apk`

2. **Launch the app** from the emulator

3. **Watch Logcat** - crash logs will appear immediately

## Step 4: Look for These Common Error Patterns

### JavaScript Errors:
```
ReactNativeJS: Error: ...
ReactNativeJS: TypeError: ...
ReactNativeJS: ReferenceError: ...
```

### Native Module Errors:
```
AndroidRuntime: FATAL EXCEPTION: ...
AndroidRuntime: java.lang.RuntimeException: ...
AndroidRuntime: Caused by: ...
```

### Missing Assets/Files:
```
Unable to load asset: ...
File not found: ...
```

### Module Initialization:
```
Failed to load module: ...
Native module not found: ...
```

## Step 5: Copy the Full Stack Trace

1. **Select the error line** in Logcat
2. **Scroll up** to see the full stack trace
3. **Copy all related lines** (usually starts with "FATAL" or "Error")
4. **Share the logs** to identify the issue

## Alternative: Use ADB from Terminal (if emulator is running)

```bash
# Connect to emulator (usually already connected)
adb devices

# View logs filtered for your app
adb logcat | grep -i "feynmanapp\|reactnative\|error\|fatal\|exception"

# Or save to file
adb logcat > crash_logs.txt
```

## Common Issues to Check:

1. **Missing Permissions** - Check AndroidManifest.xml
2. **Missing Assets** - Audio files, images not bundled
3. **Native Module Initialization** - expo-audio, expo-font, etc.
4. **Supabase Connection** - Network errors on first launch
5. **Font Loading** - Custom fonts not loading

