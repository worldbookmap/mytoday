"use client"

import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
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
import { deleteFragment, listFragments, logout, translateFragment } from "@/app/actions"
import { formatDay, hasKorean, shiftDay, toDay } from "@/lib/day"
import type { Fragment } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DayArchive } from "@/components/day-archive"
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

export function TodayApp() {
  const router = useRouter()
  const [day, setDay] = useState(() => toDay())
  const [fragments, setFragments] = useState<Fragment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>("cloud")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState("fragments")
  const isToday = day === toDay()

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset while the new day loads
    setLoading(true)
    setSelectedId(null)
    listFragments(day).then(({ data, error }) => {
      if (cancelled) return
      if (error !== undefined) toast.error(error)
      setFragments(data ?? [])
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [day])

  const translate = useCallback(async (fragment: Fragment) => {
    if (!hasKorean(fragment.content)) return
    const { data: en, error } = await translateFragment(fragment.id)
    if (error !== undefined) return toast.error(error)
    setFragments((prev) => prev.map((f) => (f.id === fragment.id ? { ...f, content_en: en } : f)))
  }, [])

  function handleSaved(fragment: Fragment) {
    setFragments((prev) => [...prev, fragment])
    translate(fragment)
  }

  function handleDelete(fragment: Fragment) {
    toast("이 파편을 지울까요?", {
      action: {
        label: "삭제",
        onClick: async () => {
          const { error } = await deleteFragment(fragment.id)
          if (error !== undefined) return toast.error(error)
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
          onClick={async () => {
            await logout()
            router.refresh()
          }}
          aria-label="잠그기"
        >
          <LogOutIcon />
        </Button>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <TabsList className="w-full">
          <TabsTrigger value="fragments">그날의 파편</TabsTrigger>
          <TabsTrigger value="summary">하루 정리</TabsTrigger>
          <TabsTrigger value="archive">지난 기록</TabsTrigger>
        </TabsList>

        <TabsContent value="fragments" className="space-y-4 pt-3">
          <FragmentComposer day={day} onSaved={handleSaved} />

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
          <DaySummary key={day} day={day} fragments={fragments} />
        </TabsContent>

        <TabsContent value="archive" className="pt-3">
          <DayArchive
            onOpen={(d) => {
              setDay(d)
              setTab("summary")
            }}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}
