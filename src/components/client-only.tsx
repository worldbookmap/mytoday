"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/** True only in the browser, so date-dependent UI uses the viewer's local day. */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false)
}

export function ClientOnly({ children }: { children: React.ReactNode }) {
  return useIsClient() ? <>{children}</> : null
}
