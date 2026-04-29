import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Witaj w KAPP" }] }),
  component: Onboarding,
});

const slides = [
  {
    title: "Bądź aktywny na kampusie 🎓",
    body: "Uczestnicz w eventach, zajęciach i spotkaniach kół zainteresowań.",
    Illustration: CampusIllustration,
  },
  {
    title: "Zdobywaj banany za każdą aktywność 🍌",
    body: "Skanuj kod QR przy wejściu na event.",
    Illustration: ScanIllustration,
  },
  {
    title: "Wymieniaj banany na nagrody 🎁",
    body: "Kawa, bilety i zniżki u partnerów uczelni.",
    Illustration: RewardsIllustration,
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const total = slides.length;
  const slide = slides[step];
  const Illustration = slide.Illustration;
  const isLast = step === total - 1;

  const finish = () => {
    if (typeof window !== "undefined") localStorage.setItem("kapp_onboarded", "1");
    navigate({ to: "/login" });
  };

  const next = () => (isLast ? finish() : setStep(step + 1));

  return (
    <div className="flex min-h-screen flex-col bg-background px-7 pt-12 pb-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-10 animate-fade-in" key={step}>
        <Illustration />
        <div className="flex flex-col items-center gap-4">
          <h1 className="max-w-[300px] text-center font-display text-[32px] font-extrabold leading-[1.1] tracking-tight text-text-1">
            {slide.title}
          </h1>
          <p className="max-w-[300px] text-center text-[15px] leading-relaxed text-text-3">
            {slide.body}
          </p>
        </div>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-primary" : "w-1.5 bg-white/15",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-10 flex w-full flex-col gap-2">
        <button
          onClick={next}
          className="bg-gradient-brand shadow-glow w-full rounded-2xl py-5 font-display text-base font-bold text-white active:scale-[0.97]"
        >
          {isLast ? "Zaczynamy →" : "Dalej"}
        </button>
        {!isLast && (
          <button onClick={finish} className="py-3 text-[13px] text-text-3">
            Pomiń
          </button>
        )}
      </div>
    </div>
  );
}

/* ──────────────── Illustrations (SVG) ──────────────── */

function CampusIllustration() {
  return (
    <svg width="220" height="200" viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.66 0.18 285)" stopOpacity="0.9" />
          <stop offset="1" stopColor="oklch(0.4 0.16 285)" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.78 0.13 195)" stopOpacity="0.25" />
          <stop offset="1" stopColor="oklch(0.78 0.13 195)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="180" rx="100" ry="14" fill="url(#ground)" />
      {/* Main building */}
      <rect x="60" y="60" width="100" height="110" rx="8" fill="url(#bld)" />
      <polygon points="55,60 110,30 165,60" fill="oklch(0.85 0.16 90)" />
      {/* Columns */}
      <rect x="74" y="100" width="8" height="60" rx="2" fill="oklch(0.95 0.02 285)" opacity="0.9" />
      <rect x="94" y="100" width="8" height="60" rx="2" fill="oklch(0.95 0.02 285)" opacity="0.9" />
      <rect x="118" y="100" width="8" height="60" rx="2" fill="oklch(0.95 0.02 285)" opacity="0.9" />
      <rect x="138" y="100" width="8" height="60" rx="2" fill="oklch(0.95 0.02 285)" opacity="0.9" />
      {/* Door */}
      <rect x="100" y="140" width="20" height="30" rx="3" fill="oklch(0.2 0.05 285)" />
      {/* Windows on roof */}
      <circle cx="110" cy="55" r="5" fill="oklch(0.2 0.05 285)" />
      {/* Graduation cap floating */}
      <g transform="translate(155 25)">
        <polygon points="0,10 22,0 44,10 22,20" fill="oklch(0.2 0.05 285)" />
        <rect x="18" y="14" width="8" height="14" rx="1" fill="oklch(0.2 0.05 285)" />
        <circle cx="40" cy="14" r="2.5" fill="oklch(0.85 0.16 90)" />
      </g>
      {/* Stars */}
      <circle cx="30" cy="40" r="2" fill="oklch(0.85 0.16 90)" />
      <circle cx="195" cy="80" r="2" fill="oklch(0.78 0.13 195)" />
      <circle cx="20" cy="120" r="2" fill="oklch(0.66 0.18 285)" />
    </svg>
  );
}

