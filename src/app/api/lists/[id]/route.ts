import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { MAX_LIST_ITEMS } from "@/lib/constants";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
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

    const { data: list, error } = await supabase
      .from("shopping_lists")
      .select("*, items:shopping_list_items(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({ list });
  } catch (error) {
    console.error("GET /api/lists/[id] unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
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

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const body = await request.json();
    const { nome_lista, items } = body as {
      nome_lista?: string;
      items?: { nome_remedio: string }[];
    };

    // Update list name if provided
    if (nome_lista !== undefined) {
      if (typeof nome_lista !== "string" || !nome_lista.trim()) {
        return NextResponse.json(
          { error: "nome_lista must be a non-empty string" },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from("shopping_lists")
        .update({ nome_lista: nome_lista.trim() })
        .eq("id", id);

      if (updateError) {
        console.error("PUT /api/lists/[id] update name error:", updateError);
        return NextResponse.json(
          { error: "Failed to update list name" },
          { status: 500 }
        );
      }
    }

    // Replace items if provided
    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return NextResponse.json(
          { error: "items must be an array" },
          { status: 400 }
        );
      }

      if (items.length > MAX_LIST_ITEMS) {
        return NextResponse.json(
          { error: `Maximum of ${MAX_LIST_ITEMS} items allowed` },
          { status: 400 }
        );
      }

      // Delete existing items and insert new ones
      const { error: deleteError } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("lista_id", id);

      if (deleteError) {
        console.error("PUT /api/lists/[id] delete items error:", deleteError);
        return NextResponse.json(
          { error: "Failed to replace items" },
          { status: 500 }
        );
      }

      if (items.length > 0) {
        const itemRows = items.map((item) => ({
          lista_id: id,
          nome_remedio: item.nome_remedio.trim(),
          principio_ativo: null,
        }));

        const { error: insertError } = await supabase
          .from("shopping_list_items")
          .insert(itemRows);

        if (insertError) {
          console.error("PUT /api/lists/[id] insert items error:", insertError);
          return NextResponse.json(
            { error: "Failed to insert new items" },
            { status: 500 }
          );
        }
      }
    }

    // Return updated list with items
    const { data: updatedList, error: refetchError } = await supabase
      .from("shopping_lists")
      .select("*, items:shopping_list_items(*)")
      .eq("id", id)
      .single();

    if (refetchError || !updatedList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({ list: updatedList });
  } catch (error) {
    console.error("PUT /api/lists/[id] unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
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

    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("DELETE /api/lists/[id] error:", error);
      return NextResponse.json(
        { error: "Failed to delete list" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/lists/[id] unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
