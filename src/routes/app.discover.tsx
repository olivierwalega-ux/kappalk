import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trophy, Users, Megaphone, Plus, BookOpen, Briefcase, ShoppingCart, Heart, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatusBar, PageHeader, Chips, SectionHeader } from "@/components/phone-shell";
import { useMissions, getIcon, getColor } from "@/lib/missions";
import campusMap from "@/assets/alk-campus-map.svg";

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

type Tab = "map" | "events" | "challenges" | "groups" | "board";

function DiscoverPage() {
  const [tab, setTab] = useState<Tab>("map");
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

  useEffect(() => { load(); }, [user?.id]);

  const claim = async (id: string) => {
    const { data, error } = await supabase.rpc("claim_event", { _event_id: id });
    if (error) { toast.error(error.message); return; }
    const result = data as { points?: number } | null;
    toast.success(`+${result?.points ?? 0} punktów! 🎉`);
    await refreshProfile();
    load();
  };

  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Odkryj" />
      <Chips
        value={tab}
        onChange={setTab}
        options={[
          { id: "map", label: "Mapa" },
          { id: "events", label: "Eventy" },
          { id: "challenges", label: "Wyzwania" },
          { id: "groups", label: "Koła" },
          { id: "board", label: "Ogłoszenia" },
        ]}
      />

      {tab === "map" && <MapTab events={events} />}
      {tab === "events" && <EventsTab events={events} loading={loading} claimed={claimed} onClaim={claim} />}
      {tab === "challenges" && <ChallengesTab />}
      {tab === "groups" && <GroupsTab />}
      {tab === "board" && <BoardTab />}

      <div className="h-6" />
    </div>
  );
}

function MapTab({ events }: { events: Ev[] }) {
  return (
    <div>
      <div className="mx-4 overflow-hidden rounded-2xl border border-soft bg-[#0A0C14]">
        <img src={campusMap} alt="Mapa kampusu Akademii Leona Koźmińskiego" className="h-auto w-full" />
      </div>
      <SectionHeader title="Eventy na mapie" />
      <div className="mx-4 space-y-2">
        {events.slice(0, 6).map((e) => (
          <div key={e.id} className="bg-surface-2 flex items-center gap-3 rounded-xl border border-soft px-4 py-3">
            <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorVar(e.color) }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text-1">{e.title}</div>
              <div className="text-[11px] text-text-2">{e.location}</div>
            </div>
            <div className="font-display text-sm font-semibold" style={{ color: e.points === 0 ? "var(--teal)" : "var(--brand-glow)" }}>
              {e.points === 0 ? "Partner" : `+${e.points}`}
            </div>
          </div>
        ))}
        {events.length === 0 && <div className="text-sm text-text-2">Brak eventów na mapie.</div>}
      </div>
    </div>
  );
}

function EventsTab({ events, loading, claimed, onClaim }: { events: Ev[]; loading: boolean; claimed: Set<string>; onClaim: (id: string) => void }) {
  return (
    <div className="mx-4 mt-1 space-y-2">
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
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-brand-glow">{e.category}</span>
                  <button
                    disabled={isClaimed || e.points === 0}
                    onClick={() => onClaim(e.id)}
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
  );
}

