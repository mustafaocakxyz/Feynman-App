# How to Get Android Crash Logs

## Method 1: ADB Logcat (Recommended)

1. **Connect your Android device via USB** and enable USB debugging
2. **Open Terminal** and run:
   ```bash
   adb logcat | grep -i "error\|exception\|crash\|fatal"
   ```
   
   Or for more detailed logs:
   ```bash
   adb logcat *:E ReactNative:V ReactNativeJS:V
   ```

3. **Launch the app** on your device
4. **Watch the terminal** - crash logs will appear in real-time

## Method 2: ADB Logcat (Save to File)

```bash
adb logcat > crash_logs.txt
```

Then open `crash_logs.txt` and search for "FATAL", "Exception", or "Error"

## Method 3: React Native Error Handler

Add this to your `app/_layout.tsx` to catch JavaScript errors:

```typescript
import { LogBox } from 'react-native';
import ErrorBoundary from 'react-native-error-boundary';

LogBox.ignoreLogs(['Warning: ...']); // Optional: ignore specific warnings

const ErrorFallback = ({ error, resetError }) => (
  <View>
    <Text>Something went wrong:</Text>
    <Text>{error.toString()}</Text>
    <Button onPress={resetError} title="Try again" />
  </View>
);

// Wrap your app in ErrorBoundary
```

## Method 4: Check Device Logs

On your Android device:
1. Settings → Developer Options → Bug Report
2. Generate a bug report after the crash
3. Share the report to analyze

