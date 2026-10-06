import { createClient } from "@supabase/supabase-js"

// Browser client used only to upload photos to signed URLs issued by the
// server. All table access goes through server actions.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export const PHOTO_BUCKET = "fragments"
