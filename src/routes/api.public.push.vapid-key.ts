import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/push/vapid-key")({
  server: {
    handlers: {
      GET: async () => {
        const publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
        if (!publicKey) {
          return new Response(
            JSON.stringify({ publicKey: null, error: "VAPID not configured" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify({ publicKey }), {
          headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
        });
      },
    },
  },
});
