# Comparador de Precos de Farmacias — Design Spec

## Resumo

Plataforma web que compara precos de remedios entre as principais farmacias online do Brasil (Drogasil, Droga Raia, Pague Menos, Drogaria Sao Paulo, Panvel), mostrando preco do remedio + frete + prazo de entrega, ordenado por preco total. O usuario informa o CEP e busca por nome do remedio, foto da receita ou caixa do remedio. Busca por principio ativo e melhoria futura (v2) — requer base de dados mapeando principio ativo para nomes comerciais. Suporta lista de compras com comparacao consolidada.

## Publico-alvo

Qualquer pessoa que queira encontrar o melhor preco de remedios — desde compras do dia a dia ate medicamentos de uso continuo.

## Stack Tecnica

| Componente | Tecnologia | Hosting |
|---|---|---|
| Frontend + API | Next.js 14 (App Router, TypeScript) | Vercel (free) |
| Auth + Banco | Supabase (Auth + PostgreSQL) | Supabase (free) |
| Scrapers | Python (httpx + BeautifulSoup + Playwright quando necessario) | Render (free) |
| OCR | Google Cloud Vision API | Google Cloud (free tier) |
| Parser de receita | Google Gemini API | Google AI (free tier) |
| Cache | Supabase PostgreSQL (TTL de 1h) | Junto do banco |
| Manter scraper acordado | Cron-job.org (pinga a cada 14 min) | Gratuito |

## Arquitetura

### Fluxo principal (busca on-demand)

```
[Usuario busca remedio + CEP]
         |
  [Next.js API Route]
         |
  [Chama microservico Python no Render]
         |
  [Dispara scrapers em paralelo (5 farmacias)]
   |      |      |      |      |
Drogasil  Raia  Pague  DSP  Panvel
   |      |      |      |      |
  [Retorna preco + frete + prazo por farmacia]
         |
  [Salva no cache (Supabase) com TTL 1h]
         |
  [Ordena por preco total, retorna ao frontend]
```

### Fluxo OCR

```
[Usuario envia foto da receita/caixa]
         |
  [Next.js envia imagem pro Google Cloud Vision API]
         |
  [OCR retorna texto bruto]
         |
  [Texto enviado pro Google Gemini API]
         |
  [Gemini extrai nomes dos remedios + dosagens]
         |
  [Usuario confirma/corrige os remedios identificados]
         |
  [Busca on-demand para cada remedio]
```

### Scraping responsavel

- Respeitar robots.txt de cada farmacia
- Rate limit de 1 request a cada 2-3 segundos por farmacia
- Apenas on-demand (quando o usuario busca), sem crawler massivo
- Sem armazenamento de catalogo — apenas cache curto (1h)
- Incluir link direto pro produto na farmacia (manda trafego de volta)
- User-Agent fixo e transparente (ex: "ComparaFarmacia/1.0") — sem rotacao, sem evasao
- Timeout de 15s por farmacia — se nao responder, ignora

### Contrato do microservico Python (API REST)

O microservico Python no Render expoe um unico endpoint:

**POST /search**

Request:
```json
{
  "remedio": "Dipirona 500mg",
  "cep": "01001000"
}
```

Response:
```json
{
  "resultados": [
    {
      "farmacia": "drogasil",
      "nome_produto": "Dipirona Sodica 500mg 10 Comprimidos - Generico",
      "preco_remedio": 8.50,
      "frete": 12.90,
      "preco_total": 21.40,
      "prazo_dias": 2,
      "url_produto": "https://www.drogasil.com.br/..."
    }
  ],
  "erros": [
    { "farmacia": "panvel", "motivo": "timeout" }
  ]
}
```

Notas:
- `prazo_dias` e um inteiro normalizado (dias uteis). O scraper converte textos como "2 dias uteis", "entrega amanha" para inteiro
- Classificacao no frontend: verde (1-2 dias), amarelo (3-5 dias), vermelho (6+ dias)
- Farmacias que falharam vao no array `erros` com motivo

### Estrategia de scraping por farmacia

Priorizar httpx + BeautifulSoup (sem browser). Playwright apenas como fallback para farmacias que renderizam preco via JavaScript. Render free tier tem 512MB RAM — Playwright consome ~150MB por instancia, entao no maximo 2-3 instancias simultaneas. As demais usam httpx (leve, ~5MB).

### Cache: consulta e limpeza

Antes de disparar scraping, a API checa o cache:
```sql
SELECT * FROM search_cache
WHERE nome_remedio = $1 AND cep = $2 AND buscado_em > NOW() - INTERVAL '1 hour'
```
Se houver resultados validos, retorna do cache sem scraping.

Limpeza: Supabase pg_cron (extensao nativa) roda diariamente:
```sql
DELETE FROM search_cache WHERE buscado_em < NOW() - INTERVAL '1 hour'
```

## Modelo de Dados

### Tabelas

**users** (gerenciada pelo Supabase Auth)
- id (UUID, PK)
- email
- nome
- cep_padrao
- created_at

**search_cache**
- id (UUID, PK)
- nome_remedio (text)
- cep (text)
- farmacia (text)
- preco_remedio (decimal)
- frete (decimal)
- prazo_dias (integer) — dias uteis normalizado
- preco_total (decimal)
- url_produto (text)
- buscado_em (timestamp)
- UNIQUE em (nome_remedio, cep, farmacia) — upsert com ON CONFLICT DO UPDATE SET para sobrescrever com dados frescos
- INDEX em (nome_remedio, cep, buscado_em)

### Normalizacao de termos de busca

