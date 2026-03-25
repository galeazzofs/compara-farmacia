import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { MAX_LIST_ITEMS } from "@/lib/constants";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: lists, error } = await supabase
      .from("shopping_lists")
      .select("*, items:shopping_list_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/lists error:", error);
      return NextResponse.json(
        { error: "Failed to fetch lists" },
        { status: 500 }
      );
    }

    return NextResponse.json({ lists: lists ?? [] });
  } catch (error) {
    console.error("GET /api/lists unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { nome_lista, items } = body as {
      nome_lista: string;
      items: { nome_remedio: string }[];
    };

    if (!nome_lista || typeof nome_lista !== "string" || !nome_lista.trim()) {
      return NextResponse.json(
        { error: "nome_lista is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items must be a non-empty array" },
        { status: 400 }
      );
    }

    if (items.length > MAX_LIST_ITEMS) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_LIST_ITEMS} items allowed` },
        { status: 400 }
      );
    }

    const { data: list, error: listError } = await supabase
      .from("shopping_lists")
      .insert({ user_id: user.id, nome_lista: nome_lista.trim() })
      .select()
      .single();

    if (listError || !list) {
      console.error("POST /api/lists insert list error:", listError);
      return NextResponse.json(
        { error: "Failed to create list" },
        { status: 500 }
      );
    }

    const itemRows = items.map((item) => ({
      lista_id: list.id,
      nome_remedio: item.nome_remedio.trim(),
      principio_ativo: null,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from("shopping_list_items")
      .insert(itemRows)
      .select();

    if (itemsError) {
      console.error("POST /api/lists insert items error:", itemsError);
      // Clean up the created list
      await supabase.from("shopping_lists").delete().eq("id", list.id);
      return NextResponse.json(
        { error: "Failed to create list items" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { list: { ...list, items: createdItems ?? [] } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/lists unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
