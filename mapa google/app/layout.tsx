import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mapa Google",
  description: "Proyecto Next.js + TypeScript",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
