import type { Season } from "@/lib/season"

/** Fixed, full-screen seasonal illustration behind the app. */
export function SeasonBackground({ season }: { season: Season }) {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 bg-cover bg-no-repeat transition-[background-image] duration-700"
      // Anchor left so phones (which crop to a narrow slice) keep the
      // branches and trees that sit on that side of each picture.
      style={{ backgroundImage: `url(/seasons/${season}.svg)`, backgroundPosition: "left center" }}
    />
  )
}
