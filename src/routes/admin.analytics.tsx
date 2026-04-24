import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, PageHeader } from "@/components/phone-shell";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analityki — KAPP Admin" }] }),
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const months = [80, 75, 85, 78, 90, 88, 100];
  const labels = ["Wrz", "Paź", "Lis", "Gru", "Sty", "Lut", "Mar"];

  return (
    <div className="animate-fade-in">
      <StatusBar />
      <PageHeader title="Analityki" subtitle="Semestr letni 2024/25" />

      <div className="mx-4 space-y-2">
        <Met v="94.2%" l="Retencja studentów" chg="↑ +4.2%" up />
        <Met v="68%" l="Wskaźnik zaangażowania" chg="↑ +23%" up />
        <Met v="3.4×" l="Aktywności / student / tydz." chg="↑ +1.1×" up />
        <Met v="23" l="Zagrożeni odejściem" chg="⚠ wymaga uwagi" />
      </div>

      <h2 className="font-display px-6 pt-5 pb-2 text-[15px] font-bold">ROI platformy</h2>
      <div className="mx-4 rounded-2xl border border-green/20 bg-[linear-gradient(135deg,oklch(0.78_0.18_150/0.06),oklch(0.78_0.13_195/0.04))] p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-text-2">Koszt KAPP / rok</div>
            <div className="font-display text-lg font-bold">60 000 PLN</div>
          </div>
          <div>
            <div className="text-[11px] text-text-2">Wartość retencji</div>
            <div className="font-display text-lg font-bold text-green">+840 000 PLN</div>
          </div>
        </div>
        <div className="mt-3 border-t border-green/15 pt-3">
          <div className="text-[11px] text-text-2">Zwrot z inwestycji</div>
          <div className="font-display text-[38px] font-extrabold tracking-tight text-green">14× ROI</div>
          <div className="text-[12px] text-text-2">
            Każda złotówka inwestowana w KAPP zwraca 14 zł w zatrzymanych studentach
          </div>
        </div>
      </div>

      <h2 className="font-display px-6 pt-5 pb-2 text-[15px] font-bold">Retencja miesięczna</h2>
      <div className="bg-surface-2 mx-4 rounded-2xl border border-soft p-4">
        <div className="flex h-16 items-end gap-1">
          {months.map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{
              height: `${h}%`,
              background: i === months.length - 1 ? "var(--green)" : "oklch(0.78 0.18 150 / 0.25)",
            }} />
          ))}
        </div>
        <div className="mt-2 flex gap-1 text-center text-[9px] text-text-3">
          {labels.map((l, i) => <div key={l} className="flex-1" style={{ color: i === labels.length - 1 ? "var(--green)" : "var(--text-3)" }}>{l}</div>)}
        </div>
      </div>
      <div className="h-6" />
    </div>
  );
}

function Met({ v, l, chg, up }: { v: string; l: string; chg: string; up?: boolean }) {
  return (
    <div className="bg-surface-2 flex items-center justify-between rounded-2xl border border-soft p-3.5">
      <div>
        <div className="font-display text-xl font-extrabold">{v}</div>
        <div className="text-[12px] text-text-2">{l}</div>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${up ? "bg-green/15 text-green" : "bg-pink/15 text-pink"}`}>
        {chg}
      </span>
    </div>
  );
}
