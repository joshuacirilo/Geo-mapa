# Geo-mapa (Next + Leaflet)

Proyecto en Next.js con Leaflet para:
- Mostrar marcadores desde una API (`/api/markers`).
- Dibujar poligonos y circulos.
- Exportar la figura a GeoJSON y mostrarla en el sidebar.

Este README te permite recrear el proyecto en otra carpeta y entender la
estructura, arquitectura, flujo y funciones actuales.

## Requisitos
- Node.js 18+ (recomendado) y npm.
- Base de datos configurada para Prisma (ver `.env`).

## Crear el proyecto desde cero
1. Crea la carpeta y entra:
```bash
mkdir geo-mapa
cd geo-mapa
```

2. Inicializa Next:
```bash
npx create-next-app@latest .
```

3. Instala dependencias:
```bash
npm i leaflet leaflet-sidebar
npm i prisma @prisma/client
```

4. Copia la estructura y archivos desde este repo (seccion de estructura).
5. Configura `.env` y Prisma:
```bash
npx prisma generate
```

6. Levanta el proyecto:
```bash
npm run dev
```

## Estructura
```
src/
  app/
    api/
      markers/
        route.js         # API de markers (GET/POST)
    components/
      MapClient.jsx      # Inicializa Leaflet y orquesta logica
      MapControls.jsx    # Controles UI (checkbox, select, botones)
      MapCanvas.jsx      # Contenedor del mapa
      MapSidebar.jsx     # Sidebar para GeoJSON
    globals.css          # CSS global + Leaflet CSS
    layout.js
    page.js              # Renderiza MapClient
  app/lib/
    prisma.js            # Cliente Prisma (si aplica)
prisma/
  schema.prisma
```

## Arquitectura
- **Cliente**: `MapClient.jsx` (React client component) crea el mapa Leaflet
  y maneja la logica de dibujo, sidebar y markers.
- **UI separada**: `MapControls`, `MapCanvas`, `MapSidebar` son componentes
  reutilizables de presentacion.
- **Backend**: `/api/markers` expone los markers como GeoJSON.
- **Datos**: Prisma obtiene markers desde la base de datos.

## Flujo general
1. `page.js` renderiza `<MapClient />`.
2. `MapClient` monta Leaflet en `MapCanvas`.
3. `MapClient` carga markers desde `/api/markers` y los agrega como GeoJSON.
4. Controles permiten activar dibujo y crear figuras.
5. Al crear, se genera GeoJSON y se muestra en `MapSidebar`.

## Componentes y funciones

### `MapClient.jsx`
- Inicializa Leaflet con opciones del mapa (center, zoom, bounds).
- Configura iconos default (`L.Icon.Default.mergeOptions`).
- Crea sidebar con `leaflet-sidebar`.
- Carga markers con `fetch('/api/markers')`.
- Dibujo:
  - Poligono: cada click agrega un punto.
  - Circulo: primer click define centro, segundo click define radio.
  - `Crear` exporta GeoJSON y lo renderiza en el sidebar.
  - `Limpiar` borra figura y resetea estado.

### `MapControls.jsx`
UI de controles:
- Checkbox: activar dibujo.
- Select: tipo de figura (`polygon` o `circle`).
- Botones: `Crear`, `Limpiar`.

### `MapCanvas.jsx`
Contenedor del mapa Leaflet (div con id configurable).

### `MapSidebar.jsx`
Contenedor del sidebar donde se imprime el GeoJSON.

### `/api/markers/route.js`
Endpoints:
- `GET`: devuelve FeatureCollection.
- `POST`: crea un marker con `id_public`, `title`, `categoria`, `geojson`.

## Configuracion del mapa
Las opciones del mapa se definen en `src/app/components/MapClient.jsx`
en el constructor:
```js
const map = L.map(mapRef.current, {
  center: [14.607820, -90.513863],
  zoom: 7,
  zoomControl: false,
  attributionControl: true,
  keyboard: true,
  minZoom: 7,
  maxZoom: 16,
  maxBounds: [[18.44834670293207, -88.04443359375001], [10.692996347925087, -92.98828125]]
});
```

## CSS global
`src/app/globals.css` importa los estilos de Leaflet y sidebar:
```css
@import "leaflet/dist/leaflet.css";
@import "leaflet-sidebar/src/L.Control.Sidebar.css";
```

## Notas de integracion
- Los IDs de controles pueden configurarse pasando `ids` a `MapClient`.
- Los markers deben venir como GeoJSON (Point) desde la API.
- Si el icono por defecto no aparece, asegurate de que `MapClient.jsx`
  resuelva correctamente las URLs (`iconUrl?.src`).

## Sugerencias de extension
- Guardar GeoJSON generado en backend.
- Filtrar markers por bounds del poligono/circulo.
- Edicion de figuras existentes.
