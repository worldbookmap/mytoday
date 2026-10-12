"use client"

import dynamic from "next/dynamic"

// Leaflet touches `window` on import.
export const FragmentMap = dynamic(() => import("@/components/fragment-map"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-2xl bg-muted" />,
})
