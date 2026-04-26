import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Camera, CheckCircle2, CreditCard, QrCode, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { StatusBar, PageHeader, SectionHeader } from "@/components/phone-shell";
import { formatPts } from "@/lib/format";
import { QrScanner } from "@/components/qr-scanner";

export const Route = createFileRoute("/app/qr")({
  head: () => ({ meta: [{ title: "Skaner QR — KAPP" }] }),
  component: QrPage,
});

type ClaimResult = { success: true; points: number; title: string };

function QrPage() {
  const { profile, refreshProfile } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<ClaimResult | null>(null);

  const walletInfo = () => toast.info("Dodawanie do Apple Wallet dostępne w wersji mobilnej iOS");

  // Accepts raw UUID, "kapp:event:<uuid>" or any URL containing a uuid
  const extractEventId = (text: string): string | null => {
    const uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const m = text.match(uuidRe);
    return m ? m[0] : null;
  };

  const handleResult = useCallback(
    async (text: string) => {
      if (busy) return;
      const eventId = extractEventId(text);
      if (!eventId) {
        toast.error("Nieprawidłowy kod QR");
        return;
      }
      setBusy(true);
      const { data, error } = await supabase.rpc("claim_event", { _event_id: eventId });
      setBusy(false);

      if (error) {
        toast.error(error.message || "Nie udało się odebrać punktów");
        // re-arm after a moment so user can try a different code
        setTimeout(() => {
          // QrScanner internally guards single-fire; we re-render to reset
        }, 1000);
        return;
      }

      const result = data as unknown as ClaimResult;
      setSuccess(result);
      setScanning(false);
      await refreshProfile();
    },
    [busy, refreshProfile],
  );

  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Skaner QR" subtitle="Zeskanuj kod by zdobyć punkty" />

      <div className="flex flex-col items-center px-6 pt-2">
        <div className="bg-surface-2 relative h-64 w-64 overflow-hidden rounded-3xl border-2 border-primary/30">
          {scanning ? (
            <>
              <QrScanner
                onResult={handleResult}
                onError={(m) => {
                  toast.error(m);
                  setScanning(false);
                }}
                paused={busy || !!success}
              />
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-3 top-3 h-6 w-6 rounded-tl-md border-l-2 border-t-2 border-brand-glow" />
                <div className="absolute right-3 top-3 h-6 w-6 rounded-tr-md border-r-2 border-t-2 border-brand-glow" />
                <div className="absolute left-3 bottom-3 h-6 w-6 rounded-bl-md border-b-2 border-l-2 border-brand-glow" />
                <div className="absolute right-3 bottom-3 h-6 w-6 rounded-br-md border-b-2 border-r-2 border-brand-glow" />
                <div className="animate-scan absolute left-[13%] right-[13%] h-0.5 bg-gradient-to-r from-transparent via-brand-glow to-transparent" />
              </div>
              <button
                onClick={() => setScanning(false)}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
                aria-label="Zamknij skaner"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="absolute left-3 top-3 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-primary" />
              <div className="absolute right-3 top-3 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-primary" />
              <div className="absolute left-3 bottom-3 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-primary" />
              <div className="absolute right-3 bottom-3 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <QrCode className="h-12 w-12 text-primary/30" />
              </div>
            </>
          )}
        </div>

        {!scanning && (
          <button
            onClick={() => setScanning(true)}
            className="bg-gradient-brand shadow-glow font-display mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white active:scale-[0.98]"
          >
            <Camera className="h-4 w-4" /> Włącz skaner
          </button>
        )}
        {scanning && (
          <p className="mt-3 text-[12px] text-text-3">
            {busy ? "Sprawdzanie kodu…" : "Skieruj kamerę na kod QR eventu"}
          </p>
        )}
      </div>

      {/* Wallet card */}
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
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-bold">
            {profile?.first_name} {profile?.last_name}
          </div>
          <div className="text-[12px] text-text-2">{profile?.student_id} · Koźmiński</div>
          <div className="font-display mt-1 text-lg font-bold text-brand-glow">
            {formatPts(profile?.points ?? 0)} pkt
          </div>
        </div>
      </div>

      <Link
        to="/app/transfer"
        className="bg-surface-2 font-display mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-2xl border border-soft py-3.5 text-sm font-bold active:scale-[0.98]"
      >
        <Send className="h-4 w-4 text-teal" /> Wyślij punkty znajomemu
      </Link>

      <SectionHeader title="Apple Wallet" />
      <div className="mx-4 grid grid-cols-2 gap-2">
        <button onClick={walletInfo} className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-4 active:border-primary">
          <CreditCard className="h-6 w-6 text-brand-glow" />
          <span className="text-center text-[11px] font-medium text-text-2">Karta studenta<br />w Wallet</span>
        </button>
        <button onClick={walletInfo} className="bg-surface-2 flex flex-col items-center gap-2 rounded-2xl border border-soft p-4 active:border-primary">
          <QrCode className="h-6 w-6 text-gold" />
          <span className="text-center text-[11px] font-medium text-text-2">QR do transferu<br />w Wallet</span>
        </button>
      </div>
      <div className="h-6" />

      {/* Success modal */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
          <div className="bg-surface-2 animate-fade-in mx-4 mb-4 w-full max-w-md rounded-3xl border border-soft p-6 sm:mb-0">
            <div className="flex flex-col items-center text-center">
              <div className="bg-gradient-success flex h-16 w-16 items-center justify-center rounded-full">
                <CheckCircle2 className="h-9 w-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="font-display mt-4 text-xl font-extrabold">Brawo!</div>
              <div className="mt-1 text-sm text-text-2">{success.title}</div>
              <div className="font-display mt-3 text-[42px] font-extrabold leading-none text-brand-glow">
                +{success.points} <span className="text-base font-normal text-text-2">pkt</span>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="bg-gradient-brand shadow-glow font-display mt-5 w-full rounded-2xl py-3.5 text-sm font-bold text-white active:scale-[0.98]"
              >
                Super!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
