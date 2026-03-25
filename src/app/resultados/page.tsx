"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import LoadingSearch from "@/components/LoadingSearch";
import ResultsList from "@/components/ResultsList";
import type { SearchResponse } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

export default function ResultadosPage() {
  const searchParams = useSearchParams();
  const remedio = searchParams.get("remedio") ?? "";
  const cep = searchParams.get("cep") ?? "";

  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchResults = useCallback(async () => {
    if (!remedio || !cep) return;

    setStatus("loading");
    setData(null);
    setErrorMessage("");

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remedio, cep }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.error ?? `Erro na requisição (status ${res.status})`
        );
      }

      const json: SearchResponse = await res.json();
      setData(json);
      setStatus("success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido. Tente novamente.";
      setErrorMessage(message);
      setStatus("error");
    }
  }, [remedio, cep]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const hasParams = remedio && cep;

  return (
    <main className="flex flex-1 flex-col">
      {/* Top search bar */}
      <div className="border-b border-gray-100 bg-white px-4 py-5 shadow-sm">
        <div className="mx-auto max-w-4xl">
          <SearchBar initialRemedio={remedio} initialCep={cep ? formatCep(cep) : ""} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {/* No params guard */}
        {!hasParams && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-lg font-semibold text-gray-700">
              Nenhuma busca realizada
            </p>
            <p className="text-sm text-gray-500">
              Volte à página inicial e faça uma pesquisa.
            </p>
          </div>
        )}

        {/* Search context heading */}
        {hasParams && status !== "idle" && (
          <div className="mb-6">
            <h1 className="text-lg font-bold text-gray-900">
              Resultados para &ldquo;
              <span className="text-teal-600">{remedio}</span>&rdquo;
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              CEP: {formatCep(cep)}
            </p>
          </div>
        )}

        {/* Loading state */}
        {status === "loading" && <LoadingSearch />}

        {/* Error state */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-800">Falha na busca</p>
              <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
            </div>
            <button
              onClick={fetchResults}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Results */}
        {status === "success" && data && (
          <>
            {data.resultados.length === 0 && data.erros.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                  💊
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    Nenhum resultado encontrado
                  </p>
                  <p className="mt-1 text-sm text-gray-500 max-w-sm">
                    Não encontramos esse medicamento nas farmácias para o CEP
                    informado. Tente outro nome ou verifique o CEP.
                  </p>
                </div>
                <div className="mt-2 flex flex-col gap-2 text-sm text-gray-400">
                  <p>Dicas:</p>
                  <ul className="list-disc list-inside text-left">
                    <li>Use o nome genérico (ex: &ldquo;dipirona&rdquo; em vez de &ldquo;Novalgina&rdquo;)</li>
                    <li>Remova dosagem e tente só o nome</li>
                    <li>Verifique se o CEP está correto</li>
                  </ul>
                </div>
              </div>
            ) : (
              <ResultsList
                resultados={data.resultados}
                erros={data.erros}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function formatCep(cep: string): string {
  const clean = cep.replace(/\D/g, "");
  if (clean.length === 8) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return cep;
}
