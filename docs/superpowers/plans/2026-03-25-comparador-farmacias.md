# Comparador de Precos de Farmacias — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. Use @frontend-design skill for all UI component tasks.

**Goal:** Build a web platform that compares medicine prices across 5 major Brazilian pharmacies (Drogasil, Droga Raia, Pague Menos, Drogaria Sao Paulo, Panvel), showing price + shipping + delivery time, with OCR support for prescriptions and shopping list consolidation.

**Architecture:** Next.js 14 App Router frontend + API on Vercel, Supabase for auth + PostgreSQL, Python FastAPI microservice on Render for on-demand scraping, Google Cloud Vision for OCR, Google Gemini for prescription parsing. Search works without login; account required only for persistent features.

**Tech Stack:** Next.js 14 (TypeScript), Supabase (Auth + PostgreSQL), Python (FastAPI + httpx + BeautifulSoup + Playwright), Google Cloud Vision API, Google Gemini API, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-03-25-comparador-farmacias-design.md`

---

## File Structure

### Next.js App (`/`)

```
src/
  app/
    layout.tsx                    - Root layout, fonts, metadata, Supabase provider
    page.tsx                      - Home page with search bar
    globals.css                   - Global styles + Tailwind
    resultados/
      page.tsx                    - Search results page (server component)
    login/
      page.tsx                    - Login page
    cadastro/
      page.tsx                    - Signup page (includes CEP field)
    lista/
      page.tsx                    - Shopping lists (requires auth)
    perfil/
      page.tsx                    - Profile page (requires auth)
    api/
      search/
        route.ts                  - POST: call Python microservice, manage cache
      ocr/
        route.ts                  - POST: receive image, call Vision + Gemini
      lists/
        route.ts                  - GET/POST shopping lists
      lists/[id]/
        route.ts                  - GET/PUT/DELETE single list
      lists/[id]/compare/
        route.ts                  - POST: compare all items in list
  lib/
    supabase/
      client.ts                   - Browser Supabase client
      server.ts                   - Server-side Supabase client
    normalize.ts                  - Search term normalization
    types.ts                      - Shared TypeScript types
    constants.ts                  - Pharmacy names, color thresholds, etc.
  components/
    Header.tsx                    - Top navigation bar
    SearchBar.tsx                 - Search input + CEP + submit
    PhotoUpload.tsx               - Camera/upload button for OCR
    ResultCard.tsx                - Single pharmacy result card
    ResultsList.tsx               - List of ResultCards with sorting
    PrazoBadge.tsx                - Green/yellow/red delivery badge
    LoadingSearch.tsx             - Skeleton/animation while scraping
    ShoppingListCard.tsx          - Shopping list summary card
    ShoppingListForm.tsx          - Add/edit items in a list
    ComparisonTable.tsx           - Consolidated comparison table
    OcrConfirmation.tsx           - Show OCR results for user confirmation
    AuthGuard.tsx                 - Wraps pages that require login
    CepInput.tsx                  - CEP input with mask + validation
middleware.ts                     - Supabase auth refresh middleware
next.config.js
tailwind.config.ts
package.json
tsconfig.json
.env.local                        - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, SCRAPER_API_URL, etc.
```

### Python Microservice (`/scraper`)

```
scraper/
  main.py                         - FastAPI app, POST /search, POST /health
  config.py                       - Settings (timeouts, user-agent, rate limits)
  scrapers/
    base.py                       - Abstract base scraper class
    drogasil.py                   - Drogasil scraper
    drogaraia.py                  - Droga Raia scraper
    paguemenos.py                 - Pague Menos scraper
    drogariasaopaulo.py           - Drogaria Sao Paulo scraper
    panvel.py                     - Panvel scraper
  utils/
    normalize.py                  - Search term normalization (Python mirror)
    prazo_parser.py               - Convert "2 dias uteis" -> 2
  tests/
    test_normalize.py             - Normalization tests
    test_prazo_parser.py          - Prazo parser tests
    test_main.py                  - API endpoint tests
    test_scrapers.py              - Scraper integration tests (mocked HTML)
  requirements.txt
  Procfile                        - For Render deployment
```

### Supabase (`/supabase`)

```
supabase/
  migrations/
    20260325000000_create_tables.sql  - users profile, search_cache, shopping_lists, shopping_list_items
```

---

## Chunk 1: Project Foundation

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `postcss.config.js`, `.gitignore`, `.env.local.example`

- [ ] **Step 1: Create Next.js project with TypeScript + Tailwind**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Verify project runs**

Run: `npm run dev`
Expected: Next.js dev server starts at localhost:3000

- [ ] **Step 3: Create .env.local.example**

Create `.env.local.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SCRAPER_API_URL=http://localhost:8000
GOOGLE_CLOUD_VISION_API_KEY=your_google_vision_key
GOOGLE_GEMINI_API_KEY=your_google_gemini_key
```

- [ ] **Step 4: Add .env.local.example to .gitignore check**

Verify `.gitignore` includes `.env.local` (create-next-app should have added it). If not, add it.

- [ ] **Step 5: Initialize git and commit**

```bash
git init
git add -A
git commit -m "chore: initialize Next.js 14 project with TypeScript and Tailwind"
```

---

### Task 2: Install dependencies and configure Supabase client

**Files:**
- Modify: `package.json`
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/types.ts`, `src/lib/constants.ts`, `middleware.ts`

- [ ] **Step 1: Install Supabase packages**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create shared TypeScript types**

Create `src/lib/types.ts`:
```typescript
export interface SearchResult {
  farmacia: string;
  nome_produto: string;
  preco_remedio: number;
  frete: number;
  preco_total: number;
  prazo_dias: number;
  url_produto: string;
}

export interface SearchResponse {
  resultados: SearchResult[];
  erros: { farmacia: string; motivo: string }[];
}

export interface CachedResult {
  id: string;
  nome_remedio: string;
  nome_produto: string;
  cep: string;
  farmacia: string;
  preco_remedio: number;
  frete: number;
  prazo_dias: number;
  preco_total: number;
  url_produto: string;
  buscado_em: string;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  nome_lista: string;
  created_at: string;
  items?: ShoppingListItem[];
}

export interface ShoppingListItem {
  id: string;
  lista_id: string;
  nome_remedio: string;
  principio_ativo: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  cep_padrao: string;
  created_at: string;
}

export interface OcrResult {
  remedios: { nome: string; dosagem: string | null }[];
  texto_bruto: string;
  confianca: number;
}
```

