interface PrazoBadgeProps {
  prazo_dias: number;
}

export default function PrazoBadge({ prazo_dias }: PrazoBadgeProps) {
  if (prazo_dias === -1) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
        Indisponível
      </span>
    );
  }

  if (prazo_dias <= 2) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        {prazo_dias === 0 ? "Hoje" : `${prazo_dias} dia${prazo_dias > 1 ? "s" : ""} útil${prazo_dias > 1 ? "eis" : ""}`}
      </span>
    );
  }

  if (prazo_dias <= 5) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
        {prazo_dias} dias úteis
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
      {prazo_dias} dias úteis
    </span>
  );
}
