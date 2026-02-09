# Geo-mapa (Seccion 9)

Proyecto base con Leaflet para:
- Dibujar poligonos y circulos en el mapa.
- Exportar la figura a GeoJSON y mostrarla en el sidebar.
- Mostrar puntos por categoria (opcional).

Este README esta enfocado en integrar el modulo a otro proyecto, conservando la opcion de dibujar figuras y mostrar su GeoJSON. La data de marcadores es opcional.

## Requisitos
- Navegador moderno.
- Leaflet (CDN).
- Font Awesome (solo si usas iconos personalizados).

## Estructura relevante
- `index.html` Carga Leaflet, `points.js`, `js/map.js` y `index.js`.
- `js/map.js` Inicializa el mapa, capas y (opcionalmente) puntos.
- `index.js` Maneja el modo dibujo, eventos del mapa y exportacion GeoJSON.
- `styles.css` Estilos basicos del layout e iconos.
- `points.js` (Opcional) Dataset de puntos por categoria.

## Integracion rapida
1. Copia estos archivos a tu proyecto:
   - `index.js`
   - `js/map.js`
   - `styles.css`
2. Asegurate de incluir Leaflet en tu HTML.
3. Si no necesitas puntos, puedes omitir `points.js` y eliminar la logica de puntos en `js/map.js`.

## HTML minimo
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<link rel="stylesheet" href="./styles.css">

<div id="mapa"></div>
<div id="sidebar">actualmente no hay informacion</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="./js/map.js"></script>
<script src="./index.js"></script>
```

Si usas puntos con iconos personalizados:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">
<script src="./points.js"></script>
```

## Como funciona el dibujo
En `index.js`:
- Poligono: cada click agrega un punto. Se completa con 3 o mas puntos.
- Circulo: primer click define el centro, segundo click define el radio. El radio se actualiza con `mousemove`.
- Boton `crear`: exporta la figura a GeoJSON y lo muestra en `#sidebar`.

### Exportacion GeoJSON
Se usa `toGeoJSON()` de Leaflet:
```js
const geojson = polygon.toGeoJSON();
// o
const geojson = circle.toGeoJSON();
geojson.properties = {
  ...geojson.properties,
  radius: circle.getRadius(), // el radio no existe en GeoJSON estandar
};
```

## Puntos por categoria (opcional)
Si quieres mantener los puntos:
- `points.js` define el objeto `puntos`.
- `js/map.js` crea `featureGroup` por categoria y los agrega como overlays.
Puedes eliminar esta parte si no necesitas los puntos en tu integracion.

## Notas de integracion
- El mapa usa el div `#mapa` y el sidebar usa `#sidebar`.
- El boton `crear` y los controles estan en `index.html`. Puedes moverlos a tu layout, pero conserva los `id`:
  - `#checkbox` (activar modo dibujo)
  - `#limpiar` (limpiar figura)
  - `select` (seleccion de figura)
- Si deseas separar responsabilidades, puedes mover el codigo de dibujo a un modulo y exponer funciones publicas.

## Sugerencias de extension
- Guardar el GeoJSON en un backend.
- Agregar validacion espacial (por ejemplo, puntos dentro del poligono).
- Permitir editar o mover figuras existentes.

