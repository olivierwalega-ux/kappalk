import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, TrendingUp, QrCode, Send, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { StatusBar } from "@/components/phone-shell";
import { formatPts, greeting } from "@/lib/format";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "KAPP — Home" }] }),
  component: HomePage,
});

type Tx = { id: string; description: string | null; amount: number; created_at: string; type: string };
type Ev = { id: string; title: string; location: string | null; points: number; color: string | null };

function HomePage() {
  const { profile } = useAuth();
  const [tx, setTx] = useState<Tx[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);

  useEffect(() => {
    supabase.from("transactions").select("id,description,amount,created_at,type").order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setTx((data as Tx[]) ?? []));
    supabase.from("events").select("id,title,location,points,color").eq("is_active", true).limit(4)
      .then(({ data }) => setEvents((data as Ev[]) ?? []));
  }, []);

  const pts = profile?.points ?? 0;
  const nextLevel = (profile?.level ?? 1) * 200;
  const progress = Math.min(100, Math.round((pts / nextLevel) * 100));

  return (
    <div className="animate-fade-in">
      <StatusBar />

      {/* HERO */}
      <div className="bg-gradient-hero relative mx-4 mt-2 overflow-hidden rounded-3xl border border-primary/30 px-5 py-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[radial-gradient(closest-side,oklch(0.66_0.18_285/0.3),transparent)]" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-[13px] text-white/55">{greeting()},</div>
            <div className="font-display text-[20px] font-extrabold tracking-tight text-white">
              {profile?.first_name ?? "Student"} ✨
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1">
            <Flame className="h-3.5 w-3.5 text-amber" />
            <span className="font-display text-[13px] font-bold text-white">{profile?.streak_days ?? 0} dni</span>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="text-[11px] uppercase tracking-wider text-white/45">Twoje punkty</div>
          <div className="font-display text-[40px] font-extrabold leading-none tracking-tight text-white">
            {formatPts(pts)} <span className="text-base font-medium text-white/50">pkt</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-green" />
            <span className="text-xs text-green">Poziom {profile?.level ?? 1}</span>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="mb-1.5 flex justify-between text-[11px] text-white/55">
            <span>Postęp do poziomu {(profile?.level ?? 1) + 1}</span>
            <span>{nextLevel - pts > 0 ? `${nextLevel - pts} do celu` : "Osiągnięto!"}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="bg-gradient-gold h-full rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        <Link to="/app/qr" className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-3.5 active:opacity-70">
          <div className="bg-gradient-brand flex h-11 w-11 items-center justify-center rounded-2xl shadow-glow">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs font-medium">Skanuj QR</span>
        </Link>
        <Link to="/app/transfer" className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-3.5 active:opacity-70">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal/20">
            <Send className="h-5 w-5 text-teal" />
          </div>
          <span className="text-xs font-medium">Wyślij</span>
        </Link>
        <Link to="/app/discover" className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-3.5 active:opacity-70">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/20">
            <Trophy className="h-5 w-5 text-gold" />
          </div>
          <span className="text-xs font-medium">Eventy</span>
        </Link>
      </div>

      {/* TODAY EVENTS */}
      <div className="mx-4 mt-5">
        <h2 className="font-display mb-2 text-[15px] font-bold">Dziś na kampusie</h2>
        <div className="bg-surface-2 overflow-hidden rounded-2xl border border-soft">
          {events.length === 0 && <div className="p-4 text-sm text-text-2">Brak aktywnych wydarzeń.</div>}
          {events.map((e) => (
            <Link key={e.id} to="/app/discover" className="flex items-center gap-3 border-b border-soft px-4 py-3 last:border-b-0 active:bg-surface-3">
              <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorVar(e.color) }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{e.title}</div>
                <div className="text-[11px] text-text-2">{e.location}</div>
              </div>
              <div className="font-display text-sm font-semibold text-brand-glow">+{e.points}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ACTIVITY */}
      <div className="mx-4 mt-5">
        <h2 className="font-display mb-2 text-[15px] font-bold">Ostatnia aktywność</h2>
        <div className="bg-surface-2 overflow-hidden rounded-2xl border border-soft">
          {tx.length === 0 && <div className="p-4 text-sm text-text-2">Brak transakcji. Odbierz pierwsze punkty z eventu!</div>}
          {tx.map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-b border-soft px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.description ?? t.type}</div>
                <div className="text-[11px] text-text-2">{new Date(t.created_at).toLocaleString("pl-PL")}</div>
              </div>
              <div className={`font-display text-sm font-bold ${t.amount >= 0 ? "text-green" : "text-pink"}`}>
                {t.amount >= 0 ? "+" : ""}
                {t.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function colorVar(c: string | null) {
  switch (c) {
    case "teal": return "var(--teal)";
    case "gold": return "var(--gold)";
    case "green": return "var(--green)";
    case "amber": return "var(--amber)";
    case "purple": return "var(--brand)";
    default: return "var(--pink)";
  }
}
