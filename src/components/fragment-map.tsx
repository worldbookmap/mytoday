"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useMemo } from "react"
import { latLngBounds } from "leaflet"
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet"
import { formatTime } from "@/lib/day"
import type { Fragment } from "@/lib/types"

type Located = Fragment & { lat: number; lng: number }

function FitBounds({ points }: { points: Located[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    map.fitBounds(latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 16 })
  }, [map, points])
  return null
}

export default function FragmentMap({ fragments }: { fragments: Fragment[] }) {
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
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#1f2937", fillOpacity: 0.9 }}
          >
            <Tooltip direction="top" offset={[0, -8]} permanent={points.length <= 8}>
              {i + 1}
            </Tooltip>
            <Popup>
              <div className="space-y-1">
                <div className="text-xs opacity-60">{formatTime(f.created_at)}</div>
                {f.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
                  <img src={f.image_url} alt="" className="max-h-32 rounded" />
                )}
                {f.content && <div className="text-sm">{f.content}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
