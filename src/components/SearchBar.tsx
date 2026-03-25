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
      // Multiple medicines: search for the first one for now
      // Future: offer shopping list creation
      const params = new URLSearchParams({ remedio: remedios[0], cep: cepClean });
      router.push(`/resultados?${params.toString()}`);
    }
  }

  function handleOcrCancel() {
    setOcrResult(null);
  }

  return (
    <>
      {/* OCR confirmation modal */}
      {ocrResult && (
        <OcrConfirmation
          result={ocrResult}
          onConfirm={handleOcrConfirm}
          onCancel={handleOcrCancel}
        />
      )}

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

        {/* Photo upload (replaces disabled camera placeholder) */}
        <PhotoUpload onResult={handleOcrResult} />

        {/* Search button */}
        <button
          type="submit"
          className="h-12 shrink-0 rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white transition-all hover:bg-teal-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto w-full"
        >
          Comparar preços
        </button>
      </form>
    </>
  );
}
