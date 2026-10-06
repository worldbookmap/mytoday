import { isAuthed } from "@/lib/server/auth"
import { PasscodeForm } from "@/components/passcode-form"
import { TodayApp } from "@/components/today-app"

export default async function Home() {
  return (await isAuthed()) ? <TodayApp /> : <PasscodeForm />
}
