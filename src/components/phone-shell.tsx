import type { ReactNode } from "react";

/** Mobile-first phone container — full screen on mobile, centered card on desktop */
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-background">
        {children}
      </div>
    </div>
  );
}

export function StatusBar() {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between bg-gradient-to-b from-background via-background/80 to-transparent px-6 pt-12 pb-1">
      <span className="font-display text-sm font-semibold text-text-1">9:41</span>
      <div className="flex items-center gap-1.5 opacity-70">
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor" className="text-text-1">
          <rect x="0" y="3" width="2.5" height="8" rx="1.2" />
          <rect x="4" y="2" width="2.5" height="9" rx="1.2" />
          <rect x="8" y="0" width="2.5" height="11" rx="1.2" />
          <rect x="12" y="1" width="2.5" height="9" rx="1.2" opacity=".4" />
        </svg>
        <svg width="23" height="11" viewBox="0 0 26 13" fill="none" className="text-text-1">
          <rect x=".5" y=".5" width="22" height="12" rx="3" stroke="currentColor" opacity=".4" />
          <rect x="23" y="3.5" width="2.5" height="6" rx="1.2" fill="currentColor" opacity=".4" />
          <rect x="2" y="2" width="16" height="9" rx="2" fill="currentColor" opacity=".75" />
        </svg>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between px-6 pt-2 pb-1">
      <div className="flex-1">
        <h1 className="font-display text-[27px] font-extrabold leading-tight tracking-tight text-text-1">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-text-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 pt-5 pb-2.5">
      <h2 className="font-display text-[15px] font-bold text-text-1">{title}</h2>
      {action && <div className="text-xs font-medium text-brand-glow">{action}</div>}
    </div>
  );
}
