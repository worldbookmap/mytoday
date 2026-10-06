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

/** Korean → English. Uses DeepL when DEEPL_API_KEY is set, otherwise MyMemory. */
export async function translateKoToEn(text: string): Promise<string> {
  if (text.length > MAX_CHARS) throw new Error(`${MAX_CHARS}자 이하만 번역할 수 있어요`)
  const key = process.env.DEEPL_API_KEY
  try {
    return key ? await deepl(text, key) : await myMemory(text)
  } catch (e) {
    console.error("translate failed", e)
    throw new Error("번역 서비스에 연결하지 못했어요")
  }
}
