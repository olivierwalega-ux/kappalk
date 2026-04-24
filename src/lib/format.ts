export const formatPts = (n: number) => n.toLocaleString("pl-PL");

export const initials = (first?: string | null, last?: string | null) =>
  ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "S";

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "Dzień dobry";
  if (h < 18) return "Cześć";
  return "Dobry wieczór";
};
