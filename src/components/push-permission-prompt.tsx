import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { enablePush, pushSupported, pushPermissionState, PUSH_PERM_KEY } from "@/lib/push";

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    const state = pushPermissionState();
    if (state !== "default") return; // already granted/denied
    const dismissed = localStorage.getItem(PUSH_PERM_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 1000 * 60 * 60 * 24 * 3) return; // 3 days
    const t = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const onAllow = async () => {
    setShow(false);
    const res = await enablePush();
    if (res.ok) {
      toast.success("Powiadomienia push włączone 🔔");
    } else if (res.reason === "no-vapid") {
      toast.error("Push jeszcze niedostępny — administrator nie skonfigurował kluczy VAPID");
    } else if (res.reason === "denied") {
      toast.error("Brak zgody na powiadomienia");
    } else if (res.reason === "unsupported") {
      toast.error("Twoja przeglądarka nie wspiera push");
    } else {
      toast.error("Nie udało się włączyć powiadomień");
    }
  };

  const onDismiss = () => {
    localStorage.setItem(PUSH_PERM_KEY, String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-[88px] z-40 mx-auto flex max-w-md justify-center px-3">
      <div className="bg-surface-1 flex w-full items-center gap-3 rounded-2xl border border-primary/30 p-3 shadow-glow animate-fade-in">
        <div className="bg-gradient-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Bell className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text-1">Włącz powiadomienia</div>
          <div className="text-[11px] text-text-2">Transfery, eventy i streak — bądź na bieżąco.</div>
        </div>
        <button
          onClick={onAllow}
          className="bg-gradient-brand rounded-xl px-3 py-2 font-display text-xs font-bold text-white"
        >
          Włącz
        </button>
        <button onClick={onDismiss} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-3 active:opacity-50">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
