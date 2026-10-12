"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useMemo } from "react"
import { latLng, latLngBounds } from "leaflet"
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet"
import { formatDay, formatTime } from "@/lib/day"
import { type Season, seasonOf } from "@/lib/season"
import type { Fragment } from "@/lib/types"

type Located = Fragment & { lat: number; lng: number }

/** Fragments saved at one spot, with their 1-based order in the list. */
type Place = { lat: number; lng: number; items: { fragment: Located; n: number }[] }

// GPS readings at the same spot drift by a few meters.
const SAME_PLACE_METERS = 30

function groupByPlace(points: Located[]): Place[] {
  const places: Place[] = []
  points.forEach((fragment, i) => {
    const here = latLng(fragment.lat, fragment.lng)
    const place = places.find((p) => here.distanceTo([p.lat, p.lng]) <= SAME_PLACE_METERS)
    if (place) place.items.push({ fragment, n: i + 1 })
    else places.push({ lat: fragment.lat, lng: fragment.lng, items: [{ fragment, n: i + 1 }] })
  })
  return places
}

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
  const places = useMemo(() => groupByPlace(points), [points])

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
        {places.map((place) => {
          const latest = place.items[place.items.length - 1].fragment
          const count = place.items.length
          return (
            <CircleMarker
              key={place.items[0].fragment.id}
              center={[place.lat, place.lng]}
              radius={count > 1 ? 11 : 9}
              pathOptions={{
                color: "#fff",
                weight: 2,
                fillColor: onOpenDay ? SEASON_MARKER[seasonOf(latest.day)] : "#1f2937",
                fillOpacity: 0.9,
              }}
            >
              {onOpenDay ? (
                count > 1 && (
                  <Tooltip direction="top" offset={[0, -10]}>
                    파편 {count}개
                  </Tooltip>
                )
              ) : (
                <Tooltip direction="top" offset={[0, -10]} permanent={places.length <= 8}>
                  {place.items.map((i) => i.n).join(", ")}
                </Tooltip>
              )}
              <Popup>
                <ul className="max-h-72 divide-y overflow-y-auto pr-1">
                  {place.items.map(({ fragment: f }) => (
                    <li key={f.id} className="space-y-1 py-2 first:pt-0 last:pb-0">
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
                    </li>
                  ))}
                </ul>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
