import { supabase } from "@/lib/supabase"

/** Translate Korean text to English through our /api/translate route. */
export async function translateToEnglish(text: string): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    },
    body: JSON.stringify({ text }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? "번역에 실패했어요")
  return json.text as string
}
