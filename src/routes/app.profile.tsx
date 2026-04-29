import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { LogOut, Settings, ShieldCheck, Send, QrCode, Copy, Bell, CreditCard, Lock, Star, Clock, Users, Activity, Zap, Trophy, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { StatusBar, SectionHeader } from "@/components/phone-shell";
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
        <Stat label="Banany 🍌" value={formatPts(profile?.points ?? 0)} accent />
        <Stat label="Poziom" value={String(profile?.level ?? 1)} />
        <Stat label="Streak" value={String(profile?.streak_days ?? 0)} />
      </div>

      {/* Wallet card */}
      <SectionHeader title="Portfel KAPP" />
      <div className="mx-4">
        <div
          className="relative overflow-hidden rounded-2xl border border-primary/30 p-5"
          style={{ background: "linear-gradient(135deg, oklch(0.22 0.12 285), oklch(0.27 0.14 285), oklch(0.16 0.1 285))" }}
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,oklch(0.66_0.18_285/0.3),transparent)]" />
          <div className="font-display relative text-base font-extrabold text-white/90">KAPP</div>
          <div className="font-display relative mt-3 text-[34px] font-extrabold leading-none tracking-tight text-white">
            {formatPts(profile?.points ?? 0)} <span className="text-sm font-normal text-white/50">🍌</span>
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
          <span className="text-[11px] font-medium text-text-2">Wyślij banany</span>
        </Link>
        <Link to="/app/qr" className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-3.5 active:opacity-80">
          <QrCode className="h-5 w-5 text-teal" />
          <span className="text-[11px] font-medium text-text-2">Mój kod QR</span>
        </Link>
      </div>

      {/* Społeczność */}
      <SectionHeader title="Społeczność" />
      <div className="mx-4 grid grid-cols-3 gap-2">
        <Link to="/app/challenges" className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-3.5 active:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
            <Trophy className="h-5 w-5 text-gold" />
          </div>
          <span className="text-[11px] font-medium text-text-2">Wyzwania</span>
        </Link>
        <Link to="/app/groups" className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-3.5 active:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15">
            <Users className="h-5 w-5 text-teal" />
          </div>
          <span className="text-[11px] font-medium text-text-2">Grupy</span>
        </Link>
        <Link to="/app/board" className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-3.5 active:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink/15">
            <Megaphone className="h-5 w-5 text-pink" />
          </div>
          <span className="text-[11px] font-medium text-text-2">Ogłoszenia</span>
        </Link>
      </div>

      {/* Referral */}
      <SectionHeader title="Zaproś znajomego" />
      <div className="bg-surface-2 mx-4 rounded-2xl border border-soft p-4">
        <div className="text-[13px] text-text-2">
          Ty dostajesz <span className="font-semibold text-brand-glow">+50 🍌</span>, znajomy{" "}
          <span className="font-semibold text-brand-glow">+100 🍌</span>.
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

      {/* Badges */}
      <SectionHeader title="Odznaki" />
      <div className="mx-4 flex flex-wrap gap-2">
        <Badge icon={Star} color="var(--brand-glow)" label="Speaker" />
        <Badge icon={Clock} color="var(--gold)" label="Early Bird" />
        <Badge icon={Users} color="var(--teal)" label="Konektor" />
        <Badge icon={Activity} color="var(--green)" label="Active Week" />
        <Badge icon={Zap} color="var(--gold)" label="7-day Streak" />
      </div>

      {/* Settings */}
      <SectionHeader title="Ustawienia" />
      <div className="bg-surface-2 mx-4 overflow-hidden rounded-2xl border border-soft">
        <Row icon={<Settings className="h-4 w-4 text-brand-glow" />} label="Edytuj profil" />
        <Row icon={<Bell className="h-4 w-4 text-teal" />} label="Powiadomienia" border />
        <Row icon={<CreditCard className="h-4 w-4 text-gold" />} label="Apple Wallet" border />
        <Row icon={<Lock className="h-4 w-4 text-green" />} label="Prywatność" border />
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

function Badge({ icon: Icon, color, label }: { icon: typeof Star; color: string; label: string }) {
  return (
    <div className="bg-surface-2 flex items-center gap-1.5 rounded-full border border-soft px-3 py-1.5">
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      <span className="text-[12px] text-text-1">{label}</span>
    </div>
  );
}

function Row({ icon, label, border }: { icon: React.ReactNode; label: string; border?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 active:bg-surface-3 ${border ? "border-t border-soft" : ""}`}>
      {icon}
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-text-3">›</span>
    </div>
  );
}
