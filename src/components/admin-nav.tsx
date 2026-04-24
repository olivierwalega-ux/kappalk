import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Calendar, Users, BarChart3, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/events", label: "Wydarzenia", icon: Calendar },
  { to: "/admin/students", label: "Studenci", icon: Users },
  { to: "/admin/analytics", label: "Analityki", icon: BarChart3 },
] as const;

export function AdminNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[78px] max-w-md items-start gap-1 border-t border-soft bg-[oklch(0.1_0.025_280/0.92)] px-1 pt-2 backdrop-blur-xl">
      {items.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
        return (
          <Link key={to} to={to} className="flex flex-1 flex-col items-center gap-1 py-1.5 active:scale-90">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", active ? "bg-teal/25" : "")}>
              <Icon className={cn("h-5 w-5", active ? "text-teal opacity-100" : "text-text-1 opacity-40")} />
            </span>
            <span className={cn("text-[10px] font-medium", active ? "text-teal" : "text-text-3")}>{label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => navigate({ to: "/app" })}
        className="flex flex-1 flex-col items-center gap-1 py-1.5 active:scale-90"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl">
          <ArrowLeftRight className="h-5 w-5 text-text-1 opacity-40" />
        </span>
        <span className="text-[10px] font-medium text-text-3">Student</span>
      </button>
    </nav>
  );
}
