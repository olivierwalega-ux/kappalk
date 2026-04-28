import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, TrendingUp, QrCode, Send, Trophy, Check, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { StatusBar, SectionHeader } from "@/components/phone-shell";
import { formatPts, greeting } from "@/lib/format";
import { useMissions, getIcon, getColor } from "@/lib/missions";
import { NotificationBell } from "@/components/notification-bell";

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

  const { user } = useAuth();

  useEffect(() => {
    const loadTx = () =>
      supabase.from("transactions").select("id,description,amount,created_at,type").order("created_at", { ascending: false }).limit(5)
        .then(({ data }) => setTx((data as Tx[]) ?? []));

    loadTx();
    supabase.from("events").select("id,title,location,points,color").eq("is_active", true).limit(4)
      .then(({ data }) => setEvents((data as Ev[]) ?? []));

    if (!user) return;
    // Realtime: refresh transactions whenever a new one lands for this user
    const channel = supabase
      .channel(`tx:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        () => loadTx(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const pts = profile?.points ?? 0;
  const nextLevel = (profile?.level ?? 1) * 200;
  const progress = Math.min(100, Math.round((pts / nextLevel) * 100));

  const { missions } = useMissions("mission");

  return (
    <div className="animate-fade-in">
      <StatusBar />

      {/* HERO */}
      <div className="bg-gradient-hero relative mx-4 mt-2 overflow-hidden rounded-3xl border border-primary/30 px-5 py-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[radial-gradient(closest-side,oklch(0.66_0.18_285/0.3),transparent)]" />
        <div className="relative flex items-start justify-between">
          <Link to="/app/profile" className="min-w-0 flex-1 active:opacity-80">
            <div className="text-[13px] text-white/55">{greeting()},</div>
            <div className="font-display text-[20px] font-extrabold tracking-tight text-white">
              {profile?.first_name ?? "Student"} ✨
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <Flame className="h-3.5 w-3.5 text-amber" />
              <span className="font-display text-[13px] font-bold text-white">{profile?.streak_days ?? 0} dni</span>
            </div>
          </div>
        </div>

        <Link to="/app/profile" className="relative mt-4 block active:opacity-80">
          <div className="text-[11px] uppercase tracking-wider text-white/45">Twoje banany 🍌</div>
          <div className="font-display text-[40px] font-extrabold leading-none tracking-tight text-white">
            {formatPts(pts)} <span className="text-base font-medium text-white/50">🍌</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-green" />
            <span className="text-xs text-green">Poziom {profile?.level ?? 1}</span>
          </div>
        </Link>

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
          <span className="text-xs font-medium">Prześlij 🍌</span>
        </Link>
        <Link to="/app/ranking" className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-3.5 active:opacity-70">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/20">
            <Trophy className="h-5 w-5 text-gold" />
          </div>
          <span className="text-xs font-medium">Ranking</span>
        </Link>
      </div>

      {/* MISJE DNIA — 2x2 */}
      <SectionHeader title="Misje dnia" action={<Link to="/app/discover">Wszystkie</Link>} />
      <div className="mx-4 grid grid-cols-2 gap-2">
        {missions.length === 0 && (
          <div className="bg-surface-2 col-span-2 rounded-2xl border border-soft p-4 text-sm text-text-2">
            Brak aktywnych misji.
          </div>
        )}
        {missions.map((m) => {
          const Icon = getIcon(m.icon);
          const c = getColor(m.color);
          return (
            <div key={m.id} className="bg-surface-2 rounded-2xl border border-soft p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: c.bg }}>
                  <Icon className="h-4 w-4" style={{ color: c.fg }} />
                </div>
                <span className="font-display text-[13px] font-bold" style={{ color: m.completed ? "var(--green)" : c.fg }}>
                  +{m.bonus_points}
                </span>
              </div>
              <div className="mb-1.5 text-[12px] font-semibold text-text-1">{m.title}</div>
              <div className="bg-surface-3 mb-1 h-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${m.percent}%`,
                    background: m.completed ? "var(--gradient-success)" : "var(--gradient-brand)",
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-3">{m.fraction}</span>
                <span className={m.completed ? "font-semibold text-green" : "text-text-2"}>
                  {m.completed ? "✓ Gotowe" : "W trakcie"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SERIA */}
      <StreakRow streak={profile?.streak_days ?? 0} />


      {/* TODAY EVENTS */}
      <SectionHeader title="Dziś na kampusie" action={<Link to="/app/discover">Odkryj</Link>} />
      <div className="bg-surface-2 mx-4 overflow-hidden rounded-2xl border border-soft">
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

      {/* ACTIVITY */}
      <SectionHeader title="Ostatnia aktywność" action={<Link to="/app/profile">Wszystkie</Link>} />
      <div className="bg-surface-2 mx-4 overflow-hidden rounded-2xl border border-soft">
        {tx.length === 0 && <div className="p-4 text-sm text-text-2">Pusto. Zgarnij pierwsze banany 🍌 z eventu!</div>}
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
      <div className="h-6" />
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

function StreakRow({ streak }: { streak: number }) {
  // Show last 7 days as visual indicators; filled = active, empty = missed
  // Today is the rightmost dot. Past N-1 dots filled when streak >= position.
  const days = 7;
  const filled = Math.min(streak, days);
  const todayActive = streak > 0;

  return (
    <div className="bg-surface-2 mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-soft p-3">
      <div className="flex items-center gap-1.5">
        <Flame className={`h-4 w-4 ${todayActive ? "text-amber" : "text-text-3"}`} />
        <span className="font-display text-[13px] font-bold">
          {streak} <span className="text-text-2 font-normal">{streak === 1 ? "dzień" : "dni"}</span>
        </span>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        {Array.from({ length: days }).map((_, i) => {
          // Rightmost = today (i = days - 1)
          const isToday = i === days - 1;
          const position = days - i; // 7, 6, ..., 1
          const active = filled >= position;
          if (isToday && active) {
            return (
              <div
                key={i}
                className="bg-gold flex h-7 w-7 items-center justify-center rounded-full shadow-[0_0_12px_rgba(245,200,66,0.5)]"
                title="Dzisiaj"
              >
                <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />
              </div>
            );
          }
          if (active) {
            return (
              <div key={i} className="bg-primary flex h-6 w-6 items-center justify-center rounded-full">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </div>
            );
          }
          return (
            <div
              key={i}
              className={`flex h-6 w-6 items-center justify-center rounded-full border border-soft bg-surface-3 ${
                isToday ? "ring-1 ring-text-3" : ""
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
