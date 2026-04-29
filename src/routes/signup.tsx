import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Załóż konto — KAPP" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signUp(email, password, first, last);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Konto utworzone — witaj w KAPP!");
    navigate({ to: "/app" });
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,oklch(0.66_0.18_285/0.18),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col gap-5 px-7 pt-14 pb-8">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-gradient-brand shadow-glow flex h-14 w-14 items-center justify-center rounded-[18px] font-display text-xl font-extrabold text-white">
            K
          </div>
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-text-1">Załóż konto KAPP</h1>
          <p className="text-center text-sm text-text-3">100 🍌 powitalnych na start.</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Imię"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              className="rounded-2xl border border-input bg-surface-2 px-4 py-3.5 text-base text-text-1 placeholder:text-text-3 focus:border-primary outline-none"
            />
            <input
              required
              placeholder="Nazwisko"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              className="rounded-2xl border border-input bg-surface-2 px-4 py-3.5 text-base text-text-1 placeholder:text-text-3 focus:border-primary outline-none"
            />
          </div>
          <input
            type="email"
            required
            autoCapitalize="none"
            placeholder="numer_indeksu@kozminski.edu.pl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-2xl border border-input bg-surface-2 px-4 py-3.5 text-base text-text-1 placeholder:text-text-3 focus:border-primary outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Hasło (min. 6 znaków)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-2xl border border-input bg-surface-2 px-4 py-3.5 text-base text-text-1 placeholder:text-text-3 focus:border-primary outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-gradient-brand shadow-glow mt-1 w-full rounded-2xl py-4 font-display text-base font-bold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Zakładamy konto…" : "Załóż konto"}
          </button>
        </form>

        <p className="text-center text-[11px] text-text-3">
          Tylko dla studentów ALK z domeną @kozminski.edu.pl
        </p>

        <Link to="/login" className="text-center text-sm text-brand-glow">
          Mam już konto — zaloguj się
        </Link>
      </div>
    </div>
  );
}
