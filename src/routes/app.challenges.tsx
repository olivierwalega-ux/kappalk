import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, PageHeader, SectionHeader } from "@/components/phone-shell";
import { useMissions, getIcon, getColor } from "@/lib/missions";

export const Route = createFileRoute("/app/challenges")({
  head: () => ({ meta: [{ title: "Wyzwania — KAPP" }] }),
  component: ChallengesPage,
});

function ChallengesPage() {
  const { missions, loading } = useMissions("challenge");
  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Wyzwania" subtitle="Reset: niedziela" />
      <SectionHeader title="Wyzwania tygodnia" />
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
          const subtitle = c.completed ? `${c.fraction} — ukończono ✓` : `${c.progress} z ${c.target} ukończono`;
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
                <div className="font-display text-sm font-semibold" style={{ color: c.completed ? "var(--green)" : "var(--brand-glow)" }}>
                  +{c.bonus_points} 🍌
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
                    style={{ width: `${c.percent}%`, background: c.completed ? "var(--gradient-success)" : "var(--gradient-brand)" }}
                  />
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
