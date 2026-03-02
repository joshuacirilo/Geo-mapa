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
  const iso4appKey =
    process.env.NEXT_PUBLIC_ISO4APP_KEY ?? process.env.ISO4APP ?? "";

  return (
    <html lang="es">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ISO4APP_KEY__=${JSON.stringify(iso4appKey)};`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
