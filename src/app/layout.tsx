import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ComparaFarmácia — Encontre o menor preço de remédios",
  description:
    "Compare preços de medicamentos nas maiores farmácias do Brasil: Drogasil, Droga Raia, Pague Menos e Drogaria São Paulo.",
  keywords: ["farmácia", "remédio", "comparar preço", "medicamento", "frete"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${sora.variable} h-full antialiased`}>
      <body className="noise-overlay min-h-full flex flex-col mesh-bg font-sans text-navy-900">
        <Header />
        <div className="flex flex-1 flex-col relative z-10">{children}</div>
      </body>
    </html>
  );
}
