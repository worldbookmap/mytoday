"use client"

import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudIcon,
  ListIcon,
  Loader2Icon,
  LogOutIcon,
  MapIcon,
} from "lucide-react"
import { toast } from "sonner"
import { supabase, PHOTO_BUCKET } from "@/lib/supabase"
import { formatDay, hasKorean, shiftDay, toDay } from "@/lib/day"
import { translateToEnglish } from "@/lib/translate"
import type { Fragment } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DaySummary } from "@/components/day-summary"
import { FragmentCard } from "@/components/fragment-card"
import { FragmentCloud } from "@/components/fragment-cloud"
import { FragmentComposer } from "@/components/fragment-composer"
import { FragmentTimeline } from "@/components/fragment-timeline"

// Leaflet touches `window` on import.
const FragmentMap = dynamic(() => import("@/components/fragment-map"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-2xl bg-muted" />,
})

type View = "cloud" | "timeline" | "map"

const VIEWS: { id: View; label: string; Icon: typeof CloudIcon }[] = [
  { id: "cloud", label: "워드 클라우드", Icon: CloudIcon },
  { id: "timeline", label: "타임라인", Icon: ListIcon },
  { id: "map", label: "지도", Icon: MapIcon },
]

async function withImageUrls(fragments: Fragment[]): Promise<Fragment[]> {
  const paths = fragments.flatMap((f) => (f.image_path ? [f.image_path] : []))
  if (paths.length === 0) return fragments
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60)
  const urls = new Map(data?.map((d) => [d.path, d.signedUrl]))
  return fragments.map((f) => (f.image_path ? { ...f, image_url: urls.get(f.image_path) ?? undefined } : f))
}

export function TodayApp({ userId }: { userId: string }) {
  const [day, setDay] = useState(() => toDay())
  const [fragments, setFragments] = useState<Fragment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>("cloud")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isToday = day === toDay()

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset while the new day loads
    setLoading(true)
    setSelectedId(null)
    supabase
      .from("fragments")
      .select("*")
      .eq("day", day)
      .order("created_at")
      .then(async ({ data, error }) => {
        if (cancelled) return
        if (error) toast.error(error.message)
        const rows = await withImageUrls((data ?? []) as Fragment[])
        if (cancelled) return
        setFragments(rows)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [day])

  const translate = useCallback(async (fragment: Fragment) => {
    if (!hasKorean(fragment.content)) return
    try {
      const en = await translateToEnglish(fragment.content!)
      const { error } = await supabase.from("fragments").update({ content_en: en }).eq("id", fragment.id)
      if (error) throw error
      setFragments((prev) => prev.map((f) => (f.id === fragment.id ? { ...f, content_en: en } : f)))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "번역하지 못했어요")
    }
  }, [])

  async function handleSaved(fragment: Fragment) {
    const [withUrl] = await withImageUrls([fragment])
    setFragments((prev) => [...prev, withUrl])
    translate(fragment)
  }

  function handleDelete(fragment: Fragment) {
    toast("이 파편을 지울까요?", {
      action: {
        label: "삭제",
        onClick: async () => {
          const { error } = await supabase.from("fragments").delete().eq("id", fragment.id)
          if (error) return toast.error(error.message)
          if (fragment.image_path) await supabase.storage.from(PHOTO_BUCKET).remove([fragment.image_path])
          setFragments((prev) => prev.filter((f) => f.id !== fragment.id))
          setSelectedId((id) => (id === fragment.id ? null : id))
        },
      },
    })
  }

  const selected = fragments.find((f) => f.id === selectedId)

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-6 pb-16">
      <header className="mb-5 flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setDay((d) => shiftDay(d, -1))} aria-label="전날">
          <ChevronLeftIcon />
        </Button>
        <button
          type="button"
          onClick={() => setDay(toDay())}
          className="font-heading text-xl font-semibold tracking-tight"
          title="오늘로 이동"
        >
          {formatDay(day)}
          {isToday && <span className="ml-2 text-sm font-normal text-muted-foreground">오늘</span>}
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDay((d) => shiftDay(d, 1))}
          disabled={isToday}
          aria-label="다음날"
        >
          <ChevronRightIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => supabase.auth.signOut()}
          aria-label="로그아웃"
        >
          <LogOutIcon />
        </Button>
      </header>

      <Tabs defaultValue="fragments">
        <TabsList className="w-full">
          <TabsTrigger value="fragments">그날의 파편</TabsTrigger>
          <TabsTrigger value="summary">하루 정리</TabsTrigger>
        </TabsList>

        <TabsContent value="fragments" className="space-y-4 pt-3">
          <FragmentComposer userId={userId} day={day} onSaved={handleSaved} />

          <div className="flex items-center justify-between">
            <h2 className="text-sm text-muted-foreground">
              파편 {fragments.length}개
            </h2>
            <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
              {VIEWS.map(({ id, label, Icon }) => (
                <Button
                  key={id}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={label}
                  aria-pressed={view === id}
                  title={label}
                  onClick={() => setView(id)}
                  className={cn(view === id && "bg-background shadow-xs hover:bg-background")}
                >
                  <Icon />
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <Loader2Icon className="mx-auto my-16 animate-spin text-muted-foreground" />
          ) : fragments.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {isToday ? "오늘 처음 떠오른 것을 남겨보세요." : "이 날은 남긴 파편이 없어요."}
            </p>
          ) : view === "cloud" ? (
            <>
              <FragmentCloud
                fragments={fragments}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
              />
              {selected && (
                <div className="rounded-2xl border bg-card p-4">
                  <FragmentCard fragment={selected} onDelete={handleDelete} onTranslate={translate} />
                </div>
              )}
            </>
          ) : view === "timeline" ? (
            <FragmentTimeline fragments={fragments} onDelete={handleDelete} onTranslate={translate} />
          ) : (
            <FragmentMap fragments={fragments} />
          )}
        </TabsContent>

        <TabsContent value="summary" className="pt-3">
          <DaySummary key={day} userId={userId} day={day} fragments={fragments} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
