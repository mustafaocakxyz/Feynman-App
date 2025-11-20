# Supabase Setup Guide

## Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign in"** if you already have an account
3. Sign in with your credentials

---

## Step 2: Create a Project (If You Don't Have One)

### 2.1 Create New Project
1. Click **"New Project"** button
2. Fill in project details:
   - **Name**: e.g., "FeynmanApp" or "FeynmanApp-MVP"
   - **Database Password**: Create a strong password (save this securely!)
   - **Region**: Choose closest region (e.g., "West US (California)" or "Europe West (London)")
   - **Pricing Plan**: Select your paid plan

3. Click **"Create new project"**
4. Wait 1-2 minutes for project to be created

---

## Step 3: Find Your Project Credentials

Once your project is created and loaded:

### 3.1 Access Project Settings
1. Click on the **⚙️ Settings icon** (gear icon) in the left sidebar
2. Click **"API"** in the settings menu

### 3.2 Find Your Credentials

On the API settings page, you'll see:

#### 📍 **Project URL**
- **What it looks like**: 
  ```
  https://xxxxxxxxxxxxx.supabase.co
  ```
- **Where to find it**: Under "Project URL" section
- **Example**: `https://abcdefghijklmnop.supabase.co`
- **This is what I need**: Copy this URL

#### 🔑 **Anon/Public Key**
- **What it looks like**:
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0ODk5MjE2NCwiZXhwIjoxOTY0NTY4MTY0fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```
- **Where to find it**: Under "Project API keys" section
- **Label**: Look for key with role **"anon"** or **"public"**
- **This is what I need**: Copy the "anon public" key (long JWT token)

⚠️ **Important**: Use the **anon/public** key, NOT the **service_role** key (which is secret)

---

## Step 4: Enable Email/Password Authentication

### 4.1 Navigate to Authentication Settings
1. In the left sidebar, click **"Authentication"**
2. Click **"Providers"** in the submenu

### 4.2 Enable Email Provider
1. Find **"Email"** in the providers list
2. Toggle the switch to **ON** (enable)
3. The settings should show:
   - ✅ **Enable email provider**: ON
   - **Confirm email**: You can disable this for MVP (toggle OFF)
   - **Secure email change**: Can leave default

4. Click **"Save"** (if changes were made)

### 4.3 Verify Email/Password is Enabled
- You should see **"Email"** listed under "Enabled providers"
- Status should show as **Active** or **Enabled**

---

## Step 5: (Optional) Configure Email Templates

For MVP, you can skip this step, but if you want:

1. Still in **Authentication** → Click **"Email Templates"**
2. You can customize:
   - **Confirm signup** (can disable for MVP)
   - **Invite user** (can skip)
   - **Magic Link** (not using for MVP)
   - **Change Email Address** (optional)
   - **Reset Password** (optional for MVP)

For MVP, we can disable email confirmation to simplify.

---

## Step 6: What to Send Me

Once you have everything set up, provide me with:

### ✅ Required Information:
1. **Project URL**:
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

2. **Anon/Public Key**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
   ```
   (The full long JWT token)

3. **Confirmation**: "Email/Password authentication is enabled"

### 📋 Optional Information (if you changed defaults):
- Email confirmation enabled: Yes/No
- Any custom auth settings

---

## Visual Guide: What Each Section Looks Like

### Project Settings → API Page:
```
┌─────────────────────────────────────┐
│ Settings                            │
├─────────────────────────────────────┤
│  Project URL                        │
│  ┌───────────────────────────────┐  │
│  │ https://abc...supabase.co     │  │
│  └───────────────────────────────┘  │
│                                     │
│  Project API keys                   │
│  ┌───────────────────────────────┐  │
│  │ anon public                   │  │
│  │ eyJhbGciOiJIUzI1NiIsInR5cCI6  │  │
│  │ IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz  │  │
│  │ ZSIsInJlZiI6ImFiY2RlZmdoaWprb  │  │
│  │ ... (long token)              │  │
│  └───────────────────────────────┘  │
│                                     │
│  service_role secret                │
│  ┌───────────────────────────────┐  │
│  │ (DO NOT USE THIS ONE)         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Authentication → Providers Page:
```
┌─────────────────────────────────────┐
│ Authentication                      │
├─────────────────────────────────────┤
│  Email                              │
│  ┌───────────────────────────────┐  │
│  │ ☑️ Enable email provider      │  │
│  │    [Toggle: ON ✓]             │  │
│  │                                │  │
│  │ ☐ Confirm email               │  │
│  │    [Toggle: OFF]              │  │
│  │                                │  │
│  │    [Save]                      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Security Notes

✅ **Safe to share**:
- Project URL (public endpoint)
- Anon/Public key (designed for client-side use)

❌ **Never share**:
- Service Role key (secret, backend only)
- Database password
- JWT secret

---

## Troubleshooting

### "I can't find the API settings"
- Make sure you're in the correct project
- Look for ⚙️ Settings icon in left sidebar
- Click on your project name at top if you have multiple projects

### "I see multiple keys, which one?"
- Look for the one labeled **"anon"** or **"public"**
- It will be very long (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
- **DO NOT** use the **"service_role"** key (that's secret)

### "Email provider is not showing"
- Make sure you clicked "Authentication" → "Providers" in the left menu
- Email should be the first provider listed
- If not visible, refresh the page or check your plan includes auth

---

## Quick Checklist

Before moving forward, verify:

- [ ] Project is created and loaded
- [ ] Found Project URL (looks like `https://xxx.supabase.co`)
- [ ] Found Anon/Public key (long JWT token starting with `eyJ...`)
- [ ] Email/Password authentication is enabled (toggle ON)
- [ ] Email confirmation is disabled for MVP (optional, but recommended)
- [ ] Ready to share credentials (URL and Anon key)

---

## Next Steps

Once you have the credentials, you can either:
1. Share them here and I'll start implementing
2. Or we can proceed with installation steps first and add credentials later

Let me know when you have the credentials ready! 🚀

