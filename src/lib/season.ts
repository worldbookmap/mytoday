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

// Word-cloud chip styles: gradient fill, text color, and a matching glow.
// Full class strings so Tailwind can see them.
export const SEASON_CHIPS: Record<Season, string[]> = {
  spring: [
    "from-pink-200 to-rose-50 text-rose-900 shadow-pink-300/50",
    "from-lime-100 to-emerald-50 text-emerald-900 shadow-lime-300/50",
    "from-fuchsia-100 to-pink-50 text-fuchsia-900 shadow-fuchsia-300/40",
    "from-amber-100 to-yellow-50 text-amber-900 shadow-amber-300/50",
    "from-rose-100 to-orange-50 text-rose-900 shadow-rose-300/40",
    "from-violet-100 to-pink-50 text-violet-900 shadow-violet-300/40",
  ],
  summer: [
    "from-sky-200 to-cyan-50 text-sky-900 shadow-sky-300/50",
    "from-yellow-100 to-amber-50 text-amber-900 shadow-yellow-300/50",
    "from-teal-100 to-emerald-50 text-teal-900 shadow-teal-300/50",
    "from-blue-100 to-sky-50 text-blue-900 shadow-blue-300/40",
    "from-cyan-100 to-white text-cyan-900 shadow-cyan-300/40",
    "from-emerald-100 to-lime-50 text-emerald-900 shadow-emerald-300/40",
  ],
  autumn: [
    "from-orange-200 to-amber-50 text-orange-950 shadow-orange-300/50",
    "from-yellow-200 to-amber-50 text-yellow-950 shadow-yellow-300/50",
    "from-red-200 to-orange-50 text-red-950 shadow-red-300/40",
    "from-amber-200 to-yellow-50 text-amber-950 shadow-amber-300/50",
    "from-rose-200 to-orange-50 text-rose-950 shadow-rose-300/40",
    "from-orange-100 to-rose-50 text-orange-900 shadow-orange-200/50",
  ],
  winter: [
    "from-sky-100 to-white text-sky-900 shadow-sky-200/60",
    "from-indigo-100 to-sky-50 text-indigo-900 shadow-indigo-200/60",
    "from-slate-100 to-white text-slate-800 shadow-slate-300/50",
    "from-violet-100 to-indigo-50 text-violet-900 shadow-violet-200/60",
    "from-blue-100 to-white text-blue-900 shadow-blue-200/60",
    "from-cyan-50 to-white text-cyan-900 shadow-cyan-200/60",
  ],
}

// Soft color pool behind the cloud.
export const SEASON_GLOW: Record<Season, string> = {
  spring: "rgba(249, 168, 212, 0.35)",
  summer: "rgba(125, 211, 252, 0.35)",
  autumn: "rgba(253, 186, 116, 0.4)",
  winter: "rgba(199, 210, 254, 0.45)",
}
