import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AdminNav } from "@/components/admin-nav";
import { PhoneShell } from "@/components/phone-shell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { session, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/login" });
    else if (!isAdmin) navigate({ to: "/app" });
  }, [loading, session, isAdmin, navigate]);

  if (loading || !session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="bg-gradient-brand flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl font-display text-xl font-extrabold text-white">
          K
        </div>
      </div>
    );
  }

  return (
    <PhoneShell>
      <main className="flex-1 pb-[88px]">
        <Outlet />
      </main>
      <AdminNav />
    </PhoneShell>
  );
}
