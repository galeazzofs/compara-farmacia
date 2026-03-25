"use client";

import { useState } from "react";
import { OcrResult } from "@/lib/types";

interface OcrConfirmationProps {
  result: OcrResult;
  onConfirm: (remedios: string[]) => void;
  onCancel: () => void;
}

interface MedicineEntry {
  id: number;
  value: string;
}

let nextId = 1;

function makeEntry(value: string): MedicineEntry {
  return { id: nextId++, value };
}

export default function OcrConfirmation({
  result,
  onConfirm,
  onCancel,
}: OcrConfirmationProps) {
  const [entries, setEntries] = useState<MedicineEntry[]>(() =>
    result.remedios.length > 0
      ? result.remedios.map((r) =>
          makeEntry(r.dosagem ? `${r.nome} ${r.dosagem}` : r.nome)
        )
      : [makeEntry("")]
  );
  const [rawOpen, setRawOpen] = useState(false);

  const lowConfidence = result.confianca < 0.5;

  function updateEntry(id: number, value: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, value } : e))
    );
  }

  function removeEntry(id: number) {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      return next.length > 0 ? next : [makeEntry("")];
    });
  }

  function addEntry() {
    setEntries((prev) => [...prev, makeEntry("")]);
  }

  function handleConfirm() {
    const names = entries
      .map((e) => e.value.trim())
      .filter((v) => v.length > 0);
    if (names.length === 0) return;
    onConfirm(names);
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ocr-dialog-title"
    >
      {/* Dialog panel */}
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 id="ocr-dialog-title" className="text-base font-semibold text-gray-800">
            Remédios encontrados na receita
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
          {/* Low-confidence warning */}
          {lowConfidence && (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>
                Não conseguimos identificar os remédios com segurança. Verifique
                os nomes abaixo.
              </span>
            </div>
          )}

          {/* Editable medicine list */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Remédios
            </p>
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={entry.value}
                  onChange={(e) => updateEntry(entry.id, e.target.value)}
                  placeholder="Nome do remédio"
                  className="h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  aria-label="Remover remédio"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
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
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Add medicine button */}
            <button
              type="button"
              onClick={addEntry}
              className="flex items-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-xs font-medium text-teal-600 hover:bg-teal-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
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
              Adicionar remédio
            </button>
          </div>

          {/* Collapsible raw OCR text */}
          {result.texto_bruto && (
            <div className="rounded-xl border border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setRawOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                aria-expanded={rawOpen}
              >
                <span>Texto extraído (OCR)</span>
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
                  className={`transition-transform ${rawOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {rawOpen && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <p className="whitespace-pre-wrap text-xs text-gray-600 leading-relaxed">
                    {result.texto_bruto}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 h-10 rounded-xl bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
}
