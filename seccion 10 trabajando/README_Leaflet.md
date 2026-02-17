# README Especial: Leaflet en Next.js (solo mapa)

Guia para que otra persona pueda llevar **solo el mapa de Leaflet** a otro proyecto Next.js.

## Objetivo
Con esta guia podras mostrar un mapa en pantalla con:
- Carga correcta de Leaflet en Next.js (Client Component).
- Estilos necesarios para que el contenedor del mapa tenga altura y ancho.
- Limites de navegacion (`maxBounds`) y niveles de zoom (`minZoom`, `maxZoom`).

## Links oficiales recomendados
- Next.js: https://nextjs.org/docs
- Leaflet: https://leafletjs.com/
- Referencia de API Leaflet (`L.map` y opciones): https://leafletjs.com/reference.html#map-option
- Tiles OpenStreetMap: https://www.openstreetmap.org/

## Dependencias
Instala en tu proyecto:

```bash
npm i leaflet
```

> Nota: `leaflet-sidebar` es opcional si solo quieres el mapa base.

## Archivos minimos que debes tener

```txt
src/
  app/
    components/
      MapClient.jsx
      MapCanvas.jsx
    globals.css
    layout.js
    page.js
```

## 1) `src/app/layout.js`
Importa los estilos globales:

```jsx
import './globals.css';

export const metadata = {
  title: 'Mapa',
  description: 'Mapa con Leaflet'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

## 2) `src/app/globals.css`
Sin altura en `html`, `body` y contenedor del mapa, Leaflet no se ve.

```css
@import "leaflet/dist/leaflet.css";

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

.app-shell {
  position: relative;
  width: 100%;
  height: 100vh;
}

#map {
  width: 100%;
  height: 100%;
}
```

## 3) `src/app/components/MapCanvas.jsx`
Contenedor simple del mapa:

```jsx
"use client";

import { forwardRef } from 'react';

const MapCanvas = forwardRef(function MapCanvas({ id = 'map', ...rest }, ref) {
  return <div id={id} ref={ref} {...rest} />;
});

export default MapCanvas;
```

## 4) `src/app/components/MapClient.jsx`
Componente cliente que inicializa Leaflet y configura limites.

```jsx
"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import MapCanvas from './MapCanvas';

export default function MapClient() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: typeof iconRetinaUrl === 'string' ? iconRetinaUrl : iconRetinaUrl?.src,
      iconUrl: typeof iconUrl === 'string' ? iconUrl : iconUrl?.src,
      shadowUrl: typeof shadowUrl === 'string' ? shadowUrl : shadowUrl?.src
    });

    const map = L.map(mapRef.current, {
      center: [14.60782, -90.513863],
      zoom: 7,
      zoomControl: false,
      attributionControl: true,
      keyboard: true,
      minZoom: 7,
      maxZoom: 16,
      maxBounds: [
        [18.44834670293207, -88.04443359375001],
        [10.692996347925087, -92.98828125]
      ]
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    return () => {
      map.off();
      map.remove();
    };
  }, []);

  return <MapCanvas id="map" ref={mapRef} />;
}
```

## 5) `src/app/page.js`
Renderiza el mapa en una pantalla completa:

```jsx
import MapClient from './components/MapClient';

export default function Page() {
  return (
    <main className="app-shell">
      <MapClient />
    </main>
  );
}
```

## Parametros clave para que se muestre correctamente

- `center`: coordenada inicial del mapa (`[lat, lng]`).
- `zoom`: nivel inicial.
- `minZoom` y `maxZoom`: rango permitido.
- `maxBounds`: caja geografica limite para no salir del area permitida.
- `#map { width: 100%; height: 100%; }`: obligatorio para que Leaflet pinte el mapa.
- `.app-shell { height: 100vh; }`: hace que ocupe toda la pantalla.

## Ejemplo de limites (`maxBounds`)
Formato:

```js
maxBounds: [
  [latNorte, lngEste],
  [latSur, lngOeste]
]
```

En este proyecto:

```js
maxBounds: [
  [18.44834670293207, -88.04443359375001],
  [10.692996347925087, -92.98828125]
]
```

## Checklist rapido
- `leaflet` instalado.
- `@import "leaflet/dist/leaflet.css";` en `globals.css`.
- `MapClient` con `"use client"`.
- Contenedor del mapa con altura real (`100%` o `100vh`).
- `L.tileLayer(...)` agregado al mapa.

---

## Figuras: poligono y circulo
Esta seccion agrega dibujo manual sin plugins de dibujo (`leaflet-draw`), usando eventos de Leaflet.

### Archivos implicados
- `src/app/components/MapClient.jsx`: logica de dibujo y exportacion.
- `src/app/components/MapControls.jsx`: UI para activar dibujo, tipo y botones.

