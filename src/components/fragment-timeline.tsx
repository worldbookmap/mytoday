"use client"

import type { Fragment } from "@/lib/types"
import { FragmentCard } from "@/components/fragment-card"

export function FragmentTimeline({
  fragments,
  onDelete,
  onTranslate,
}: {
  fragments: Fragment[]
  onDelete: (fragment: Fragment) => void
  onTranslate: (fragment: Fragment) => void
}) {
  return (
    <ol className="relative ml-2 space-y-6 border-l py-2 pl-6">
      {fragments.map((f) => (
        <li key={f.id} className="relative">
          <span className="absolute top-1 -left-[1.95rem] size-3 rounded-full border-2 border-background bg-primary" />
          <FragmentCard fragment={f} onDelete={onDelete} onTranslate={onTranslate} />
        </li>
      ))}
    </ol>
  )
}
