import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Delete } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatusBar, PageHeader } from "@/components/phone-shell";
import { formatPts } from "@/lib/format";

export const Route = createFileRoute("/app/transfer")({
  head: () => ({ meta: [{ title: "Wyślij punkty — KAPP" }] }),
  component: TransferPage,
});

type Friend = { id: string; first_name: string | null; last_name: string | null; faculty: string | null; year: number | null; avatar_initials: string | null };

function TransferPage() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Friend | null>(null);
  const [amount, setAmount] = useState("0");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id,first_name,last_name,faculty,year,avatar_initials").neq("id", user.id).limit(50)
      .then(({ data }) => setStudents((data as Friend[]) ?? []));
  }, [user?.id]);

  const filtered = students.filter((s) => {
    const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const press = (k: string) => {
    if (k === "del") setAmount((a) => a.slice(0, -1) || "0");
    else setAmount((a) => {
      const next = a === "0" ? k : a + k;
      const n = parseInt(next, 10);
      if (n > (profile?.points ?? 0)) return String(profile?.points ?? 0);
      return next;
    });
  };

  const send = async () => {
    if (!picked) return toast.error("Wybierz odbiorcę");
    const n = parseInt(amount, 10);
    if (!n || n <= 0) return toast.error("Wpisz kwotę");
    setSending(true);
    const { error } = await supabase.rpc("transfer_points", { _to_user: picked.id, _amount: n, _note: "Transfer P2P" });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success(`Wysłano ${n} pkt do ${picked.first_name}!`);
    await refreshProfile();
    navigate({ to: "/app" });
  };

  if (!picked) {
    return (
      <div className="animate-fade-in">
        <StatusBar />
        <PageHeader title="Wybierz odbiorcę" subtitle="Wyślij punkty znajomemu" />
        <div className="bg-surface-2 mx-4 flex items-center gap-2 rounded-xl border border-input px-3 py-2.5">
          <Search className="h-4 w-4 text-text-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj studenta…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-3"
          />
        </div>
        <div className="mx-4 mt-3 space-y-1.5">
          {filtered.length === 0 && <div className="p-4 text-center text-sm text-text-2">Brak studentów do wyświetlenia.</div>}
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setPicked(s)}
              className="bg-surface-2 flex w-full items-center gap-3 rounded-2xl border border-soft p-3 active:bg-surface-3"
            >
              <div className="bg-gradient-brand flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white">
                {s.avatar_initials ?? "?"}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">{s.first_name} {s.last_name}</div>
                <div className="text-[11px] text-text-2">{s.faculty}, rok {s.year}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const n = parseInt(amount, 10) || 0;
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];

  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Wyślij punkty" subtitle="Transfer peer-to-peer" />

      <button
        onClick={() => setPicked(null)}
        className="bg-surface-2 mx-4 mb-3 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl border border-soft p-3"
      >
        <div className="bg-gradient-brand flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white">
          {picked.avatar_initials}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium">{picked.first_name} {picked.last_name}</div>
          <div className="text-[11px] text-text-2">{picked.faculty}, rok {picked.year}</div>
        </div>
        <span className="text-xs text-brand-glow">Zmień</span>
      </button>

      <div className="bg-surface-2 mx-4 mb-3 rounded-2xl border border-soft p-4">
        <div className="text-[11px] uppercase tracking-wider text-text-3">Kwota</div>
        <div className="font-display flex items-baseline gap-2 text-[44px] font-extrabold leading-none tracking-tight">
          {formatPts(n)} <span className="text-base font-normal text-text-2">pkt</span>
        </div>
        <div className="mt-2 text-[12px] text-text-2">
          Dostępne: <span className="font-bold text-text-1">{formatPts(profile?.points ?? 0)} pkt</span>
        </div>
      </div>

      <div className="mx-4 grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            disabled={k === "."}
            onClick={() => press(k)}
            className="bg-surface-2 font-display rounded-xl border border-soft py-4 text-lg font-bold active:bg-surface-3 disabled:opacity-20"
          >
            {k === "del" ? <Delete className="mx-auto h-5 w-5" /> : k}
          </button>
        ))}
      </div>

      <button
        onClick={send}
        disabled={sending || n <= 0}
        className="bg-gradient-brand shadow-glow font-display mx-4 mt-4 w-[calc(100%-2rem)] rounded-2xl py-4 text-base font-bold text-white active:scale-[0.98] disabled:opacity-40"
      >
        {sending ? "Wysyłanie…" : `Wyślij ${formatPts(n)} pkt`}
      </button>
      <div className="h-6" />
    </div>
  );
}
