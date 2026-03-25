import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeSearchTerm } from "@/lib/normalize";
import { CACHE_TTL_HOURS, SCRAPER_TIMEOUT_MS } from "@/lib/constants";
import type { SearchResponse } from "@/lib/types";

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

    // Check cache first
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
        resultados: cached.map((row) => ({
          farmacia: row.farmacia,
          nome_produto: row.nome_produto || row.nome_remedio,
          preco_remedio: row.preco_remedio,
          frete: row.frete,
          preco_total: row.preco_total,
          prazo_dias: row.prazo_dias,
          url_produto: row.url_produto,
        })),
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
