"use client"

import { LanguagesIcon, MapPinIcon, Trash2Icon } from "lucide-react"
import { formatTime, hasKorean } from "@/lib/day"
import type { Fragment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { TranslationReveal } from "@/components/translation-reveal"

export function FragmentCard({
  fragment,
  onDelete,
  onTranslate,
}: {
  fragment: Fragment
  onDelete: (fragment: Fragment) => void
  onTranslate: (fragment: Fragment) => void
}) {
  const needsTranslation = hasKorean(fragment.content) && !fragment.content_en
  return (
    <article className="space-y-2">
      <header className="flex items-center gap-2 text-xs text-muted-foreground">
        <time dateTime={fragment.created_at}>{formatTime(fragment.created_at)}</time>
        {fragment.lat != null && <MapPinIcon className="size-3" aria-label="위치 있음" />}
        <div className="ml-auto flex">
          {needsTranslation && (
            <Button variant="ghost" size="icon-xs" onClick={() => onTranslate(fragment)} aria-label="영어로 번역">
              <LanguagesIcon />
            </Button>
          )}
          <Button variant="ghost" size="icon-xs" onClick={() => onDelete(fragment)} aria-label="삭제">
            <Trash2Icon />
          </Button>
        </div>
      </header>
      {fragment.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
        <img src={fragment.image_url} alt={fragment.content ?? ""} className="max-h-72 rounded-xl object-cover" />
      )}
      {fragment.content && <p className="whitespace-pre-wrap leading-relaxed">{fragment.content}</p>}
      <TranslationReveal text={fragment.content_en} />
    </article>
  )
}
