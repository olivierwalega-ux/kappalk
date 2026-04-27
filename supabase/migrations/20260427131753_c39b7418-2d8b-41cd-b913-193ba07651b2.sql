-- 1. Add last_active_date to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- 2. Function to bump streak based on activity
CREATE OR REPLACE FUNCTION public.bump_streak(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today DATE := (now() AT TIME ZONE 'Europe/Warsaw')::DATE;
  _last DATE;
  _current INTEGER;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;

  SELECT last_active_date, streak_days INTO _last, _current
  FROM public.profiles WHERE id = _user_id;

  IF _last = _today THEN
    -- already counted today
    RETURN;
  ELSIF _last = _today - INTERVAL '1 day' THEN
    -- consecutive day
    UPDATE public.profiles
    SET streak_days = COALESCE(streak_days, 0) + 1,
        last_active_date = _today,
        updated_at = now()
    WHERE id = _user_id;
  ELSE
    -- first time or gap: start at 1
    UPDATE public.profiles
    SET streak_days = 1,
        last_active_date = _today,
        updated_at = now()
    WHERE id = _user_id;
  END IF;
END;
$$;

-- 3. Trigger functions on user_events and transactions also bump streak
CREATE OR REPLACE FUNCTION public.tg_user_events_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.bump_mission_progress(NEW.user_id, 'qr_scan', 1);
  PERFORM public.bump_mission_progress(NEW.user_id, 'event_attended', 1);
  PERFORM public.bump_streak(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_transactions_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'transfer_out' THEN
    PERFORM public.bump_mission_progress(NEW.user_id, 'transfer_sent', 1);
    PERFORM public.bump_streak(NEW.user_id);
  END IF;

  IF NEW.amount > 0 AND NEW.type IN ('event', 'transfer_in') THEN
    PERFORM public.bump_mission_progress(NEW.user_id, 'points_earned', NEW.amount);
    PERFORM public.bump_streak(NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Make sure triggers exist (idempotent)
DROP TRIGGER IF EXISTS user_events_after_insert ON public.user_events;
CREATE TRIGGER user_events_after_insert
AFTER INSERT ON public.user_events
FOR EACH ROW EXECUTE FUNCTION public.tg_user_events_after_insert();

DROP TRIGGER IF EXISTS transactions_after_insert ON public.transactions;
CREATE TRIGGER transactions_after_insert
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_transactions_after_insert();

-- 4. Daily reset for inactive users (streak = 0 if last_active_date < yesterday)
CREATE OR REPLACE FUNCTION public.reset_inactive_streaks()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _yesterday DATE := ((now() AT TIME ZONE 'Europe/Warsaw')::DATE) - INTERVAL '1 day';
BEGIN
  UPDATE public.profiles
  SET streak_days = 0,
      updated_at = now()
  WHERE streak_days > 0
    AND (last_active_date IS NULL OR last_active_date < _yesterday);
END;
$$;

-- 5. Schedule daily reset at 00:05 Europe/Warsaw (= 23:05 UTC in winter, 22:05 UTC in summer; use UTC 23:05 as compromise)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reset-inactive-streaks') THEN
    PERFORM cron.unschedule('reset-inactive-streaks');
  END IF;
  PERFORM cron.schedule(
    'reset-inactive-streaks',
    '5 23 * * *',
    $cmd$ SELECT public.reset_inactive_streaks(); $cmd$
  );
END $$;