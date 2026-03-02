# README ISO (Isocrona en mapa)

Este documento explica la funcion `ISO` que agregamos en el mapa 2D.

## Archivos involucrados

- `app/components/iso4app.tsx`
- `app/components/circle.tsx`
- `.env` (`NEXT_PUBLIC_ISO4APP_KEY`)

## 1) `app/components/iso4app.tsx` (modulo de servicio ISO)

### Encabezado y tipos globales

```ts
"use client";
```

- Indica que el archivo corre en cliente (browser), necesario porque usa `window` y `<script>`.

```ts
declare global {
  interface Window {
    iso4app?: any;
  }
}
```

- Extiende `window` para que TypeScript reconozca `window.iso4app`.

### Variables de configuracion

```ts
const ISO4APP_KEY =
  process.env.NEXT_PUBLIC_ISO4APP_KEY ?? process.env.NEXT_PUBLIC_ISO4APP ?? "";
```

- Lee la key publica del entorno.
- Prioriza `NEXT_PUBLIC_ISO4APP_KEY`.

```ts
let iso4appLoadPromise: Promise<void> | null = null;
```

- Evita cargar el script multiples veces.
- Si ya se esta cargando, reutiliza la misma promesa.

### `parseIsoCoords(rawCoords)`

Objetivo: convertir el string de coordenadas de iso4app en arreglo `{lat, lng}`.

Pasos:

1. `split(",")`: separa cada punto.
2. `trim()` + `filter(Boolean)`: limpia espacios y vacios.
3. `split(" ")`: separa lat y lng.
4. `Number(...)`: convierte a numerico.
5. filtra puntos invalidos.

Resultado:

- `Array<{ lat: number; lng: number }>`

### `ensureIso4appLoaded()`

Objetivo: asegurar que la libreria iso4app este disponible en `window`.

Flujo:

1. Si ya existe `window.iso4app`, termina.
2. Si ya hay una carga en curso (`iso4appLoadPromise`), espera esa.
3. Si no hay key, lanza error.
4. Busca si ya existe `<script data-iso4app="true">`.
5. Si no existe, crea script:
   - `src = https://www.iso4app.net/api/js?v=1.3&lkey=...`
   - `async`, `defer`
6. Resuelve cuando carga y `window.iso4app` existe.
7. Rechaza si hay error de carga.

### `getIsochronePolygon(lat, lng)`

Objetivo: pedir una isocrona (10km) y devolver puntos listos para pintar poligono.

Pasos:

1. `await ensureIso4appLoaded()`
2. `const engine = new iso4app.Engine()`
3. Define props:
   - `maxdist: "100"` (aprox. 100m)
   - `mobility: MOTOR_VEHICLE`
   - `speedtype: NORMAL`
4. Ejecuta:
   - `engine.getIsoline(lat, lng, iso4app.Distance.METERS_10000, props)`
5. Valida error:
   - `errcode === "0"` => exito
   - si no, lanza error con `errcode:errmsg`
6. Parsea `isocoords` con `parseIsoCoords`.
7. Verifica minimo 3 puntos (poligono valido).
8. Retorna:
   - `paths`
   - `startpoint` opcional

---

## 2) `app/components/circle.tsx` (integracion UI + dibujo)

### Import principal

```ts
import { getIsochronePolygon } from "./iso4app";
```

- Trae la funcion de servicio para calcular isocrona.

### Estado/modo ISO

```ts
type InteractionMode = "measure" | "iso" | null;
```

- Agrega un nuevo modo interactivo llamado `iso`.

```ts
const isoMarkerRef = useRef<any>(null);
const isoPolygonRef = useRef<any>(null);
const [isoResult, setIsoResult] = useState<string>("");
```

- `isoMarkerRef`: guarda el marcador del punto clickeado.
- `isoPolygonRef`: guarda el poligono isocrono dibujado.
- `isoResult`: mensaje de estado al usuario.

### Limpieza

Dentro de `clearRouteAndMeasure()` se agrego:

- eliminar marcador ISO si existe.
- eliminar poligono ISO si existe.
- limpiar mensaje `isoResult`.

Esto garantiza que el boton `X` deje el mapa limpio.

### Click en mapa (modo ISO)

En el listener `map.click`:

1. Si `mode === "iso"`:
   - toma `event.latLng`.
   - borra marcador/poligono ISO anterior.
   - crea nuevo marcador en el punto.
   - muestra `Calculando isocrona...`.
2. Llama:
   - `await getIsochronePolygon(point.lat(), point.lng())`
3. Si exito:
   - crea `google.maps.Polygon` con `paths` devueltos.
   - actualiza mensaje `Isocrona creada (10km)...`.
4. Si falla:
   - muestra `Error ISO: ...`.
5. `return` para no ejecutar flujo de medicion.

### Boton ISO

```tsx
<button ... onClick={() => setInteractionMode(interactionMode === "iso" ? null : "iso")}>
  ISO
</button>
```

- Activa/desactiva el modo ISO.
- Mientras este activo, un clic en mapa dispara la isocrona.

### Mensaje visual

Panel inferior:

- muestra modo activo.
- si estas en `iso`, indica que hagas clic en 1 punto.
- imprime `isoResult`.

---

## 3) Variables de entorno necesarias

En `.env`:

```env
NEXT_PUBLIC_ISO4APP_KEY="tu_key_iso4app"
```

Si falta esta variable, la funcion ISO fallara con:

- `Falta NEXT_PUBLIC_ISO4APP_KEY en .env`

---

## 4) Flujo de usuario final

1. Usuario entra al mapa 2D.
2. Clic en boton `ISO`.
3. Clic en un punto del mapa.
4. Se crea marcador.
5. Se calcula y dibuja poligono isocrono de 10km.
6. Boton `X` limpia todo.

---

## 5) Errores comunes

- Key ISO incorrecta o sin permisos.
- Script ISO bloqueado por red/CORS.
- Respuesta ISO sin puntos (`isocoords` vacio).
- Coordenadas fuera de cobertura del servicio.

En todos esos casos, el mensaje aparece en `isoResult`.

