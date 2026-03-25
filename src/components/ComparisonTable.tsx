"use client";

import PrazoBadge from "@/components/PrazoBadge";
import { FARMACIAS } from "@/lib/constants";

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

interface ComparisonTableProps {
  comparison: ComparisonResult[];
}

function getDisplayName(farmaciaId: string): string {
  const found = FARMACIAS.find((f) => f.id === farmaciaId);
  return found ? found.nome : farmaciaId;
}

function getPharmacyColor(farmaciaId: string): string {
  const found = FARMACIAS.find((f) => f.id === farmaciaId);
  return found ? found.cor : "#6b7280";
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ComparisonTable({ comparison }: ComparisonTableProps) {
  if (comparison.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Nenhum resultado encontrado para os itens desta lista.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {comparison.map((item, index) => {
        const isBest = index === 0;
        const isMissingItems = !item.completa;
        const missingCount = item.itens_total - item.itens_encontrados;
        const color = getPharmacyColor(item.farmacia);

        return (
          <div
            key={item.farmacia}
            className={[
              "relative flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
              isBest
                ? "border-teal-300 ring-2 ring-teal-200"
                : "border-gray-100",
            ].join(" ")}
          >
            {/* Best option badge */}
            {isBest && (
              <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-teal-600 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Melhor opção
              </span>
            )}

            {/* Pharmacy header */}
            <div className="flex items-center gap-3 pt-1">
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <h3 className="text-base font-bold text-gray-900">
                {getDisplayName(item.farmacia)}
              </h3>
            </div>

            {/* Items found */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Itens encontrados</span>
              <span
                className={`font-semibold ${
                  item.completa ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {item.itens_encontrados}/{item.itens_total}
              </span>
            </div>

            {/* Missing items warning */}
            {isMissingItems && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Faltam {missingCount} {missingCount === 1 ? "item" : "itens"}
              </div>
            )}

            {/* Price breakdown */}
            <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Remédios</span>
                <span className="font-medium text-gray-800">
                  {formatCurrency(item.soma_remedios)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Frete</span>
                <span className="font-medium text-gray-800">
                  {item.frete === 0 ? (
                    <span className="text-emerald-600 font-semibold">
                      Grátis
                    </span>
                  ) : (
                    formatCurrency(item.frete)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-base">
                <span className="font-bold text-gray-900">Total</span>
                <span
                  className={`font-extrabold ${
                    isBest ? "text-teal-700" : "text-gray-900"
                  }`}
                >
                  {formatCurrency(item.preco_total)}
                </span>
              </div>
            </div>

            {/* Prazo badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Prazo de entrega</span>
              <PrazoBadge prazo_dias={item.prazo_dias} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
