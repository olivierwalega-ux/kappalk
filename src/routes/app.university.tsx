import { createFileRoute } from "@tanstack/react-router";
import { Clock, BookOpen, Utensils, GraduationCap } from "lucide-react";
import { StatusBar, PageHeader } from "@/components/phone-shell";

export const Route = createFileRoute("/app/university")({
  head: () => ({ meta: [{ title: "Uczelnia — KAPP" }] }),
  component: UniPage,
});

const lessons = [
  { time: "8:00", name: "Mikroekonomia", loc: "Sala 204", color: "var(--brand)", now: false },
  { time: "10:00", name: "Statystyka", loc: "Sala A1", color: "var(--teal)", now: true },
  { time: "12:00", name: "Marketing", loc: "Sala 312", color: "var(--gold)", now: false },
  { time: "14:00", name: "Prawo gospodarcze", loc: "Aula B", color: "var(--pink)", now: false },
];

const meals = [
  { name: "Pierogi ruskie", cal: "520 kcal", price: "14 zł" },
  { name: "Kurczak curry", cal: "640 kcal", price: "18 zł" },
  { name: "Sałatka cezar", cal: "380 kcal", price: "16 zł" },
];

const grades = [
  { name: "Mikroekonomia", grade: "5.0", color: "var(--green)" },
  { name: "Statystyka", grade: "4.5", color: "var(--brand-glow)" },
  { name: "Marketing", grade: "4.0", color: "var(--gold)" },
  { name: "Prawo", grade: "3.5", color: "var(--amber)" },
];

function UniPage() {
  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Uczelnia" subtitle="ALK · Zarządzanie · rok 2" />

      {/* Plan zajęć */}
      <Section icon={Clock} title="Plan na dziś">
        <div className="bg-surface-2 overflow-hidden rounded-2xl border border-soft">
          {lessons.map((l) => (
            <div key={l.time} className="flex items-center gap-3 border-b border-soft px-4 py-3 last:border-b-0">
              <div className="font-display w-10 text-center text-[11px] font-semibold text-text-3">{l.time}</div>
              <div className="h-2 w-2 rounded-full" style={{ background: l.color }} />
              <div className="flex-1">
                <div className="text-sm font-medium">{l.name}</div>
                <div className="text-[11px] text-text-2">{l.loc}</div>
              </div>
              {l.now && (
                <span className="rounded-full bg-green/20 px-2 py-0.5 text-[10px] font-semibold text-green">teraz</span>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* GPA */}
      <Section icon={GraduationCap} title="Twoje oceny">
        <div className="bg-surface-2 rounded-2xl border border-soft p-4">
          <div className="font-display text-center text-[44px] font-extrabold tracking-tight">4.32</div>
          <div className="mb-3 text-center text-xs text-text-2">Średnia semestru</div>
          {grades.map((g) => (
            <div key={g.name} className="flex items-center justify-between border-t border-soft py-2.5 first:border-t-0">
              <span className="text-sm">{g.name}</span>
              <span className="font-display text-base font-bold" style={{ color: g.color }}>{g.grade}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Stołówka */}
      <Section icon={Utensils} title="Stołówka — dziś">
        <div className="bg-surface-2 overflow-hidden rounded-2xl border border-soft">
          {meals.map((m) => (
            <div key={m.name} className="flex items-center justify-between border-b border-soft px-4 py-3 last:border-b-0">
              <div>
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-[11px] text-text-2">{m.cal}</div>
              </div>
              <div className="font-display text-sm font-bold">{m.price}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Frekwencja */}
      <Section icon={BookOpen} title="Frekwencja">
        <div className="bg-surface-2 rounded-2xl border border-soft p-4 space-y-3">
          {[
            { name: "Mikroekonomia", pct: 92 },
            { name: "Statystyka", pct: 78 },
            { name: "Marketing", pct: 65 },
          ].map((c) => (
            <div key={c.name}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{c.name}</span>
                <span className="font-display font-bold">{c.pct}%</span>
              </div>
              <div className="bg-surface-3 h-1.5 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${c.pct}%`,
                    background: c.pct >= 80 ? "var(--green)" : c.pct >= 70 ? "var(--gold)" : "var(--pink)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="h-6" />
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Clock; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 px-6 pb-2">
        <Icon className="h-3.5 w-3.5 text-brand-glow" />
        <h2 className="font-display text-[14px] font-bold">{title}</h2>
      </div>
      <div className="mx-4">{children}</div>
    </div>
  );
}