### Flujo de dibujo
- `polygon`:
  - Cada click en el mapa agrega un punto.
  - Se crea/actualiza `L.polygon(latlngs)`.
  - `Crear` valida minimo 3 puntos y exporta `toGeoJSON()`.
- `circle`:
  - Primer click: centro del circulo.
  - Segundo click: radio final (`distanceTo`).
  - Mientras mueves mouse, se actualiza radio en vivo (`mousemove`).
  - `Crear` exporta `toGeoJSON()` y agrega `properties.radius`.

### Componente de controles (`MapControls.jsx`)
Usa IDs compatibles con `MapClient` (`checkbox`, `shape-select`, `crear`, `limpiar`):

```jsx
"use client";

export default function MapControls({
  checkboxId = 'checkbox',
  selectId = 'shape-select',
  createId = 'crear',
  clearId = 'limpiar'
}) {
  return (
    <div id="controls">
      <label className="control-item" htmlFor={checkboxId}>
        <input id={checkboxId} type="checkbox" /> Dibujar
      </label>

      <select id={selectId} defaultValue="polygon">
        <option value="polygon">Poligono</option>
        <option value="circle">Circulo</option>
      </select>

      <button id={createId} type="button">Crear</button>
      <button id={clearId} type="button">Limpiar</button>
    </div>
  );
}
```

### Bloque de logica para figuras en `MapClient.jsx`
Integra este bloque dentro del `useEffect` (despues de crear `map`):

```jsx
let latlngs = [];
let polygon = null;
let circle = null;
let circleCenter = null;

const onMapClickPolygon = (e) => {
  const punto = [e.latlng.lat, e.latlng.lng];
  latlngs.push(punto);

  if (!polygon) {
    polygon = L.polygon(latlngs, { color: 'red' }).addTo(map);
  } else {
    polygon.setLatLngs(latlngs);
  }
};

const onMapClickCircle = (e) => {
  if (!circleCenter) {
    circleCenter = e.latlng;
    if (circle) map.removeLayer(circle);
    circle = L.circle([circleCenter.lat, circleCenter.lng], { radius: 0 }).addTo(map);
    return;
  }

  const radio = circleCenter.distanceTo(e.latlng);
  circle.setRadius(radio);
  circleCenter = null;
  map.off('mousemove', onMapMoveCircle);
};

const onMapMoveCircle = (e) => {
  if (!circleCenter || !circle) return;
  circle.setRadius(circleCenter.distanceTo(e.latlng));
};

const btn = document.querySelector('#crear');
const select = document.querySelector('#shape-select');
const checkbox = document.querySelector('#checkbox');
const limpiar = document.querySelector('#limpiar');

const evaluar = () => {
  const activo = checkbox?.checked;
  const modo = select?.value;

  map.off('click', onMapClickPolygon);
  map.off('click', onMapClickCircle);
  map.off('mousemove', onMapMoveCircle);

  if (!activo) return;
  if (modo === 'polygon') map.on('click', onMapClickPolygon);
  if (modo === 'circle') {
    map.on('click', onMapClickCircle);
    map.on('mousemove', onMapMoveCircle);
  }
};

const onCrear = () => {
  const value = select?.value;

  if (value === 'polygon') {
    if (!polygon || latlngs.length < 3) {
      console.log('Poligono incompleto: minimo 3 puntos');
      return;
    }
    console.log('GeoJSON polygon:', polygon.toGeoJSON());
    return;
  }

  if (value === 'circle') {
    if (!circle || circleCenter) {
      console.log('Circulo incompleto: define centro y radio');
      return;
    }

    const geojson = circle.toGeoJSON();
    geojson.properties = {
      ...geojson.properties,
      radius: circle.getRadius()
    };

    console.log('GeoJSON circle:', geojson);
  }
};

const onLimpiar = () => {
  if (polygon) {
    map.removeLayer(polygon);
    polygon = null;
  }

  if (circle) {
    map.removeLayer(circle);
    circle = null;
  }

  circleCenter = null;
  map.off('mousemove', onMapMoveCircle);
  latlngs = [];
};

btn?.addEventListener('click', onCrear);
limpiar?.addEventListener('click', onLimpiar);
select?.addEventListener('change', evaluar);
checkbox?.addEventListener('change', evaluar);
```

### CSS de controles
Agrega esto a `src/app/globals.css` para ver los controles sobre el mapa:

```css
#controls {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 1000;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
}

.control-item {
  font-size: 14px;
}

#controls button,
#controls select {
  padding: 4px 8px;
}
```

