"use client"

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { SEASON_CHIPS, SEASON_GLOW, type Season } from "@/lib/season"
import type { Fragment } from "@/lib/types"
import { cn } from "@/lib/utils"

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

// Shorter fragments read like keywords: big serif pills. Longer ones become
// small cards so the cloud stays readable.
function chipClass(text: string): string {
  const n = text.length
  // One step smaller on phones so a few chips fit per row.
  if (n <= 4) return "rounded-full px-5 py-2 font-serif text-3xl font-bold sm:px-6 sm:py-2.5 sm:text-4xl"
  if (n <= 10) return "rounded-full px-4 py-1.5 font-serif text-xl font-bold sm:px-5 sm:py-2 sm:text-2xl"
  if (n <= 20) return "rounded-full px-3.5 py-1.5 text-base font-medium sm:px-4 sm:text-lg"
  if (n <= 40) return "rounded-2xl px-3.5 py-2 text-sm sm:px-4 sm:text-base"
  return "rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed sm:px-4 sm:py-2.5 sm:text-sm"
}

type Point = { x: number; y: number }
type Rect = { x: number; y: number; w: number; h: number }

const GAP = 10

/**
 * Archimedean-spiral packing: each box (largest first) walks outward from the
 * center until it fits inside ±halfWidth and overlaps nothing already placed.
 * Narrow screens therefore grow taller instead of overlapping. Returns centers.
 */
function packSpiral(sizes: { w: number; h: number }[], halfWidth: number, stretch: number): Point[] {
  const placed: Rect[] = []
  const fits = (r: Rect) =>
    r.x >= -halfWidth &&
    r.x + r.w <= halfWidth &&
    !placed.some(
      (p) =>
        r.x < p.x + p.w + GAP && r.x + r.w + GAP > p.x && r.y < p.y + p.h + GAP && r.y + r.h + GAP > p.y
    )
  return sizes.map(({ w, h }) => {
    // Too wide to ever fit: pin it to the center line.
    const width = Math.min(w, halfWidth * 2)
    for (let t = 0, r = 0; r < 4000; ) {
      const cx = r * Math.cos(t) * stretch
      const cy = r * Math.sin(t)
      const rect = { x: cx - width / 2, y: cy - h / 2, w: width, h }
      if (fits(rect)) {
        placed.push(rect)
        return { x: cx, y: cy }
      }
      // Keep the step along the curve roughly constant (~6px) as it widens.
      t += Math.min(0.1, 6 / Math.max(r, 1))
      r = 3.2 * t
    }
    const y = Math.max(0, ...placed.map((p) => p.y + p.h)) + GAP + h / 2
    placed.push({ x: -width / 2, y: y - h / 2, w: width, h })
    return { x: 0, y }
  })
}

