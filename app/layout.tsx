import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-Loyalty — Cartes de fidélité digitales",
  description: "Plateforme SaaS de cartes de fidélité digitales pour commerces physiques.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
