
-- Enum ról
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Tabela profili
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  student_id TEXT,
  faculty TEXT DEFAULT 'Zarządzanie',
  year INTEGER DEFAULT 1,
  avatar_initials TEXT,
  points INTEGER NOT NULL DEFAULT 100,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tabela ról
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Funkcja security definer do sprawdzania ról (anty-rekursja RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Tabela eventów
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT NOT NULL DEFAULT 'event',
  points INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  participants_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  color TEXT DEFAULT 'pink',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Tabela transakcji punktów
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  related_user_id UUID REFERENCES auth.users(id),
  event_id UUID REFERENCES public.events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====

-- profiles
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "roles_select_admin" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "roles_admin_manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- events
CREATE POLICY "events_select_all" ON public.events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "events_admin_manage" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- transactions
CREATE POLICY "tx_select_own" ON public.transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = related_user_id);

CREATE POLICY "tx_select_admin" ON public.transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "tx_insert_own" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===== FUNKCJE & TRIGGERY =====

-- Auto-tworzenie profilu i nadawanie roli "student" po rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first TEXT;
  v_last TEXT;
  v_initials TEXT;
  v_student_id TEXT;
BEGIN
  v_first := COALESCE(NEW.raw_user_meta_data ->> 'first_name', '');
  v_last := COALESCE(NEW.raw_user_meta_data ->> 'last_name', '');
  v_student_id := split_part(NEW.email, '@', 1);
  v_initials := UPPER(LEFT(COALESCE(NULLIF(v_first,''), 'S'), 1) || LEFT(COALESCE(NULLIF(v_last,''), 'T'), 1));

  INSERT INTO public.profiles (id, email, first_name, last_name, student_id, avatar_initials, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(v_first,''),
    NULLIF(v_last,''),
    v_student_id,
    v_initials,
    'KAPP-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 6))
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Funkcja do bezpiecznego transferu punktów P2P
CREATE OR REPLACE FUNCTION public.transfer_points(_to_user UUID, _amount INTEGER, _note TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _from UUID := auth.uid();
  _balance INTEGER;
BEGIN
  IF _from IS NULL THEN
    RAISE EXCEPTION 'Wymagane logowanie';
  END IF;
  IF _from = _to_user THEN
    RAISE EXCEPTION 'Nie można wysłać punktów do siebie';
  END IF;
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Kwota musi być dodatnia';
  END IF;

  SELECT points INTO _balance FROM public.profiles WHERE id = _from;
  IF _balance IS NULL OR _balance < _amount THEN
    RAISE EXCEPTION 'Niewystarczające saldo';
  END IF;

  UPDATE public.profiles SET points = points - _amount WHERE id = _from;
  UPDATE public.profiles SET points = points + _amount WHERE id = _to_user;

  INSERT INTO public.transactions(user_id, amount, type, description, related_user_id)
  VALUES (_from, -_amount, 'transfer_out', COALESCE(_note,'Transfer P2P'), _to_user);
  INSERT INTO public.transactions(user_id, amount, type, description, related_user_id)
  VALUES (_to_user, _amount, 'transfer_in', COALESCE(_note,'Transfer P2P'), _from);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Funkcja dołączania do eventu (zdobycie punktów)
CREATE OR REPLACE FUNCTION public.claim_event(_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _pts INTEGER;
  _title TEXT;
  _exists BOOLEAN;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Wymagane logowanie'; END IF;

  SELECT points, title INTO _pts, _title FROM public.events WHERE id = _event_id AND is_active = true;
  IF _pts IS NULL THEN RAISE EXCEPTION 'Event nie istnieje'; END IF;

  SELECT EXISTS(SELECT 1 FROM public.transactions WHERE user_id = _uid AND event_id = _event_id) INTO _exists;
  IF _exists THEN RAISE EXCEPTION 'Punkty za ten event już zostały odebrane'; END IF;

  UPDATE public.profiles SET points = points + _pts WHERE id = _uid;
  UPDATE public.events SET participants_count = participants_count + 1 WHERE id = _event_id;
  INSERT INTO public.transactions(user_id, amount, type, description, event_id)
  VALUES (_uid, _pts, 'event', _title, _event_id);

  RETURN jsonb_build_object('success', true, 'points', _pts);
END;
$$;
