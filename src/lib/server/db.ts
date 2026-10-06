import { createClient } from "@supabase/supabase-js"

// Server-only client with the secret key; it bypasses RLS, so every caller
// must go through requireAuth() first.
export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export const PHOTO_BUCKET = "fragments"
