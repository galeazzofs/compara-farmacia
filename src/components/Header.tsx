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
    <header className="sticky top-0 z-50 w-full border-b border-navy-200/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="ComparaFarmácia — página inicial"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white font-bold text-xs tracking-wider shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
            <span className="relative z-10">CF</span>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="font-[var(--font-display)] font-bold text-navy-900 text-lg tracking-tight">
            Compara<span className="text-gradient">Farmácia</span>
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
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy-500 hover:text-navy-900 hover:bg-navy-50 transition-all duration-200"
                  >
                    Minhas Listas
                  </Link>
                  <Link
                    href="/perfil"
                    className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold text-xs shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                    aria-label="Meu perfil"
                    title="Meu perfil"
                  >
                    {user.email?.charAt(0).toUpperCase() ?? "U"}
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-navy-900 px-5 py-2 text-sm font-semibold text-white hover:bg-navy-800 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
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
