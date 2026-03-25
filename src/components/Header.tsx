"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="ComparaFarmácia — página inicial"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-sm shadow-sm group-hover:bg-teal-700 transition-colors">
            CF
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">
            Compara<span className="text-teal-600">Farmácia</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/lista"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    Minhas Listas
                  </Link>
                  <Link
                    href="/perfil"
                    className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-700 font-semibold text-sm hover:bg-teal-100 transition-colors"
                    aria-label="Meu perfil"
                    title="Meu perfil"
                  >
                    {user.email?.charAt(0).toUpperCase() ?? "U"}
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
                >
                  Entrar
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
