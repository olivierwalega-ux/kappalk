export const formatPts = (n: number) => n.toLocaleString("pl-PL");

/**
 * Polska odmiana słowa "banan" zależnie od liczby.
 * 1 → banan, 2-4 → banany, 5+ → bananów (z wyjątkami 12-14).
 */
export const bananForm = (n: number): "banan" | "banany" | "bananów" => {
  const abs = Math.abs(n);
  if (abs === 1) return "banan";
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "banany";
  return "bananów";
};

/** "1 247 bananów" — pełna fraza z odmianą */
export const bananyLabel = (n: number) => `${formatPts(n)} ${bananForm(n)}`;

/** "1 247 🍌" — fraza z emoji */
export const bananyEmoji = (n: number) => `${formatPts(n)} 🍌`;

export const initials = (first?: string | null, last?: string | null) =>
  ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "S";

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "Dzień dobry";
  if (h < 18) return "Cześć";
  return "Dobry wieczór";
};
