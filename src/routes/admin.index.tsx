import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatusBar } from "@/components/phone-shell";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — KAPP Admin" }] }),
  component: AdminDash,
});

function AdminDash() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState({ students: 0, events: 0, points: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("transactions").select("amount").gte("amount", 1),
    ]).then(([p, e, t]) => {
      const total = ((t.data as { amount: number }[] | null) ?? []).reduce((s, r) => s + r.amount, 0);
      setCounts({ students: p.count ?? 0, events: e.count ?? 0, points: total });
    });
  }, []);

  const bars = [55, 40, 72, 50, 88, 100, 62];
  const days = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
  const faculties = [
    { name: "Zarządzanie", pct: 84, grad: "linear-gradient(90deg, var(--brand), var(--teal))" },
    { name: "Finanse", pct: 71, grad: "var(--gradient-pink)" },
    { name: "IT", pct: 66, grad: "var(--gradient-success)" },
    { name: "Prawo", pct: 52, grad: "var(--gradient-gold)" },
  ];

  return (
    <div className="animate-fade-in">
      <StatusBar />

      {/* hero */}
      <div className="mx-4 mt-3 overflow-hidden rounded-2xl border border-teal/20 bg-[linear-gradient(135deg,oklch(0.18_0.06_200),oklch(0.22_0.08_200),oklch(0.14_0.05_200))] p-5">
        <div className="text-[10px] uppercase tracking-widest text-white/40">Panel administratora</div>
        <div className="font-display text-lg font-bold text-white">{profile?.first_name} {profile?.last_name}</div>
        <div className="mb-4 text-[12px] text-white/50">Akademia Leona Koźmińskiego</div>
        <div className="grid grid-cols-3 gap-2">
          <Kpi v={counts.students} k="Studenci" />
          <Kpi v={counts.events} k="Aktywne eventy" />
          <Kpi v={counts.points} k="Banany 🍌 wydane" />
        </div>
      </div>

      {/* metryki 2x2 */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
        <Met v="94%" l="Retencja" chg="+4%" up />
        <Met v="68%" l="Zaangażowanie" chg="+23%" up />
        <Met v="3.4×" l="Aktywności/tydz." chg="+1.1×" up />
        <Met v="23" l="Zagrożeni" chg="⚠" />
      </div>

      {/* aktywność tygodnia */}
      <h2 className="font-display px-6 pt-5 pb-2 text-[15px] font-bold">Aktywność — 7 dni</h2>
      <div className="bg-surface-2 mx-4 rounded-2xl border border-soft p-4">
        <div className="flex h-20 items-end gap-1.5">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md"
              style={{ height: `${h}%`, background: i === 5 ? "var(--brand)" : "oklch(0.66 0.18 285 / 0.22)" }}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-1.5 text-center text-[10px]">
          {days.map((d, i) => (
            <div key={d} className="flex-1" style={{ color: i === 5 ? "var(--brand-glow)" : "var(--text-3)" }}>{d}</div>
          ))}
        </div>
      </div>

      {/* wydziały */}
      <h2 className="font-display px-6 pt-5 pb-2 text-[15px] font-bold">Aktywność wg wydziału</h2>
      <div className="mx-4 space-y-2.5 px-2">
        {faculties.map((f) => (
          <div key={f.name} className="flex items-center gap-3">
            <div className="w-14 text-[11px] text-text-2">{f.name}</div>
            <div className="bg-surface-3 h-1.5 flex-1 overflow-hidden rounded-full">
              <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: f.grad }} />
            </div>
            <div className="font-display w-8 text-right text-[11px]">{f.pct}%</div>
          </div>
        ))}
      </div>
      <div className="h-6" />
    </div>
  );
}

function Kpi({ v, k }: { v: number; k: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-xl font-extrabold text-white">{v}</div>
      <div className="text-[10px] text-white/40">{k}</div>
    </div>
  );
}
function Met({ v, l, chg, up }: { v: string; l: string; chg: string; up?: boolean }) {
  return (
    <div className="bg-surface-2 flex items-center justify-between rounded-2xl border border-soft p-3.5">
      <div>
        <div className="font-display text-xl font-extrabold">{v}</div>
        <div className="text-[12px] text-text-2">{l}</div>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${up ? "bg-green/15 text-green" : "bg-pink/15 text-pink"}`}>
        {chg}
      </span>
    </div>
  );
}
