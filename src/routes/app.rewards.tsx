import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Coffee, Pizza, Ticket, ShoppingBag, Sparkles, Gift, Dumbbell, BookOpen } from "lucide-react";
import { StatusBar } from "@/components/phone-shell";
import { useAuth } from "@/lib/auth-context";
import { formatPts, bananForm } from "@/lib/format";

export const Route = createFileRoute("/app/rewards")({
  head: () => ({ meta: [{ title: "Nagrody — KAPP" }] }),
  component: RewardsPage,
});

type Reward = {
  id: string;
  title: string;
  partner: string;
  cost: number;
  icon: typeof Coffee;
  color: string;
  bg: string;
};

const REWARDS: Reward[] = [
  { id: "kawa",     title: "Kawa w Hog's Head",       partner: "Hog's Head",      cost: 80,   icon: Coffee,    color: "var(--gold)",       bg: "rgba(245,200,66,.12)" },
  { id: "pizza",    title: "Kawałek pizzy",            partner: "Stołówka ALK",    cost: 120,  icon: Pizza,     color: "var(--pink)",       bg: "rgba(232,96,122,.12)" },
  { id: "kino",     title: "Bilet do kina Multikino",  partner: "Multikino",       cost: 450,  icon: Ticket,    color: "var(--brand-glow)", bg: "rgba(123,110,246,.12)" },
  { id: "merch",    title: "Bluza KAPP",               partner: "ALK Shop",        cost: 1500, icon: ShoppingBag, color: "var(--teal)",     bg: "rgba(62,198,198,.12)" },
  { id: "siłownia", title: "Wejście na siłownię",      partner: "Calypso ALK",     cost: 200,  icon: Dumbbell,  color: "var(--green)",      bg: "rgba(62,200,122,.12)" },
  { id: "książka",  title: "Książka z biblioteki+",    partner: "Biblioteka ALK",  cost: 300,  icon: BookOpen,  color: "var(--amber)",      bg: "rgba(245,158,66,.12)" },
  { id: "vip",      title: "VIP na evencie",           partner: "KAPP",            cost: 800,  icon: Sparkles,  color: "var(--brand)",      bg: "rgba(123,110,246,.18)" },
  { id: "niespodzianka", title: "Losowa niespodzianka", partner: "Partnerzy",      cost: 50,   icon: Gift,      color: "var(--pink)",       bg: "rgba(232,96,122,.12)" },
];

function RewardsPage() {
  const { profile } = useAuth();
  const balance = profile?.points ?? 0;

  return (
    <div className="animate-fade-in">
      <StatusBar />

      <header className="mx-4 mt-2 mb-3 flex items-center gap-2">
        <Link to="/app" className="bg-surface-2 flex h-9 w-9 items-center justify-center rounded-xl border border-soft">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-extrabold tracking-tight">Nagrody</h1>
          <p className="text-[11px] text-text-2">Wymieniaj banany na fajne rzeczy 🍌</p>
        </div>
        <div className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[12px] font-bold text-gold">
          {formatPts(balance)} 🍌
        </div>
      </header>

      <div className="mx-4 grid grid-cols-2 gap-2">
        {REWARDS.map((r) => {
          const enough = balance >= r.cost;
          const missing = r.cost - balance;
          const Icon = r.icon;
          return (
            <div
              key={r.id}
              className={`bg-surface-2 flex flex-col rounded-2xl border p-3.5 ${
                enough ? "border-green/40" : "border-soft"
              }`}
            >
              <div
                className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: r.bg }}
              >
                <Icon className="h-5 w-5" style={{ color: r.color }} />
              </div>
              <div className="text-[13px] font-semibold leading-tight text-text-1">{r.title}</div>
              <div className="text-[11px] text-text-3">{r.partner}</div>

              <div className="font-display mt-2 text-[15px] font-extrabold text-brand-glow">
                {formatPts(r.cost)} 🍌
              </div>

              <p
                className={`mt-1.5 text-[11px] leading-snug ${
                  enough ? "text-green" : "text-text-2"
                }`}
              >
                {enough
                  ? `${r.title} za ${formatPts(r.cost)} 🍌 — masz już tyle!`
                  : `Brakuje Ci jeszcze ${formatPts(missing)} 🍌`}
              </p>

              <button
                disabled={!enough}
                className={`font-display mt-3 w-full rounded-xl py-2 text-[12px] font-bold active:scale-[0.98] ${
                  enough
                    ? "bg-gradient-brand shadow-glow text-white"
                    : "bg-surface-3 text-text-3"
                }`}
              >
                {enough ? "Zgarnij nagrodę 🎁" : `Zbieraj jeszcze ${formatPts(missing)} ${bananForm(missing)}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="h-8" />
    </div>
  );
}
