import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://ouxggxuzjejaomzzjial.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eGdneHV6amVqYW9tenpqaWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mjg1NzUsImV4cCI6MjA3OTIwNDU3NX0.0A5BVpcoT06oFoMUv3na1VHNZXEQtD9mGTDiUrlghAg';

// Create and export Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Type exports for TypeScript
export type { User, Session } from '@supabase/supabase-js';

