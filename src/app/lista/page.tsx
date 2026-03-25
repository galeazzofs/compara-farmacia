"use client";

import { useState, useEffect, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import ShoppingListForm from "@/components/ShoppingListForm";
import ComparisonTable, {
  ComparisonResult,
} from "@/components/ComparisonTable";
import CepInput from "@/components/CepInput";
import type { ShoppingList } from "@/lib/types";

// ─── Inner page (rendered after AuthGuard) ───────────────────────────────────

function ListaPageContent() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Selected list state
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [cep, setCep] = useState("");
  const [cepError, setCepError] = useState("");
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState<ComparisonResult[] | null>(null);
  const [compareError, setCompareError] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Save loading
  const [saving, setSaving] = useState(false);

  const fetchLists = useCallback(async () => {
    setLoadingLists(true);
    try {
      const res = await fetch("/api/lists");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLists(data.lists ?? []);
    } catch {
      // silently fail — user will see empty state
    } finally {
      setLoadingLists(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  async function handleSave(nome: string, items: string[]) {
    setSaving(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_lista: nome,
          items: items.map((nome_remedio) => ({ nome_remedio })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao salvar lista");
      }

      setShowForm(false);
      await fetchLists();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar lista.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(listId: string) {
    setDeletingId(listId);
    try {
      const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir lista");

      if (selectedList?.id === listId) {
        setSelectedList(null);
        setComparison(null);
      }

      setDeleteConfirmId(null);
      await fetchLists();
    } catch {
      alert("Não foi possível excluir a lista. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCompare() {
    if (!selectedList) return;

    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length !== 8) {
      setCepError("Informe um CEP válido com 8 dígitos.");
      return;
    }
    setCepError("");
    setComparing(true);
    setComparison(null);
    setCompareError("");

    try {
      const res = await fetch(`/api/lists/${selectedList.id}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: rawCep }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao comparar preços");
      }

      setComparison(data.comparison);
    } catch (err) {
      setCompareError(
        err instanceof Error ? err.message : "Erro ao comparar preços."
      );
    } finally {
      setComparing(false);
    }
  }

  function selectList(list: ShoppingList) {
    setSelectedList(list);
    setComparison(null);
    setCompareError("");
    setCep("");
    setCepError("");
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Minhas listas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize remédios e compare preços de uma só vez.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 active:bg-teal-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova lista
          </button>
        )}
      </div>

      {/* New list form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-bold text-gray-900">
            Nova lista de remédios
          </h2>
          {saving ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            </div>
          ) : (
            <ShoppingListForm
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lists sidebar */}
        <div className="lg:col-span-1">
          {loadingLists ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            </div>
          ) : lists.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">
                Nenhuma lista criada ainda.
              </p>
              <p className="text-xs text-gray-400">
                Clique em &ldquo;Nova lista&rdquo; para começar.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {lists.map((list) => {
                const isSelected = selectedList?.id === list.id;
                const itemCount = list.items?.length ?? 0;
                const isConfirmingDelete = deleteConfirmId === list.id;
                const isDeleting = deletingId === list.id;

                return (
                  <li key={list.id}>
                    <div
                      className={[
                        "group relative flex flex-col gap-1 rounded-2xl border bg-white p-4 transition-all",
                        isSelected
                          ? "border-teal-300 ring-2 ring-teal-200 shadow-sm"
                          : "border-gray-100 hover:border-gray-200 hover:shadow-sm cursor-pointer",
                      ].join(" ")}
                      onClick={() => !isConfirmingDelete && selectList(list)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (!isConfirmingDelete) selectList(list);
                        }
                      }}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          {list.nome_lista}
                        </p>

                        {/* Delete button / confirm */}
                        {isConfirmingDelete ? (
                          <div
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-gray-500">
                              Excluir?
                            </span>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDelete(list.id)}
                              className="rounded-lg bg-red-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {isDeleting ? "..." : "Sim"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded-lg border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(list.id);
                            }}
                            aria-label={`Excluir lista ${list.nome_lista}`}
                            className="shrink-0 rounded-lg p-1 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 focus:opacity-100"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-gray-400">
                        {itemCount} {itemCount === 1 ? "item" : "itens"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selectedList ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">
                Selecione uma lista para comparar preços.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* List detail card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  {selectedList.nome_lista}
                </h2>

                {/* Items */}
                {selectedList.items && selectedList.items.length > 0 ? (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {selectedList.items.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 ring-1 ring-teal-200"
                      >
                        {item.nome_remedio}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mb-5 text-sm text-gray-400">
                    Esta lista não tem itens.
                  </p>
                )}

                {/* CEP + compare */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <CepInput
                      value={cep}
                      onChange={(v) => {
                        setCep(v);
                        setCepError("");
                      }}
                      error={cepError}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCompare}
                    disabled={
                      comparing ||
                      !selectedList.items ||
                      selectedList.items.length === 0
                    }
                    className="h-12 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed active:bg-emerald-800 whitespace-nowrap"
                  >
                    {comparing ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Comparando...
                      </span>
                    ) : (
                      "Comparar preços"
                    )}
                  </button>
                </div>

                {comparing && (
                  <p className="mt-2 text-xs text-gray-400">
                    Buscando preços em cada farmácia sequencialmente. Isso pode
                    levar alguns segundos.
                  </p>
                )}
              </div>

              {/* Compare error */}
              {compareError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {compareError}
                </div>
              )}

              {/* Comparison results */}
              {comparison && (
                <div>
                  <h3 className="mb-4 text-base font-bold text-gray-900">
                    Comparação de preços
                  </h3>
                  <ComparisonTable comparison={comparison} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Page export wrapped in AuthGuard ────────────────────────────────────────

export default function ListaPage() {
  return (
    <AuthGuard>
      <ListaPageContent />
    </AuthGuard>
  );
}
