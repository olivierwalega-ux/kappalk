import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBar, PageHeader, SectionHeader } from "@/components/phone-shell";
import campusMap from "@/assets/alk-campus-map.svg";

export const Route = createFileRoute("/app/discover")({
  head: () => ({ meta: [{ title: "Odkryj — KAPP" }] }),
  component: DiscoverPage,
});

type Ev = {
  id: string;
  title: string;
  location: string | null;
  points: number;
  color: string | null;
  starts_at: string | null;
};

function DiscoverPage() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    supabase
      .from("events")
      .select("id,title,location,points,color,starts_at")
      .eq("is_active", true)
      .gte("starts_at", start.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at", { ascending: true })
      .then(({ data }) => {
        setEvents((data as Ev[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Odkryj" subtitle="Mapa kampusu i dzisiejsze eventy" />

      <div className="mx-4 overflow-hidden rounded-2xl border border-soft bg-[#0A0C14]">
        <img src={campusMap} alt="Mapa kampusu Akademii Leona Koźmińskiego" className="h-auto w-full" />
      </div>

      <SectionHeader title="Dziś na kampusie" />
      <div className="mx-4 space-y-2">
        {loading && <div className="text-sm text-text-2">Ładowanie…</div>}
        {!loading && events.length === 0 && (
          <div className="bg-surface-2 rounded-2xl border border-soft p-4 text-sm text-text-2">
            Dziś nic się nie dzieje. Zajrzyj jutro 👀
          </div>
        )}
        {events.map((e) => {
          const time = e.starts_at
            ? new Date(e.starts_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
            : "—";
          return (
            <div key={e.id} className="bg-surface-2 flex items-center gap-3 rounded-2xl border border-soft px-4 py-3">
              <div className="font-display w-12 shrink-0 text-center text-[12px] font-semibold text-text-3">{time}</div>
              <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorVar(e.color) }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-1">{e.title}</div>
                <div className="text-[11px] text-text-2">{e.location}</div>
              </div>
              <div className="font-display text-sm font-semibold text-brand-glow">
                {e.points === 0 ? "Partner" : `+${e.points} 🍌`}
              </div>
            </div>
          );
        })}
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
