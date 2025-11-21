# Vercel Deployment Guide

## ✅ Prerequisites

Everything is set up! You just need to run terminal commands.

## 📋 Step-by-Step Instructions

### Step 1: Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

**Note:** If you get permission errors on Mac/Linux, use:
```bash
sudo npm install -g vercel
```

---

### Step 2: Test Web Build Locally (Optional but Recommended)

Test that the web build works before deploying:

```bash
cd FeynmanApp
npm run build:web
```

This creates a `dist` folder. If it works, you're good to go!

---

### Step 3: Deploy to Vercel

**Option A: From FeynmanApp directory (Recommended)**
```bash
cd FeynmanApp
vercel
```

**Option B: From project root**
```bash
vercel FeynmanApp
```

---

### Step 4: Follow the Prompts

When you run `vercel`, it will ask:

1. **"Set up and deploy?"** → Type `Y` and press Enter
2. **"Which scope?"** → Select your account (or create one)
3. **"Link to existing project?"** → Type `N` for first deployment
4. **"What's your project's name?"** → Press Enter (uses default) or type a name
5. **"In which directory is your code located?"** → Type `./` or `FeynmanApp` depending on where you ran the command
   - If you're in `FeynmanApp` directory, type `./`
   - If you're in project root, type `FeynmanApp`

Vercel will automatically:
- ✅ Detect `vercel.json` configuration
- ✅ Run `npm install`
- ✅ Run `npm run build:web`
- ✅ Deploy to a URL

---

### Step 5: Get Your Live URL

After deployment, Vercel will show you:
```
✅ Production: https://your-app-name.vercel.app
```

**Share this URL with anyone!** 🎉

---

## 🔄 Subsequent Deployments

After the first deployment, just run:
```bash
cd FeynmanApp
vercel --prod
```

Or push to git (if connected):
```bash
git push
```
Vercel will auto-deploy if you've connected your Git repo.

---

## 🌐 Connecting to Git (Optional - For Auto-Deploy)

If you want automatic deployments on git push:

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub/GitLab repo
3. Vercel will automatically detect settings and deploy on every push

---

## 🐛 Troubleshooting

**Build fails?**
- Make sure you're in the `FeynmanApp` directory
- Check that `node_modules` is installed: `npm install`
- Test build locally first: `npm run build:web`

**Routing not working?**
- The `vercel.json` file handles this automatically
- Make sure `rewrites` are configured (already done ✅)

**Can't find output directory?**
- Check what folder `npm run build:web` creates
- Update `outputDirectory` in `vercel.json` if needed

---

## 📝 What Was Set Up For You

✅ `vercel.json` - Configuration file (already created)
✅ `package.json` - Added `build:web` script
✅ Static export - Configured in `app.json`

**You're all set! Just run the commands above.** 🚀

