# Geo Mapa (Next.js + Google Maps + Mapbox Isochrone)

README de handoff para continuar el trabajo en el mismo contexto.

## Stack actual
- Next.js 15 + TypeScript (App Router).
- Google Maps JavaScript API (2D + 3D).
- Mapbox Isochrone API para isocronas.
- Tailwind CSS (instalado y activo).

## Estructura relevante
- [app/page.tsx](/c:/Users/Joshua C/Desktop/aprendizaje/geo-mapas/Geo-mapa/mapa google/app/page.tsx): entrada principal.
- [app/components/MapModeSwitcher.tsx](/c:/Users/Joshua C/Desktop/aprendizaje/geo-mapas/Geo-mapa/mapa google/app/components/MapModeSwitcher.tsx): switch 2D/3D.
- [app/components/circle.tsx](/c:/Users/Joshua C/Desktop/aprendizaje/geo-mapas/Geo-mapa/mapa google/app/components/circle.tsx): mapa 2D, dibujo, medicion, ISO sidebar.
- [app/components/isocrone.tsx](/c:/Users/Joshua C/Desktop/aprendizaje/geo-mapas/Geo-mapa/mapa google/app/components/isocrone.tsx): cliente Mapbox isochrone.
- [app/components/Map3DView.tsx](/c:/Users/Joshua C/Desktop/aprendizaje/geo-mapas/Geo-mapa/mapa google/app/components/Map3DView.tsx): vista 3D.
- [app/data/geojson.ts](/c:/Users/Joshua C/Desktop/aprendizaje/geo-mapas/Geo-mapa/mapa google/app/data/geojson.ts): puntos de marcadores.
- [app/estilos mapa/vegetacion y caminos.ts](/c:/Users/Joshua C/Desktop/aprendizaje/geo-mapas/Geo-mapa/mapa google/app/estilos mapa/vegetacion y caminos.ts): estilo local de mapa vegetacion.

## Variables de entorno
Usar `.env`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="tu_google_maps_key"
NEXT_PUBLIC_MAP_LOAD_COST_USD="0.007"

# Mapbox (isocronas)
NEXT_PUBLIC_ACCESS_TOKEN="tu_mapbox_token"
# opcional alias soportado por codigo:
# NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="tu_mapbox_token"
```

`.env.example` actualmente solo trae las variables base de Google; si se comparte el proyecto conviene agregar ahi el token de Mapbox.

## Flujo funcional actual
### 1) Selector de modo
- `2D`: renderiza `Circle`.
- `3D`: renderiza `Map3DView`.

### 2) Mapa 2D (`Circle`)
- Centro inicial: Zona 10, Ciudad de Guatemala.
- Restriccion de bounds: Guatemala (`strictBounds: true`).
- Toolbar superior:
  - Dibujar `polyline`, `polygon`, `circle`.
  - `X` limpiar figuras.
  - `MED` para medir distancia entre 2 clics.
  - `ISO` para abrir panel lateral de isocrona.
  - selector tipo de mapa (`roadmap`, `satellite`, `hybrid`, `terrain`, `vegetacion`).

### 3) Marcadores desde GeoJSON
- Solo se cargan features `Point`.
- Se muestran solo si caen dentro de las figuras dibujadas.

### 4) Isocronas (Mapbox)
- Archivo de consumo: `app/components/isocrone.tsx`.
- Endpoint usado:
  - `https://api.mapbox.com/isochrone/v1/mapbox/{profile}/{lng},{lat}?contours_minutes={minutes}&polygons=true&access_token={token}`
- El response GeoJSON se guarda en variable `geoJson` y se imprime en consola:
  - `console.log("MAPBOX_ISO_GEOJSON:", geoJson);`

### 5) Sidebar ISO (estado actual)
En `interactionMode === "iso"` se muestra sidebar con estilo Tailwind y campos:
- `longitud`
- `latitude`
- `routing profile` (driving, driving-traffic, walking, cycling)
- `contour` en minutos
- boton `Marcar en el mapa`
- boton `Crear`

Comportamiento:
- `Marcar en el mapa`: activa captura (`isPickingIsoPoint`).
- En el siguiente click del mapa:
  - actualiza `isoLatitude` y `isoLongitude`,
  - desactiva captura,
  - imprime `Latitud: ..., Longitud: ...` en consola.
- `Crear`:
  - consume Mapbox con los parametros actuales,
  - dibuja poligono en Google Maps,
  - imprime respuesta de API en consola.

## Decisiones importantes tomadas (historial reciente)
- Se elimino por completo la integracion vieja de `iso4app` y su API route.
- Se migro la isocrona a Mapbox.
- El flujo ISO dejo de depender del click directo para crear; ahora usa formulario + boton `Crear`.
- Se agrego captura opcional de coordenadas desde el mapa.
- Se instalo Tailwind y se aplico al sidebar ISO sin romper la logica existente.

## Pendientes recomendados (para siguiente agente)
1. Migrar toolbar y paneles restantes (aun inline-style) a Tailwind para consistencia visual.
2. Agregar validacion UX para lat/lng (rangos validos) y mensajes mas claros.
3. Agregar `NEXT_PUBLIC_ACCESS_TOKEN` a `.env.example`.
4. Documentar costo/limites de Mapbox Isochrone.
5. Revisar si se necesita mantener `app/components/GoogleMap.tsx` y `VegetationMapView.tsx` (posible codigo no usado en flujo principal).

## Ejecutar
```bash
npm install
npm run dev
```
