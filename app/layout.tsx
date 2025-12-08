// /app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "INATUR - Sistema de Actividades",
  description:
    "Sistema de gestión de actividades operativas y efemérides de INATUR Táchira",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // CAMBIO: Agregamos 'suppressHydrationWarning' para evitar errores
    // causados por extensiones del navegador (LastPass, Grammarly, etc.)
    // que modifican el DOM antes de que React termine de cargar.
    <html lang="es" suppressHydrationWarning>
      <head />
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