- [ ] **Step 3: Create constants**

Create `src/lib/constants.ts`:
```typescript
export const FARMACIAS = [
  { id: "drogasil", nome: "Drogasil", cor: "#E31837" },
  { id: "drogaraia", nome: "Droga Raia", cor: "#00A651" },
  { id: "paguemenos", nome: "Pague Menos", cor: "#003DA5" },
  { id: "drogariasaopaulo", nome: "Drogaria São Paulo", cor: "#D4213D" },
  { id: "panvel", nome: "Panvel", cor: "#0066B3" },
] as const;

export const PRAZO_THRESHOLDS = {
  rapido: { max: 2, cor: "green" },
  medio: { max: 5, cor: "yellow" },
  lento: { min: 6, cor: "red" },
} as const;

export const CACHE_TTL_HOURS = 1;
export const MAX_LIST_ITEMS = 10;
export const MAX_IMAGE_SIZE_MB = 10;
export const SCRAPER_TIMEOUT_MS = 20000;
```

- [ ] **Step 4: Create Supabase browser client**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 5: Create Supabase server client**

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 6: Create auth middleware**

Create `middleware.ts` (project root):
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedPaths = ["/lista", "/perfil"];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client, types, constants, and auth middleware"
```

---

### Task 3: Create Supabase database schema

**Files:**
- Create: `supabase/migrations/20260325000000_create_tables.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/20260325000000_create_tables.sql`:
```sql
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

-- Anyone can read cache (search works without login)
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

-- Cache cleanup (run daily via pg_cron or Supabase scheduled function)
-- DELETE FROM public.search_cache WHERE buscado_em < NOW() - INTERVAL '1 hour';
```

- [ ] **Step 2: Run migration on Supabase**

Go to Supabase Dashboard > SQL Editor. Paste and run the migration SQL. Alternatively, if using Supabase CLI:
```bash
npx supabase db push
```

- [ ] **Step 3: Set up cache cleanup**

In Supabase Dashboard > Database > Extensions, enable `pg_cron`. Then in SQL Editor:
```sql
SELECT cron.schedule(
  'cleanup-search-cache',
  '0 * * * *',
  $$DELETE FROM public.search_cache WHERE buscado_em < NOW() - INTERVAL '1 hour'$$
);
```

- [ ] **Step 4: Commit migration file**

```bash
git add supabase/
git commit -m "feat: add database schema with profiles, cache, and shopping lists"
```

---

### Task 4: Create search term normalization utility

**Files:**
- Create: `src/lib/normalize.ts`, `src/lib/__tests__/normalize.test.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom
npx ts-jest config:init
```

- [ ] **Step 2: Write failing tests for normalization**

Create `src/lib/__tests__/normalize.test.ts`:
```typescript
import { normalizeSearchTerm } from "../normalize";

