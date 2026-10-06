import { isAuthed } from "@/lib/server/auth"
import { ClientOnly } from "@/components/client-only"
import { PasscodeForm } from "@/components/passcode-form"
import { TodayApp } from "@/components/today-app"

export default async function Home() {
  if (!(await isAuthed())) return <PasscodeForm />
  // "Today" must come from the viewer's clock, not the server's (UTC on Vercel).
  return (
    <ClientOnly>
      <TodayApp />
    </ClientOnly>
  )
}
