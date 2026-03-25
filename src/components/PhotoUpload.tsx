"use client";

import { useRef, useState } from "react";
import { OcrResult } from "@/lib/types";
import { MAX_IMAGE_SIZE_MB } from "@/lib/constants";

interface PhotoUploadProps {
  onResult: (result: OcrResult) => void;
}

export default function PhotoUpload({ onResult }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleButtonClick() {
    setError(null);
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);
    setPreview(null);

    // Validate size
    const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`Imagem muito grande. Máximo ${MAX_IMAGE_SIZE_MB} MB.`);
      e.target.value = "";
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload via FormData
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Erro ${res.status} ao processar imagem.`);
      }

      const result: OcrResult = await res.json();
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem. Tente novamente.");
    } finally {
      setLoading(false);
      // Reset input so the same file can be re-selected if needed
      e.target.value = "";
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Selecionar imagem da receita"
      />

      {/* Camera button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
        title="Buscar por foto da receita"
        aria-label="Buscar por foto da receita"
        className={[
          "hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors",
          loading
            ? "border-teal-300 text-teal-400 cursor-wait"
            : "border-teal-400 text-teal-600 hover:bg-teal-50 hover:border-teal-500 active:scale-95 cursor-pointer",
        ].join(" ")}
      >
        {loading ? (
          /* Spinner */
          <svg
            className="animate-spin"
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
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          /* Camera icon */
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
        )}
      </button>

      {/* Preview thumbnail */}
      {preview && (
        <div className="absolute top-14 left-0 z-10 rounded-lg border border-gray-200 bg-white p-1 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Pré-visualização da receita"
            className="h-16 w-16 rounded object-cover"
          />
        </div>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute top-14 left-0 z-10 w-56 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 shadow-md">
          {error}
        </div>
      )}
    </div>
  );
}
