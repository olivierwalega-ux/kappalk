import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatusBar, PageHeader } from "@/components/phone-shell";

export const Route = createFileRoute("/app/discover")({
  head: () => ({ meta: [{ title: "Odkryj — KAPP" }] }),
  component: DiscoverPage,
});

type Ev = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string;
  points: number;
  color: string | null;
  participants_count: number;
};

function DiscoverPage() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user, refreshProfile } = useAuth();

  const load = async () => {
    const [{ data: ev }, { data: tx }] = await Promise.all([
      supabase.from("events").select("*").eq("is_active", true).order("starts_at", { ascending: true }),
      user
        ? supabase.from("transactions").select("event_id").eq("user_id", user.id).not("event_id", "is", null)
        : Promise.resolve({ data: [] }),
    ]);
    setEvents((ev as Ev[]) ?? []);
    setClaimed(new Set(((tx as { event_id: string | null }[] | null) ?? []).map((t) => t.event_id!).filter(Boolean)));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const claim = async (id: string) => {
    const { data, error } = await supabase.rpc("claim_event", { _event_id: id });
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as { points?: number } | null;
    toast.success(`+${result?.points ?? 0} punktów! 🎉`);
    await refreshProfile();
    load();
  };

  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Odkryj" subtitle="Eventy i wyzwania na kampusie" />

      <div className="mx-4 mt-2 space-y-2">
        {loading && <div className="text-sm text-text-2">Ładowanie…</div>}
        {events.map((e) => {
          const isClaimed = claimed.has(e.id);
          return (
            <div key={e.id} className="bg-surface-2 rounded-2xl border border-soft p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorVar(e.color) }} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-text-1">{e.title}</div>
                  <div className="mt-0.5 text-[12px] text-text-2">
                    {e.location} · {e.participants_count} uczestników
                  </div>
                  {e.description && <div className="mt-1.5 text-[12px] text-text-3">{e.description}</div>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-brand-glow">
                      {e.category}
                    </span>
                    <button
                      disabled={isClaimed || e.points === 0}
                      onClick={() => claim(e.id)}
                      className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground active:scale-95 disabled:opacity-40"
                    >
                      {isClaimed ? "Odebrano ✓" : e.points === 0 ? "Partner" : `+${e.points} pkt`}
                    </button>
                  </div>
                </div>
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
