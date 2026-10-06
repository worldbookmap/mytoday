"use client"

import { useMemo } from "react"
import { SEASON_CHIPS, type Season } from "@/lib/season"
import type { Fragment } from "@/lib/types"
import { cn } from "@/lib/utils"

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

// Shorter fragments read like keywords, so they get the biggest type.
function sizeClass(text: string): string {
  const n = text.length
  if (n <= 4) return "rounded-2xl px-4 py-2 text-3xl font-semibold"
  if (n <= 10) return "rounded-2xl px-3.5 py-2 text-2xl font-medium"
  if (n <= 20) return "rounded-xl px-3 py-1.5 text-lg font-medium"
  if (n <= 40) return "rounded-xl px-3 py-1.5 text-base"
  return "rounded-xl px-3 py-2 text-sm leading-snug"
}

export function FragmentCloud({
  fragments,
  season,
  selectedId,
  onSelect,
}: {
  fragments: Fragment[]
  season: Season
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  // Stable scatter: order and tilt derive from the id, so the cloud
  // doesn't reshuffle on every render.
  const items = useMemo(
    () =>
      fragments
        .map((f) => ({ f, h: hash(f.id) }))
        .sort((a, b) => a.h - b.h),
    [fragments]
  )

  const chips = SEASON_CHIPS[season]

  return (
    <div className="flex min-h-64 flex-wrap content-center items-center justify-center gap-x-3 gap-y-3.5 px-1 py-6">
      {items.map(({ f, h }, i) => {
        const rotate = ((h % 9) - 4) * 0.8
        const selected = f.id === selectedId
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelect(f.id)}
            style={{ rotate: `${rotate}deg` }}
            className={cn(
              "max-w-full rounded-2xl text-center leading-tight transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.97]",
              selected && "-translate-y-0.5 scale-105 rounded-2xl shadow-lg ring-2 ring-white"
            )}
          >
            {f.image_url ? (
              // Polaroid-style frame so photos sit in the cloud like the chips do.
              <span className="block rounded-xl bg-white p-1.5 pb-3 shadow-md ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                <img
                  src={f.image_url}
                  alt={f.content ?? "사진"}
                  className={cn("rounded-lg object-cover", h % 2 ? "size-20" : "size-28")}
                />
              </span>
            ) : (
              <span
                className={cn(
                  "block max-w-72 break-keep shadow-sm ring-1 ring-black/5",
                  sizeClass(f.content ?? ""),
                  // Color by position so neighbors never share a tint.
                  chips[i % chips.length]
                )}
              >
                {f.content}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
