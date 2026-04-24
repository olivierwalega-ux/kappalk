import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { StatusBar, PageHeader, Chips, SectionHeader } from "@/components/phone-shell";

export const Route = createFileRoute("/app/university")({
  head: () => ({ meta: [{ title: "Uczelnia — KAPP" }] }),
  component: UniPage,
});

type Tab = "plan" | "menu" | "att" | "gpa" | "cal";

function UniPage() {
  const [tab, setTab] = useState<Tab>("plan");
  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Uczelnia" />
      <Chips
        value={tab}
        onChange={setTab}
        options={[
          { id: "plan", label: "Plan zajęć" },
          { id: "menu", label: "Stołówka" },
          { id: "att", label: "Frekwencja" },
          { id: "gpa", label: "GPA" },
          { id: "cal", label: "Kalendarz" },
        ]}
      />
      {tab === "plan" && <PlanTab />}
      {tab === "menu" && <MenuTab />}
      {tab === "att" && <AttTab />}
      {tab === "gpa" && <GpaTab />}
      {tab === "cal" && <CalTab />}
      <div className="h-6" />
    </div>
  );
}

function PlanTab() {
  const today = [{ time: "8:00", name: "Brak zajęć", loc: "Niedziela", color: "var(--brand)" }];
  const tomorrow = [
    { time: "8:00", name: "Zarządzanie Strategiczne", loc: "Sala 304 · dr Kowalski", color: "var(--brand)", badge: "Jutro" },
    { time: "10:00", name: "Analiza Finansowa", loc: "Sala 201 · dr Wiśniewska", color: "var(--teal)" },
    { time: "12:00", name: "Marketing Cyfrowy", loc: "Lab. 105 · mgr Nowak", color: "var(--gold)" },
    { time: "14:00", name: "Prawo Gospodarcze", loc: "Aula B · dr Mazur", color: "var(--pink)" },
  ];
  return (
    <div>
      <SectionHeader title="Dziś — Niedziela 20 kwi" />
      <LessonList items={today} />
      <SectionHeader title="Poniedziałek 21 kwi" />
      <LessonList items={tomorrow} />
    </div>
  );
}

function LessonList({ items }: { items: { time: string; name: string; loc: string; color: string; badge?: string }[] }) {
  return (
    <div className="bg-surface-2 mx-4 overflow-hidden rounded-2xl border border-soft">
      {items.map((l, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-soft px-4 py-3 last:border-b-0">
          <div className="font-display w-10 text-center text-[11px] font-semibold text-text-3">{l.time}</div>
          <div className="h-2 w-2 rounded-full" style={{ background: l.color }} />
          <div className="flex-1">
            <div className="text-sm font-medium text-text-1">{l.name}</div>
            <div className="text-[11px] text-text-2">{l.loc}</div>
          </div>
          {l.badge && <span className="rounded-full bg-green/15 px-2 py-0.5 text-[10px] font-semibold text-green">{l.badge}</span>}
        </div>
      ))}
    </div>
  );
}

function MenuTab() {
  const soups = [
    { name: "Żurek z jajkiem", cal: "320 kcal", price: "8 zł" },
    { name: "Krem z batatów", cal: "280 kcal", price: "9 zł" },
  ];
  const mains = [
    { name: "Kurczak z ryżem i warzywami", cal: "640 kcal", price: "18 zł" },
    { name: "Makaron z łososiem", cal: "580 kcal", price: "22 zł" },
    { name: "Kotlet schabowy z ziemniakami", cal: "720 kcal", price: "16 zł" },
  ];
  return (
    <div>
      <SectionHeader title="Menu dziś — Hog's Head" action="−20% z KAPP" />
      <div className="mx-4">
        <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-text-3">Zupy</div>
        <MealList items={soups} />
        <div className="mt-4 mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-text-3">Dania główne</div>
        <MealList items={mains} />
      </div>
    </div>
  );
}

function MealList({ items }: { items: { name: string; cal: string; price: string }[] }) {
  return (
    <div className="bg-surface-2 overflow-hidden rounded-2xl border border-soft">
      {items.map((m) => (
        <div key={m.name} className="flex items-center justify-between border-b border-soft px-4 py-3 last:border-b-0">
          <div>
            <div className="text-sm font-medium text-text-1">{m.name}</div>
            <div className="text-[11px] text-text-2">{m.cal}</div>
          </div>
          <div className="font-display text-sm font-bold text-text-1">{m.price}</div>
        </div>
      ))}
    </div>
  );
}

