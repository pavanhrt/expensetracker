/** Tag pill colors for each seeded category — tinted background + matching text, dark theme. */
const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-lime/10 text-lime",
  Groceries: "bg-cyan/10 text-cyan",
  "Pooja/Religious": "bg-magenta/10 text-magenta",
  "Fuel/Transport": "bg-violet/10 text-violet",
  "Utilities/Recharge": "bg-cyan/10 text-cyan",
  Household: "bg-violet/10 text-violet",
  Health: "bg-magenta/10 text-magenta",
  Shopping: "bg-lime/10 text-lime",
};

const FALLBACK = "bg-white/5 text-muted";

export function categoryTagClass(category: string | null | undefined): string {
  if (!category) return FALLBACK;
  return CATEGORY_COLORS[category] ?? FALLBACK;
}
