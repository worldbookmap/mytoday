"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/app/actions"
import { toDay } from "@/lib/day"
import { seasonOf } from "@/lib/season"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIsClient } from "@/components/client-only"
import { SeasonBackground } from "@/components/season-background"

export function PasscodeForm() {
  const router = useRouter()
  const [passcode, setPasscode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const isClient = useIsClient()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const { error } = await login(passcode)
      if (error) {
        setError(error)
        setPasscode("")
      } else {
        router.refresh()
      }
    })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4">
      {isClient && <SeasonBackground season={seasonOf(toDay())} />}
      <div className="flex flex-col gap-6 rounded-3xl bg-background/70 p-6 shadow-lg ring-1 ring-white/60 backdrop-blur-xl">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">오늘의 파편</h1>
          <p className="text-sm text-muted-foreground">
            하루 동안 떠오른 단어, 문장, 사진을 모아 저녁에 하루를 정리해요.
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            placeholder="비밀번호"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="h-10 text-base"
          />
          <Button type="submit" size="lg" disabled={pending}>
            들어가기
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </div>
    </main>
  )
}