function AttTab() {
  const items = [
    { name: "Zarządzanie Strategiczne", pct: 88 },
    { name: "Analiza Finansowa", pct: 75 },
    { name: "Marketing Cyfrowy", pct: 93 },
    { name: "Prawo Gospodarcze", pct: 58 },
    { name: "Ekonometria", pct: 82 },
  ];
  return (
    <div>
      <SectionHeader title="Frekwencja — semestr letni" />
      <div className="bg-surface-2 mx-4 overflow-hidden rounded-2xl border border-soft">
        {items.map((c) => {
          const ok = c.pct >= 70;
          return (
            <div key={c.name} className="flex items-center gap-3 border-b border-soft px-4 py-3 last:border-b-0">
              <div className="flex-1 text-sm font-medium text-text-1">{c.name}</div>
              <div className="w-20">
                <div className="bg-surface-3 h-1.5 overflow-hidden rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: ok ? "var(--gradient-success)" : "var(--gradient-pink)" }} />
                </div>
              </div>
              <div className="font-display w-10 text-right text-sm font-bold" style={{ color: ok ? "var(--green)" : "var(--amber)" }}>{c.pct}%</div>
            </div>
          );
        })}
      </div>
      <div className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-amber/20 bg-amber/5 p-3.5">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber" />
        <div>
          <div className="text-[13px] font-semibold text-text-1">Uwaga: Prawo Gospodarcze</div>
          <div className="text-[11px] text-text-2">Frekwencja poniżej 70% — wymagane zaliczenie</div>
        </div>
      </div>
    </div>
  );
}

function GpaTab() {
  const grades = [
    { name: "Zarządzanie Strategiczne", g: "5.0", color: "var(--green)" },
    { name: "Analiza Finansowa", g: "4.5", color: "var(--green)" },
    { name: "Marketing Cyfrowy", g: "4.0", color: "var(--green)" },
    { name: "Prawo Gospodarcze", g: "3.5", color: "var(--amber)" },
    { name: "Ekonometria", g: "W trakcie", color: "var(--text-2)" },
  ];
  return (
    <div>
      <div className="mt-4 text-center">
        <div className="font-display text-[52px] font-extrabold leading-none tracking-tight text-text-1">4.2</div>
        <div className="mt-1 text-xs text-text-2">Średnia ważona — semestr letni 2024/25</div>
      </div>
      <div className="bg-surface-2 mx-4 mt-4 overflow-hidden rounded-2xl border border-soft">
        {grades.map((g) => (
          <div key={g.name} className="flex items-center justify-between border-b border-soft px-4 py-3 last:border-b-0">
            <span className="text-sm font-medium text-text-1">{g.name}</span>
            <span className="font-display text-base font-bold" style={{ color: g.color }}>{g.g}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalTab() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const today = 20;
  const events = new Set([20, 21, 22, 26, 28]);
  return (
    <div>
      <SectionHeader title="Kwiecień 2025" />
      <div className="bg-surface-2 mx-4 rounded-2xl border border-soft p-3">
        <div className="grid grid-cols-7 gap-1 pb-2">
          {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-text-3">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* April 1 2025 = Tuesday => start with one empty Mon */}
          <div />
          {days.map((d) => {
            const isToday = d === today;
            const hasEv = events.has(d);
            return (
              <div
                key={d}
                className={`relative flex aspect-square items-center justify-center rounded-lg text-[12px] ${
                  isToday ? "bg-primary text-primary-foreground font-bold" : "text-text-1"
                }`}
              >
                {d}
                {hasEv && !isToday && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand-glow" />}
              </div>
            );
          })}
        </div>
      </div>

      <SectionHeader title="Nadchodzące" />
      <div className="bg-surface-2 mx-4 overflow-hidden rounded-2xl border border-soft">
        {[
          { name: "Zarządzanie Strategiczne", meta: "Pn 21 kwi · 8:00 · Sala 304", tag: "Zajęcia", color: "var(--brand-glow)" },
          { name: "Konferencja IT 2025", meta: "Nd 20 kwi · Aula A · +100 pkt", tag: "Event", color: "var(--pink)" },
          { name: "Spotkanie Koła IT", meta: "Wt 22 kwi · 16:00 · Sala 105", tag: "Koło", color: "var(--teal)" },
          { name: "Targi Pracy ALK", meta: "Pt 28 kwi · 10:00", tag: "Event", color: "var(--gold)" },
        ].map((u) => (
          <div key={u.name} className="flex items-center gap-3 border-b border-soft px-4 py-3 last:border-b-0">
            <div className="h-2 w-2 rounded-full" style={{ background: u.color }} />
            <div className="flex-1">
              <div className="text-sm font-medium text-text-1">{u.name}</div>
              <div className="text-[11px] text-text-2">{u.meta}</div>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `color-mix(in oklab, ${u.color} 15%, transparent)`, color: u.color }}>{u.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
