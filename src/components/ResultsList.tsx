import type { SearchResult } from "@/lib/types";
import ResultCard from "./ResultCard";

interface ResultsListProps {
  resultados: SearchResult[];
  erros: { farmacia: string; motivo: string }[];
}

export default function ResultsList({ resultados, erros }: ResultsListProps) {
  const sorted = [...resultados].sort((a, b) => a.preco_total - b.preco_total);

  return (
    <div className="flex flex-col gap-6">
      {/* Results summary */}
      {sorted.length > 0 && (
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{sorted.length}</span>{" "}
          resultado{sorted.length !== 1 ? "s" : ""} encontrado
          {sorted.length !== 1 ? "s" : ""}, ordenados pelo menor preço total.
        </p>
      )}

      {/* Cards grid */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((result, index) => (
            <ResultCard
              key={`${result.farmacia}-${result.nome_produto}-${index}`}
              result={result}
              rank={index + 1}
            />
          ))}
        </div>
      ) : (
        erros.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <div className="text-4xl">🔍</div>
            <p className="font-semibold text-gray-700">
              Nenhum resultado encontrado
            </p>
            <p className="text-sm text-gray-500 max-w-xs">
              Tente buscar por um nome diferente ou verifique o CEP informado.
            </p>
          </div>
        )
      )}

      {/* Errors section */}
      {erros.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Farmácias com erro na busca
          </p>
          <div className="flex flex-col gap-2">
            {erros.map((erro, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
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
                  className="mt-0.5 shrink-0 text-red-400"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-red-700">
                    {erro.farmacia}
                  </span>
                  <p className="text-xs text-red-600 mt-0.5">{erro.motivo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
