import { useEffect, useState } from "react";
import { QrCode, Zap, Trophy, Target, Star, Users, Activity, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type MissionKind = "mission" | "challenge";

export interface MissionRow {
  id: string;
  code: string;
  kind: MissionKind;
  period: string;
  trigger_event: string;
  target: number;
  bonus_points: number;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
}

export interface UserMissionRow {
  mission_id: string;
  progress: number;
  completed: boolean;
  bonus_awarded: boolean;
  period_key: string;
}

export interface MissionWithProgress extends MissionRow {
  progress: number;
  completed: boolean;
  percent: number;
  fraction: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  qr: QrCode,
  zap: Zap,
  trophy: Trophy,
  target: Target,
  star: Star,
  users: Users,
  activity: Activity,
};

const COLOR_MAP: Record<string, { fg: string; bg: string }> = {
  brand:  { fg: "var(--brand-glow)", bg: "rgba(123,110,246,.15)" },
  green:  { fg: "var(--green)",      bg: "rgba(62,200,122,.15)" },
  gold:   { fg: "var(--gold)",       bg: "rgba(245,200,66,.12)" },
  pink:   { fg: "var(--pink)",       bg: "rgba(232,96,122,.12)" },
  teal:   { fg: "var(--teal)",       bg: "rgba(62,198,198,.12)" },
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Star;
}

export function getColor(name: string) {
  return COLOR_MAP[name] ?? COLOR_MAP.brand;
}

export function useMissions(kind: MissionKind) {
  const { user } = useAuth();
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [progress, setProgress] = useState<Record<string, UserMissionRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      const [{ data: mData }, { data: pData }] = await Promise.all([
        supabase
          .from("missions")
          .select("*")
          .eq("kind", kind)
          .eq("is_active", true)
          .order("sort_order"),
        user
          ? supabase
              .from("user_missions")
              .select("mission_id,progress,completed,bonus_awarded,period_key")
              .eq("user_id", user.id)
          : Promise.resolve({ data: [] as UserMissionRow[] }),
      ]);
      if (ignore) return;
      setMissions((mData as MissionRow[]) ?? []);
      const map: Record<string, UserMissionRow> = {};
      ((pData as UserMissionRow[]) ?? []).forEach((p) => {
        map[p.mission_id] = p;
      });
      setProgress(map);
      setLoading(false);
    };

    load();

    if (!user) return;
    const channel = supabase
      .channel(`um:${user.id}:${kind}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_missions", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as UserMissionRow | null;
          if (!row) return;
          setProgress((prev) => ({ ...prev, [row.mission_id]: row }));
        },
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id, kind]);

  const enriched: MissionWithProgress[] = missions.map((m) => {
    const p = progress[m.id];
    const cur = Math.min(p?.progress ?? 0, m.target);
    const completed = p?.completed ?? false;
    return {
      ...m,
      progress: cur,
      completed,
      percent: Math.round((cur / m.target) * 100),
      fraction: `${cur}/${m.target}`,
    };
  });

  return { missions: enriched, loading };
}
