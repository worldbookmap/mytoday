"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useMemo } from "react"
import { latLngBounds } from "leaflet"
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet"
import { formatDay, formatTime } from "@/lib/day"
import { type Season, seasonOf } from "@/lib/season"
import type { Fragment } from "@/lib/types"

type Located = Fragment & { lat: number; lng: number }

const SEASON_MARKER: Record<Season, string> = {
  spring: "#ec4899",
  summer: "#0ea5e9",
  autumn: "#ea580c",
  winter: "#6366f1",
}

function FitBounds({ points }: { points: Located[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    map.fitBounds(latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 16 })
  }, [map, points])
  return null
}

/**
 * Fragments with a location as markers. With `onOpenDay` it maps many days:
 * markers are colored by season and popups link to their day.
 */
export default function FragmentMap({
  fragments,
  onOpenDay,
}: {
  fragments: Fragment[]
  onOpenDay?: (day: string) => void
}) {
  const points = useMemo(
    () => fragments.filter((f): f is Located => f.lat != null && f.lng != null),
    [fragments]
  )

  if (points.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        위치가 기록된 파편이 아직 없어요.
      </p>
    )
  }

  return (
    <div className="isolate overflow-hidden rounded-2xl border">
      <MapContainer center={[points[0].lat, points[0].lng]} zoom={14} className="h-[420px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((f, i) => (
          <CircleMarker
            key={f.id}
            center={[f.lat, f.lng]}
            radius={9}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: onOpenDay ? SEASON_MARKER[seasonOf(f.day)] : "#1f2937",
              fillOpacity: 0.9,
            }}
          >
            {!onOpenDay && (
              <Tooltip direction="top" offset={[0, -8]} permanent={points.length <= 8}>
                {i + 1}
              </Tooltip>
            )}
            <Popup>
              <div className="space-y-1">
                <div className="text-xs opacity-60">
                  {onOpenDay ? `${formatDay(f.day)} · ${formatTime(f.created_at)}` : formatTime(f.created_at)}
                </div>
                {f.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
                  <img src={f.image_url} alt="" className="max-h-32 rounded" />
                )}
                {f.content && <div className="text-sm">{f.content}</div>}
                {onOpenDay && (
                  <button
                    type="button"
                    onClick={() => onOpenDay(f.day)}
                    className="text-xs font-medium underline underline-offset-2"
                  >
                    이 날 보기
                  </button>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
