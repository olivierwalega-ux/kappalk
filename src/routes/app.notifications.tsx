import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, Bell, CheckCheck, Send, Flame, Trophy, CalendarClock } from "lucide-react";
import { StatusBar } from "@/components/phone-shell";
import { useNotifications, type Notification } from "@/lib/notifications";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Powiadomienia — KAPP" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { items, unread, loading, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();

  // Auto-mark all read after the user opens this page
  useEffect(() => {
    if (unread > 0) {
      const t = setTimeout(() => markAllRead(), 800);
      return () => clearTimeout(t);
    }
  }, [unread]);

  const onClick = (n: Notification) => {
    if (!n.read) markRead(n.id);
    if (n.link) navigate({ to: n.link as string });
  };

  return (
    <div className="animate-fade-in">
      <StatusBar />
      <header className="mx-4 mt-2 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/app" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 border border-soft">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight">Powiadomienia</h1>
            <p className="text-[11px] text-text-2">{items.length === 0 ? "Brak powiadomień" : `${unread} nieprzeczytane`}</p>
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => markAllRead()}
            className="flex items-center gap-1.5 rounded-xl border border-soft bg-surface-2 px-3 py-2 text-xs font-medium"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Oznacz wszystkie
          </button>
        )}
      </header>

      <div className="mx-4 space-y-2">
        {loading && <div className="bg-surface-2 rounded-2xl border border-soft p-4 text-sm text-text-2">Ładowanie…</div>}
        {!loading && items.length === 0 && (
          <div className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-3">
              <Bell className="h-5 w-5 text-text-3" />
            </div>
            <div className="font-display font-bold">Cisza w eterze</div>
            <p className="text-xs text-text-2">Powiadomienia o transferach, eventach i rankingu pojawią się tutaj.</p>
          </div>
        )}
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => onClick(n)}
            className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
              n.read ? "bg-surface-2 border-soft" : "bg-primary/10 border-primary/30"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: bgFor(n.type) }}>
              <Icon type={n.type} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold text-text-1">{n.title}</div>
                {!n.read && <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
              {n.body && <div className="mt-0.5 text-xs text-text-2">{n.body}</div>}
              <div className="mt-1.5 text-[10px] uppercase tracking-wide text-text-3">{relTime(n.created_at)}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="h-6" />
    </div>
  );
}

function Icon({ type }: { type: string }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "transfer_received": return <Send className={cls} style={{ color: "var(--teal)" }} />;
    case "event_starting": return <CalendarClock className={cls} style={{ color: "var(--pink)" }} />;
    case "streak_warning": return <Flame className={cls} style={{ color: "var(--amber)" }} />;
    case "rank_up": return <Trophy className={cls} style={{ color: "var(--gold)" }} />;
    default: return <Bell className={cls} style={{ color: "var(--text-2)" }} />;
  }
}

function bgFor(type: string) {
  switch (type) {
    case "transfer_received": return "color-mix(in oklab, var(--teal) 18%, transparent)";
    case "event_starting": return "color-mix(in oklab, var(--pink) 18%, transparent)";
    case "streak_warning": return "color-mix(in oklab, var(--amber) 18%, transparent)";
    case "rank_up": return "color-mix(in oklab, var(--gold) 22%, transparent)";
    default: return "var(--surface-3)";
  }
}

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "przed chwilą";
  if (min < 60) return `${min} min temu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} godz. temu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d. temu`;
  return new Date(iso).toLocaleDateString("pl-PL");
}
