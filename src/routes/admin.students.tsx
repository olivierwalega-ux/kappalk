import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBar, PageHeader } from "@/components/phone-shell";
import { formatPts } from "@/lib/format";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Studenci — KAPP Admin" }] }),
  component: AdminStudents,
});

type S = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  faculty: string | null;
  year: number | null;
  points: number;
  avatar_initials: string | null;
};

function AdminStudents() {
  const [students, setStudents] = useState<S[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("id,first_name,last_name,faculty,year,points,avatar_initials").order("points", { ascending: false }).limit(50)
      .then(({ data }) => setStudents((data as S[]) ?? []));
  }, []);

  const inactive = students.filter((s) => s.points < 200).length;
  const filtered = students.filter((s) => `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Studenci" subtitle={`${students.length} użytkowników`} />

      <div className="bg-surface-2 mx-4 mb-3 flex items-center gap-2 rounded-xl border border-input px-3 py-2.5">
        <Search className="h-4 w-4 text-text-2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj studenta…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-3"
        />
      </div>

      <div className="mx-4 space-y-1.5">
        {filtered.map((s, i) => (
          <div key={s.id} className="bg-surface-2 flex items-center gap-3 rounded-2xl border border-soft p-3">
            <div className="font-display w-6 text-center text-sm font-bold text-text-2">{i + 1}</div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{
                background: i === 0 ? "var(--gradient-gold)" : i < 3 ? "var(--gradient-brand)" : "var(--surface-3)",
                color: i < 3 ? "#fff" : "var(--text-1)",
              }}
            >
              {s.avatar_initials ?? "?"}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{s.first_name} {s.last_name}</div>
              <div className="text-[11px] text-text-2">{s.faculty}, rok {s.year}</div>
            </div>
            <div className="font-display text-sm font-bold text-brand-glow">{formatPts(s.points)}</div>
          </div>
        ))}
      </div>

      {inactive > 0 && (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-pink/20 bg-pink/5 p-4">
          <AlertCircle className="h-5 w-5 text-pink" />
          <div>
            <div className="text-sm font-semibold">{inactive} studentów zagrożonych</div>
            <div className="text-[11px] text-text-2">Saldo poniżej 200 pkt</div>
          </div>
        </div>
      )}
      <div className="h-6" />
    </div>
  );
}
