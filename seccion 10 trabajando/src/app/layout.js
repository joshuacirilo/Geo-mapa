import './globals.css';

export const metadata = {
  title: 'Geo-mapa',
  description: 'Mapa con Leaflet y herramientas de dibujo'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
