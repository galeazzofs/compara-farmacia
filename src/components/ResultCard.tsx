import type { SearchResult } from "@/lib/types";
import { FARMACIAS } from "@/lib/constants";
import PrazoBadge from "./PrazoBadge";

interface ResultCardProps {
  result: SearchResult;
  rank?: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export default function ResultCard({ result, rank }: ResultCardProps) {
  const farmaciaInfo = FARMACIAS.find(
    (f) => f.id === result.farmacia.toLowerCase().replace(/\s/g, "")
  );
  const borderColor = farmaciaInfo?.cor ?? "#6b7280";
  const farmaciaName = farmaciaInfo?.nome ?? result.farmacia;

  const isBestPrice = rank === 1;

  return (
    <article
      className={[
        "relative flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm border transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        isBestPrice
          ? "border-teal-200 ring-1 ring-teal-200"
          : "border-gray-100",
      ].join(" ")}
    >
      {/* Best price badge */}
      {isBestPrice && (
        <div className="absolute -top-3 left-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Melhor preço
          </span>
        </div>
      )}

      {/* Header row: pharmacy name + prazo badge */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Colored left accent */}
          <div
            className="h-6 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: borderColor }}
            aria-hidden="true"
          />
          <span className="font-bold text-gray-900 text-sm truncate">
            {farmaciaName}
          </span>
        </div>
        <PrazoBadge prazo_dias={result.prazo_dias} />
      </div>

      {/* Product name */}
      <p className="text-sm text-gray-500 leading-snug line-clamp-2 -mt-1">
        {result.nome_produto}
      </p>

      {/* Price breakdown */}
      <div className="flex flex-col gap-1 rounded-xl bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Remédio</span>
          <span>{formatBRL(result.preco_remedio)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Frete</span>
          <span className={result.frete === 0 ? "text-emerald-600 font-medium" : ""}>
            {result.frete === 0 ? "Grátis" : formatBRL(result.frete)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
          <span className="text-sm font-semibold text-gray-700">Total</span>
          <span className="text-xl font-bold text-gray-900">
            {formatBRL(result.preco_total)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <a
        href={result.url_produto}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto flex h-10 items-center justify-center gap-1.5 rounded-xl bg-teal-600 text-sm font-semibold text-white transition-all hover:bg-teal-700 active:scale-95"
      >
        Ver na farmácia
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
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </article>
  );
}
