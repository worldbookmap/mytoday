"use client"

import { useEffect, useMemo, useState } from "react"
import { ListIcon, Loader2Icon, MapIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"
import { listArchive, listLocatedFragments } from "@/app/actions"
import { formatDay } from "@/lib/day"
import type { DayEntry, Fragment } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FragmentMap } from "@/components/fragment-map-lazy"

type ArchiveItem = {
  day: string
  entry: DayEntry | null
  fragmentCount: number
}

function yearMonth(day: string): string {
  const [y, m] = day.split("-")
  return `${y}년 ${Number(m)}월`
}

/** Every day with a summary or at least one fragment, newest first. */
export function DayArchive({ onOpen }: { onOpen: (day: string) => void }) {
  const [items, setItems] = useState<ArchiveItem[] | null>(null)
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"list" | "map">("list")
  const [located, setLocated] = useState<Fragment[] | null>(null)

  useEffect(() => {
    listArchive().then(({ data, error }) => {
      if (error !== undefined) toast.error(error)

      const byDay = new Map<string, ArchiveItem>()
      const item = (day: string) => {
        if (!byDay.has(day)) byDay.set(day, { day, entry: null, fragmentCount: 0 })
        return byDay.get(day)!
      }
      for (const d of data?.fragmentDays ?? []) item(d).fragmentCount++
      for (const e of data?.days ?? []) item(e.day).entry = e

      setItems([...byDay.values()].sort((a, b) => b.day.localeCompare(a.day)))
    })
  }, [])

  // Loaded on first switch to the map; signed photo URLs make it the heavier query.
  useEffect(() => {
    if (view !== "map" || located) return
    listLocatedFragments().then(({ data, error }) => {
      if (error !== undefined) toast.error(error)
      setLocated(data ?? [])
    })
  }, [view, located])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!items || !q) return items
    return items.filter(({ entry }) =>
      [entry?.title, entry?.body, entry?.body_en].some((t) => t?.toLowerCase().includes(q))
    )
  }, [items, query])

  // A fragment matches by its own text or by its day's summary.
  const filteredLocated = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!located || !q) return located
    const days = new Set(filtered?.map((i) => i.day))
    return located.filter(
      (f) => days.has(f.day) || [f.content, f.content_en].some((t) => t?.toLowerCase().includes(q))
    )
  }, [located, filtered, query])

  if (!filtered) {
    return <Loader2Icon className="mx-auto my-16 animate-spin text-muted-foreground" />
  }

  const groups = new Map<string, ArchiveItem[]>()
  for (const i of filtered) {
    const key = yearMonth(i.day)
    groups.set(key, [...(groups.get(key) ?? []), i])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={view === "map" ? "파편, 일기, 영어 글에서 찾기" : "제목, 일기, 영어 글에서 찾기"}
            className="h-10 pl-9 text-base"
          />
        </div>
        <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
          {(
            [
              { id: "list", label: "목록", Icon: ListIcon },
              { id: "map", label: "지도", Icon: MapIcon },
            ] as const
          ).map(({ id, label, Icon }) => (
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

      {view === "map" &&
        (!filteredLocated ? (
          <Loader2Icon className="mx-auto my-16 animate-spin text-muted-foreground" />
        ) : query && filteredLocated.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">찾는 파편이 없어요.</p>
        ) : (
          <FragmentMap fragments={filteredLocated} onOpenDay={onOpen} />
        ))}

      {view === "list" && filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {query ? "찾는 글이 없어요." : "아직 남긴 기록이 없어요."}
        </p>
      )}

      {view === "list" && [...groups].map(([month, list]) => (
        <section key={month} className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">{month}</h2>
          <ul className="space-y-2">
            {list.map(({ day, entry, fragmentCount }) => {
              const excerpt = entry?.body?.trim() || entry?.body_en?.trim()
              const speakingCount = entry?.speaking?.length ?? 0
              return (
                <li key={day}>
                  <button
                    type="button"
                    onClick={() => onOpen(day)}
                    className="w-full space-y-1.5 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-muted-foreground">{formatDay(day)}</span>
                      <span className="truncate font-medium">
                        {entry?.title || (excerpt ? "" : "정리 전")}
                      </span>
                    </div>
                    {excerpt && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {fragmentCount > 0 && <Badge variant="secondary">파편 {fragmentCount}</Badge>}
                      {entry?.body_en?.trim() && <Badge variant="secondary">English</Badge>}
                      {speakingCount > 0 && <Badge variant="secondary">말하기 {speakingCount}</Badge>}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
