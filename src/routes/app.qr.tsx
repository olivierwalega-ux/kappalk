import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, QrCode } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { StatusBar, PageHeader, SectionHeader } from "@/components/phone-shell";
import { formatPts } from "@/lib/format";

export const Route = createFileRoute("/app/qr")({
  head: () => ({ meta: [{ title: "Mój kod QR — KAPP" }] }),
  component: QrPage,
});

function QrPage() {
  const { profile } = useAuth();
  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Skaner QR" subtitle="Zeskanuj kod by zdobyć punkty" />

      <div className="flex flex-col items-center px-6 pt-2">
        <div className="bg-surface-2 relative h-60 w-60 overflow-hidden rounded-3xl border-2 border-primary/30">
          <div className="absolute left-3 top-3 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-primary" />
          <div className="absolute right-3 top-3 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-primary" />
          <div className="absolute left-3 bottom-3 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-primary" />
          <div className="absolute right-3 bottom-3 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-primary" />
          <div className="animate-scan absolute left-[13%] right-[13%] h-0.5 bg-gradient-to-r from-transparent via-brand-glow to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <QrCode className="h-12 w-12 text-primary/30" />
          </div>
        </div>
        <p className="mt-3 text-[12px] text-text-3">Aparat dostępny w wersji mobilnej</p>
      </div>

      <div className="bg-surface-2 mx-4 mt-5 flex items-center gap-4 rounded-2xl border border-soft p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white">
          <svg width="56" height="56" viewBox="0 0 21 21">
            <rect width="21" height="21" fill="white" />
            <rect x="1" y="1" width="7" height="7" fill="none" stroke="#000" strokeWidth="1" />
            <rect x="2.5" y="2.5" width="4" height="4" fill="#000" />
            <rect x="13" y="1" width="7" height="7" fill="none" stroke="#000" strokeWidth="1" />
            <rect x="14.5" y="2.5" width="4" height="4" fill="#000" />
            <rect x="1" y="13" width="7" height="7" fill="none" stroke="#000" strokeWidth="1" />
            <rect x="2.5" y="14.5" width="4" height="4" fill="#000" />
            <rect x="9" y="9" width="2" height="4" fill="#000" />
            <rect x="13" y="12" width="4" height="2" fill="#000" />
          </svg>
        </div>
        <div>
          <div className="font-display text-base font-bold">
            {profile?.first_name} {profile?.last_name}
          </div>
          <div className="text-[12px] text-text-2">{profile?.student_id} · Koźmiński</div>
          <div className="font-display mt-1 text-lg font-bold text-brand-glow">
            {formatPts(profile?.points ?? 0)} pkt
          </div>
        </div>
      </div>

      <SectionHeader title="Apple Wallet" />
      <div className="mx-4 grid grid-cols-2 gap-2">
        <button className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-4 active:border-primary">
          <CreditCard className="h-6 w-6 text-brand-glow" />
          <span className="text-center text-[11px] font-medium text-text-2">Karta studenta<br />w Wallet</span>
        </button>
        <button className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-4 active:border-primary">
          <QrCode className="h-6 w-6 text-gold" />
          <span className="text-center text-[11px] font-medium text-text-2">QR do transferu<br />w Wallet</span>
        </button>
      </div>
      <div className="h-6" />
    </div>
  );
}