function ChallengesTab() {
  const { missions, loading } = useMissions("challenge");
  return (
    <div>
      <SectionHeader title="Wyzwania tygodnia" action="Reset: niedziela" />
      <div className="mx-4 space-y-2">
        {loading && <div className="text-sm text-text-2">Ładowanie…</div>}
        {!loading && missions.length === 0 && (
          <div className="bg-surface-2 rounded-2xl border border-soft p-4 text-sm text-text-2">
            Brak aktywnych wyzwań w tym tygodniu.
          </div>
        )}
        {missions.map((c) => {
          const Icon = getIcon(c.icon);
          const col = getColor(c.color);
          const subtitle = c.completed
            ? `${c.fraction} — ukończono ✓`
            : `${c.progress} z ${c.target} ukończono`;
          return (
            <div key={c.id} className="bg-surface-2 overflow-hidden rounded-2xl border border-soft">
              <div className="flex items-center gap-3 border-b border-soft px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: col.bg }}>
                  <Icon className="h-4 w-4" style={{ color: col.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text-1">{c.title}</div>
                  <div className="text-[11px] text-text-2">{subtitle}</div>
                </div>
                <div
                  className="font-display text-sm font-semibold"
                  style={{ color: c.completed ? "var(--green)" : "var(--brand-glow)" }}
                >
                  +{c.bonus_points} pkt
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="mb-1.5 flex justify-between text-[11px] text-text-2">
                  <span>{c.completed ? "Ukończono!" : "Postęp"}</span>
                  <span style={{ color: c.completed ? "var(--green)" : "var(--brand-glow)" }}>{c.percent}%</span>
                </div>
                <div className="bg-surface-3 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${c.percent}%`,
                      background: c.completed ? "var(--gradient-success)" : "var(--gradient-brand)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupsTab() {
  const groups = [
    { icon: BookOpen, color: "var(--brand-glow)", bg: "rgba(123,110,246,.12)", name: "Koło IT i Technologii", meta: "234 członków · Ty: 380 pkt", joined: true },
    { icon: Briefcase, color: "var(--gold)", bg: "rgba(245,200,66,.1)", name: "Koło Finansów i Inwestycji", meta: "187 członków · Ty: 120 pkt", joined: true },
    { icon: Trophy, color: "var(--teal)", bg: "rgba(62,198,198,.1)", name: "Koło Przedsiębiorczości", meta: "312 członków", joined: false },
    { icon: Heart, color: "var(--pink)", bg: "rgba(232,96,122,.1)", name: "Wolontariat ALK", meta: "98 członków", joined: false },
    { icon: Activity, color: "var(--green)", bg: "rgba(62,200,122,.1)", name: "Sport i Zdrowy Styl Życia", meta: "156 członków", joined: false },
  ];
  return (
    <div>
      <SectionHeader title="Koła zainteresowań" action="+ Nowa" />
      <div className="bg-surface-2 mx-4 overflow-hidden rounded-2xl border border-soft">
        {groups.map((g) => (
          <div key={g.name} className="flex items-center gap-3 border-b border-soft px-4 py-3 last:border-b-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: g.bg }}>
              <g.icon className="h-4 w-4" style={{ color: g.color }} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-1">{g.name}</div>
              <div className="text-[11px] text-text-2">{g.meta}</div>
            </div>
            {g.joined ? (
              <span className="rounded-full bg-green/15 px-2.5 py-0.5 text-[10px] font-semibold text-green">Dołączyłeś</span>
            ) : (
              <button className="text-[11px] font-semibold text-brand-glow active:opacity-70">+ Dołącz</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardTab() {
  const [filter, setFilter] = useState<"all" | "tutor" | "project" | "sale">("all");
  const posts = [
    { type: "tutor" as const, icon: BookOpen, color: "var(--brand-glow)", bg: "rgba(123,110,246,.15)", title: "Korepetycje z Analizy Finansowej", desc: "Rok 2 i 3. 60 zł/h lub 150 pkt KAPP. Kontakt: Mateusz K.", tag: "Korepetycje", time: "2 godz. temu" },
    { type: "project" as const, icon: Users, color: "var(--teal)", bg: "rgba(62,198,198,.12)", title: "Szukam grupy na projekt z Marketingu", desc: "Termin: 15 maja. Mam już 2 osoby, potrzebuję 1–2 więcej.", tag: "Projekt", time: "5 godz. temu" },
    { type: "sale" as const, icon: ShoppingCart, color: "var(--gold)", bg: "rgba(245,200,66,.12)", title: "Sprzedam podręczniki do Prawa Europejskiego", desc: "Stan b. dobry, 2 książki. 80 zł lub 200 pkt KAPP.", tag: "Sprzedaż", time: "wczoraj" },
  ];
  const filtered = filter === "all" ? posts : posts.filter((p) => p.type === filter);
  return (
    <div>
      <SectionHeader title="Tablica ogłoszeń" action={<span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Dodaj</span>} />
      <Chips
        value={filter}
        onChange={setFilter}
        options={[
          { id: "all", label: "Wszystkie" },
          { id: "tutor", label: "Korepetycje" },
          { id: "project", label: "Projekty" },
          { id: "sale", label: "Sprzedaż" },
        ]}
      />
      <div className="mx-4 space-y-2">
        {filtered.map((p) => (
          <div key={p.title} className="bg-surface-2 flex items-start gap-3 rounded-2xl border border-soft p-3.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: p.bg }}>
              <p.icon className="h-4 w-4" style={{ color: p.color }} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-text-1">{p.title}</div>
              <div className="mt-0.5 text-[12px] leading-snug text-text-2">{p.desc}</div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: p.bg, color: p.color }}>{p.tag}</span>
                <span className="text-[10px] text-text-3">{p.time}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-sm text-text-2">Brak ogłoszeń w tej kategorii.</div>}
      </div>
            <div className="flex items-center gap-1.5 text-[11px] text-text-3">
        <Megaphone className="h-3 w-3" /> Społeczność KAPP
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
