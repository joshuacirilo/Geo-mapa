# Geo Mapa - Handoff para Agente IA

Este documento resume el estado real del proyecto para que otro agente pueda continuar sin perder contexto ni romper la arquitectura.

## Stack
- Next.js 15 (App Router) + TypeScript.
- Google Maps JavaScript API (mapa 2D principal).
- Mapbox Isochrone API (isocronas).
- Tailwind CSS (UI del sidebar ISO).

## Punto de entrada
- `app/page.tsx` monta el flujo principal y el switch 2D/3D.
- `app/components/circle.tsx` concentra casi toda la logica de mapa 2D, isocronas, figuras y filtros.

## Archivos clave
- `app/components/circle.tsx`: mapa 2D, dibujo, medicion, panel ISO, filtros de marcadores, POIs, perfiles.
- `app/components/isocrone.tsx`: cliente para llamadas Mapbox Isochrone (`getIsocroneFromMapbox`).
- `app/library/polygons.ts`: conversion GeoJSON/figuras a paths de poligono Google Maps.
- `app/library/trafficIso.ts`: helpers de modo trafico (`TRAFFIC_ISO_PROFILE`, minutos y `depart_at`).
- `app/library/mapboxTraffic.ts`: validacion de endpoint Mapbox Traffic v4.
- `app/estilos mapa/estilos iso/isoStyles.ts`: selector de estilo (`basica`, `segunda-opcion`, `tercera-opcion`).
- `app/estilos mapa/estilos iso/thirdIsoStyle.ts`: paleta/transparencia para estilo 3.
- `app/data/geojson.ts`: dataset de marcadores base.

## Variables de entorno
Configurar en `.env`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="..."
GOOGLE_MAPS_API_KEY_SERVER="..."
NEXT_PUBLIC_MAP_LOAD_COST_USD="0.007"

# Mapbox (isochrones + traffic validation)
NEXT_PUBLIC_ACCESS_TOKEN="..."
# alias soportado por codigo
# NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="..."
```

Nota: el SDK de Google Maps ahora se carga via `app/api/google-maps-js/route.ts`, usando la variable server `GOOGLE_MAPS_API_KEY_SERVER` (con fallback a `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` para compatibilidad local).

## Estado funcional actual
- Sidebar ISO con Tailwind, activado desde boton `ISO`.
- Coordenadas manuales (`Longitud`, `Latitud`) o seleccion por clic (`Marcar en el mapa`).
- Toggle `Perfiles`:
- `sin-trafico`: mantiene comportamiento previo (perfil no trafico).
- `con-trafico`: usa perfil trafico para isocronas por tiempo y activa capa de trafico en mapa.
- Toggle `Contour type`:
- `Metros`: dropdown con valores fijos + intervalo.
- `Hibrido`: combina tiempo y distancia (render separado por color).
- `Calculada`: convierte velocidad+tiempo a `contours_meters` (distancia sobre red vial).
- Estilos ISO en dropdown (`basica`, `segunda opcion`, `tercera opcion`) aplicados sin tocar el estilo base del mapa.
- Marcadores del dataset y POIs:
- Solo visibles cuando existe filtro activo (isocrona o figura).
- Si no hay filtro activo, se ocultan.

## Lógica de isócrona (resumen)
- `createIsochrone()` en `circle.tsx` decide el flujo por `isoContourUnit` y `isoTrafficProfile`.
- Para `meters` usa `contours_meters`.
- Para `hibrido` hace dos llamadas (tiempo + distancia) y renderiza ambas capas.
- Para `calculada`:
- Convierte `km/h` a `m/s`.
- Calcula distancia por cada tiempo seleccionado.
- Llama Mapbox con `contours_meters`.
- Existe control de maximo de contornos por llamada (chunks) para evitar errores HTTP 422.

## Tráfico en tiempo real
- UI: activar `Perfiles -> con trafico`.
- Efecto en mapa: `google.maps.TrafficLayer` se muestra/oculta.
- Validacion Mapbox: `fetchMapboxTrafficTileJson()` consume:
- `https://api.mapbox.com/v4/mapbox.mapbox-traffic-v1.json?access_token=...`
- Se ejecuta una sola vez por sesion de carga (bandera interna).

## POIs y Places API (New)
- Se usa `google.maps.importLibrary("places")` y `Place.searchNearby`.
- Campos pedidos minimos para no elevar costo.
- Si falla `includedTypes`, hay fallback a `includedPrimaryTypes`.
- Iconos personalizados de POI estan pausados a proposito:
- Hay `TODO` en `circle.tsx` para retomarlo con estrategia de bajo consumo.

## Reglas de arquitectura a respetar
- Mantener `Circle` como integrador principal del flujo 2D.
- Agregar utilidades nuevas en `app/library/*` (no mezclar helpers extensos en JSX).
- Mantener estilos ISO desacoplados en `app/estilos mapa/estilos iso/*`.
- Evitar romper contratos existentes de `getIsocroneFromMapbox` y `getIsoPolygonStyle`.

## Problemas conocidos / riesgos
- `circle.tsx` ya es grande; nuevas features deben extraerse a helpers para evitar deuda tecnica.
- Integrar trafico visual de Mapbox como overlay real (tiles) aun no esta implementado; hoy se valida endpoint de Mapbox y se muestra capa de Google Traffic.
- Campos avanzados de Places API (por ejemplo iconos legacy) pueden fallar por compatibilidad de `fields`.

## Checklist rápido para siguiente agente
1. Verificar `.env` con keys reales y reiniciar `npm run dev`.
2. Probar `ISO -> Perfiles -> con trafico` y confirmar capa de trafico visible.
3. Probar `Metros`, `Hibrido`, `Calculada` y revisar consola ante errores 4xx.
4. Si se tocaran POIs, mantener el limite de llamadas y maximo de resultados.
5. Si se agrega nueva opcion visual, implementarla como archivo de estilo independiente y conectarla via `isoStyles.ts`.

## Comandos
```bash
npm install
npm run dev
```
