"use client"

import { AuthGate } from "@/components/auth-gate"
import { TodayApp } from "@/components/today-app"

export default function Home() {
  return <AuthGate>{(session) => <TodayApp userId={session.user.id} />}</AuthGate>
}