Antes de qualquer cache read/write ou chamada ao microservico, o termo de busca passa por normalizacao:
1. Lowercase
2. Trim whitespace e colapsar espacos multiplos
3. Remover acentos (e.g., "farmácia" -> "farmacia")
4. Padronizar dosagem: "500 mg" -> "500mg", "1g" -> "1000mg"

Funcao aplicada tanto no Next.js (antes de consultar cache) quanto no microservico Python (antes de retornar resultados). Isso garante cache hit rate alto.

**shopping_lists**
- id (UUID, PK)
- user_id (FK -> users)
- nome_lista (text)
- created_at

**shopping_list_items**
- id (UUID, PK)
- lista_id (FK -> shopping_lists)
- nome_remedio (text)
- principio_ativo (text, nullable)

Nota: historico de buscas pode ser derivado do search_cache (por CEP e timestamp). Tabela dedicada desnecessaria na v1.

## Telas e Fluxo do Usuario

### Telas principais

1. **Login/Cadastro** — email + senha via Supabase Auth, pede CEP no cadastro
2. **Home/Busca** — campo de busca central + campo CEP (pre-preenchido se logado) + botao de foto (OCR) + acesso a lista de compras. Busca funciona sem login — usuario informa CEP manualmente. Login necessario apenas para: salvar CEP padrao, listas de compras, e ver historico.
3. **Resultados da busca** — cards por farmacia ordenados por preco total:
   - Nome do produto + dosagem
   - Preco do remedio
   - Frete
   - Preco total (destaque)
   - Prazo de entrega (badge colorido: verde = rapido, amarelo = medio, vermelho = lento)
   - Botao "Ver na farmacia" (link direto)
4. **Lista de compras** — adicionar varios remedios, comparacao consolidada por farmacia ("Comprar tudo na Drogasil = R$X" vs "Comprar tudo na Raia = R$Y"). Limite de 10 itens por lista. Algoritmo de combo misto: calcula custo total (remedios + frete por farmacia) para cada combinacao via brute-force (10 itens x 5 farmacias = maximo 5^10, mas na pratica cortado com poda: se uma farmacia nao tem o item, elimina). Para v1, mostrar apenas custo total por farmacia unica (sem combo misto) — combo misto e melhoria futura.
5. **Perfil** — editar CEP, ver buscas recentes (derivado do cache)

### Upload de imagem (OCR)

- Formatos aceitos: JPEG, PNG
- Tamanho maximo: 10MB (validado no frontend antes de enviar)
- Se imagem ilegivel ou OCR retornar confianca baixa: mostra texto extraido e pede correcao manual
- Google Cloud Vision tem limite de 20MB por imagem, mas 10MB e suficiente para fotos de celular

### Fluxo principal

```
Cadastro -> Informa CEP -> Busca remedio (texto ou foto)
  -> Aguarda scraping (~5-10s com loading animado)
    -> Ve resultados ordenados por preco total
      -> Clica "Ver na farmacia" -> Vai pro site da farmacia
```

### Fluxo lista de compras

```
Adiciona remedios a lista -> Clica "Comparar tudo"
  -> Scraping sequencial por farmacia (respeitando rate limit):
     Para cada farmacia: busca todos os itens da lista com 2-3s entre requests
     Farmacias diferentes rodam em paralelo (max 5 simultaneas)
  -> Tabela consolidada: custo total por farmacia (soma remedios + 1 frete)
    -> Destaca melhor opcao (menor preco total)
```

## Tratamento de Erros

- **Farmacia fora do ar:** Ignora e mostra as que responderam, com aviso "Nao conseguimos consultar a [farmacia] neste momento"
- **Scraping bloqueado:** Retry com backoff. Se persistir, marca farmacia como indisponivel temporariamente
- **OCR falhou:** Mostra texto extraido e pede confirmacao manual do usuario
- **Nenhum resultado:** Sugere verificar o nome do remedio ou buscar pelo principio ativo
- **CEP invalido:** Validacao no frontend antes de buscar
- **Cache expirado:** Faz nova busca automaticamente e atualiza cache

## Limitacoes e Riscos

- **Termos de uso:** Web scraping pode violar ToS das farmacias. Risco baixo para projeto pessoal com scraping responsavel e on-demand
- **Mudancas no HTML:** Sites mudam layout e quebram scrapers. Necessario monitorar e ajustar periodicamente
- **Precisao:** Precos/frete podem ter discrepancia entre scraping e site real. Incluir disclaimer e link direto
- **Cold start do Render:** Free tier desliga apos inatividade. Mitigado com cron-job.org pingando a cada 14 minutos
- **Limites free tier:** Google Vision (1500 req/mes), Gemini API (free tier), Supabase (500MB), Vercel (100GB bandwidth)

## Monetizacao

Nenhuma. Projeto pessoal/portfolio.

## Decisoes de design

1. **Scraping on-demand vs pre-coletado:** On-demand escolhido por ser mais simples, dados sempre frescos, e nao desperdicar recursos com remedios que ninguem busca
2. **Supabase vs Firebase:** Supabase escolhido por ter PostgreSQL (dados relacionais: remedios, precos, farmacias, listas sao naturalmente relacionais) vs Firestore (NoSQL, teria que desnormalizar tudo)
3. **Next.js full stack:** Uma linguagem (TypeScript), um repo, um deploy no Vercel. Scrapers em Python separados porque Python e melhor pra scraping
4. **Conta opcional para busca, obrigatoria para features persistentes:** Busca funciona sem login (usuario informa CEP manualmente). Login necessario para: salvar CEP padrao, listas de compras, historico. Isso reduz friccao e permite que qualquer pessoa use a plataforma imediatamente.
5. **Frontend-design skill:** Sera utilizada na implementacao para UI de alta qualidade, mobile-first
