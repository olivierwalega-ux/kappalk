import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-extrabold text-text-1">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-text-1">Nie znaleziono</h2>
        <p className="mt-2 text-sm text-text-2">Ta strona nie istnieje.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Wróć do startu
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" },
      { name: "theme-color", content: "#070711" },
      { title: "KAPP" },
      { name: "description", content: "KAPP — banany 🍌, eventy i studencka społeczność ALK w jednej apce." },
      { property: "og:title", content: "KAPP" },
      { property: "og:description", content: "KAPP — banany 🍌, eventy i studencka społeczność ALK w jednej apce." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "KAPP" },
      { name: "twitter:description", content: "KAPP — banany 🍌, eventy i studencka społeczność ALK w jednej apce." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/22e23dcf-8791-4965-86a8-454e6be292fa/id-preview-5740ebd5--61919a94-b351-48a4-9c02-e69a2d5ada2d.lovable.app-1777021897824.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/22e23dcf-8791-4965-86a8-454e6be292fa/id-preview-5740ebd5--61919a94-b351-48a4-9c02-e69a2d5ada2d.lovable.app-1777021897824.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster theme="dark" position="top-center" />
    </AuthProvider>
  );
}
