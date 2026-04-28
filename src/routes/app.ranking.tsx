import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Trophy, Crown, Medal, Flame } from "lucide-react";
import { StatusBar } from "@/components/phone-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatPts, initials } from "@/lib/format";

type Row = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_initials: string | null;
  faculty: string | null;
  year: number | null;
  points: number;
  created_at: string;
};

export const Route = createFileRoute("/app/ranking")({
  head: () => ({ meta: [{ title: "Ranking — KAPP" }] }),
  component: RankingPage,
});

const PAGE_SIZE = 100;

function RankingPage() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_initials, faculty, year, points, created_at")
      .order("points", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(PAGE_SIZE);
    setRows((data as Row[]) ?? []);
  };

  useEffect(() => {
    load();
    // realtime: any profile points update -> debounce reload
    const channel = supabase
      .channel("ranking:profiles")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => load(), 400);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => load(), 400);
        },
      )
      .subscribe();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const myRank = useMemo(() => {
    if (!rows || !user) return null;
    const i = rows.findIndex((r) => r.id === user.id);
    return i >= 0 ? i + 1 : null;
  }, [rows, user?.id]);

  const myRow: Row | null = useMemo(() => {
    if (!rows || !user) return null;
    return rows.find((r) => r.id === user.id) ?? null;
  }, [rows, user?.id]);

  return (
    <div className="animate-fade-in">
      <StatusBar />

      {/* HEADER */}
      <header className="mx-4 mt-2 mb-3 flex items-center gap-2">
        <Link to="/app" className="bg-surface-2 flex h-9 w-9 items-center justify-center rounded-xl border border-soft">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-extrabold tracking-tight">Ranking</h1>
          <p className="text-[11px] text-text-2">
            {rows ? `${rows.length} studentów` : "Ładowanie…"}
            {myRank && <> · jesteś na <span className="text-brand-glow font-semibold">#{myRank}</span></>}
          </p>
        </div>
        <div className="bg-gradient-brand flex h-9 w-9 items-center justify-center rounded-xl">
          <Trophy className="h-4 w-4 text-white" />
        </div>
      </header>

      {!rows && <SkeletonList />}

      {rows && rows.length === 0 && (
        <div className="bg-surface-2 mx-4 rounded-2xl border border-soft p-6 text-center text-sm text-text-2">
          Brak studentów w rankingu.
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          {/* PODIUM */}
          <Podium top3={rows.slice(0, 3)} meId={user?.id ?? null} />

          {/* LIST 4..N */}
          <div className="mx-4 mt-4 space-y-1.5">
            {rows.slice(3).map((r, idx) => (
              <RankRow
                key={r.id}
                rank={idx + 4}
                row={r}
                isMe={r.id === user?.id}
              />
            ))}
          </div>

          {/* Sticky "you" card if outside top 100 */}
          {!myRank && profile && (
            <div className="bg-surface-2 mx-4 mt-4 rounded-2xl border border-primary/30 p-3 text-center text-xs text-text-2">
              Twoja pozycja jest poza top {PAGE_SIZE}. Zbieraj banany 🍌, by się tu znaleźć!
            </div>
          )}
        </>
      )}

      {/* Floating MY-RANK pill */}
      {myRank && myRow && (
        <div className="sticky bottom-[100px] z-20 mx-4 mt-4">
          <div className="bg-surface-1 flex items-center gap-3 rounded-2xl border border-primary/40 p-3 shadow-glow backdrop-blur">
            <RankBadge rank={myRank} />
            <Avatar row={myRow} ring />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-text-1">Ty</div>
              <div className="truncate text-[11px] text-text-2">{nameOf(myRow)}</div>
            </div>
            <PointsPill points={myRow.points} highlight />
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}

/* ---------- Components ---------- */

function Podium({ top3, meId }: { top3: Row[]; meId: string | null }) {
  const [first, second, third] = [top3[0], top3[1], top3[2]];
  return (
    <div className="mx-4 mt-2 grid grid-cols-3 items-end gap-2">
      <PodiumCol row={second} place={2} height={84} meId={meId} />
      <PodiumCol row={first} place={1} height={108} meId={meId} crown />
      <PodiumCol row={third} place={3} height={68} meId={meId} />
    </div>
  );
}

function PodiumCol({
  row,
  place,
  height,
  meId,
  crown,
}: {
  row?: Row;
  place: 1 | 2 | 3;
  height: number;
  meId: string | null;
  crown?: boolean;
}) {
  if (!row) return <div />;
  const isMe = row.id === meId;
  const colors: Record<number, string> = {
    1: "var(--gradient-gold)",
    2: "linear-gradient(135deg, oklch(0.78 0.02 280), oklch(0.62 0.02 280))",
    3: "linear-gradient(135deg, oklch(0.62 0.10 40), oklch(0.48 0.10 40))",
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {crown && <Crown className="absolute -top-5 left-1/2 h-5 w-5 -translate-x-1/2 text-gold" />}
        <Avatar row={row} ring={isMe} size={place === 1 ? 56 : 48} />
      </div>
      <div className="w-full truncate text-center text-[11px] font-medium text-text-1">{nameOf(row)}</div>
      <div className="font-display text-[13px] font-bold text-text-1">{formatPts(row.points)} 🍌</div>
      <div
        className={`flex w-full items-center justify-center rounded-t-xl border border-soft ${
          isMe ? "ring-2 ring-primary/60" : ""
        }`}
        style={{ height, background: colors[place] }}
      >
        <span className="font-display text-2xl font-extrabold text-white">{place}</span>
      </div>
    </div>
  );
}

function RankRow({ rank, row, isMe }: { rank: number; row: Row; isMe: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-2.5 ${
        isMe ? "border-primary/50 bg-primary/10 shadow-glow" : "border-soft bg-surface-2"
      }`}
    >
      <RankBadge rank={rank} />
      <Avatar row={row} ring={isMe} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className={`truncate text-sm font-semibold ${isMe ? "text-brand-glow" : "text-text-1"}`}>
            {isMe ? "Ty" : nameOf(row)}
          </div>
          {isMe && (
            <span className="rounded-full bg-primary/30 px-1.5 py-0.5 font-display text-[9px] font-bold text-white">
              TY
            </span>
          )}
        </div>
        <div className="truncate text-[11px] text-text-2">
          {row.faculty ?? "Student"}
          {row.year ? ` · rok ${row.year}` : ""}
        </div>
      </div>
      <PointsPill points={row.points} highlight={isMe} />
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const top = rank <= 3;
  const color =
    rank === 1 ? "var(--gold)" : rank === 2 ? "oklch(0.78 0.02 280)" : rank === 3 ? "oklch(0.62 0.10 40)" : "var(--text-3)";
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-display text-xs font-extrabold ${
        top ? "text-white" : "border border-soft bg-surface-3 text-text-2"
      }`}
      style={top ? { background: `color-mix(in oklab, ${color} 90%, transparent)` } : undefined}
    >
      {top ? <Medal className="h-3.5 w-3.5" /> : rank}
    </div>
  );
}

function Avatar({ row, ring, size = 40 }: { row: Row; ring?: boolean; size?: number }) {
  const ini = row.avatar_initials ?? initials(row.first_name, row.last_name);
  return (
    <div
      className={`bg-gradient-brand flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white ${
        ring ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      }`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {ini}
    </div>
  );
}

function PointsPill({ points, highlight }: { points: number; highlight?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${
        highlight ? "bg-gradient-gold text-white" : "bg-surface-3 text-text-1"
      }`}
    >
      {highlight && <Flame className="h-3 w-3" />}
      <span className="font-display text-[12px] font-bold">{formatPts(points)}</span>
      <span className="text-[10px] opacity-70">🍌</span>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="mx-4 mt-2 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-surface-2 h-14 animate-pulse rounded-2xl border border-soft" />
      ))}
    </div>
  );
}

function nameOf(r: Row): string {
  const n = `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim();
  return n || "Student";
}
