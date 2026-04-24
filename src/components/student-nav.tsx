import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, QrCode, GraduationCap, User } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const items: NavItem[] = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/discover", label: "Odkryj", icon: Search },
  { to: "/app/qr", label: "QR", icon: QrCode },
  { to: "/app/university", label: "Uczelnia", icon: GraduationCap },
  { to: "/app/profile", label: "Profil", icon: User },
];

export function StudentNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[78px] max-w-md items-start gap-1 border-t border-soft bg-[oklch(0.1_0.025_280/0.92)] px-1 pt-2 backdrop-blur-xl">
      {items.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to as string}
            className="flex flex-1 flex-col items-center gap-1 py-1.5 transition-transform active:scale-90"
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                active ? "bg-primary/25" : "bg-transparent",
              )}
            >
              <Icon className={cn("h-5 w-5 transition-opacity", active ? "text-brand-glow opacity-100" : "text-text-1 opacity-40")} />
            </span>
            <span className={cn("text-[10px] font-medium tracking-wide", active ? "text-brand-glow" : "text-text-3")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
