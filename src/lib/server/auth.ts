import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const SESSION_COOKIE = "mytoday_session"

function passcode(): string {
  const value = process.env.APP_PASSCODE
  if (!value) throw new Error("APP_PASSCODE is not set")
  return value
}

/** Cookie value derived from the passcode, so changing it signs everyone out. */
export function sessionToken(): string {
  return createHmac("sha256", passcode()).update("mytoday-session-v1").digest("hex")
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function checkPasscode(input: string): boolean {
  return safeEqual(input, passcode())
}

export async function isAuthed(): Promise<boolean> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value
  return !!value && safeEqual(value, sessionToken())
}

export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) throw new Error("비밀번호를 다시 입력해 주세요")
}
