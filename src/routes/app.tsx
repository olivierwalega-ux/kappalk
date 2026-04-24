import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { StudentNav } from "@/components/student-nav";
import { PhoneShell } from "@/components/phone-shell";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  if (loading || !session) {
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
      <StudentNav />
    </PhoneShell>
  );
}
