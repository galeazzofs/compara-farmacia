"use client";

import { useState, KeyboardEvent } from "react";
import { MAX_LIST_ITEMS } from "@/lib/constants";

interface ShoppingListFormProps {
  onSave: (nome: string, items: string[]) => void;
  onCancel?: () => void;
  initialItems?: string[];
  initialName?: string;
}

export default function ShoppingListForm({
  onSave,
  onCancel,
  initialItems = [],
  initialName = "",
}: ShoppingListFormProps) {
  const [nome, setNome] = useState(initialName);
  const [items, setItems] = useState<string[]>(initialItems);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  function addItem() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (items.length >= MAX_LIST_ITEMS) {
      setError(`Máximo de ${MAX_LIST_ITEMS} itens permitidos.`);
      return;
    }

    if (items.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      setError("Este remédio já foi adicionado.");
      return;
    }

    setItems((prev) => [...prev, trimmed]);
    setInputValue("");
    setError("");
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setError("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  }

  function handleSave() {
    if (!nome.trim()) {
      setError("O nome da lista é obrigatório.");
      return;
    }
    if (items.length === 0) {
      setError("Adicione pelo menos um remédio à lista.");
      return;
    }
    setError("");
    onSave(nome.trim(), items);
  }

  const atLimit = items.length >= MAX_LIST_ITEMS;

  return (
    <div className="flex flex-col gap-5">
      {/* List name */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="nome-lista"
          className="text-sm font-semibold text-gray-700"
        >
          Nome da lista
        </label>
        <input
          id="nome-lista"
          type="text"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setError("");
          }}
          placeholder="Ex: Medicamentos mensais"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 transition-all"
        />
      </div>

      {/* Add medicine input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="add-remedio"
            className="text-sm font-semibold text-gray-700"
          >
            Remédios
          </label>
          <span
            className={`text-xs font-medium ${
              atLimit ? "text-red-500" : "text-gray-400"
            }`}
          >
            {items.length}/{MAX_LIST_ITEMS}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            id="add-remedio"
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Dipirona 500mg"
            disabled={atLimit}
            className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="button"
            onClick={addItem}
            disabled={atLimit || !inputValue.trim()}
            className="h-11 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:bg-teal-800"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Item chips */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 ring-1 ring-teal-200"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(index)}
                aria-label={`Remover ${item}`}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-teal-500 hover:bg-teal-200 hover:text-teal-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 h-11 rounded-xl bg-teal-600 text-sm font-semibold text-white transition-colors hover:bg-teal-700 active:bg-teal-800"
        >
          Salvar lista
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
