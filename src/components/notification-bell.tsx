import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useNotifications } from "@/lib/notifications";

export function NotificationBell() {
  const { unread } = useNotifications();
  return (
    <Link
      to="/app/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-soft bg-surface-2 active:opacity-70"
      aria-label="Powiadomienia"
    >
      <Bell className="h-4 w-4 text-text-1" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink px-1 font-display text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
