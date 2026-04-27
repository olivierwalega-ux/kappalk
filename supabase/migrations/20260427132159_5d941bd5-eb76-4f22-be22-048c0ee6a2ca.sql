-- ===== 1. NOTIFICATIONS TABLE =====
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'transfer_received' | 'event_starting' | 'streak_warning' | 'rank_up'
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  pushed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_unpushed
  ON public.notifications(user_id) WHERE pushed = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notif_select_own ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY notif_update_own ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY notif_select_admin ON public.notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ===== 2. PUSH SUBSCRIPTIONS =====
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY push_select_own ON public.push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY push_insert_own ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY push_update_own ON public.push_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY push_delete_own ON public.push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== 3. RANK SNAPSHOTS =====
CREATE TABLE IF NOT EXISTS public.user_rank_snapshots (
  user_id UUID PRIMARY KEY,
  was_top10 BOOLEAN NOT NULL DEFAULT false,
  last_rank INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_rank_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY rank_select_own ON public.user_rank_snapshots
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ===== 4. NOTIFICATION HELPER =====
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _body TEXT DEFAULT NULL,
  _link TEXT DEFAULT NULL,
  _data JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (_user_id, _type, _title, _body, _link, _data)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- ===== 5. TRANSFER NOTIFICATION (on transfer_in) =====
CREATE OR REPLACE FUNCTION public.tg_notify_on_transfer_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender_name TEXT;
BEGIN
  IF NEW.type = 'transfer_in' AND NEW.related_user_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''), email)
      INTO _sender_name
    FROM public.profiles WHERE id = NEW.related_user_id;

    PERFORM public.create_notification(
      NEW.user_id,
      'transfer_received',
      _sender_name || ' wysłał Ci punkty 💸',
      '+' || NEW.amount || ' pkt' || COALESCE(' • ' || NEW.description, ''),
      '/app',
      jsonb_build_object('amount', NEW.amount, 'from', NEW.related_user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_transfer_in ON public.transactions;
CREATE TRIGGER notify_on_transfer_in
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_transfer_in();

-- ===== 6. RANK CHECK (after profile points update) =====
CREATE OR REPLACE FUNCTION public.check_rank_top10(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rank INTEGER;
  _was BOOLEAN;
  _points INTEGER;
BEGIN
  -- compute current rank (only among students with role)
  SELECT rnk, points INTO _rank, _points
  FROM (
    SELECT p.id, p.points,
           ROW_NUMBER() OVER (ORDER BY p.points DESC, p.created_at ASC) AS rnk
    FROM public.profiles p
  ) t
  WHERE t.id = _user_id;

  IF _rank IS NULL THEN RETURN; END IF;

  SELECT was_top10 INTO _was FROM public.user_rank_snapshots WHERE user_id = _user_id;

  -- entering top 10
  IF _rank <= 10 AND COALESCE(_was, false) = false THEN
    PERFORM public.create_notification(
      _user_id,
      'rank_up',
      'Wskoczyłeś do TOP 10! 🏆',
      'Jesteś teraz na #' || _rank || ' miejscu w rankingu uczelni.',
      '/app/discover',
      jsonb_build_object('rank', _rank, 'points', _points)
    );
  END IF;

  INSERT INTO public.user_rank_snapshots (user_id, was_top10, last_rank, updated_at)
  VALUES (_user_id, _rank <= 10, _rank, now())
  ON CONFLICT (user_id) DO UPDATE
    SET was_top10 = EXCLUDED.was_top10,
        last_rank = EXCLUDED.last_rank,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_check_rank_after_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.points IS DISTINCT FROM OLD.points THEN
    PERFORM public.check_rank_top10(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_rank_after_points ON public.profiles;
CREATE TRIGGER check_rank_after_points
AFTER UPDATE OF points ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_check_rank_after_points();

-- ===== 7. STREAK WARNING JOB (called by cron daily) =====
CREATE OR REPLACE FUNCTION public.notify_streak_at_risk()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today DATE := (now() AT TIME ZONE 'Europe/Warsaw')::DATE;
  _count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, streak_days
    FROM public.profiles
    WHERE streak_days > 0
      AND (last_active_date IS NULL OR last_active_date < _today)
  LOOP
    PERFORM public.create_notification(
      r.id,
      'streak_warning',
      'Twoja seria jest zagrożona! 🔥',
      'Zachowaj ' || r.streak_days || '-dniową serię — wykonaj dowolną aktywność dziś przed północą.',
      '/app',
      jsonb_build_object('streak', r.streak_days)
    );
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END;
$$;

-- ===== 8. EVENT STARTING SOON JOB =====
CREATE OR REPLACE FUNCTION public.notify_events_starting_soon()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INTEGER := 0;
  r RECORD;
BEGIN
  -- For each event starting within next 60 min and active, notify everyone who scanned it (registered)
  -- Also dedupe: skip if a notification already created for this user+event in last 6h
  FOR r IN
    SELECT e.id AS event_id, e.title, e.starts_at, e.location, ue.user_id
    FROM public.events e
    JOIN public.user_events ue ON ue.event_id = e.id
    WHERE e.is_active = true
      AND e.starts_at IS NOT NULL
      AND e.starts_at BETWEEN now() AND now() + INTERVAL '60 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = ue.user_id
          AND n.type = 'event_starting'
          AND (n.data->>'event_id') = e.id::text
          AND n.created_at > now() - INTERVAL '6 hours'
      )
  LOOP
    PERFORM public.create_notification(
      r.user_id,
      'event_starting',
      r.title || ' zaczyna się wkrótce 🎉',
      'Zaczyna się o ' || to_char(r.starts_at AT TIME ZONE 'Europe/Warsaw', 'HH24:MI')
        || COALESCE(' • ' || r.location, ''),
      '/app/discover',
      jsonb_build_object('event_id', r.event_id, 'starts_at', r.starts_at)
    );
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END;
$$;

-- ===== 9. CRON JOBS =====
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-streak-at-risk') THEN
    PERFORM cron.unschedule('notify-streak-at-risk');
  END IF;
  -- 20:00 Europe/Warsaw ≈ 19:00 UTC (winter); use 19:00 UTC as a stable time
  PERFORM cron.schedule(
    'notify-streak-at-risk',
    '0 19 * * *',
    $cmd$ SELECT public.notify_streak_at_risk(); $cmd$
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-events-starting') THEN
    PERFORM cron.unschedule('notify-events-starting');
  END IF;
  -- every 15 minutes
  PERFORM cron.schedule(
    'notify-events-starting',
    '*/15 * * * *',
    $cmd$ SELECT public.notify_events_starting_soon(); $cmd$
  );
END $$;