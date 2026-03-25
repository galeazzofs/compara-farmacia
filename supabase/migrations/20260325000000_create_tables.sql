-- User profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL DEFAULT '',
  cep_padrao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nome', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Search cache
CREATE TABLE IF NOT EXISTS public.search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_remedio TEXT NOT NULL,
  nome_produto TEXT NOT NULL,
  cep TEXT NOT NULL,
  farmacia TEXT NOT NULL,
  preco_remedio DECIMAL(10,2) NOT NULL,
  frete DECIMAL(10,2) NOT NULL,
  prazo_dias INTEGER NOT NULL,
  preco_total DECIMAL(10,2) NOT NULL,
  url_produto TEXT NOT NULL,
  buscado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nome_remedio, cep, farmacia)
);

CREATE INDEX idx_search_cache_lookup
  ON public.search_cache (nome_remedio, cep, buscado_em);

ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache"
  ON public.search_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage cache"
  ON public.search_cache FOR ALL
  USING (auth.role() = 'service_role');

-- Shopping lists
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome_lista TEXT NOT NULL DEFAULT 'Minha Lista',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lists"
  ON public.shopping_lists FOR ALL
  USING (auth.uid() = user_id);

-- Shopping list items
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  nome_remedio TEXT NOT NULL,
  principio_ativo TEXT
);

ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own list items"
  ON public.shopping_list_items FOR ALL
  USING (
    lista_id IN (
      SELECT id FROM public.shopping_lists WHERE user_id = auth.uid()
    )
  );
