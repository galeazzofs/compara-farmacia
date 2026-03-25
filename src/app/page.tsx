import SearchBar from "@/components/SearchBar";
import { FARMACIAS } from "@/lib/constants";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero section */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50 px-4 py-20 sm:py-28">
        {/* Subtle background decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-teal-50 opacity-70 blur-3xl" />
          <div className="absolute top-20 right-0 h-64 w-64 rounded-full bg-emerald-50 opacity-50 blur-2xl" />
        </div>

        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-6 text-center">
          {/* Pill badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Comparação gratuita em tempo real
          </span>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Compare preços de{" "}
            <span className="text-teal-600">remédios</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-lg text-base text-gray-500 sm:text-lg leading-relaxed">
            Encontre o menor preço com frete incluso nas maiores farmácias do
            Brasil. Rápido, simples e sem cadastro.
          </p>

          {/* Search bar */}
          <div className="mt-2 w-full">
            <SearchBar />
          </div>

          {/* Helper text */}
          <p className="text-xs text-gray-400">
            Ex: &ldquo;Dipirona 500mg&rdquo;, &ldquo;Losartana 50mg&rdquo;,
            &ldquo;Omeprazol 20mg&rdquo;
          </p>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-t border-gray-100 bg-white px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Feature
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              title="Tempo real"
              description="Buscamos os preços no momento da sua pesquisa, sem dados desatualizados."
            />
            <Feature
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              }
              title="Frete incluso"
              description="O preço total já inclui o frete para o seu CEP. Sem surpresas."
            />
            <Feature
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
              title="5 farmácias"
              description="Comparamos Drogasil, Droga Raia, Pague Menos, Drogaria SP e Panvel."
            />
          </div>
        </div>
      </section>

      {/* Pharmacy logos strip */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            Farmácias comparadas
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {FARMACIAS.map((farmacia) => (
              <div
                key={farmacia.id}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: farmacia.cor }}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-gray-700">
                  {farmacia.nome}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
