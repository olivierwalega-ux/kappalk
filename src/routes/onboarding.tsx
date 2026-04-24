import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Witaj w KAPP" }],
  }),
  component: Onboarding,
});

const slides = [
  {
    icon: Calendar,
    accent: "oklch(0.66 0.18 285)",
    bg: "rgba(123,110,246,.1)",
    title: "Twój kampus, ożywiony",
    body: "KAPP zbiera wszystkie aktywności studenckie w jednym miejscu — od zajęć po eventy.",
  },
  {
    icon: Trophy,
    accent: "oklch(0.85 0.16 90)",
    bg: "rgba(245,200,66,.08)",
    title: "Punkty za każdą aktywność",
    body: "Skanuj QR, bądź aktywny i wymieniaj punkty na nagrody od partnerów uczelni.",
  },
  {
    icon: Users,
    accent: "oklch(0.78 0.13 195)",
    bg: "rgba(62,198,198,.08)",
    title: "Połącz się ze społecznością",
    body: "Wysyłaj punkty, rywalizuj w rankingu i odkrywaj koła zainteresowań.",
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const total = slides.length;
  const slide = slides[step];

  const finish = () => {
    if (typeof window !== "undefined") localStorage.setItem("kapp_onboarded", "1");
    navigate({ to: "/login" });
  };

  const next = () => (step < total - 1 ? setStep(step + 1) : finish());

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-7 pt-16 pb-8">
      <div className="flex flex-1 flex-col items-center gap-5 animate-fade-in">
        <div
          className="animate-float-y flex h-44 w-44 items-center justify-center rounded-[36px]"
          style={{ background: slide.bg }}
          key={step}
        >
          <slide.icon className="h-20 w-20" style={{ color: slide.accent }} strokeWidth={1.4} />
        </div>
        <h1 className="text-center font-display text-[27px] font-extrabold leading-tight tracking-tight text-text-1">
          {slide.title}
        </h1>
        <p className="max-w-[280px] text-center text-sm leading-relaxed text-text-2">{slide.body}</p>
        <div className="mt-2 flex gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-5 bg-primary" : "w-1.5 bg-white/15",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto flex w-full flex-col gap-2">
        <button
          onClick={next}
          className="bg-gradient-brand shadow-glow w-full rounded-2xl py-5 font-display text-base font-bold text-white active:scale-[0.97]"
        >
          {step < total - 1 ? "Dalej" : "Zacznij"}
        </button>
        {step < total - 1 && (
          <button onClick={finish} className="py-3 text-[13px] text-text-3">
            Pomiń
          </button>
        )}
      </div>
    </div>
  );
}
