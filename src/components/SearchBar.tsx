"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CepInput from "./CepInput";
import PhotoUpload from "./PhotoUpload";
import OcrConfirmation from "./OcrConfirmation";
import { OcrResult } from "@/lib/types";

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
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

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

  function handleOcrResult(result: OcrResult) {
    setOcrResult(result);
  }

  function handleOcrConfirm(remedios: string[]) {
    setOcrResult(null);
    const cepClean = cep.replace(/\D/g, "");

    if (remedios.length === 1) {
      const params = new URLSearchParams({ remedio: remedios[0], cep: cepClean });
      router.push(`/resultados?${params.toString()}`);
    } else {
      const params = new URLSearchParams({ remedio: remedios[0], cep: cepClean });
      router.push(`/resultados?${params.toString()}`);
    }
  }

  function handleOcrCancel() {
    setOcrResult(null);
  }

  return (
    <>
      {ocrResult && (
        <OcrConfirmation
          result={ocrResult}
          onConfirm={handleOcrConfirm}
          onCancel={handleOcrCancel}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="glass-card w-full rounded-2xl p-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-1.5"
        noValidate
      >
        {/* Medicine name input */}
        <div className="flex flex-col gap-1 flex-1">
          <input
            type="text"
            placeholder="Nome do remedio (ex: Dipirona 500mg)"
            value={remedio}
            onChange={(e) => setRemedio(e.target.value)}
            aria-label="Nome do remédio"
            className={[
              "h-11 w-full rounded-xl border-0 bg-transparent px-4 text-sm text-navy-800 outline-none transition-all",
              "placeholder:text-navy-300",
              "focus:bg-white focus:ring-2 focus:ring-brand-400/40",
              remedioError ? "ring-2 ring-red-400/40 bg-red-50/50" : "",
            ].join(" ")}
          />
          {remedioError && (
            <p className="text-xs text-red-500 font-medium pl-3">{remedioError}</p>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-navy-200/50 self-center" />

        {/* CEP input */}
        <div className="sm:w-40">
          <CepInput value={cep} onChange={setCep} error={cepError} />
        </div>

        {/* Photo upload */}
        <PhotoUpload onResult={handleOcrResult} />

        {/* Search button */}
        <button
          type="submit"
          className="h-11 shrink-0 rounded-xl bg-brand-500 px-6 text-sm font-bold text-white transition-all hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 sm:w-auto w-full"
        >
          Comparar precos
        </button>
      </form>
    </>
  );
}
