"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function PasscodeForm() {
  const router = useRouter()
  const [passcode, setPasscode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

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
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4">
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
    </main>
  )
}
