"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2Icon, SearchIcon } from "lucide-react"
import { toast } from "sonner"
import { listArchive } from "@/app/actions"
import { formatDay } from "@/lib/day"
import type { DayEntry } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!items || !q) return items
    return items.filter(({ entry }) =>
      [entry?.title, entry?.body, entry?.body_en].some((t) => t?.toLowerCase().includes(q))
    )
  }, [items, query])

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
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목, 일기, 영어 글에서 찾기"
          className="h-10 pl-9 text-base"
        />
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {query ? "찾는 글이 없어요." : "아직 남긴 기록이 없어요."}
        </p>
      )}

      {[...groups].map(([month, list]) => (
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
