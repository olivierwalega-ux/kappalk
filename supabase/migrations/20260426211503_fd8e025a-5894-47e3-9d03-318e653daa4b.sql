-- Tabela skanów QR
CREATE TABLE public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

CREATE INDEX idx_user_events_user ON public.user_events(user_id);
CREATE INDEX idx_user_events_event ON public.user_events(event_id);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_events_select_own"
  ON public.user_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_events_select_admin"
  ON public.user_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_events_admin_manage"
  ON public.user_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER TABLE public.user_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_events;

-- Aktualizacja claim_event: dodatkowo wpis do user_events + użycie unikalności jako twardej blokady
CREATE OR REPLACE FUNCTION public.claim_event(_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _uid UUID := auth.uid();
  _pts INTEGER;
  _title TEXT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Wymagane logowanie'; END IF;

  SELECT points, title INTO _pts, _title
  FROM public.events
  WHERE id = _event_id AND is_active = true;

  IF _pts IS NULL THEN RAISE EXCEPTION 'Event nie istnieje lub jest nieaktywny'; END IF;

  IF EXISTS (SELECT 1 FROM public.user_events WHERE user_id = _uid AND event_id = _event_id) THEN
    RAISE EXCEPTION 'Ten kod QR został już zeskanowany';
  END IF;

  INSERT INTO public.user_events(user_id, event_id, points_awarded)
  VALUES (_uid, _event_id, _pts);

  UPDATE public.profiles SET points = points + _pts WHERE id = _uid;
  UPDATE public.events SET participants_count = participants_count + 1 WHERE id = _event_id;

  INSERT INTO public.transactions(user_id, amount, type, description, event_id)
  VALUES (_uid, _pts, 'event', _title, _event_id);

  RETURN jsonb_build_object('success', true, 'points', _pts, 'title', _title);
END;
$function$;