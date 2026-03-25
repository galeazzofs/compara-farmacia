"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CepInput from "./CepInput";

interface SearchBarProps {
  initialRemedio?: string;
  initialCep?: string;
}

export default function SearchBar({
  initialRemedio = "",
  initialCep = "",
}: SearchBarProps) {
  const router = useRouter();
  const [remedio, setRemedio] = useState(initialRemedio);
  const [cep, setCep] = useState(initialCep);
  const [remedioError, setRemedioError] = useState("");
  const [cepError, setCepError] = useState("");

  function validate() {
    let valid = true;
    if (!remedio.trim()) {
      setRemedioError("Informe o nome do remédio.");
      valid = false;
    } else {
      setRemedioError("");
    }

    const cepClean = cep.replace(/\D/g, "");
    if (!cepClean || cepClean.length !== 8) {
      setCepError("CEP inválido. Use o formato XXXXX-XXX.");
      valid = false;
    } else {
      setCepError("");
    }
    return valid;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const params = new URLSearchParams({
      remedio: remedio.trim(),
      cep: cep.replace(/\D/g, ""),
    });
    router.push(`/resultados?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-2"
      noValidate
    >
      {/* Medicine name input */}
      <div className="flex flex-col gap-1 flex-1">
        <input
          type="text"
          placeholder="Nome do remédio (ex: Dipirona 500mg)"
          value={remedio}
          onChange={(e) => setRemedio(e.target.value)}
          aria-label="Nome do remédio"
          className={[
            "h-12 w-full rounded-xl border bg-white px-4 text-sm text-gray-800 outline-none transition-all",
            "placeholder:text-gray-400",
            "focus:ring-2 focus:ring-teal-500 focus:border-teal-500",
            remedioError
              ? "border-red-400 focus:ring-red-400 focus:border-red-400"
              : "border-gray-200",
          ].join(" ")}
        />
        {remedioError && (
          <p className="text-xs text-red-500 font-medium pl-1">{remedioError}</p>
        )}
      </div>

      {/* CEP input */}
      <div className="sm:w-44">
        <CepInput value={cep} onChange={setCep} error={cepError} />
      </div>

      {/* Camera placeholder button */}
      <button
        type="button"
        disabled
        title="Em breve: busca por foto da receita"
        aria-label="Busca por foto (em breve)"
        className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400 cursor-not-allowed transition-colors hover:border-teal-300 hover:text-teal-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      {/* Search button */}
      <button
        type="submit"
        className="h-12 shrink-0 rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white transition-all hover:bg-teal-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto w-full"
      >
        Comparar preços
      </button>
    </form>
  );
}
