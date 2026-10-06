"use client"

import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AuthGate({ children }: { children: (session: Session) => React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  if (session === undefined) return null
  if (session) return <>{children(session)}</>

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">오늘의 파편</h1>
        <p className="text-sm text-muted-foreground">
          하루 동안 떠오른 단어, 문장, 사진을 모아 저녁에 하루를 정리해요.
        </p>
      </div>
      {sent ? (
        <p className="rounded-lg bg-muted p-4 text-sm">
          <strong>{email}</strong> 으로 로그인 링크를 보냈어요. 메일함을 확인해 주세요.
        </p>
      ) : (
        <form onSubmit={sendLink} className="flex flex-col gap-3">
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" size="lg">
            로그인 링크 받기
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      )}
    </main>
  )
}