describe("normalizeSearchTerm", () => {
  it("converts to lowercase", () => {
    expect(normalizeSearchTerm("DIPIRONA")).toBe("dipirona");
  });

  it("trims and collapses whitespace", () => {
    expect(normalizeSearchTerm("  dipirona   500mg  ")).toBe("dipirona 500mg");
  });

  it("removes accents", () => {
    expect(normalizeSearchTerm("farmácia drogão")).toBe("farmacia drogao");
  });

  it("standardizes dosage spacing", () => {
    expect(normalizeSearchTerm("dipirona 500 mg")).toBe("dipirona 500mg");
  });

  it("converts grams to mg", () => {
    expect(normalizeSearchTerm("amoxicilina 1g")).toBe("amoxicilina 1000mg");
  });

  it("handles combined normalization", () => {
    expect(normalizeSearchTerm("  DIPIRONA Sódica  500 mg ")).toBe(
      "dipirona sodica 500mg"
    );
  });

  it("returns empty string for empty input", () => {
    expect(normalizeSearchTerm("")).toBe("");
    expect(normalizeSearchTerm("   ")).toBe("");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/lib/__tests__/normalize.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement normalization**

Create `src/lib/normalize.ts`:
```typescript
export function normalizeSearchTerm(term: string): string {
  if (!term || !term.trim()) return "";

  let normalized = term
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  // Remove accents
  normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Standardize dosage: "500 mg" -> "500mg"
  normalized = normalized.replace(/(\d+)\s*(mg|ml|mcg|ui)/gi, "$1$2");

  // Convert grams to mg: "1g" -> "1000mg", "0.5g" -> "500mg"
  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s*g\b/gi, (_, num) => {
    return `${Math.round(parseFloat(num) * 1000)}mg`;
  });

  return normalized;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/lib/__tests__/normalize.test.ts`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/normalize.ts src/lib/__tests__/ jest.config.ts
git commit -m "feat: add search term normalization with tests"
```

---

## Chunk 2: Python Microservice (Scraper)

### Task 5: Initialize Python microservice

**Files:**
- Create: `scraper/main.py`, `scraper/config.py`, `scraper/requirements.txt`, `scraper/Procfile`, `scraper/.gitignore`

- [ ] **Step 1: Create scraper directory and requirements**

Create `scraper/requirements.txt`:
```
fastapi==0.115.0
uvicorn==0.30.0
httpx==0.27.0
beautifulsoup4==4.12.3
playwright==1.48.0
lxml==5.3.0
pytest==8.3.0
pytest-asyncio==0.24.0
```

- [ ] **Step 2: Create config**

Create `scraper/config.py`:
```python
USER_AGENT = "ComparaFarmacia/1.0 (+https://github.com/comparafarmacia)"
REQUEST_TIMEOUT = 15
RATE_LIMIT_SECONDS = 2.5
MAX_PLAYWRIGHT_INSTANCES = 2

FARMACIAS = ["drogasil", "drogaraia", "paguemenos", "drogariasaopaulo", "panvel"]
```

- [ ] **Step 3: Create FastAPI app**

Create `scraper/main.py`:
```python
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scrapers.drogasil import DrogasilScraper
from scrapers.drogaraia import DrogaRaiaScraper
from scrapers.paguemenos import PagueMenosScraper
from scrapers.drogariasaopaulo import DrogariaSaoPauloScraper
from scrapers.panvel import PanvelScraper

app = FastAPI(title="ComparaFarmacia Scraper")


class SearchRequest(BaseModel):
    remedio: str
    cep: str


class ResultItem(BaseModel):
    farmacia: str
    nome_produto: str
    preco_remedio: float
    frete: float
    preco_total: float
    prazo_dias: int
    url_produto: str


class ErrorItem(BaseModel):
    farmacia: str
    motivo: str


class SearchResponse(BaseModel):
    resultados: list[ResultItem]
    erros: list[ErrorItem]


SCRAPERS = [
    DrogasilScraper(),
    DrogaRaiaScraper(),
    PagueMenosScraper(),
    DrogariaSaoPauloScraper(),
    PanvelScraper(),
]


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    if not request.remedio or not request.cep:
        raise HTTPException(status_code=400, detail="remedio and cep are required")

    if len(request.cep) != 8 or not request.cep.isdigit():
        raise HTTPException(status_code=400, detail="CEP must be 8 digits")

    tasks = [scraper.search(request.remedio, request.cep) for scraper in SCRAPERS]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    resultados = []
    erros = []

    for scraper, result in zip(SCRAPERS, results):
        if isinstance(result, Exception):
            erros.append(ErrorItem(farmacia=scraper.name, motivo=str(result)))
        elif result is None:
            erros.append(ErrorItem(farmacia=scraper.name, motivo="no results"))
        else:
            resultados.append(result)

    return SearchResponse(resultados=resultados, erros=erros)
```

- [ ] **Step 4: Create Procfile for Render**

Create `scraper/Procfile`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

- [ ] **Step 5: Create .gitignore for scraper**

Create `scraper/.gitignore`:
```
__pycache__/
*.pyc
.venv/
.env
```

- [ ] **Step 6: Commit**

```bash
git add scraper/
git commit -m "feat: initialize Python FastAPI scraper microservice"
```

---

### Task 6: Create base scraper and utility modules

**Files:**
- Create: `scraper/scrapers/__init__.py`, `scraper/scrapers/base.py`, `scraper/utils/__init__.py`, `scraper/utils/normalize.py`, `scraper/utils/prazo_parser.py`
- Create: `scraper/tests/__init__.py`, `scraper/tests/test_normalize.py`, `scraper/tests/test_prazo_parser.py`

- [ ] **Step 1: Write failing tests for prazo_parser**

Create `scraper/tests/__init__.py` (empty), `scraper/utils/__init__.py` (empty), `scraper/scrapers/__init__.py` (empty).

Create `scraper/tests/test_prazo_parser.py`:
```python
from utils.prazo_parser import parse_prazo


def test_parse_dias_uteis():
    assert parse_prazo("2 dias úteis") == 2


def test_parse_dia_util():
    assert parse_prazo("1 dia útil") == 1


def test_parse_entrega_amanha():
    assert parse_prazo("Entrega amanhã") == 1


def test_parse_entrega_hoje():
    assert parse_prazo("Entrega hoje") == 0


def test_parse_number_only():
    assert parse_prazo("3") == 3


def test_parse_unknown_returns_default():
    assert parse_prazo("indisponível") == -1


def test_parse_empty():
    assert parse_prazo("") == -1
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `scraper/` dir): `python -m pytest tests/test_prazo_parser.py -v`
Expected: FAIL — module not found

- [ ] **Step 3: Implement prazo_parser**

Create `scraper/utils/prazo_parser.py`:
```python
import re


def parse_prazo(text: str) -> int:
    """Convert delivery time text to integer days. Returns -1 if unparseable."""
    if not text:
        return -1

    text_lower = text.lower().strip()

    if "hoje" in text_lower:
        return 0
    if "amanhã" in text_lower or "amanha" in text_lower:
        return 1

    match = re.search(r"(\d+)\s*dia", text_lower)
    if match:
        return int(match.group(1))

    if text_lower.isdigit():
        return int(text_lower)

    return -1
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_prazo_parser.py -v`
Expected: All PASS

- [ ] **Step 5: Write failing tests for Python normalize**

Create `scraper/tests/test_normalize.py`:
```python
from utils.normalize import normalize_search_term


def test_lowercase():
    assert normalize_search_term("DIPIRONA") == "dipirona"


def test_trim_whitespace():
    assert normalize_search_term("  dipirona   500mg  ") == "dipirona 500mg"


def test_remove_accents():
    assert normalize_search_term("farmácia drogão") == "farmacia drogao"


def test_standardize_dosage():
    assert normalize_search_term("dipirona 500 mg") == "dipirona 500mg"


def test_grams_to_mg():
    assert normalize_search_term("amoxicilina 1g") == "amoxicilina 1000mg"


def test_empty():
    assert normalize_search_term("") == ""
    assert normalize_search_term("   ") == ""
```

- [ ] **Step 6: Implement Python normalize**

Create `scraper/utils/normalize.py`:
```python
import re
import unicodedata


def normalize_search_term(term: str) -> str:
    if not term or not term.strip():
        return ""

    normalized = term.lower().strip()
    normalized = re.sub(r"\s+", " ", normalized)

    # Remove accents
    normalized = unicodedata.normalize("NFD", normalized)
    normalized = re.sub(r"[\u0300-\u036f]", "", normalized)

    # Standardize dosage: "500 mg" -> "500mg"
    normalized = re.sub(r"(\d+)\s*(mg|ml|mcg|ui)", r"\1\2", normalized, flags=re.IGNORECASE)

    # Convert grams to mg: "1g" -> "1000mg"
    def grams_to_mg(match):
        num = float(match.group(1))
        return f"{round(num * 1000)}mg"

    normalized = re.sub(r"(\d+(?:\.\d+)?)\s*g\b", grams_to_mg, normalized, flags=re.IGNORECASE)

    return normalized
```

- [ ] **Step 7: Run normalize tests**

Run: `python -m pytest tests/test_normalize.py -v`
Expected: All PASS

- [ ] **Step 8: Create base scraper class**

Create `scraper/scrapers/base.py`:
```python
import asyncio
from abc import ABC, abstractmethod
from typing import Optional

import httpx
from config import USER_AGENT, REQUEST_TIMEOUT, RATE_LIMIT_SECONDS


class BaseScraper(ABC):
    """Abstract base class for pharmacy scrapers."""

    def __init__(self):
        self._last_request_time = 0

    @property
    @abstractmethod
    def name(self) -> str:
        """Pharmacy identifier (e.g., 'drogasil')."""
        ...

    @abstractmethod
    async def search(self, remedio: str, cep: str) -> Optional[dict]:
        """
        Search for a medicine at this pharmacy.
        Returns a dict with: farmacia, nome_produto, preco_remedio, frete, preco_total, prazo_dias, url_produto
        Returns None if no results found.
        Raises Exception on error.
        """
        ...

    async def _rate_limit(self):
        """Enforce rate limiting between requests."""
        import time
        now = time.monotonic()
        elapsed = now - self._last_request_time
        if self._last_request_time > 0 and elapsed < RATE_LIMIT_SECONDS:
            await asyncio.sleep(RATE_LIMIT_SECONDS - elapsed)
        self._last_request_time = time.monotonic()

    async def _get(self, url: str, params: dict = None, retries: int = 2) -> httpx.Response:
        """Make a rate-limited GET request with retry and exponential backoff."""
        await self._rate_limit()
        last_error = None
        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(
                    headers={"User-Agent": USER_AGENT},
                    timeout=REQUEST_TIMEOUT,
                    follow_redirects=True,
                ) as client:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    return response
            except (httpx.HTTPStatusError, httpx.RequestError) as e:
                last_error = e
                if attempt < retries:
                    await asyncio.sleep(2 ** attempt)
        raise last_error
```

- [ ] **Step 9: Commit**

```bash
git add scraper/
git commit -m "feat: add base scraper, normalization, and prazo parser with tests"
```

---

### Task 7: Implement pharmacy scrapers

**Files:**
- Create: `scraper/scrapers/drogasil.py`, `scraper/scrapers/drogaraia.py`, `scraper/scrapers/paguemenos.py`, `scraper/scrapers/drogariasaopaulo.py`, `scraper/scrapers/panvel.py`
- Create: `scraper/tests/test_scrapers.py`

**IMPORTANT NOTE:** Scraper CSS selectors and URL patterns WILL need adjustment after testing against live sites. The implementations below are best-effort based on typical pharmacy site structures. Each scraper must be tested manually against the real site and selectors updated accordingly. The structure and error handling patterns are production-ready — only the selectors are approximate.

- [ ] **Step 1: Implement Drogasil scraper**

Create `scraper/scrapers/drogasil.py`:
```python
from typing import Optional
from bs4 import BeautifulSoup
from scrapers.base import BaseScraper
from utils.normalize import normalize_search_term
from utils.prazo_parser import parse_prazo


class DrogasilScraper(BaseScraper):
    @property
    def name(self) -> str:
        return "drogasil"

    async def search(self, remedio: str, cep: str) -> Optional[dict]:
        normalized = normalize_search_term(remedio)
        search_url = f"https://www.drogasil.com.br/search?w={normalized.replace(' ', '+')}"

        response = await self._get(search_url)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "lxml")

        # NOTE: Selectors are approximate — must be verified against live site
        product = soup.select_one("[data-testid='product-card'], .product-card, .item-product")
        if not product:
            return None

        nome_el = product.select_one(".product-name, .item-title, h2, h3")
        preco_el = product.select_one(".product-price, .price, [data-testid='price']")
        link_el = product.select_one("a[href]")

        if not nome_el or not preco_el or not link_el:
            return None

        nome_produto = nome_el.get_text(strip=True)
        preco_text = preco_el.get_text(strip=True)
        preco_remedio = self._parse_price(preco_text)
        url_produto = link_el["href"]
        if not url_produto.startswith("http"):
            url_produto = f"https://www.drogasil.com.br{url_produto}"

        # Shipping: POST to pharmacy's shipping calculator API
        frete = 0.0
        prazo_dias = -1
        try:
            frete, prazo_dias = await self._get_shipping(url_produto, cep)
        except Exception:
            pass  # frete stays 0, prazo stays -1

        return {
            "farmacia": self.name,
            "nome_produto": nome_produto,
            "preco_remedio": preco_remedio,
            "frete": frete,
            "preco_total": preco_remedio + frete,
            "prazo_dias": prazo_dias,
            "url_produto": url_produto,
        }

    async def _get_shipping(self, product_url: str, cep: str) -> tuple[float, int]:
        """
        Fetch shipping cost and delivery days for a product + CEP.
        Each pharmacy has a shipping API endpoint — typically found by inspecting
        the network tab when entering a CEP on the product page.

        Pattern: POST to shipping endpoint with product ID + CEP, parse JSON response.

        NOTE: Exact endpoint and payload vary per pharmacy. Must be discovered
        by inspecting each pharmacy's site. Example for Drogasil:
        POST https://www.drogasil.com.br/api/shipping
        Body: {"cep": "01001000", "productId": "12345"}
        Response: {"price": 12.90, "days": 2}

        Selectors/endpoints WILL need live tuning in Task 19.
        """
        # Placeholder — to be implemented per pharmacy in Task 19
        return (0.0, -1)

    def _parse_price(self, text: str) -> float:
        """Parse 'R$ 12,90' -> 12.90"""
        import re
        cleaned = re.sub(r"[^\d,.]", "", text)
        cleaned = cleaned.replace(".", "").replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
```

- [ ] **Step 2: Implement remaining scrapers (same pattern)**

Create `scraper/scrapers/drogaraia.py`, `scraper/scrapers/paguemenos.py`, `scraper/scrapers/drogariasaopaulo.py`, `scraper/scrapers/panvel.py` following the exact same pattern as Drogasil but with their respective URLs:

- Droga Raia: `https://www.drogaraia.com.br/search?w={query}`
- Pague Menos: `https://www.paguemenos.com.br/busca?q={query}`
- Drogaria Sao Paulo: `https://www.drogariasaopaulo.com.br/search?w={query}`
- Panvel: `https://www.panvel.com/busca?q={query}`

Each scraper follows the same structure: search URL → parse HTML → extract first product → return standardized dict. Selectors vary per site and must be tested live.

- [ ] **Step 3: Write scraper tests with mocked HTML**

Create `scraper/tests/test_scrapers.py`:
```python
import pytest
from unittest.mock import AsyncMock, patch
from scrapers.drogasil import DrogasilScraper


MOCK_DROGASIL_HTML = """
<html><body>
<div class="product-card">
  <h3 class="product-name">Dipirona Sodica 500mg 10 Comprimidos</h3>
  <span class="product-price">R$ 8,50</span>
  <a href="/dipirona-sodica-500mg">Link</a>
</div>
</body></html>
"""


@pytest.mark.asyncio
async def test_drogasil_scraper_parses_product():
    scraper = DrogasilScraper()

    mock_response = AsyncMock()
    mock_response.text = MOCK_DROGASIL_HTML
    mock_response.status_code = 200
    mock_response.raise_for_status = lambda: None

    with patch.object(scraper, "_get", return_value=mock_response):
        result = await scraper.search("dipirona 500mg", "01001000")

    assert result is not None
    assert result["farmacia"] == "drogasil"
    assert result["preco_remedio"] == 8.50
    assert "dipirona" in result["nome_produto"].lower()


@pytest.mark.asyncio
async def test_drogasil_scraper_returns_none_on_empty():
    scraper = DrogasilScraper()

    mock_response = AsyncMock()
    mock_response.text = "<html><body>Nenhum resultado</body></html>"
    mock_response.status_code = 200
    mock_response.raise_for_status = lambda: None

    with patch.object(scraper, "_get", return_value=mock_response):
        result = await scraper.search("remedioquenoexiste", "01001000")

    assert result is None
```

- [ ] **Step 4: Run tests**

Run: `cd scraper && python -m pytest tests/ -v`
Expected: All PASS

- [ ] **Step 5: Verify microservice runs locally**

```bash
cd scraper
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Test with: `curl -X POST http://localhost:8000/health`
Expected: `{"status": "ok"}`

- [ ] **Step 6: Commit**

```bash
git add scraper/
git commit -m "feat: implement pharmacy scrapers with tests (selectors need live tuning)"
```

---

## Chunk 3: Core Search Flow (Next.js)

### Task 8: Create search API route with cache

**Files:**
- Create: `src/app/api/search/route.ts`

- [ ] **Step 1: Implement search API route**

Create `src/app/api/search/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeSearchTerm } from "@/lib/normalize";
import { CACHE_TTL_HOURS, SCRAPER_TIMEOUT_MS } from "@/lib/constants";
import type { SearchResponse, CachedResult } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { remedio, cep } = body;

    if (!remedio || !cep) {
      return NextResponse.json(
        { error: "remedio and cep are required" },
        { status: 400 }
      );
    }

    if (!/^\d{8}$/.test(cep)) {
      return NextResponse.json(
        { error: "CEP must be 8 digits" },
        { status: 400 }
      );
    }

    const normalized = normalizeSearchTerm(remedio);

    // Check cache
    const cacheThreshold = new Date(
      Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: cached } = await supabase
      .from("search_cache")
      .select("*")
      .eq("nome_remedio", normalized)
      .eq("cep", cep)
      .gte("buscado_em", cacheThreshold);

    if (cached && cached.length > 0) {
      return NextResponse.json({
        resultados: cached.map(cacheToResult),
        erros: [],
        from_cache: true,
      });
    }

    // Call Python microservice
    const scraperUrl = process.env.SCRAPER_API_URL!;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCRAPER_TIMEOUT_MS);

    let scraperResponse: SearchResponse;
    try {
      const res = await fetch(`${scraperUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remedio: normalized, cep }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Scraper returned ${res.status}`);
      }

      scraperResponse = await res.json();
    } catch (error) {
      clearTimeout(timeout);
      return NextResponse.json(
        { error: "Failed to fetch prices. Please try again." },
        { status: 502 }
      );
    }

    // Save results to cache (upsert)
    if (scraperResponse.resultados.length > 0) {
      const cacheRows = scraperResponse.resultados.map((r) => ({
        nome_remedio: normalized,
        nome_produto: r.nome_produto,
        cep,
        farmacia: r.farmacia,
        preco_remedio: r.preco_remedio,
        frete: r.frete,
        prazo_dias: r.prazo_dias,
        preco_total: r.preco_total,
        url_produto: r.url_produto,
        buscado_em: new Date().toISOString(),
      }));

      await supabase.from("search_cache").upsert(cacheRows, {
        onConflict: "nome_remedio,cep,farmacia",
      });
    }

    return NextResponse.json({
      ...scraperResponse,
      from_cache: false,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function cacheToResult(row: CachedResult) {
  return {
    farmacia: row.farmacia,
    nome_produto: (row as any).nome_produto || row.nome_remedio,
    preco_remedio: row.preco_remedio,
    frete: row.frete,
    preco_total: row.preco_total,
    prazo_dias: row.prazo_dias,
    url_produto: row.url_produto,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/search/
git commit -m "feat: add search API route with cache and scraper integration"
```

---

### Task 9: Build UI components (use @frontend-design skill)

**Files:**
- Create: `src/components/Header.tsx`, `src/components/SearchBar.tsx`, `src/components/CepInput.tsx`, `src/components/ResultCard.tsx`, `src/components/ResultsList.tsx`, `src/components/PrazoBadge.tsx`, `src/components/LoadingSearch.tsx`

**IMPORTANT:** Use the @frontend-design skill for ALL component implementations in this task. The skill will guide creating distinctive, production-grade UI — not generic AI aesthetics. Mobile-first design.

- [ ] **Step 1: Build CepInput component**

Use @frontend-design. Component: masked CEP input (XXXXX-XXX), validates 8 digits, shows error state.

- [ ] **Step 2: Build PrazoBadge component**

Use @frontend-design. Component: colored badge — green (1-2 dias), yellow (3-5 dias), red (6+ dias), gray (-1 = unknown). Shows "X dias úteis" text.

- [ ] **Step 3: Build SearchBar component**

Use @frontend-design. Component: search input + CepInput side by side + submit button. Mobile: stacked vertically. Desktop: horizontal row. Includes camera icon button for OCR (disabled for now).

- [ ] **Step 4: Build Header component**

Use @frontend-design. Component: top nav bar with logo/name "ComparaFarmácia", links to Lista and Perfil (shown only if logged in), Login button (if not logged in).

- [ ] **Step 5: Build ResultCard component**

Use @frontend-design. Component: card showing pharmacy name (with brand color), product name, price breakdown (remédio + frete = total), PrazoBadge, and "Ver na farmácia" external link button. Total price is the visual focus.

- [ ] **Step 6: Build ResultsList component**

Use @frontend-design. Component: renders list of ResultCards sorted by preco_total ascending. Shows pharmacy error messages at the bottom.

- [ ] **Step 7: Build LoadingSearch component**

Use @frontend-design. Component: skeleton cards with pulsing animation + text "Buscando preços em 5 farmácias..." with a progress indicator.

- [ ] **Step 8: Commit**

```bash
git add src/components/
git commit -m "feat: add search UI components with mobile-first design"
```

---

### Task 10: Build Home page and Results page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/resultados/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout with Header**

Modify `src/app/layout.tsx` to include the Header component and set up metadata:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ComparaFarmácia - Compare preços de remédios",
  description:
    "Compare preços de remédios entre as principais farmácias online do Brasil",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Build Home page**

Use @frontend-design. `src/app/page.tsx`: Hero section with headline "Compare preços de remédios", subtitle "Encontre o menor preço com frete incluso nas maiores farmácias do Brasil", SearchBar centered, pharmacy logos row at the bottom. Clean, modern, trustworthy feel.

- [ ] **Step 3: Build Results page**

Create `src/app/resultados/page.tsx`: reads `?remedio=X&cep=Y` from URL params, calls `/api/search` on mount, shows LoadingSearch while waiting, then ResultsList with results. Shows error state if no results. Includes SearchBar at the top for new searches.

- [ ] **Step 4: Test the full search flow manually**

Run `npm run dev`, go to localhost:3000, enter a medicine and CEP, verify:
1. Loading state appears
2. Results appear (or error if scraper is not running)
3. Cards show correct info and sort by total price

- [ ] **Step 5: Commit**

```bash
git add src/app/
git commit -m "feat: add home page and search results page"
```

---

## Chunk 4: Authentication

### Task 11: Build auth pages

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/cadastro/page.tsx`, `src/components/AuthGuard.tsx`

- [ ] **Step 1: Build Login page**

Use @frontend-design. `src/app/login/page.tsx`: email + password form, "Entrar" button, link to cadastro. Uses Supabase `signInWithPassword`. Redirects to home or `?redirect` param on success.

- [ ] **Step 2: Build Cadastro page**

Use @frontend-design. `src/app/cadastro/page.tsx`: email + password + nome + CEP form, "Criar conta" button, link to login. Uses Supabase `signUp` with `data: { nome, cep_padrao }`. After signup, updates profile with CEP.

- [ ] **Step 3: Build AuthGuard component**

Create `src/components/AuthGuard.tsx`:
```typescript
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push(`/login?redirect=${window.location.pathname}`);
      } else {
        setAuthenticated(true);
      }
      setLoading(false);
    });
  }, [router, supabase.auth]);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!authenticated) return null;
  return <>{children}</>;
}
```

- [ ] **Step 4: Test auth flow**

1. Go to /cadastro, create account
2. Verify redirect to home
3. Go to /login, sign in
4. Verify /lista and /perfil are accessible
5. Sign out, verify /lista redirects to /login

- [ ] **Step 5: Commit**

```bash
git add src/app/login/ src/app/cadastro/ src/components/AuthGuard.tsx
git commit -m "feat: add login, signup, and auth guard"
```

---

### Task 12: Build Profile page

**Files:**
- Create: `src/app/perfil/page.tsx`

- [ ] **Step 1: Build Profile page**

Use @frontend-design. `src/app/perfil/page.tsx`: wrapped in AuthGuard. Shows user name, email, editable CEP field with save button. Below: "Buscas recentes" section querying search_cache by the user's CEP (last 10, ordered by buscado_em desc). Logout button.

- [ ] **Step 2: Commit**

```bash
git add src/app/perfil/
git commit -m "feat: add profile page with CEP editing and recent searches"
```

---

## Chunk 5: OCR Feature

### Task 13: Create OCR API route

**Files:**
- Create: `src/app/api/ocr/route.ts`

- [ ] **Step 1: Implement OCR API route**

Create `src/app/api/ocr/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { MAX_IMAGE_SIZE_MB } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate size
    const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Validate type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG and PNG are supported" },
        { status: 400 }
      );
    }

    // Convert to base64 for Google Vision API
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Step 1: Google Cloud Vision OCR
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    const visionData = await visionResponse.json();
    const rawText =
      visionData.responses?.[0]?.fullTextAnnotation?.text || "";

    if (!rawText) {
      return NextResponse.json({
        remedios: [],
        texto_bruto: "",
        confianca: 0,
      });
    }

    // Step 2: Google Gemini to extract medicine names
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extraia os nomes dos medicamentos e dosagens do texto abaixo. O texto foi extraído via OCR de uma receita médica ou caixa de remédio, então pode ter erros.

