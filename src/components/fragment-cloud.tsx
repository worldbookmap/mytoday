"use client"

import { useMemo } from "react"
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
  if (n <= 4) return "text-4xl font-semibold"
  if (n <= 10) return "text-3xl font-medium"
  if (n <= 20) return "text-xl"
  if (n <= 40) return "text-base"
  return "text-sm"
}

const TONES = ["text-foreground", "text-foreground/80", "text-primary", "text-foreground/65"]

export function FragmentCloud({
  fragments,
  selectedId,
  onSelect,
}: {
  fragments: Fragment[]
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

  return (
    <div className="flex min-h-64 flex-wrap content-center items-center justify-center gap-x-5 gap-y-3 px-2 py-6">
      {items.map(({ f, h }) => {
        const rotate = ((h % 9) - 4) * 0.8
        const selected = f.id === selectedId
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelect(f.id)}
            style={{ rotate: `${rotate}deg` }}
            className={cn(
              "max-w-full rounded-lg px-1 text-center leading-tight transition-all hover:scale-105",
              selected && "bg-accent ring-2 ring-ring/40"
            )}
          >
            {f.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
              <img
                src={f.image_url}
                alt={f.content ?? "사진"}
                className={cn("rounded-xl object-cover shadow-sm", h % 2 ? "size-20" : "size-28")}
              />
            ) : (
              <span className={cn("block max-w-72 break-keep", sizeClass(f.content ?? ""), TONES[h % TONES.length])}>
                {f.content}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
