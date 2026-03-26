import SearchBar from "@/components/SearchBar";
import { FARMACIAS } from "@/lib/constants";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero section */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Background decoration */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-brand-400/8 blur-3xl animate-float" />
          <div className="absolute top-20 right-1/4 h-80 w-80 rounded-full bg-blue-400/5 blur-3xl animate-float delay-300" />
          <div className="absolute -bottom-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-orange-400/5 blur-3xl" />
        </div>

        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-5 text-center">
          {/* Pill badge */}
          <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/80 px-4 py-1.5 text-xs font-semibold text-brand-700 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            Comparando precos ao vivo
          </span>

          {/* Heading */}
          <h1 className="animate-fade-in-up delay-100 font-[var(--font-display)] text-4xl font-extrabold leading-[1.1] tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
            Encontre o melhor{" "}
            <br className="hidden sm:block" />
            <span className="text-gradient">preco de remedios</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up delay-200 max-w-md text-base text-navy-400 sm:text-lg leading-relaxed">
            Compare precos com frete incluso nas maiores farmacias do Brasil.
            Rapido, gratuito e em tempo real.
          </p>

          {/* Search bar */}
          <div className="animate-fade-in-up delay-300 mt-3 w-full">
            <SearchBar />
          </div>

          {/* Helper text */}
          <p className="animate-fade-in delay-400 text-xs text-navy-300">
            Ex: &ldquo;Dipirona 500mg&rdquo;, &ldquo;Losartana 50mg&rdquo;,
            &ldquo;Omeprazol 20mg&rdquo;
          </p>
        </div>
      </section>

      {/* Features strip */}
      <section className="relative px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Feature
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              title="Tempo real"
              description="Precos buscados no momento da sua pesquisa, sempre atualizados."
              delay="delay-100"
            />
            <Feature
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              }
              title="Frete incluso"
              description="Preco total com frete para o seu CEP. Sem surpresas."
              delay="delay-200"
            />
            <Feature
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
              title="4 farmacias"
              description="Drogasil, Droga Raia, Pague Menos e Drogaria Sao Paulo."
              delay="delay-300"
            />
          </div>
        </div>
      </section>

      {/* Pharmacy strip */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-navy-300">
            Farmacias comparadas
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {FARMACIAS.map((farmacia) => (
              <div
                key={farmacia.id}
                className="glass-card flex items-center gap-2 rounded-full px-4 py-2 hover:scale-105 transition-all duration-300 cursor-default"
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: farmacia.cor }}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-navy-600">
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
  delay = "",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: string;
}) {
  return (
    <div className={`animate-fade-in-up ${delay} glass-card flex flex-col gap-3 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600">
        {icon}
      </div>
      <div>
        <p className="font-[var(--font-display)] font-semibold text-navy-800">{title}</p>
        <p className="mt-1 text-sm text-navy-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
