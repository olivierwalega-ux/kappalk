import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { LogOut, Settings, ShieldCheck, Send, QrCode, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { StatusBar } from "@/components/phone-shell";
import { formatPts } from "@/lib/format";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profil — KAPP" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const copyRef = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Skopiowano!");
    }
  };

  return (
    <div className="animate-fade-in">
      <StatusBar />

      {/* Top */}
      <div className="flex flex-col items-center gap-2 px-6 pt-3 pb-5">
        <div className="bg-gradient-pink flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/10 font-display text-2xl font-bold text-white">
          {profile?.avatar_initials ?? "S"}
        </div>
        <div className="font-display text-xl font-bold">
          {profile?.first_name} {profile?.last_name}
        </div>
        <div className="text-center text-[13px] text-text-2">
          ALK · {profile?.faculty} · rok {profile?.year}
        </div>
        <span className="rounded-full bg-gold/15 px-3 py-1 text-[12px] font-semibold text-gold">Gold Member</span>
      </div>

      {/* Stats */}
      <div className="mx-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-border">
        <Stat label="Punkty" value={formatPts(profile?.points ?? 0)} accent />
        <Stat label="Poziom" value={String(profile?.level ?? 1)} />
        <Stat label="Streak" value={String(profile?.streak_days ?? 0)} />
      </div>

      {/* Wallet card */}
      <div className="mx-4 mt-4">
        <h2 className="font-display mb-2 text-[15px] font-bold">Portfel KAPP</h2>
        <div
          className="relative overflow-hidden rounded-2xl border border-primary/30 p-5"
          style={{ background: "linear-gradient(135deg, oklch(0.22 0.12 285), oklch(0.27 0.14 285), oklch(0.16 0.1 285))" }}
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,oklch(0.66_0.18_285/0.3),transparent)]" />
          <div className="font-display relative text-base font-extrabold text-white/90">KAPP</div>
          <div className="font-display relative mt-3 text-[34px] font-extrabold leading-none tracking-tight text-white">
            {formatPts(profile?.points ?? 0)} <span className="text-sm font-normal text-white/50">pkt</span>
          </div>
          <div className="relative mt-2 text-[13px] text-white/60">
            {profile?.first_name} {profile?.last_name}
          </div>
          <div className="relative text-[11px] text-white/35">{profile?.student_id} · Koźmiński</div>
        </div>
      </div>

      {/* Wallet buttons */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
        <Link to="/app/transfer" className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-3.5 active:opacity-80">
          <Send className="h-5 w-5 text-brand-glow" />
          <span className="text-[11px] font-medium text-text-2">Wyślij punkty</span>
        </Link>
        <Link to="/app/qr" className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-3.5 active:opacity-80">
          <QrCode className="h-5 w-5 text-teal" />
          <span className="text-[11px] font-medium text-text-2">Mój kod QR</span>
        </Link>
      </div>

      {/* Referral */}
      <div className="mx-4 mt-4">
        <h2 className="font-display mb-2 text-[15px] font-bold">Zaproś znajomego</h2>
        <div className="bg-surface-2 rounded-2xl border border-soft p-4">
          <div className="text-[13px] text-text-2">
            Ty dostaniesz <span className="font-semibold text-brand-glow">+50 pkt</span>, a znajomy{" "}
            <span className="font-semibold text-brand-glow">+100 pkt</span>.
          </div>
          <div className="bg-surface-3 mt-3 flex items-center justify-between rounded-xl px-4 py-3">
            <div className="font-display text-base font-bold tracking-wider text-brand-glow">
              {profile?.referral_code ?? "—"}
            </div>
            <button onClick={copyRef} className="flex items-center gap-1 text-xs text-text-3 active:text-text-1">
              <Copy className="h-3.5 w-3.5" /> Kopiuj
            </button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="mx-4 mt-4">
        <h2 className="font-display mb-2 text-[15px] font-bold">Ustawienia</h2>
        <div className="bg-surface-2 overflow-hidden rounded-2xl border border-soft">
          <Row icon={<Settings className="h-4 w-4 text-brand-glow" />} label="Edytuj profil" />
          {isAdmin && (
            <button onClick={() => navigate({ to: "/admin" })} className="flex w-full items-center gap-3 border-t border-soft px-4 py-3.5 active:bg-surface-3">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <span className="flex-1 text-left text-sm">Panel administratora</span>
              <span className="text-text-3">›</span>
            </button>
          )}
          <button onClick={logout} className="flex w-full items-center gap-3 border-t border-soft px-4 py-3.5 active:bg-surface-3">
            <LogOut className="h-4 w-4 text-pink" />
            <span className="flex-1 text-left text-sm text-pink">Wyloguj</span>
          </button>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface-2 flex flex-col items-center gap-0.5 px-2 py-3.5">
      <div className={`font-display text-xl font-extrabold ${accent ? "text-brand-glow" : "text-text-1"}`}>{value}</div>
      <div className="text-[11px] text-text-2">{label}</div>
    </div>
  );
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-3">
      {icon}
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-text-3">›</span>
    </div>
  );
}
