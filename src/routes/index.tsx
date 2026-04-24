import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KAPP — Akademia Leona Koźmińskiego" },
      { name: "description", content: "Twój kampus, ożywiony. Punkty, eventy, społeczność ALK." },
    ],
  }),
  component: SplashPage,
});

function SplashPage() {
  const navigate = useNavigate();
  const { session, loading, isAdmin } = useAuth();
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (session) {
        navigate({ to: isAdmin ? "/admin" : "/app" });
      } else {
        setShowLogo(false);
        // Onboarded flag in localStorage
        const seen = typeof window !== "undefined" && localStorage.getItem("kapp_onboarded");
        navigate({ to: seen ? "/login" : "/onboarding" });
      }
    }, 1700);
    return () => clearTimeout(t);
  }, [loading, session, isAdmin, navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[28%] h-[60vh] w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.66_0.18_285/0.22),transparent)]" />
        <div className="absolute right-[10%] bottom-[20%] h-[40vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.13_195/0.12),transparent)]" />
      </div>

      {showLogo && (
        <div className="relative z-10 flex animate-splash-pop flex-col items-center gap-3.5">
          <div className="bg-gradient-brand shadow-glow flex h-24 w-24 items-center justify-center rounded-[28px] font-display text-[42px] font-extrabold text-white">
            K
          </div>
          <div className="font-display text-[44px] font-extrabold tracking-tight text-white">KAPP</div>
          <div className="max-w-[260px] text-center text-sm leading-relaxed text-white/40">
            Twój kampus. Twoje punkty.
            <br />
            Twoja społeczność.
          </div>
          <div className="mt-2 flex gap-1.5">
            <div className="h-1.5 w-4 rounded-full bg-brand-glow" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/15" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/15" />
          </div>
        </div>
      )}
    </div>
  );
}
