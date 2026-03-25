import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ComparaFarmácia — Encontre o menor preço de remédios",
  description:
    "Compare preços de medicamentos com frete incluso nas maiores farmácias do Brasil: Drogasil, Droga Raia, Pague Menos, Drogaria São Paulo e Panvel.",
  keywords: ["farmácia", "remédio", "comparar preço", "medicamento", "frete"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 font-sans text-gray-900">
        <Header />
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
