CREATE OR REPLACE FUNCTION public.current_period_key(_period TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _period = 'daily'  THEN to_char(now() AT TIME ZONE 'Europe/Warsaw', 'YYYY-MM-DD')
    WHEN _period = 'weekly' THEN to_char(now() AT TIME ZONE 'Europe/Warsaw', 'IYYY-"W"IW')
    ELSE 'all-time'
  END
$$;