function ScanIllustration() {
  return (
    <svg width="220" height="200" viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="phone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.3 0.08 285)" />
          <stop offset="1" stopColor="oklch(0.18 0.06 285)" />
        </linearGradient>
        <linearGradient id="scan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="oklch(0.66 0.18 285)" stopOpacity="0" />
          <stop offset="0.5" stopColor="oklch(0.66 0.18 285)" stopOpacity="1" />
          <stop offset="1" stopColor="oklch(0.66 0.18 285)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Phone */}
      <rect x="60" y="20" width="100" height="160" rx="16" fill="url(#phone)" stroke="oklch(0.66 0.18 285)" strokeOpacity="0.4" strokeWidth="2" />
      <rect x="68" y="34" width="84" height="132" rx="6" fill="oklch(0.1 0.03 285)" />
      {/* QR code */}
      <g transform="translate(82 56)">
        <rect width="56" height="56" fill="white" rx="2" />
        <rect x="4" y="4" width="14" height="14" fill="black" />
        <rect x="7" y="7" width="8" height="8" fill="white" />
        <rect x="10" y="10" width="2" height="2" fill="black" />
        <rect x="38" y="4" width="14" height="14" fill="black" />
        <rect x="41" y="7" width="8" height="8" fill="white" />
        <rect x="44" y="10" width="2" height="2" fill="black" />
        <rect x="4" y="38" width="14" height="14" fill="black" />
        <rect x="7" y="41" width="8" height="8" fill="white" />
        <rect x="10" y="44" width="2" height="2" fill="black" />
        <rect x="22" y="6" width="3" height="3" fill="black" />
        <rect x="28" y="6" width="3" height="3" fill="black" />
        <rect x="22" y="12" width="3" height="3" fill="black" />
        <rect x="28" y="20" width="3" height="3" fill="black" />
        <rect x="22" y="28" width="3" height="3" fill="black" />
        <rect x="34" y="22" width="3" height="3" fill="black" />
        <rect x="40" y="28" width="3" height="3" fill="black" />
        <rect x="22" y="38" width="3" height="3" fill="black" />
        <rect x="28" y="42" width="3" height="3" fill="black" />
        <rect x="34" y="40" width="3" height="3" fill="black" />
        <rect x="40" y="46" width="3" height="3" fill="black" />
        <rect x="46" y="36" width="3" height="3" fill="black" />
      </g>
      {/* Scan line */}
      <rect x="80" y="84" width="60" height="2" fill="url(#scan)" />
      {/* Corner brackets */}
      <path d="M76 56 L76 50 L82 50" stroke="oklch(0.85 0.16 90)" strokeWidth="2" fill="none" />
      <path d="M138 50 L144 50 L144 56" stroke="oklch(0.85 0.16 90)" strokeWidth="2" fill="none" />
      <path d="M76 112 L76 118 L82 118" stroke="oklch(0.85 0.16 90)" strokeWidth="2" fill="none" />
      <path d="M138 118 L144 118 L144 112" stroke="oklch(0.85 0.16 90)" strokeWidth="2" fill="none" />
      {/* Banana floating */}
      <text x="160" y="150" fontSize="36" textAnchor="middle">🍌</text>
      <text x="40" y="60" fontSize="22" textAnchor="middle" opacity="0.6">🍌</text>
      <text x="180" y="50" fontSize="18" textAnchor="middle" opacity="0.5">🍌</text>
    </svg>
  );
}

function RewardsIllustration() {
  return (
    <svg width="220" height="200" viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="box" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.78 0.13 195)" />
          <stop offset="1" stopColor="oklch(0.5 0.13 195)" />
        </linearGradient>
        <linearGradient id="lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.85 0.16 90)" />
          <stop offset="1" stopColor="oklch(0.6 0.16 90)" />
        </linearGradient>
      </defs>
      {/* Gift box body */}
      <rect x="60" y="90" width="100" height="80" rx="6" fill="url(#box)" />
      {/* Gift box lid */}
      <rect x="54" y="76" width="112" height="22" rx="4" fill="url(#lid)" />
      {/* Vertical ribbon */}
      <rect x="104" y="76" width="12" height="94" fill="oklch(0.66 0.18 285)" />
      {/* Bow */}
      <ellipse cx="98" cy="68" rx="14" ry="10" fill="oklch(0.66 0.18 285)" />
      <ellipse cx="122" cy="68" rx="14" ry="10" fill="oklch(0.66 0.18 285)" />
      <circle cx="110" cy="68" r="6" fill="oklch(0.5 0.18 285)" />
      {/* Floating items: coffee cup */}
      <g transform="translate(20 30)">
        <rect x="0" y="6" width="22" height="26" rx="3" fill="oklch(0.95 0.02 285)" />
        <path d="M22 12 Q30 14 30 20 Q30 26 22 26" stroke="oklch(0.95 0.02 285)" strokeWidth="2" fill="none" />
        <rect x="2" y="6" width="18" height="3" fill="oklch(0.6 0.12 30)" />
        <path d="M6 0 Q8 3 6 6" stroke="oklch(0.95 0.02 285)" strokeOpacity="0.5" strokeWidth="1.5" fill="none" />
        <path d="M12 0 Q14 3 12 6" stroke="oklch(0.95 0.02 285)" strokeOpacity="0.5" strokeWidth="1.5" fill="none" />
      </g>
      {/* Floating ticket */}
      <g transform="translate(170 40) rotate(15)">
        <rect width="36" height="22" rx="3" fill="oklch(0.85 0.16 90)" />
        <circle cx="0" cy="11" r="3" fill="oklch(0.1 0.03 285)" />
        <circle cx="36" cy="11" r="3" fill="oklch(0.1 0.03 285)" />
        <rect x="6" y="9" width="24" height="2" fill="oklch(0.2 0.05 285)" opacity="0.5" />
      </g>
      {/* Sparkles */}
      <text x="40" y="100" fontSize="16">✨</text>
      <text x="180" y="120" fontSize="16">✨</text>
      <text x="190" y="170" fontSize="14">🍌</text>
    </svg>
  );
}
