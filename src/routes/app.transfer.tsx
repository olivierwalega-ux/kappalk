import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Delete, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatusBar, PageHeader } from "@/components/phone-shell";
import { formatPts } from "@/lib/format";

export const Route = createFileRoute("/app/transfer")({
  head: () => ({ meta: [{ title: "Wyślij punkty — KAPP" }] }),
  component: TransferPage,
});

type Friend = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  faculty: string | null;
  year: number | null;
  avatar_initials: string | null;
  email: string;
  student_id: string | null;
};

const ALK_DOMAIN = "@kozminski.edu.pl";

// Validation schemas
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5)
  .max(255)
  .email({ message: "Nieprawidłowy email" })
  .refine((v) => v.endsWith(ALK_DOMAIN), {
    message: `Email musi być w domenie ${ALK_DOMAIN}`,
  });

const buildTransferSchema = (balance: number) =>
  z.object({
    amount: z
      .number({ message: "Wpisz kwotę" })
      .int("Kwota musi być liczbą całkowitą")
      .positive("Kwota musi być większa od zera")
      .max(balance, `Niewystarczające saldo (masz ${balance} pkt)`),
    note: z.string().trim().max(120, "Notatka max 120 znaków").optional(),
    recipientId: z.string().uuid("Wybierz odbiorcę"),
  });