Retorne APENAS um JSON array no formato:
[{"nome": "nome do remédio", "dosagem": "dosagem ou null"}]

Texto OCR:
${rawText}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    const geminiText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Parse Gemini response (extract JSON from potential markdown code block)
    let remedios = [];
    try {
      const jsonMatch = geminiText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        remedios = JSON.parse(jsonMatch[0]);
      }
    } catch {
      remedios = [];
    }

    return NextResponse.json({
      remedios,
      texto_bruto: rawText,
      confianca: remedios.length > 0 ? 0.8 : 0.2,
    });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/ocr/
git commit -m "feat: add OCR API route with Google Vision + Gemini"
```

---

### Task 14: Build OCR UI components

**Files:**
- Create: `src/components/PhotoUpload.tsx`, `src/components/OcrConfirmation.tsx`
- Modify: `src/components/SearchBar.tsx`

- [ ] **Step 1: Build PhotoUpload component**

Use @frontend-design. Component: camera icon button that opens file picker (accept="image/jpeg,image/png"). On select, shows image preview thumbnail and calls `/api/ocr`. Shows spinner while processing.

- [ ] **Step 2: Build OcrConfirmation component**

Use @frontend-design. Component: modal/dialog showing extracted medicines as editable chips/tags. User can edit names, remove wrong ones, add missing ones. "Buscar todos" button triggers search for each medicine. Shows raw OCR text in a collapsible section for reference.

- [ ] **Step 3: Integrate OCR into SearchBar**

Modify SearchBar to include PhotoUpload button. When OCR returns results, show OcrConfirmation. On confirm, either search for a single medicine or add all to a shopping list.

- [ ] **Step 4: Test OCR flow manually**

Take a photo of a medicine box, upload it, verify:
1. OCR extracts text
2. Gemini identifies medicine names
3. Confirmation dialog shows correctly
4. Search triggers for confirmed medicine

- [ ] **Step 5: Commit**

```bash
git add src/components/PhotoUpload.tsx src/components/OcrConfirmation.tsx src/components/SearchBar.tsx
git commit -m "feat: add OCR photo upload with confirmation dialog"
```

---

## Chunk 6: Shopping Lists

### Task 15: Create shopping list API routes

**Files:**
- Create: `src/app/api/lists/route.ts`, `src/app/api/lists/[id]/route.ts`, `src/app/api/lists/[id]/compare/route.ts`

- [ ] **Step 1: Implement lists CRUD API**

Create `src/app/api/lists/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { MAX_LIST_ITEMS } from "@/lib/constants";

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*, shopping_list_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { nome_lista, items } = body;

  if (items && items.length > MAX_LIST_ITEMS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_LIST_ITEMS} items per list` },
      { status: 400 }
    );
  }

  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .insert({ user_id: user.id, nome_lista: nome_lista || "Minha Lista" })
    .select()
    .single();

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  if (items && items.length > 0) {
    const listItems = items.map((item: { nome_remedio: string }) => ({
      lista_id: list.id,
      nome_remedio: item.nome_remedio,
    }));

    await supabase.from("shopping_list_items").insert(listItems);
  }

  return NextResponse.json(list, { status: 201 });
}
```

