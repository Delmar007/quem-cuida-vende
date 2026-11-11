import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import Header from "@/components/Header";
import ProfileNoticeModal from "@/components/ProfileNoticeModal";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kittanda Outlet - Outlet de Estoque",
  description: "As melhores ofertas e liquidações de estoque",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${dmSans.variable} ${plusJakarta.variable} ${playfair.variable}`}
    >
      <body className={`${dmSans.className} min-h-screen bg-white text-neutral-900 antialiased`}>
        {/* Cabeçalho Interativo com Modal de Autenticação envolvido em Suspense */}
        <Suspense fallback={<div className="h-[120px] w-full bg-white" />}>
          <Header />
        </Suspense>

        {/* Aviso de Cadastro Pendente */}
        <ProfileNoticeModal />

        {/* Container principal de 940px */}
        <main className="mx-auto w-full max-w-[940px] px-3 sm:px-4 py-6 md:py-8 overflow-x-clip">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-gray-200 mt-12 md:mt-16 py-8 w-full overflow-hidden">
          <div className="mx-auto max-w-[940px] px-4 text-xs text-gray-400 text-center tracking-widest uppercase">
            &copy; 2026 Kittanda Outlet &bull; Todos os direitos reservados.
          </div>
        </footer>
      </body>
    </html>
  );
}
