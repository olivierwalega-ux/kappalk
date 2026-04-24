import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Zaloguj się — KAPP" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, session, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: isAdmin ? "/admin" : "/app" });
  }, [loading, session, isAdmin, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Zalogowano");
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,oklch(0.66_0.18_285/0.18),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col gap-6 px-7 pt-16 pb-8">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-gradient-brand shadow-glow flex h-16 w-16 items-center justify-center rounded-[20px] font-display text-2xl font-extrabold text-white">
            K
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-1">Witaj w KAPP</h1>
          <p className="text-center text-sm text-text-2">Zaloguj się emailem ALK</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-3">E-mail uczelniany</label>
            <input
              type="email"
              required
              autoCapitalize="none"
              autoComplete="email"
              placeholder="52677@kozminski.edu.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-input bg-surface-2 px-4 py-3.5 text-base text-text-1 outline-none placeholder:text-text-3 focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-3">Hasło</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-input bg-surface-2 px-4 py-3.5 text-base text-text-1 outline-none placeholder:text-text-3 focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-gradient-brand shadow-glow mt-1 w-full rounded-2xl py-4 font-display text-base font-bold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Logowanie…" : "Zaloguj się"}
          </button>
        </form>

        <p className="text-center text-xs text-text-3">
          Logowanie tylko dla studentów ALK z domeną <span className="text-text-2">@kozminski.edu.pl</span>
        </p>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-3">lub</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Link
          to="/signup"
          className="rounded-2xl border border-input bg-surface-2 px-4 py-3.5 text-center text-sm font-medium text-text-1"
        >
          Załóż konto
        </Link>

        <div className="mt-auto text-center text-[11px] text-text-3">
          Akademia Leona Koźmińskiego · KAPP v1.0
        </div>
      </div>
    </div>
  );
}
