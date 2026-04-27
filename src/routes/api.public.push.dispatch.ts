// Sends queued (not-yet-pushed) notifications via Web Push.
// Called periodically by pg_cron. Uses service-role to bypass RLS.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

type NotifRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  data: Record<string, unknown> | null;
};

type SubRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export const Route = createFileRoute("/api/public/push/dispatch")({
  server: {
    handlers: {
      POST: async () => {
        const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
        const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
        const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@kappalk.lovable.app";
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!VAPID_PUBLIC || !VAPID_PRIVATE || !SUPABASE_URL || !SERVICE_KEY) {
          return new Response(
            JSON.stringify({ ok: false, error: "Missing VAPID or Supabase env" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }

        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

        const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // Pull pending notifications (last 24h, not pushed)
        const { data: notifs, error: nErr } = await admin
          .from("notifications")
          .select("id,user_id,type,title,body,link,data")
          .eq("pushed", false)
          .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: true })
          .limit(200);

        if (nErr) {
          return new Response(JSON.stringify({ ok: false, error: nErr.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!notifs || notifs.length === 0) {
          return Response.json({ ok: true, sent: 0, dispatched: 0 });
        }

        // Fetch all subscriptions for affected users
        const userIds = Array.from(new Set(notifs.map((n) => n.user_id)));
        const { data: subs } = await admin
          .from("push_subscriptions")
          .select("id,user_id,endpoint,p256dh,auth")
          .in("user_id", userIds);

        const subsByUser = new Map<string, SubRow[]>();
        for (const s of (subs as SubRow[]) ?? []) {
          if (!subsByUser.has(s.user_id)) subsByUser.set(s.user_id, []);
          subsByUser.get(s.user_id)!.push(s);
        }

        let sent = 0;
        const failedSubIds: string[] = [];
        const pushedNotifIds: string[] = [];

        for (const n of notifs as NotifRow[]) {
          const userSubs = subsByUser.get(n.user_id) ?? [];
          if (userSubs.length === 0) {
            // No subscription — still mark as pushed so we don't keep retrying forever
            pushedNotifIds.push(n.id);
            continue;
          }
          const payload = JSON.stringify({
            title: n.title,
            body: n.body ?? "",
            link: n.link ?? "/app/notifications",
            type: n.type,
            tag: `${n.type}:${n.id}`,
            data: n.data ?? {},
          });

          let anySuccess = false;
          for (const s of userSubs) {
            try {
              await webpush.sendNotification(
                {
                  endpoint: s.endpoint,
                  keys: { p256dh: s.p256dh, auth: s.auth },
                },
                payload,
                { TTL: 60 * 60 * 24 }
              );
              anySuccess = true;
              sent += 1;
            } catch (err: unknown) {
              const status =
                typeof err === "object" && err !== null && "statusCode" in err
                  ? (err as { statusCode?: number }).statusCode
                  : undefined;
              // 404/410 = expired / invalid subscription -> remove
              if (status === 404 || status === 410) {
                failedSubIds.push(s.id);
              } else {
                console.error("push error", status, err);
              }
            }
          }
          // Mark pushed if at least delivered to one device, or if no valid subs left.
          if (anySuccess || userSubs.every((s) => failedSubIds.includes(s.id))) {
            pushedNotifIds.push(n.id);
          }
        }

        if (failedSubIds.length > 0) {
          await admin.from("push_subscriptions").delete().in("id", failedSubIds);
        }
        if (pushedNotifIds.length > 0) {
          await admin.from("notifications").update({ pushed: true }).in("id", pushedNotifIds);
        }

        return Response.json({
          ok: true,
          dispatched: pushedNotifIds.length,
          sent,
          removedSubs: failedSubIds.length,
        });
      },
    },
  },
});
