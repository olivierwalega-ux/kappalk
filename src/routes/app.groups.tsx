import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Briefcase, Trophy, Heart, Activity } from "lucide-react";
import { StatusBar, PageHeader, SectionHeader } from "@/components/phone-shell";

export const Route = createFileRoute("/app/groups")({
  head: () => ({ meta: [{ title: "Koła — KAPP" }] }),
  component: GroupsPage,
});

function GroupsPage() {
  const groups = [
    { icon: BookOpen, color: "var(--brand-glow)", bg: "rgba(123,110,246,.12)", name: "Koło IT i Technologii", meta: "234 członków · Ty: 380 🍌", joined: true },
    { icon: Briefcase, color: "var(--gold)", bg: "rgba(245,200,66,.1)", name: "Koło Finansów i Inwestycji", meta: "187 członków · Ty: 120 🍌", joined: true },
    { icon: Trophy, color: "var(--teal)", bg: "rgba(62,198,198,.1)", name: "Koło Przedsiębiorczości", meta: "312 członków", joined: false },
    { icon: Heart, color: "var(--pink)", bg: "rgba(232,96,122,.1)", name: "Wolontariat ALK", meta: "98 członków", joined: false },
    { icon: Activity, color: "var(--green)", bg: "rgba(62,200,122,.1)", name: "Sport i Zdrowy Styl Życia", meta: "156 członków", joined: false },
  ];
  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Koła" subtitle="Znajdź swoich ludzi" />
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
      <div className="h-6" />
    </div>
  );
}
