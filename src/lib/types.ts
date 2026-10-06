export type Fragment = {
  id: string
  day: string
  content: string | null
  content_en: string | null
  image_path: string | null
  lat: number | null
  lng: number | null
  created_at: string
  /** Signed URL for image_path, resolved on the client. */
  image_url?: string
}

export type SpeakingAttempt = {
  text: string
  at: string
}

export type DayEntry = {
  day: string
  title: string | null
  body: string | null
  body_en: string | null
  speaking: SpeakingAttempt[]
  updated_at: string
}
