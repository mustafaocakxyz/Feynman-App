# Testing Guide - Sharing Your App with Others

## 🚀 Fastest Options

### Option 1: Expo Go (Mobile - Fastest for React Native)

**For the tester:**
1. Install **Expo Go** app:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

**For you (developer):**
```bash
# Start with tunnel mode (works across different networks)
npx expo start --tunnel

# Or for same network:
npx expo start
```

**Tester actions:**
- Scan the QR code that appears in terminal/browser
- Or open Expo Go and enter the URL manually

**Pros:** ⚡ Very fast, no build needed, instant updates
**Cons:** Limited to Expo-compatible APIs (your app looks compatible)

---

### Option 2: Web Deployment (Fastest for Web)

**Deploy to free hosting:**

1. **Vercel** (Recommended - Easiest):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd FeynmanApp
vercel
```

2. **Netlify**:
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
cd FeynmanApp
npm run web
# Then upload the web-build folder via Netlify dashboard
```

3. **Expo Snack** (Share code directly):
   - Visit [snack.expo.dev](https://snack.expo.dev)
   - Upload your code
   - Share the link

**Pros:** 🎯 Instant sharing via URL, no app installation needed
**Cons:** Only tests web version

---

### Option 3: EAS Build (Production-like - Slower but Complete)

**For you:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure
eas build:configure

# Build for testing
eas build --profile preview --platform ios
# or
eas build --profile preview --platform android
```

**For testers:**
- Receive download link via email
- Install on their device (TestFlight for iOS, APK for Android)

**Pros:** ✅ Production-like experience, full native features
**Cons:** ⏱️ Takes 10-20 minutes per build

---

## 📋 Quick Comparison

| Method | Speed | Mobile | Web | Network Requirement |
|--------|-------|--------|-----|---------------------|
| Expo Go | ⚡⚡⚡ | ✅ | ❌ | Internet (tunnel) or Same WiFi |
| Web Deploy | ⚡⚡⚡ | ❌ | ✅ | Internet |
| EAS Build | ⚡ | ✅ | ❌ | Internet |

---

## 🎯 Recommended Workflow

**For quick testing:**
1. **Same network:** Use `expo start` + Expo Go
2. **Different network:** Use `expo start --tunnel` + Expo Go
3. **Web testing:** Deploy to Vercel (takes 2 minutes)

**For beta testing:**
- Use EAS Build for production-like experience

---

## 🔧 Troubleshooting

**Expo Go QR code not working?**
- Make sure firewall allows connections
- Use `--tunnel` flag if on different networks
- Check Expo Go app version is up to date

**Can't connect on mobile?**
- Ensure phone and computer are on same WiFi (or use tunnel)
- Check Expo Go has camera permissions (for QR scanning)

**Web deployment issues?**
- Make sure `expo-router` web support is enabled (already in your config)
- Check for any web-incompatible packages

---

## 📱 Quick Start Commands

```bash
# Start dev server with tunnel (best for sharing)
npx expo start --tunnel

# Start on web
npm run web

# Build for production testing
eas build --profile preview --platform all
```

