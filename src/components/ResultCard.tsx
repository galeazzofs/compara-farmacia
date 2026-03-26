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
        "animate-fade-in-up relative flex flex-col gap-4 rounded-2xl p-5 transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-900/5",
        isBestPrice
          ? "glass-card ring-2 ring-brand-400/30 animate-pulse-glow"
          : "glass-card",
      ].join(" ")}
      style={{ animationDelay: `${(rank || 1) * 100}ms` }}
    >
      {/* Best price badge */}
      {isBestPrice && (
        <div className="absolute -top-3 left-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3.5 py-1 text-xs font-bold text-white shadow-lg shadow-brand-500/30">
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
            Melhor preco
          </span>
        </div>
      )}

      {/* Header row: pharmacy name + prazo badge */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="h-7 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: borderColor }}
            aria-hidden="true"
          />
          <span className="font-[var(--font-display)] font-bold text-navy-800 text-sm truncate">
            {farmaciaName}
          </span>
        </div>
        <PrazoBadge prazo_dias={result.prazo_dias} />
      </div>

      {/* Product name */}
      <p className="text-sm text-navy-400 leading-snug line-clamp-2 -mt-1">
        {result.nome_produto}
      </p>

      {/* Price breakdown */}
      <div className="flex flex-col gap-1.5 rounded-xl bg-navy-50/60 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-navy-400">
          <span>Remedio</span>
          <span className="text-navy-600 font-medium">{formatBRL(result.preco_remedio)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-navy-400">
          <span>Frete</span>
          <span className={result.frete === 0 ? "text-brand-600 font-semibold" : "text-navy-600 font-medium"}>
            {result.frete === 0 ? "Gratis" : formatBRL(result.frete)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between border-t border-navy-200/50 pt-2">
          <span className="text-sm font-semibold text-navy-500">Total</span>
          <span className={[
            "text-2xl font-extrabold font-[var(--font-display)] tracking-tight",
            isBestPrice ? "text-brand-600" : "text-navy-900",
          ].join(" ")}>
            {formatBRL(result.preco_total)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <a
        href={result.url_produto}
        target="_blank"
        rel="noopener noreferrer"
        className={[
          "mt-auto flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-all active:scale-95",
          isBestPrice
            ? "bg-brand-500 text-white hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/20"
            : "bg-navy-900 text-white hover:bg-navy-800 hover:shadow-lg hover:shadow-navy-900/15",
        ].join(" ")}
      >
        Ver na farmacia
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
