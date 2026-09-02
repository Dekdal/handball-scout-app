
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END;$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Games
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  opponent TEXT NOT NULL,
  game_date DATE NOT NULL,
  competition TEXT,
  category TEXT,
  goalkeeper_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own games" ON public.games FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shots
CREATE TABLE public.shots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_number INT,
  position TEXT NOT NULL,            -- ponta_esq, ponta_dir, armador_esq, armador_cen, armador_dir, pivo
  shot_type TEXT NOT NULL,           -- 6m, 7m, 9m, contra_ataque, ponta
  zone TEXT NOT NULL,                -- A1..C3
  result TEXT NOT NULL,              -- gol, defesa, trave, fora
  game_time TEXT,
  dominant_hand TEXT,                -- destra, canhota (usado p/ 7m)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shots TO authenticated;
GRANT ALL ON public.shots TO service_role;
ALTER TABLE public.shots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own shots" ON public.shots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX shots_game_idx ON public.shots(game_id);
CREATE INDEX games_user_idx ON public.games(user_id, game_date DESC);
