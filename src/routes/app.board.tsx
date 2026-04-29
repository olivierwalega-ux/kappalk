import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Users, ShoppingCart, Plus, Megaphone } from "lucide-react";
import { StatusBar, PageHeader, SectionHeader, Chips } from "@/components/phone-shell";

export const Route = createFileRoute("/app/board")({
  head: () => ({ meta: [{ title: "Ogłoszenia — KAPP" }] }),
  component: BoardPage,
});

function BoardPage() {
  const [filter, setFilter] = useState<"all" | "tutor" | "project" | "sale">("all");
  const posts = [
    { type: "tutor" as const, icon: BookOpen, color: "var(--brand-glow)", bg: "rgba(123,110,246,.15)", title: "Korepetycje z Analizy Finansowej", desc: "Rok 2 i 3. 60 zł/h lub 150 🍌 KAPP. Kontakt: Mateusz K.", tag: "Korepetycje", time: "2 godz. temu" },
    { type: "project" as const, icon: Users, color: "var(--teal)", bg: "rgba(62,198,198,.12)", title: "Szukam grupy na projekt z Marketingu", desc: "Termin: 15 maja. Mam już 2 osoby, potrzebuję 1–2 więcej.", tag: "Projekt", time: "5 godz. temu" },
    { type: "sale" as const, icon: ShoppingCart, color: "var(--gold)", bg: "rgba(245,200,66,.12)", title: "Sprzedam podręczniki do Prawa Europejskiego", desc: "Stan b. dobry, 2 książki. 80 zł lub 200 🍌 KAPP.", tag: "Sprzedaż", time: "wczoraj" },
  ];
  const filtered = filter === "all" ? posts : posts.filter((p) => p.type === filter);
  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Ogłoszenia" />
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
      <div className="mx-4 mt-4 flex items-center gap-1.5 text-[11px] text-text-3">
        <Megaphone className="h-3 w-3" /> Społeczność KAPP
      </div>
      <div className="h-6" />
    </div>
  );
}