- [ ] **Step 2: Implement single list API**

Create `src/app/api/lists/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { MAX_LIST_ITEMS } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*, shopping_list_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { nome_lista, items } = body;

  if (items && items.length > MAX_LIST_ITEMS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_LIST_ITEMS} items per list` },
      { status: 400 }
    );
  }

  if (nome_lista) {
    await supabase
      .from("shopping_lists")
      .update({ nome_lista })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  if (items) {
    // Replace all items
    await supabase.from("shopping_list_items").delete().eq("lista_id", id);
    const listItems = items.map((item: { nome_remedio: string }) => ({
      lista_id: id,
      nome_remedio: item.nome_remedio,
    }));
    await supabase.from("shopping_list_items").insert(listItems);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Implement list comparison API**

Create `src/app/api/lists/[id]/compare/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { normalizeSearchTerm } from "@/lib/normalize";
import { SCRAPER_TIMEOUT_MS } from "@/lib/constants";
import type { SearchResponse } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { cep } = body;

  if (!cep || !/^\d{8}$/.test(cep)) {
    return NextResponse.json({ error: "Valid CEP required" }, { status: 400 });
  }

  // Get list items
  const { data: list } = await supabase
    .from("shopping_lists")
    .select("*, shopping_list_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!list || !list.shopping_list_items?.length) {
    return NextResponse.json({ error: "Empty list" }, { status: 400 });
  }

  // Search each item sequentially to respect rate limits
  // Each search already triggers parallel requests to 5 pharmacies,
  // so searching items sequentially prevents 50+ concurrent pharmacy requests
  const results = [];
  for (const item of list.shopping_list_items as { nome_remedio: string }[]) {
    const res = await fetch(`${request.nextUrl.origin}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remedio: item.nome_remedio, cep }),
    });
    const data: SearchResponse = await res.json();
    results.push({ remedio: item.nome_remedio, ...data });
  }

  // Consolidate by pharmacy: sum prices per pharmacy
  const farmaciaMap: Record<
    string,
    {
      itens: { remedio: string; preco: number; encontrado: boolean }[];
      frete_max: number;
      prazo_max: number;
    }
  > = {};

  for (const result of results) {
    for (const r of result.resultados || []) {
      if (!farmaciaMap[r.farmacia]) {
        farmaciaMap[r.farmacia] = { itens: [], frete_max: 0, prazo_max: 0 };
      }
      farmaciaMap[r.farmacia].itens.push({
        remedio: result.remedio,
        preco: r.preco_remedio,
        encontrado: true,
      });
      farmaciaMap[r.farmacia].frete_max = Math.max(
        farmaciaMap[r.farmacia].frete_max,
        r.frete
      );
      farmaciaMap[r.farmacia].prazo_max = Math.max(
        farmaciaMap[r.farmacia].prazo_max,
        r.prazo_dias
      );
    }
  }

  // Build consolidated comparison
  const totalItems = list.shopping_list_items.length;
  const comparison = Object.entries(farmaciaMap)
    .map(([farmacia, data]) => ({
      farmacia,
      itens_encontrados: data.itens.length,
      itens_total: totalItems,
      soma_remedios: data.itens.reduce((sum, i) => sum + i.preco, 0),
      frete: data.frete_max,
      preco_total:
        data.itens.reduce((sum, i) => sum + i.preco, 0) + data.frete_max,
      prazo_dias: data.prazo_max,
      completa: data.itens.length === totalItems,
      itens: data.itens,
    }))
    .sort((a, b) => {
      // Prioritize pharmacies that have all items
      if (a.completa && !b.completa) return -1;
      if (!a.completa && b.completa) return 1;
      return a.preco_total - b.preco_total;
    });

  return NextResponse.json({ comparison, results });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/lists/