### Reglas y limites recomendados para figuras
- Poligono valido: minimo 3 puntos antes de `Crear`.
- Circulo valido: 2 clicks (centro + radio final).
- `Limpiar`: elimina figura actual y resetea estado.
- Usa `minZoom`, `maxZoom` y `maxBounds` para evitar dibujo fuera del area objetivo.

### Salida GeoJSON
- Poligono: `polygon.toGeoJSON()`.
- Circulo: `circle.toGeoJSON()` + propiedad adicional `radius` en metros.

Con esto ya tienes mapa + figuras (poligono/circulo) en el mismo flujo del proyecto.

---

## Leaflet Sidebar: como funciona
Esta es la logica que usa tu proyecto para mostrar/ocultar el panel lateral con una flecha.

### 1) Dependencia e import
- Instala: `npm i leaflet-sidebar`
- Importa JS en `src/app/components/MapClient.jsx`:

```jsx
import 'leaflet-sidebar';
```

- Importa CSS en `src/app/globals.css`:

```css
@import "leaflet-sidebar/src/L.Control.Sidebar.css";
```

### 2) Estructura del contenedor
Necesitas un contenedor para el contenido del sidebar (tu `MapSidebar`):

```jsx
<MapSidebar id={resolvedIds.sidebar} ref={sidebarRef} />
```

### 3) Inicializacion del control
Dentro de `useEffect`, despues de crear `map`:

```jsx
const sidebarControl = L.control.sidebar(sidebarRef.current);
map.addControl(sidebarControl);
```

### 4) Metodos principales
- `sidebarControl.show()`: muestra el panel.
- `sidebarControl.hide()`: oculta el panel.
- `sidebarControl.toggle()`: alterna mostrar/ocultar.
- `sidebarControl.isVisible()`: devuelve `true/false` segun estado real.
- `sidebarControl.setContent(html)`: escribe contenido dentro del sidebar.

### 5) Boton flecha (toggle)
Tu implementacion actual usa un boton (`.sidebar-toggle`) y en click ejecuta:

```jsx
sidebarControl.toggle();
```

Luego actualiza icono:
- `◀` cuando esta visible.
- `▶` cuando esta oculto.

### 6) Recomendacion clave para evitar clicks duplicados
No uses un estado local separado para visibilidad. Usa siempre `sidebarControl.isVisible()` para sincronizar la UI del boton con el estado real del plugin.

### 7) Flujo en este proyecto
- Cuando haces `Crear` y hay GeoJSON, se usa `setContent(...)` y luego `show()`.
- Si quieres ocultarlo manualmente, usas la flecha (toggle).
- Si el sidebar no existe, puedes hacer fallback a un `div` normal.

---

## Mostrar GeoJSON con Leaflet Choropleth
Esta seccion explica como pintar tus `GeoJSON` por rangos de valor (clasificacion por color).

### 1) Instalar plugin
```bash
npm i leaflet-choropleth
```

### 2) Importar en `MapClient.jsx`
```jsx
import L from 'leaflet';
import 'leaflet-choropleth';
import localGeojson from '../../data/geojson.json';
```

### 3) Asegurar propiedad numerica para clasificar
El plugin necesita una propiedad numerica (ej: `incidents`) en cada feature.
Si no existe, puedes usar un fallback (en este proyecto se usa `zona`):

```jsx
const choroplethData = {
  ...localGeojson,
  features: (localGeojson.features ?? []).map((feature) => {
    const rawIncidents = Number(feature?.properties?.incidents);
    const fallbackIncidents = Number(feature?.properties?.zona ?? 0);

    return {
      ...feature,
      properties: {
        ...feature.properties,
        incidents: Number.isFinite(rawIncidents) ? rawIncidents : fallbackIncidents
      }
    };
  })
};
```

### 4) Pintar capa choropleth
```jsx
const choroplethLayer = L.choropleth(choroplethData, {
  valueProperty: 'incidents',
  scale: ['white', 'red'],
  steps: 5,
  mode: 'q',
  style: {
    color: '#fff',
    weight: 2,
    fillOpacity: 0.35
  },
  onEachFeature: (feature, layer) => {
    layer.bindPopup(
      `<strong>${feature.properties.nombre ?? 'Sin nombre'}</strong><br/>` +
      `Zona: ${feature.properties.zona ?? 'N/A'}<br/>` +
      `Incidents: ${feature.properties.incidents ?? 0}`
    );
  }
}).addTo(map);
```

### 5) Parametros que puedes ajustar rapido
- `scale`: colores de menor a mayor valor.
- `steps`: cantidad de clases.
- `mode`: tipo de clasificacion (`q` cuantiles, `e` equidistante, `k` k-means).
- `fillOpacity`: transparencia del relleno.


