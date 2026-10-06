export type Season = "spring" | "summer" | "autumn" | "winter"

/** Korean seasons: 봄 3–5, 여름 6–8, 가을 9–11, 겨울 12–2. */
export function seasonOf(day: string): Season {
  const month = Number(day.split("-")[1])
  if (month >= 3 && month <= 5) return "spring"
  if (month >= 6 && month <= 8) return "summer"
  if (month >= 9 && month <= 11) return "autumn"
  return "winter"
}

export const SEASON_LABEL: Record<Season, string> = {
  spring: "봄",
  summer: "여름",
  autumn: "가을",
  winter: "겨울",
}

// Chip colors for the word cloud, tuned to sit on each season's background.
// Full class strings so Tailwind can see them.
export const SEASON_CHIPS: Record<Season, string[]> = {
  spring: [
    "bg-pink-100 text-pink-900",
    "bg-rose-50 text-rose-900",
    "bg-lime-100 text-lime-900",
    "bg-amber-50 text-amber-900",
    "bg-fuchsia-100 text-fuchsia-900",
    "bg-pink-200 text-pink-950",
  ],
  summer: [
    "bg-sky-100 text-sky-900",
    "bg-cyan-100 text-cyan-900",
    "bg-emerald-100 text-emerald-900",
    "bg-yellow-100 text-yellow-900",
    "bg-blue-100 text-blue-900",
    "bg-teal-50 text-teal-900",
  ],
  autumn: [
    "bg-orange-100 text-orange-900",
    "bg-amber-100 text-amber-900",
    "bg-red-100 text-red-900",
    "bg-yellow-100 text-yellow-900",
    "bg-rose-100 text-rose-900",
    "bg-orange-200 text-orange-950",
  ],
  winter: [
    "bg-slate-100 text-slate-800",
    "bg-sky-50 text-sky-900",
    "bg-indigo-100 text-indigo-900",
    "bg-blue-50 text-blue-900",
    "bg-violet-100 text-violet-900",
    "bg-white text-slate-700",
  ],
}