type Layout = { points: Map<string, Point>; previous?: Map<string, Point>; height: number }

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
  const containerRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef(new Map<string, HTMLElement>())
  const [layout, setLayout] = useState<Layout | null>(null)

  const newestId = fragments.at(-1)?.id
  // Hash gives each fragment a stable tilt, color offset, and float phase.
  const items = useMemo(() => fragments.map((f) => ({ f, h: hash(f.id) })), [fragments])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ResizeObserver already batches and runs right before paint, which is
    // exactly when we want to re-pack.
    let lastKey = ""
    const measure = () => {
      const width = container.clientWidth
      const boxes = items
        .map(({ f }) => {
          const el = chipRefs.current.get(f.id)
          return { id: f.id, w: el?.offsetWidth ?? 0, h: el?.offsetHeight ?? 0 }
        })
        // Biggest first, so keywords claim the middle.
        .sort((a, b) => b.w * b.h - a.w * a.h)
      // Our own height animation also triggers the observer; only re-pack
      // when the width or a chip's size actually changed.
      const key = `${width}|${boxes.map((b) => `${b.w}x${b.h}`).join(",")}`
      if (key === lastKey) return
      lastKey = key
      // Wide screens spread sideways; phones stay closer to a circle.
      const stretch = Math.min(2, Math.max(1, width / 320))
      // Leave room for tilt, hover/selected scale, and glow.
      const margin = 14
      const centers = packSpiral(boxes, width / 2 - margin, stretch)

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      boxes.forEach((b, i) => {
        minX = Math.min(minX, centers[i].x - b.w / 2)
        maxX = Math.max(maxX, centers[i].x + b.w / 2)
        minY = Math.min(minY, centers[i].y - b.h / 2)
        maxY = Math.max(maxY, centers[i].y + b.h / 2)
      })
      const pad = 24
      const offsetX = width / 2 - (minX + maxX) / 2
      const offsetY = pad - minY
      const points = new Map<string, Point>()
      boxes.forEach((b, i) => points.set(b.id, { x: centers[i].x + offsetX, y: centers[i].y + offsetY }))
      setLayout((prev) => ({ points, previous: prev?.points, height: maxY - minY + pad * 2 }))
    }

    // Re-pack when the panel resizes or a chip changes size (e.g. fonts load).
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    chipRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  const chips = SEASON_CHIPS[season]

  return (
    <div
      ref={containerRef}
      className="relative transition-[height] duration-500 ease-out"
      style={{ height: layout?.height ?? 320 }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at center, ${SEASON_GLOW[season]}, transparent 65%)` }}
      />
      {items.map(({ f, h }, i) => {
        const point = layout?.points.get(f.id)
        // Glide only chips that already had a spot; new ones pop in place.
        const glide = !!layout?.previous?.has(f.id)
        const selected = f.id === selectedId
        const rotate = ((h % 11) - 5) * (f.image_url ? 1.4 : 0.6)
        return (
          <div
            key={f.id}
            className={cn("absolute top-0 left-0", glide && "transition-[translate] duration-500 ease-out")}
            style={{
              // Center the chip on its packed point.
              translate: point ? `calc(${point.x}px - 50%) calc(${point.y}px - 50%)` : undefined,
              visibility: point ? "visible" : "hidden",
            }}
          >
            <div
              className="cloud-item"
              style={{ animationDelay: `${i * 45}ms, ${-(h % 7000)}ms` }}
            >
              <button
                ref={(el) => {
                  if (el) chipRefs.current.set(f.id, el)
                  else chipRefs.current.delete(f.id)
                }}
                type="button"
                onClick={() => onSelect(f.id)}
                style={{ rotate: `${rotate}deg` }}
                className={cn(
                  "relative block text-center transition-[scale,box-shadow] duration-200 ease-out hover:scale-[1.06] active:scale-[0.97]",
                  selected && "scale-[1.08]"
                )}
              >
                {f.image_url ? (
                  <span
                    className={cn(
                      "block rounded-xl bg-white p-1.5 pb-4 shadow-lg shadow-black/10 ring-1 ring-black/5",
                      selected && "ring-2 ring-white shadow-xl"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                    <img
                      src={f.image_url}
                      alt={f.content ?? "사진"}
                      className={cn("rounded-lg object-cover", h % 2 ? "size-20 sm:size-24" : "size-24 sm:size-32")}
                    />
                  </span>
                ) : (
                  <span
                    className={cn(
                      "block max-w-56 bg-linear-to-br sm:max-w-64 break-keep shadow-lg ring-1 ring-white/70",
                      chipClass(f.content ?? ""),
                      // Color by position (offset by hash) so neighbors rarely match.
                      chips[(i + (items[0]?.h ?? 0)) % chips.length],
                      selected && "shadow-xl ring-2 ring-white"
                    )}
                  >
                    {f.content}
                  </span>
                )}
                {f.id === newestId && (
                  <span className="absolute -top-1 -right-1 flex size-3" aria-label="가장 최근 파편">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-white ring-2 ring-amber-300" />
                  </span>
                )}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
