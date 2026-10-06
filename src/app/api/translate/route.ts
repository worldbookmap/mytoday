import { createClient } from "@supabase/supabase-js"

const MAX_CHARS = 5000

async function deepl(text: string, key: string): Promise<string> {
  // Free-tier keys end with ":fx" and use a separate host.
  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com"
  const res = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: [text], source_lang: "KO", target_lang: "EN-US" }),
  })
  if (!res.ok) throw new Error(`DeepL ${res.status}`)
  const json = (await res.json()) as { translations: { text: string }[] }
  return json.translations[0].text
}

async function myMemory(text: string): Promise<string> {
  // MyMemory caps each request at 500 bytes, so translate line by line.
  const lines = text.split("\n")
  const out: string[] = []
  for (const line of lines) {
    if (!line.trim()) {
      out.push(line)
      continue
    }
    const url = new URL("https://api.mymemory.translated.net/get")
    url.searchParams.set("q", line)
    url.searchParams.set("langpair", "ko|en")
    const res = await fetch(url)
    if (!res.ok) throw new Error(`MyMemory ${res.status}`)
    const json = (await res.json()) as {
      responseStatus: number
      responseData: { translatedText: string }
    }
    if (json.responseStatus !== 200) throw new Error("MyMemory quota or input error")
    out.push(json.responseData.translatedText)
  }
  return out.join("\n")
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return Response.json({ error: "로그인이 필요해요" }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return Response.json({ error: "로그인이 필요해요" }, { status: 401 })

  const { text } = (await request.json()) as { text?: string }
  if (!text?.trim()) return Response.json({ error: "번역할 내용이 없어요" }, { status: 400 })
  if (text.length > MAX_CHARS) {
    return Response.json({ error: `${MAX_CHARS}자 이하만 번역할 수 있어요` }, { status: 400 })
  }

  try {
    const key = process.env.DEEPL_API_KEY
    const translated = key ? await deepl(text, key) : await myMemory(text)
    return Response.json({ text: translated })
  } catch (e) {
    console.error("translate failed", e)
    return Response.json({ error: "번역 서비스에 연결하지 못했어요" }, { status: 502 })
  }
}
