# Geo Mapa (Next.js + Google Maps)

Este proyecto usa Next.js con TypeScript y Google Maps JavaScript API.

## Requisitos

- Node.js instalado.
- API key de Google Maps con `Maps JavaScript API` habilitada.
- Librerias `drawing` y `geometry` habilitadas desde la carga del script.

## Variables de entorno

Archivo:

- `.env`

Ejemplo:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="tu_api_key"
```

## Ejecutar

```bash
npm install
npm run dev
```

## Flujo principal

### 0) Selector 2D / 3D

En la esquina superior derecha tienes el switch:

- `2D`: editor completo (formas, filtros, medicion).
- `3D`: vista Photorealistic 3D (`maps3d`) centrada en Ciudad de Guatemala.

En `3D` tienes iconos para dibujar geometria 3D:

- `3D-L`: inicia dibujo de polyline 3D.
- `3D-P`: inicia dibujo de polygon 3D.
- `OK`: guarda la figura actual.
- `X`: limpia figuras 3D.

Las figuras usan `altitudeMode: CLAMP_TO_GROUND` para ajustarse al relieve.

Nota:

- La vista 3D depende de soporte del navegador/GPU y cobertura disponible.
- Si 3D no carga, se muestra mensaje en pantalla.

### 1) Cargar marcadores desde GeoJSON

Edita este archivo:

- [app/data/geojson.ts](c:/Users/Joshua C/Desktop/aprendizaje/geo-mapas/Geo-mapa/mapa google/app/data/geojson.ts)

Actualmente se leen `Feature` de tipo `Point` y se crean marcadores internos.

### 2) Dibujar formas con iconos

En la barra flotante del mapa tienes iconos para:

- `Polyline` (linea)
- `Polygon` (poligono)
- `Circle` (circulo)
- `Limpiar` (borra todas las figuras)
- `MED` (medicion entre 2 clics)

Las figuras quedan editables al terminar de dibujarlas.

### 3) Filtrado espacial de marcadores

Los marcadores del GeoJSON solo se renderizan si estan dentro de al menos una figura:

- Circle: dentro del radio.
- Polygon: dentro del area del poligono.
- Polyline: sobre/pegado a la linea (tolerancia aproximada).

Si no hay figuras, no se muestra ningun marcador.

### 4) Medicion

- `MED`: calcula distancia directa (linea recta) entre dos puntos.

### 5) Tipo de mapa

Se mantiene selector de vista:

- `roadmap`
- `satellite`
- `hybrid`
- `terrain`

### 6) Contador de uso API

En la parte inferior se muestra:

- `map loads` acumulados (persistidos en `localStorage`)
- gasto aproximado en USD

Puedes ajustar costo por carga con:

- `NEXT_PUBLIC_MAP_LOAD_COST_USD` en `.env`

## Ubicacion base

- Centro inicial: Ciudad de Guatemala, Zona 10.
- Restriccion: limites aproximados de Guatemala (`strictBounds: true`).
