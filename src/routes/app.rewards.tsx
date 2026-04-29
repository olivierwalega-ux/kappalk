import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Coffee, Pizza, Ticket, ShoppingBag, Sparkles, Gift, Dumbbell, BookOpen } from "lucide-react";
import { StatusBar } from "@/components/phone-shell";
import { useAuth } from "@/lib/auth-context";
import { formatPts } from "@/lib/format";

export const Route = createFileRoute("/app/rewards")({
  head: () => ({ meta: [{ title: "Nagrody — KAPP" }] }),
  component: RewardsPage,
});

type Reward = {
  id: string;
  title: string;
  emoji: string;
  partner: string;
  cost: number;
  icon: typeof Coffee;
  color: string;
  bg: string;
};

const REWARDS: Reward[] = [
  { id: "niespodzianka", title: "Losowa niespodzianka", emoji: "🎁", partner: "Partnerzy",        cost: 50,   icon: Gift,        color: "var(--pink)",       bg: "rgba(232,96,122,.12)" },
  { id: "kawa",          title: "Kawa w Hog's Head",   emoji: "☕", partner: "Hog's Head",        cost: 80,   icon: Coffee,      color: "var(--gold)",       bg: "rgba(245,200,66,.12)" },
  { id: "pizza",         title: "Kawałek pizzy",        emoji: "🍕", partner: "Stołówka ALK",      cost: 120,  icon: Pizza,       color: "var(--pink)",       bg: "rgba(232,96,122,.12)" },
  { id: "siłownia",      title: "Wejście na siłownię",  emoji: "💪", partner: "Calypso ALK",       cost: 200,  icon: Dumbbell,    color: "var(--green)",      bg: "rgba(62,200,122,.12)" },
  { id: "książka",       title: "Książka z biblioteki", emoji: "📚", partner: "Biblioteka ALK",    cost: 300,  icon: BookOpen,    color: "var(--amber)",      bg: "rgba(245,158,66,.12)" },
  { id: "kino",          title: "Bilet do Multikina",   emoji: "🎬", partner: "Multikino",         cost: 450,  icon: Ticket,      color: "var(--brand-glow)", bg: "rgba(123,110,246,.12)" },
  { id: "vip",           title: "VIP na evencie",       emoji: "✨", partner: "KAPP",              cost: 800,  icon: Sparkles,    color: "var(--brand)",      bg: "rgba(123,110,246,.18)" },
  { id: "merch",         title: "Bluza KAPP",           emoji: "👕", partner: "ALK Shop",          cost: 1500, icon: ShoppingBag, color: "var(--teal)",       bg: "rgba(62,198,198,.12)" },
];

function RewardsPage() {
  const { profile } = useAuth();
  const balance = profile?.points ?? 0;

  // Cheapest reward not yet affordable — for the empty/early-state hint.
  const nextReward = REWARDS.filter((r) => r.cost > balance).sort((a, b) => a.cost - b.cost)[0];
  const missingToFirst = nextReward ? nextReward.cost - balance : 0;

  return (
    <div className="animate-fade-in">
      <StatusBar />

      <header className="mx-4 mt-2 mb-5 flex items-center gap-3">
        <Link to="/app" className="bg-surface-2 flex h-9 w-9 items-center justify-center rounded-xl border border-soft">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight">Nagrody</h1>
        </div>
        <div className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-[13px] font-bold text-gold">
          {formatPts(balance)} 🍌
        </div>
      </header>

      {nextReward && (
        <div className="mx-4 mb-6 rounded-2xl border border-soft bg-surface-2 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3">Najbliższa nagroda</div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="text-3xl">{nextReward.emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold text-text-1">{nextReward.title}</div>
              <div className="text-[12px] text-text-3">
                Brakuje Ci jeszcze <span className="font-semibold text-brand-glow">{formatPts(missingToFirst)} 🍌</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-4 grid grid-cols-2 gap-3">
        {REWARDS.map((r) => {
          const enough = balance >= r.cost;
          const missing = r.cost - balance;
          return (
            <div
              key={r.id}
              className={`bg-surface-2 flex flex-col overflow-hidden rounded-2xl border ${
                enough ? "border-green/40" : "border-soft"
              }`}
            >
              {/* Large illustration on top */}
              <div
                className="flex h-28 items-center justify-center text-[56px] leading-none"
                style={{ background: r.bg }}
              >
                {r.emoji}
              </div>

              <div className="flex flex-1 flex-col p-3.5">
                <div className="text-[14px] font-semibold leading-tight text-text-1">{r.title}</div>
                <div className="mt-0.5 text-[11px] text-text-3">{r.partner}</div>

                <div className="font-display mt-3 text-[16px] font-extrabold text-brand-glow">
                  {formatPts(r.cost)} 🍌
                </div>

                <div className="mt-1 text-[11px] text-text-3">
                  {enough
                    ? `Masz już tyle — odbierz`
                    : `Brakuje ${formatPts(missing)} 🍌`}
                </div>

                <button
                  disabled={!enough}
                  className={`font-display mt-3 w-full rounded-xl py-2.5 text-[12px] font-bold active:scale-[0.98] ${
                    enough
                      ? "bg-gradient-brand shadow-glow text-white"
                      : "bg-surface-3 text-text-3"
                  }`}
                >
                  {enough ? "Odbierz nagrodę" : "Zbieraj dalej"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-10" />
    </div>
  );
}