git commit -m "feat: add shopping list CRUD and comparison API routes"
```

---

### Task 16: Build Shopping List UI

**Files:**
- Create: `src/app/lista/page.tsx`, `src/components/ShoppingListCard.tsx`, `src/components/ShoppingListForm.tsx`, `src/components/ComparisonTable.tsx`

- [ ] **Step 1: Build ShoppingListForm component**

Use @frontend-design. Component: input field to add medicine name + "Adicionar" button. Shows list of added items as removable tags/chips. "Salvar lista" and "Comparar preços" buttons. Max 10 items enforced with counter.

- [ ] **Step 2: Build ShoppingListCard component**

Use @frontend-design. Component: card showing list name, item count, created date. Click opens the list. Delete button with confirmation.

- [ ] **Step 3: Build ComparisonTable component**

Use @frontend-design. Component: table/cards showing each pharmacy with: items found vs total, sum of medicine prices, shipping, total price, delivery time. Best option highlighted with a badge. Pharmacies missing items shown with warning. Mobile-responsive (cards on mobile, table on desktop).

- [ ] **Step 4: Build Lista page**

Use @frontend-design. `src/app/lista/page.tsx`: wrapped in AuthGuard. Shows list of user's shopping lists (ShoppingListCard). "Nova lista" button opens ShoppingListForm. When a list is selected, shows its items and "Comparar preços" button. Comparison results shown in ComparisonTable.

- [ ] **Step 5: Test shopping list flow**

1. Create a list with 3 medicines
2. Click "Comparar preços"
3. Verify comparison table shows correct data
4. Delete a list, verify it's gone

- [ ] **Step 6: Commit**

```bash
git add src/app/lista/ src/components/ShoppingList* src/components/ComparisonTable.tsx
git commit -m "feat: add shopping list UI with comparison table"
```

---

## Chunk 7: Final Polish and Deployment

### Task 17: Add error states, loading states, and disclaimer

**Files:**
- Modify: various components
- Create: `src/components/Disclaimer.tsx`

- [ ] **Step 1: Create Disclaimer component**

Use @frontend-design. Small footer banner: "Os preços exibidos são obtidos automaticamente e podem ter variações. Sempre confirme o preço final no site da farmácia antes de comprar."

- [ ] **Step 2: Add error states to all pages**

Review each page and ensure:
- Search with no results shows helpful message
- Network errors show retry button
- OCR failures show fallback text
- Shopping list comparison handles partial results gracefully

- [ ] **Step 3: Add Disclaimer to results pages**

Add Disclaimer to ResultsList and ComparisonTable components.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add error states, loading states, and price disclaimer"
```

