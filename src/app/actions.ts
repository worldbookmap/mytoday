"use server"

import { cookies } from "next/headers"
import { checkPasscode, requireAuth, SESSION_COOKIE, sessionToken } from "@/lib/server/auth"
import { db, PHOTO_BUCKET } from "@/lib/server/db"
import { translateKoToEn } from "@/lib/server/translate"
import type { DayEntry, Fragment, SpeakingAttempt } from "@/lib/types"

// Thrown errors are redacted in production, so actions return them instead.
export type Result<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

async function guarded<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    await requireAuth()
    return { data: await fn() }
  } catch (e) {
    console.error(e)
    const message = e instanceof Error ? e.message : (e as { message?: string })?.message
    return { error: message ?? "문제가 생겼어요" }
  }
}

function assertDay(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("잘못된 날짜예요")
}

async function withImageUrls(fragments: Fragment[]): Promise<Fragment[]> {
  const paths = fragments.flatMap((f) => (f.image_path ? [f.image_path] : []))
  if (paths.length === 0) return fragments
  const { data } = await db.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60)
  const urls = new Map(data?.map((d) => [d.path, d.signedUrl]))
  return fragments.map((f) => (f.image_path ? { ...f, image_url: urls.get(f.image_path) ?? undefined } : f))
}

// --- session ---

export async function login(passcode: string): Promise<{ error?: string }> {
  if (!checkPasscode(passcode)) {
    // Slow down guessing a little.
    await new Promise((r) => setTimeout(r, 800))
    return { error: "비밀번호가 맞지 않아요" }
  }
  ;(await cookies()).set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
  return {}
}

export async function logout() {
  ;(await cookies()).delete(SESSION_COOKIE)
}

// --- fragments ---

export async function listFragments(day: string) {
  return guarded(async () => {
    assertDay(day)
    const { data, error } = await db.from("fragments").select("*").eq("day", day).order("created_at")
    if (error) throw error
    return withImageUrls(data as Fragment[])
  })
}

/** One-time signed URL so the browser can upload a photo straight to Storage. */
export async function createPhotoUpload(ext: string) {
  return guarded(async () => {
    const safeExt = /^[a-z0-9]{1,5}$/i.test(ext) ? ext.toLowerCase() : "jpg"
    const path = `photos/${crypto.randomUUID()}.${safeExt}`
    const { data, error } = await db.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path)
    if (error) throw error
    return { path: data.path, token: data.token }
  })
}

export async function createFragment(input: {
  day: string
  content: string | null
  image_path: string | null
  lat: number | null
  lng: number | null
}) {
  return guarded(async () => {
    assertDay(input.day)
    if (input.image_path && !/^photos\/[\w-]+\.[a-z0-9]+$/.test(input.image_path)) {
      throw new Error("잘못된 사진 경로예요")
    }
    const { data, error } = await db
      .from("fragments")
      .insert({
        day: input.day,
        content: input.content?.trim() || null,
        image_path: input.image_path,
        lat: input.lat,
        lng: input.lng,
      })
      .select()
      .single()
    if (error) throw error
    const [withUrl] = await withImageUrls([data as Fragment])
    return withUrl
  })
}

export async function translateFragment(id: string) {
  return guarded(async () => {
    const { data, error } = await db.from("fragments").select("content").eq("id", id).single()
    if (error) throw error
    if (!data.content) return null
    const en = await translateKoToEn(data.content)
    const update = await db.from("fragments").update({ content_en: en }).eq("id", id)
    if (update.error) throw update.error
    return en
  })
}

export async function deleteFragment(id: string) {
  return guarded(async () => {
    const { data, error } = await db.from("fragments").delete().eq("id", id).select("image_path").single()
    if (error) throw error
    if (data.image_path) await db.storage.from(PHOTO_BUCKET).remove([data.image_path])
    return null
  })
}

// --- day summary ---

export async function getDay(day: string) {
  return guarded(async () => {
    assertDay(day)
    const { data, error } = await db.from("days").select("*").eq("day", day).maybeSingle()
    if (error) throw error
    return data as DayEntry | null
  })
}

export async function saveDay(input: {
  day: string
  title: string | null
  body: string | null
  body_en: string | null
  speaking: SpeakingAttempt[]
}) {
  return guarded(async () => {
    assertDay(input.day)
    const { error } = await db.from("days").upsert({ ...input, updated_at: new Date().toISOString() })
    if (error) throw error
    return null
  })
}

export async function translateText(text: string) {
  return guarded(async () => {
    if (!text.trim()) throw new Error("번역할 내용이 없어요")
    return translateKoToEn(text)
  })
}

export async function listArchive() {
  return guarded(async () => {
    const [days, fragments] = await Promise.all([
      db.from("days").select("*"),
      db.from("fragments").select("day"),
    ])
    if (days.error) throw days.error
    if (fragments.error) throw fragments.error
    return {
      days: days.data as DayEntry[],
      fragmentDays: (fragments.data as { day: string }[]).map((f) => f.day),
    }
  })
}
