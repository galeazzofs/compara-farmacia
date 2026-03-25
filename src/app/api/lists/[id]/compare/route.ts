import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import type { SearchResponse, ShoppingListItem } from "@/lib/types";

export interface ComparisonResult {
  farmacia: string;
  itens_encontrados: number;
  itens_total: number;
  soma_remedios: number;
  frete: number;
  preco_total: number;
  prazo_dias: number;
  completa: boolean;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cep } = body as { cep: string };

    if (!cep) {
      return NextResponse.json({ error: "cep is required" }, { status: 400 });
    }

    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length !== 8) {
      return NextResponse.json(
        { error: "CEP must be 8 digits" },
        { status: 400 }
      );
    }

    // Verify ownership and fetch list with items
    const { data: list, error: listError } = await supabase
      .from("shopping_lists")
      .select("*, items:shopping_list_items(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (listError || !list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const items: ShoppingListItem[] = list.items ?? [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "List has no items to compare" },
        { status: 400 }
      );
    }

    // Build base URL for internal API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL
      : request.nextUrl.origin;

    // Collect per-pharmacy data across all items
    // Map: farmacia -> { soma_remedios, frete, prazo_dias, itens_encontrados }
    const pharmacyMap = new Map<
      string,
      {
        soma_remedios: number;
        frete: number;
        prazo_dias: number;
        itens_encontrados: number;
      }
    >();

    // Search each item SEQUENTIALLY to respect rate limits
    for (const item of items) {
      let searchResult: SearchResponse;

      try {
        const res = await fetch(`${baseUrl}/api/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ remedio: item.nome_remedio, cep: rawCep }),
        });

        if (!res.ok) {
          // Skip this item if search fails
          continue;
        }

        searchResult = await res.json();
      } catch {
        // Skip this item on network/parse error
        continue;
      }

      for (const resultado of searchResult.resultados) {
        const existing = pharmacyMap.get(resultado.farmacia);
        if (existing) {
          existing.soma_remedios += resultado.preco_remedio;
          // Take the max frete across items for this pharmacy
          existing.frete = Math.max(existing.frete, resultado.frete);
          // Take the max prazo_dias across items
          existing.prazo_dias = Math.max(
            existing.prazo_dias,
            resultado.prazo_dias
          );
          existing.itens_encontrados += 1;
        } else {
          pharmacyMap.set(resultado.farmacia, {
            soma_remedios: resultado.preco_remedio,
            frete: resultado.frete,
            prazo_dias: resultado.prazo_dias,
            itens_encontrados: 1,
          });
        }
      }
    }

    const itens_total = items.length;

    // Build comparison array
    const comparison: ComparisonResult[] = Array.from(
      pharmacyMap.entries()
    ).map(([farmacia, data]) => {
      const completa = data.itens_encontrados === itens_total;
      const soma_remedios = parseFloat(data.soma_remedios.toFixed(2));
      const frete = parseFloat(data.frete.toFixed(2));
      const preco_total = parseFloat((soma_remedios + frete).toFixed(2));

      return {
        farmacia,
        itens_encontrados: data.itens_encontrados,
        itens_total,
        soma_remedios,
        frete,
        preco_total,
        prazo_dias: data.prazo_dias,
        completa,
      };
    });

    // Sort: complete pharmacies first, then by total price ascending
    comparison.sort((a, b) => {
      if (a.completa !== b.completa) {
        return a.completa ? -1 : 1;
      }
      return a.preco_total - b.preco_total;
    });

    return NextResponse.json({ comparison });
  } catch (error) {
    console.error("POST /api/lists/[id]/compare unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
