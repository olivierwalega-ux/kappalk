import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Bell, Flame, Send, Trophy, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type Notification = {
  id: string;
  user_id: string;
  type: "transfer_received" | "event_starting" | "streak_warning" | "rank_up" | string;
  title: string;
  body: string | null;
  link: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  pushed: boolean;
  created_at: string;
};

interface NotificationsState {
  items: Notification[];
  unread: number;
  loading: boolean;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<NotificationsState | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const seen = useRef<Set<string>>(new Set());

  const load = async (uid: string) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    const list = (data as Notification[]) ?? [];
    setItems(list);
    list.forEach((n) => seen.current.add(n.id));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load(user.id);

    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          if (seen.current.has(n.id)) return;
          seen.current.add(n.id);
          setItems((prev) => [n, ...prev].slice(0, 50));
          // live toast
          toast(n.title, {
            description: n.body ?? undefined,
            icon: typeIcon(n.type),
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => prev.map((x) => (x.id === n.id ? n : x)));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAllRead = async () => {
    if (!user) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const refresh = async () => {
    if (user) await load(user.id);
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <Ctx.Provider value={{ items, unread, loading, markAllRead, markRead, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

function typeIcon(type: string) {
  // Returned as ReactNode for sonner
  switch (type) {
    case "transfer_received":
      return <Send className="h-4 w-4 text-teal" />;
    case "event_starting":
      return <CalendarClock className="h-4 w-4 text-pink" />;
    case "streak_warning":
      return <Flame className="h-4 w-4 text-amber" />;
    case "rank_up":
      return <Trophy className="h-4 w-4 text-gold" />;
    default:
      return <Bell className="h-4 w-4 text-text-2" />;
  }
}

export function getNotificationIcon(type: string) {
  return typeIcon(type);
}
