# Supabase Database Setup Instructions

## Phase 1: Database Schema Creation

### Step 1: Run the Migration Script

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (FeynmanApp)
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/001_user_data_setup.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verification

To verify everything is set up correctly, run this query in SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'user_progress');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_progress');
```

Expected results:
- Both tables should appear in the first query
- Both tables should have `rowsecurity = true`

---

## Troubleshooting

### Error: "relation already exists"
- This means the tables already exist. The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to re-run.

### Error: "policy already exists"
- The script drops existing policies first, but if you get this error, you can safely ignore it or manually drop the policies.

### RLS policies not working
- Make sure RLS is enabled: `ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;`
- Verify you're authenticated when testing: Check `auth.uid()` returns your user ID

---

## Next Steps

After completing this phase, proceed to **Phase 2: Profile System** implementation.

