"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import CepInput from "@/components/CepInput";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface RecentSearch {
  id: string;
  termo: string;
  buscado_em: string;
}

function PerfilContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [nome, setNome] = useState("");
  const [cep, setCep] = useState("");
  const [cepSaving, setCepSaving] = useState(false);
  const [cepSaved, setCepSaved] = useState(false);
  const [cepError, setCepError] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loadingSearches, setLoadingSearches] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUser(data.user);
      setNome(data.user.user_metadata?.nome ?? "");

      // Load profile CEP
      const { data: profile } = await supabase
        .from("profiles")
        .select("cep_padrao")
        .eq("id", data.user.id)
        .single();

      if (profile?.cep_padrao) {
        setCep(profile.cep_padrao);
      }

      // Load recent searches filtered by user's CEP
      const cepValue = profile?.cep_padrao ?? "";
      const query = supabase
        .from("search_cache")
        .select("id, termo, buscado_em")
        .order("buscado_em", { ascending: false })
        .limit(10);

      if (cepValue) {
        query.eq("cep", cepValue);
      }

      const { data: searches } = await query;
      setRecentSearches(searches ?? []);
      setLoadingSearches(false);
    });
  }, []);

  async function handleSaveCep(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length !== 8) {
      setCepError("Informe um CEP válido com 8 dígitos.");
      return;
    }

    setCepError("");
    setCepSaving(true);
    setCepSaved(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ cep_padrao: cep })
      .eq("id", user.id);

    setCepSaving(false);
    if (error) {
      setCepError("Erro ao salvar o CEP. Tente novamente.");
    } else {
      setCepSaved(true);
      setTimeout(() => setCepSaved(false), 3000);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu perfil</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas informações e preferências
          </p>
        </div>

        {/* User info card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            Informações da conta
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Nome</label>
              <div className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm text-gray-700 flex items-center">
                {nome || "—"}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">
                E-mail
              </label>
              <div className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm text-gray-700 flex items-center">
                {user?.email ?? "—"}
              </div>
            </div>
          </div>
        </div>

        {/* CEP card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-800">
            CEP padrão
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Usado para calcular o frete nas comparações.
          </p>
          <form onSubmit={handleSaveCep} className="flex flex-col gap-3">
            <CepInput value={cep} onChange={setCep} error={cepError} />
            {cepSaved && (
              <p className="text-sm font-medium text-emerald-600">
                CEP salvo com sucesso!
              </p>
            )}
            <button
              type="submit"
              disabled={cepSaving}
              className="h-11 w-full rounded-xl bg-teal-600 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
            >
              {cepSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Salvando…
                </span>
              ) : (
                "Salvar"
              )}
            </button>
          </form>
        </div>

        {/* Recent searches card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            Buscas recentes
          </h2>

          {loadingSearches ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            </div>
          ) : recentSearches.length === 0 ? (
            <p className="text-sm text-gray-400">
              Nenhuma busca encontrada para o seu CEP.
            </p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentSearches.map((search) => (
                <li
                  key={search.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {search.termo}
                  </span>
                  <span className="ml-4 shrink-0 text-xs text-gray-400">
                    {formatDate(search.buscado_em)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sign out */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-800">Sair</h2>
          <p className="mb-4 text-sm text-gray-500">
            Encerrar a sessão neste dispositivo.
          </p>
          <button
            onClick={handleSignOut}
            className="h-11 rounded-xl border border-red-200 bg-red-50 px-6 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </main>
  );
}

export default function PerfilPage() {
  return (
    <AuthGuard>
      <PerfilContent />
    </AuthGuard>
  );
}