function TransferPage() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Friend | null>(null);
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id,first_name,last_name,faculty,year,avatar_initials,email,student_id")
      .neq("id", user.id)
      .order("first_name", { ascending: true })
      .limit(100)
      .then(({ data }) => setStudents((data as Friend[]) ?? []));
  }, [user?.id]);

  const trimmedSearch = search.trim().toLowerCase();
  const looksLikeEmail = trimmedSearch.includes("@");
  const isAlkEmail = looksLikeEmail && trimmedSearch.endsWith(ALK_DOMAIN);

  const filtered = useMemo(() => {
    if (!trimmedSearch) return students;
    return students.filter((s) => {
      const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.toLowerCase();
      return (
        name.includes(trimmedSearch) ||
        (s.email ?? "").toLowerCase().includes(trimmedSearch) ||
        (s.student_id ?? "").toLowerCase().includes(trimmedSearch)
      );
    });
  }, [students, trimmedSearch]);

  // Lookup arbitrary email not in pre-loaded list
  const lookupByEmail = async () => {
    const parsed = emailSchema.safeParse(search);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Nieprawidłowy email");
      return;
    }
    if (parsed.data === profile?.email?.toLowerCase()) {
      toast.error("Nie możesz wysłać punktów do siebie");
      return;
    }
    setLookupLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,first_name,last_name,faculty,year,avatar_initials,email,student_id")
      .eq("email", parsed.data)
      .maybeSingle();
    setLookupLoading(false);

    if (error) {
      toast.error("Błąd wyszukiwania");
      return;
    }
    if (!data) {
      toast.error("Nie znaleziono studenta o tym emailu");
      return;
    }
    setPicked(data as Friend);
    setSearch("");
  };

  const press = (k: string) => {
    if (k === "del") {
      setAmount((a) => a.slice(0, -1) || "0");
      return;
    }
    setAmount((a) => {
      const next = a === "0" ? k : a + k;
      // hard cap at balance
      const balance = profile?.points ?? 0;
      const n = parseInt(next, 10);
      if (Number.isNaN(n)) return a;
      if (n > balance) return String(balance);
      // hard cap at 6 digits as DoS protection
      if (next.length > 6) return a;
      return next;
    });
  };

  const send = async () => {
    if (!picked) return toast.error("Wybierz odbiorcę");

    const balance = profile?.points ?? 0;
    const schema = buildTransferSchema(balance);
    const parsed = schema.safeParse({
      amount: parseInt(amount, 10),
      note: note || undefined,
      recipientId: picked.id,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Błąd walidacji");
      return;
    }

    if (picked.id === user?.id) {
      toast.error("Nie możesz wysłać punktów do siebie");
      return;
    }

    setSending(true);
    const { error } = await supabase.rpc("transfer_points", {
      _to_user: parsed.data.recipientId,
      _amount: parsed.data.amount,
      _note: parsed.data.note ?? "Transfer P2P",
    });
    setSending(false);

    if (error) {
      toast.error(error.message || "Transfer nie powiódł się");
      return;
    }
    toast.success(`Wysłano ${parsed.data.amount} pkt do ${picked.first_name ?? picked.email}!`);
    await refreshProfile();
    navigate({ to: "/app" });
  };

  // ─── Step 1: pick recipient ────────────────────────────────────────────────
  if (!picked) {
    return (
      <div className="animate-fade-in">
        <StatusBar />
        <PageHeader title="Wybierz odbiorcę" subtitle="Wyślij punkty znajomemu" />

        <div className="bg-surface-2 mx-4 flex items-center gap-2 rounded-xl border border-input px-3 py-2.5">
          <Search className="h-4 w-4 text-text-2" />
          <input
            value={search}
            maxLength={255}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Imię, nazwisko, nr indeksu lub email"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-3"
          />
        </div>

        {looksLikeEmail && (
          <button
            onClick={lookupByEmail}
            disabled={!isAlkEmail || lookupLoading}
            className="bg-gradient-brand shadow-glow font-display mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {lookupLoading ? "Szukam…" : `Znajdź: ${search.trim()}`}
          </button>
        )}

        <div className="mx-4 mt-3 space-y-1.5">
          {filtered.length === 0 && (
            <div className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-6 text-center">
              <UserPlus className="h-6 w-6 text-text-3" />
              <div className="text-sm text-text-2">Brak wyników</div>
              <div className="text-[11px] text-text-3">
                Wpisz pełny email uczelniany, aby wyszukać po adresie
              </div>
            </div>
          )}
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setPicked(s)}
              className="bg-surface-2 flex w-full items-center gap-3 rounded-2xl border border-soft p-3 active:bg-surface-3"
            >
              <div className="bg-gradient-brand flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white">
                {s.avatar_initials ?? "?"}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-medium">
                  {s.first_name} {s.last_name}
                </div>
                <div className="truncate text-[11px] text-text-2">
                  {s.student_id} · {s.faculty}, rok {s.year}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="h-6" />
      </div>
    );
  }

  // ─── Step 2: enter amount ──────────────────────────────────────────────────
  const n = parseInt(amount, 10) || 0;
  const balance = profile?.points ?? 0;
  const insufficient = n > balance;
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
          {picked.avatar_initials ?? "?"}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium">
            {picked.first_name} {picked.last_name}
          </div>
          <div className="truncate text-[11px] text-text-2">{picked.email}</div>
        </div>
        <span className="text-xs text-brand-glow">Zmień</span>
      </button>

      <div className="bg-surface-2 mx-4 mb-3 rounded-2xl border border-soft p-4">
        <div className="text-[11px] uppercase tracking-wider text-text-3">Kwota</div>
        <div className="font-display flex items-baseline gap-2 text-[44px] font-extrabold leading-none tracking-tight">
          <span className={insufficient ? "text-pink" : ""}>{formatPts(n)}</span>
          <span className="text-base font-normal text-text-2">pkt</span>
        </div>
        <div className="mt-2 text-[12px] text-text-2">
          Dostępne: <span className={`font-bold ${insufficient ? "text-pink" : "text-text-1"}`}>
            {formatPts(balance)} pkt
          </span>
        </div>
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={120}
        placeholder="Notatka (opcjonalnie)"
        className="bg-surface-2 mx-4 mb-3 w-[calc(100%-2rem)] rounded-2xl border border-input px-4 py-3 text-sm outline-none placeholder:text-text-3 focus:border-primary"
      />

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
        disabled={sending || n <= 0 || insufficient}
        className="bg-gradient-brand shadow-glow font-display mx-4 mt-4 w-[calc(100%-2rem)] rounded-2xl py-4 text-base font-bold text-white active:scale-[0.98] disabled:opacity-40"
      >
        {sending ? "Wysyłanie…" : insufficient ? "Niewystarczające saldo" : `Wyślij ${formatPts(n)} pkt`}
      </button>
      <div className="h-6" />
    </div>
  );
}
