-- ───────────────────────────────────────────────────────────────────────────
-- Katalog misji
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('mission', 'challenge')),  -- mission=daily, challenge=weekly
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly')),
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('qr_scan', 'transfer_sent', 'event_attended', 'points_earned')),
  target INTEGER NOT NULL CHECK (target > 0),
  bonus_points INTEGER NOT NULL DEFAULT 0 CHECK (bonus_points >= 0),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'star',
  color TEXT NOT NULL DEFAULT 'brand',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_missions_active ON public.missions(is_active, kind, sort_order);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "missions_select_all" ON public.missions
  FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "missions_admin_manage" ON public.missions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ───────────────────────────────────────────────────────────────────────────
-- Postęp użytkownika
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,  -- e.g. '2026-04-26' (daily) or '2026-W17' (weekly)
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  bonus_awarded BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id, period_key)
);

CREATE INDEX idx_um_user_period ON public.user_missions(user_id, period_key);

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "um_select_own" ON public.user_missions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "um_select_admin" ON public.user_missions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER TABLE public.user_missions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_missions;

-- ───────────────────────────────────────────────────────────────────────────
-- Helper: aktualny period_key dla typu okresu
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_period_key(_period TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN _period = 'daily'  THEN to_char(now() AT TIME ZONE 'Europe/Warsaw', 'YYYY-MM-DD')
    WHEN _period = 'weekly' THEN to_char(now() AT TIME ZONE 'Europe/Warsaw', 'IYYY-"W"IW')
    ELSE 'all-time'
  END
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- Rdzeń: zwiększ postęp w misjach pasujących do trigger_event
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bump_mission_progress(
  _user_id UUID,
  _trigger_event TEXT,
  _delta INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m RECORD;
  pk TEXT;
  new_progress INTEGER;
  was_completed BOOLEAN;
  now_completed BOOLEAN;
BEGIN
  IF _user_id IS NULL OR _delta <= 0 THEN RETURN; END IF;

  FOR m IN
    SELECT id, target, bonus_points, period, title
    FROM public.missions
    WHERE is_active = true AND trigger_event = _trigger_event
  LOOP
    pk := public.current_period_key(m.period);

    -- Upsert postępu
    INSERT INTO public.user_missions (user_id, mission_id, period_key, progress)
    VALUES (_user_id, m.id, pk, _delta)
    ON CONFLICT (user_id, mission_id, period_key)
    DO UPDATE SET
      progress = public.user_missions.progress + EXCLUDED.progress,
      updated_at = now()
    RETURNING progress, completed INTO new_progress, was_completed;

    now_completed := new_progress >= m.target;

    -- Oznacz ukończenie + przyznaj bonus (raz)
    IF now_completed AND NOT was_completed THEN
      UPDATE public.user_missions
      SET completed = true,
          completed_at = now(),
          bonus_awarded = true,
          updated_at = now()
      WHERE user_id = _user_id AND mission_id = m.id AND period_key = pk
        AND bonus_awarded = false;

      IF m.bonus_points > 0 THEN
        UPDATE public.profiles SET points = points + m.bonus_points WHERE id = _user_id;
        INSERT INTO public.transactions(user_id, amount, type, description)
        VALUES (_user_id, m.bonus_points, 'mission_bonus', 'Bonus: ' || m.title);
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- Triggery
-- ───────────────────────────────────────────────────────────────────────────

-- 1) Skanowanie QR eventu => qr_scan + event_attended (+ points_earned ogarnia trigger transakcji)
CREATE OR REPLACE FUNCTION public.tg_user_events_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.bump_mission_progress(NEW.user_id, 'qr_scan', 1);
  PERFORM public.bump_mission_progress(NEW.user_id, 'event_attended', 1);
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_events_progress
AFTER INSERT ON public.user_events
FOR EACH ROW EXECUTE FUNCTION public.tg_user_events_after_insert();

-- 2) Transakcje => transfer_sent / points_earned
CREATE OR REPLACE FUNCTION public.tg_transactions_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Liczymy tylko realne aktywności (pomiń sam bonus, żeby nie zapętlić)
  IF NEW.type = 'transfer_out' THEN
    PERFORM public.bump_mission_progress(NEW.user_id, 'transfer_sent', 1);
  END IF;

  IF NEW.amount > 0 AND NEW.type IN ('event', 'transfer_in') THEN
    PERFORM public.bump_mission_progress(NEW.user_id, 'points_earned', NEW.amount);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER transactions_progress
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_transactions_after_insert();

-- ───────────────────────────────────────────────────────────────────────────
-- Seed: domyślne misje dnia i wyzwania tygodnia
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.missions (code, kind, period, trigger_event, target, bonus_points, title, description, icon, color, sort_order) VALUES
  ('daily_qr_1',         'mission',   'daily',  'qr_scan',        1,   50,  'Zeskanuj 1 QR',          'Zeskanuj kod QR dowolnego eventu',           'qr',      'green',     1),
  ('daily_3_activities', 'mission',   'daily',  'event_attended', 3,   30,  '3 aktywności',           'Weź udział w 3 wydarzeniach dziś',           'zap',     'brand',     2),
  ('daily_top10',        'mission',   'daily',  'points_earned',  100, 200, 'Top 10 tygodnia',        'Zdobądź 100 pkt w ciągu dnia',               'trophy',  'gold',      3),
  ('daily_streak',       'mission',   'daily',  'event_attended', 1,   80,  'Seria 7 dni',            'Bądź aktywny 7 dni z rzędu',                 'target',  'pink',      4),

  ('weekly_3_events',    'challenge', 'weekly', 'event_attended', 3,   200, 'Weź udział w 3 eventach','Tydzień bogaty w wydarzenia',                'star',    'brand',     1),
  ('weekly_2_transfers', 'challenge', 'weekly', 'transfer_sent',  2,   100, 'Wyślij punkty 2 znajomym','Podziel się punktami',                       'users',   'green',     2),
  ('weekly_500pts',      'challenge', 'weekly', 'points_earned',  500, 80,  'Zdobądź 500 pkt w tygodniu','Aktywność = nagroda',                     'trophy',  'pink',      3),
  ('weekly_5_qr',        'challenge', 'weekly', 'qr_scan',        5,   150, '5 skanów QR w tygodniu', 'Mistrz QR',                                  'activity','gold',      4);