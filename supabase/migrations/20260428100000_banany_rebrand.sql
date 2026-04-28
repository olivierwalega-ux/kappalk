-- Rebranding: punkty → banany 🍌
-- 1) Update transfer notification text
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
      _sender_name || ' przesłał Ci banany 🍌',
      '+' || NEW.amount || ' 🍌' || COALESCE(' • ' || NEW.description, ''),
      '/app',
      jsonb_build_object('amount', NEW.amount, 'from', NEW.related_user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Update mission/challenge titles & descriptions
UPDATE public.missions SET description = 'Zdobądź 100 🍌 w ciągu dnia' WHERE code = 'daily_top10';
UPDATE public.missions SET title = 'Prześlij 🍌 dwóm ziomkom', description = 'Podziel się bananami' WHERE code = 'weekly_2_transfers';
UPDATE public.missions SET title = 'Zgarnij 500 🍌 w tygodniu', description = 'Aktywność = banany' WHERE code = 'weekly_500pts';
