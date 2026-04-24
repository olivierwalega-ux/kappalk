import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StatusBar, PageHeader } from "@/components/phone-shell";

export const Route = createFileRoute("/admin/events")({
  head: () => ({ meta: [{ title: "Wydarzenia — KAPP Admin" }] }),
  component: AdminEvents,
});

type Ev = {
  id: string;
  title: string;
  location: string | null;
  points: number;
  is_active: boolean;
  participants_count: number;
  color: string | null;
};

function AdminEvents() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", location: "", points: "50", category: "event" });

  const load = async () => {
    const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    setEvents((data as Ev[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("events").insert({
      title: form.title.trim(),
      location: form.location.trim() || null,
      points: parseInt(form.points) || 0,
      category: form.category,
      is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Wydarzenie utworzone");
    setOpen(false);
    setForm({ title: "", location: "", points: "50", category: "event" });
    load();
  };

  const toggle = async (ev: Ev) => {
    const { error } = await supabase.from("events").update({ is_active: !ev.is_active }).eq("id", ev.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader
        title="Wydarzenia"
        subtitle="Zarządzaj eventami uczelni"
        action={
          <button onClick={() => setOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Plus className="h-4 w-4 text-white" strokeWidth={3} />
          </button>
        }
      />

      <div className="mx-4 mt-2 space-y-2">
        {events.map((e) => (
          <div key={e.id} className="bg-surface-2 flex items-center gap-3 rounded-2xl border border-soft p-3.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: e.is_active ? "var(--green)" : "var(--text-3)" }} />
            <div className="flex-1">
              <div className="text-sm font-medium">{e.title}</div>
              <div className="text-[11px] text-text-2">{e.location ?? "—"} · {e.participants_count} uczestników</div>
            </div>
            <div className="text-right">
              <div className="font-display text-sm font-bold text-brand-glow">+{e.points}</div>
              <button onClick={() => toggle(e)} className="text-[10px] text-text-3 underline">
                {e.is_active ? "Ukryj" : "Aktywuj"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur md:items-center" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={create}
            className="bg-surface-1 m-0 w-full max-w-md space-y-3 rounded-t-3xl border-t border-soft p-5 md:m-4 md:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Nowy event</h3>
              <button type="button" onClick={() => setOpen(false)}><X className="h-5 w-5 text-text-2" /></button>
            </div>
            <input
              required placeholder="Tytuł"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <input
              placeholder="Lokalizacja"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number" min="0" placeholder="Punkty"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="event">Event</option>
                <option value="warsztat">Warsztat</option>
                <option value="konferencja">Konferencja</option>
                <option value="sport">Sport</option>
                <option value="kariera">Kariera</option>
              </select>
            </div>
            <button type="submit" className="bg-gradient-brand w-full rounded-xl py-3 font-display text-sm font-bold text-white">
              Utwórz wydarzenie
            </button>
          </form>
        </div>
      )}
      <div className="h-6" />
    </div>
  );
}