---

### Task 18: Deploy

**Files:**
- Modify: `.env.local`, `scraper/.env`

- [ ] **Step 1: Deploy Python microservice to Render**

1. Create new Web Service on Render
2. Point to `scraper/` directory in the repo
3. Build command: `pip install -r requirements.txt && playwright install chromium`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Set environment variables (none needed for v1)
6. Note the Render URL

- [ ] **Step 2: Set up cron-job.org keepalive**

Go to cron-job.org, create a free job that GETs `https://your-render-url.onrender.com/health` every 14 minutes.

- [ ] **Step 3: Deploy Next.js to Vercel**

1. Connect repo to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SCRAPER_API_URL` (Render URL)
   - `GOOGLE_CLOUD_VISION_API_KEY`
   - `GOOGLE_GEMINI_API_KEY`
3. Deploy

- [ ] **Step 4: Set up Supabase pg_cron for cache cleanup**

Verify the cron job from Task 3 is running.

- [ ] **Step 5: End-to-end test on production**

1. Visit the Vercel URL
2. Search for "Dipirona 500mg" with a real CEP
3. Verify results appear
4. Create account, save CEP
5. Create shopping list, compare
6. Test OCR with a real medicine photo

- [ ] **Step 6: Commit any final fixes**

```bash
git add -A
git commit -m "chore: deployment configuration and final fixes"
```

---

### Task 19: Tune scrapers against live sites

**IMPORTANT:** This task requires manual testing and iteration. CSS selectors in the scrapers are approximate and WILL need adjustment.

- [ ] **Step 1: Test each scraper individually**

For each pharmacy (Drogasil, Droga Raia, Pague Menos, DSP, Panvel):
1. Visit the pharmacy site manually
2. Search for a common medicine (e.g., "Dipirona 500mg")
3. Inspect the HTML to find correct CSS selectors for: product name, price, product link
4. Update the scraper's selectors
5. Test via the Python microservice locally

- [ ] **Step 2: Implement shipping/CEP lookup per pharmacy**

Each pharmacy has a different shipping calculation mechanism. For each:
1. Find the shipping API endpoint (inspect network tab while entering CEP on the site)
2. Implement the shipping lookup in the scraper
3. Test with a real CEP

- [ ] **Step 3: Run full integration test**

Search for 3 different medicines across all pharmacies. Verify results are accurate by cross-checking with the actual pharmacy sites.

- [ ] **Step 4: Commit tuned scrapers**

```bash
git add scraper/
git commit -m "fix: tune scraper selectors and shipping lookups for live sites"
```
