"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/** English translation kept blurred until the user taps it. */
export function TranslationReveal({
  text,
  className,
}: {
  text: string | null
  className?: string
}) {
  const [shown, setShown] = useState(false)
  if (!text) return null
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setShown((v) => !v)
      }}
      aria-label={shown ? "영어 번역 숨기기" : "영어 번역 보기"}
      className={cn(
        "block text-left text-sm italic text-muted-foreground transition-[filter,opacity] duration-300",
        shown ? "opacity-100 blur-0" : "select-none opacity-60 blur-[5px] hover:blur-[3px]",
        className
      )}
    >
      {text}
    </button>
  )
}
