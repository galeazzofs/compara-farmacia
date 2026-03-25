import React from "react";

interface CepInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function CepInput({ value, onChange, error }: CepInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    const masked =
      raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
    onChange(masked);
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        inputMode="numeric"
        placeholder="CEP (ex: 01310-100)"
        value={value}
        onChange={handleChange}
        maxLength={9}
        aria-label="CEP"
        className={[
          "h-12 w-full rounded-xl border bg-white px-4 text-sm text-gray-800 outline-none transition-all",
          "placeholder:text-gray-400",
          "focus:ring-2 focus:ring-teal-500 focus:border-teal-500",
          error
            ? "border-red-400 focus:ring-red-400 focus:border-red-400"
            : "border-gray-200",
        ].join(" ")}
      />
      {error && (
        <p className="text-xs text-red-500 font-medium pl-1">{error}</p>
      )}
    </div>
  );
}
