"use client"

import { useEffect, useState } from "react"
import { CheckIcon, LanguagesIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { translateToEnglish } from "@/lib/translate"
import type { DayEntry, Fragment, SpeakingAttempt } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SpeakingPractice } from "@/components/speaking-practice"
import { TranslationReveal } from "@/components/translation-reveal"

type SaveState = "idle" | "saving" | "saved" | "error"

/** Remount per day (key={day}) so state starts fresh. */
export function DaySummary({
  userId,
  day,
  fragments,
}: {
  userId: string
  day: string
  fragments: Fragment[]
}) {
  const [loaded, setLoaded] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [bodyEn, setBodyEn] = useState("")
  const [speaking, setSpeaking] = useState<SpeakingAttempt[]>([])
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [reference, setReference] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    supabase
      .from("days")
      .select("*")
      .eq("day", day)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error(error.message)
        const entry = data as DayEntry | null
        setTitle(entry?.title ?? "")
        setBody(entry?.body ?? "")
        setBodyEn(entry?.body_en ?? "")
        setSpeaking(entry?.speaking ?? [])
        setLoaded(true)
      })
  }, [day])

  // Autosave shortly after the last edit.
  useEffect(() => {
    if (!dirty) return
    const t = setTimeout(async () => {
      setSaveState("saving")
      setDirty(false)
      const { error } = await supabase.from("days").upsert({
        user_id: userId,
        day,
        title: title || null,
        body: body || null,
        body_en: bodyEn || null,
        speaking,
        updated_at: new Date().toISOString(),
      })
      if (error) {
        // Not re-marking dirty avoids a retry loop; the next edit retries.
        setSaveState("error")
        toast.error(`저장하지 못했어요: ${error.message}`)
      } else {
        setSaveState("saved")
      }
    }, 1200)
    return () => clearTimeout(t)
  }, [dirty, userId, day, title, body, bodyEn, speaking])

  function edit<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setDirty(true)
    }
  }

  async function translateBody() {
    if (!body.trim()) return
    setTranslating(true)
    try {
      setReference(await translateToEnglish(body))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "번역하지 못했어요")
    } finally {
      setTranslating(false)
    }
  }

  if (!loaded) {
    return <Loader2Icon className="mx-auto my-16 animate-spin text-muted-foreground" />
  }

  const words = bodyEn.trim() ? bodyEn.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-6">
      <div className="flex h-5 items-center justify-end text-xs text-muted-foreground" aria-live="polite">
        {saveState === "saving" && "저장 중…"}
        {saveState === "error" && !dirty && <span className="text-destructive">저장 실패 · 다시 수정하면 재시도해요</span>}
        {saveState === "saved" && !dirty && (
          <span className="inline-flex items-center gap-1">
            <CheckIcon className="size-3" /> 저장됨
          </span>
        )}
      </div>

      {fragments.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>오늘의 파편</CardTitle>
            <CardDescription>글을 쓰면서 참고하세요. 흐린 영어는 눌러야 보여요.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {fragments
                .filter((f) => f.content)
                .map((f) => (
                  <li key={f.id} className="rounded-lg bg-muted px-2.5 py-1.5 text-sm">
                    {f.content}
                    <TranslationReveal text={f.content_en} className="text-xs" />
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">오늘의 일기 · 에세이</h2>
        <Input
          value={title}
          onChange={(e) => edit(setTitle)(e.target.value)}
          placeholder="오늘에 제목을 붙인다면"
          className="h-10 text-base"
        />
        <Textarea
          value={body}
          onChange={(e) => edit(setBody)(e.target.value)}
          placeholder="파편들을 이어서 오늘을 적어보세요."
          className="min-h-56 text-base leading-relaxed"
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-lg font-semibold">In English</h2>
          <span className="text-xs text-muted-foreground">{words} words</span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={translateBody}
            disabled={translating || !body.trim()}
          >
            {translating ? <Loader2Icon className="animate-spin" /> : <LanguagesIcon />}
            참고 번역 보기
          </Button>
        </div>
        {reference && (
          <div className="space-y-2 rounded-xl border border-dashed p-3">
            <p className="text-xs text-muted-foreground">먼저 직접 써본 뒤 눌러서 비교해 보세요.</p>
            <TranslationReveal text={reference} className="whitespace-pre-wrap" />
            {!bodyEn.trim() && (
              <Button variant="ghost" size="xs" onClick={() => edit(setBodyEn)(reference)}>
                이 번역으로 시작하기
              </Button>
            )}
          </div>
        )}
        <Textarea
          value={bodyEn}
          onChange={(e) => edit(setBodyEn)(e.target.value)}
          placeholder="Write about your day in English."
          lang="en"
          spellCheck
          className="min-h-48 text-base leading-relaxed"
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">Say it out loud</h2>
          <p className="text-sm text-muted-foreground">
            오늘 하루를 영어로 말해보세요. 말한 내용은 글자로 남아요.
          </p>
        </div>
        <SpeakingPractice
          script={bodyEn}
          attempts={speaking}
          onAttempt={(a) => {
            setSpeaking((prev) => [...prev, a])
            setDirty(true)
          }}
          onRemove={(i) => {
            setSpeaking((prev) => prev.filter((_, j) => j !== i))
            setDirty(true)
          }}
        />
      </section>
    </div>
  )
}
