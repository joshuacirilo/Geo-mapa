# Sección 6 - Leaflet.js Conceptos

## 1. Configuración del Mapa

- Inicialización del mapa con `L.map()`
- Opciones de configuración: `center`, `zoom`, `zoomControl`, `attributionControl`, `keyboard`, `minZoom`, `maxZoom`

---

## 2. Capas de Tiles (TileLayer)

- Añadir capas base con `L.tileLayer()`
- Proveedores de tiles: OpenStreetMap, Stadia Maps
- Opciones: `maxZoom`, `maxNativeZoom`, `attribution`, `bounds`, `zIndex`, `opacity`

---

## 3. Marcadores (Markers)

### Creación y opciones
- Crear marcadores con `L.marker()`
- Opciones: `opacity`, `draggable`, `interactive`

### Iconos personalizados
- Crear iconos con `L.icon()`
- Propiedades: `iconUrl`, `iconSize`, `iconAnchor`

### Métodos útiles
- `getLatLng()` - Obtener coordenadas
- `setLatLng()` - Establecer nuevas coordenadas
- `setOpacity()` - Cambiar transparencia

---

## 4. Estilos Path (Opciones de estilo)

- `stroke` - Mostrar/ocultar borde
- `color` - Color del borde
- `weight` - Grosor del borde
- `opacity` - Transparencia del borde
- `fillColor` - Color de relleno
- `fillOpacity` - Transparencia del relleno
- `dashArray` - Patrón de línea discontinua

---

## 5. Formas Vectoriales

### Circle (Círculo)
- Radio definido en **metros**
- Métodos: `setRadius()`, `getLatLng()`, `getBounds()`

### CircleMarker (Marcador circular)
- Radio definido en **píxeles**
- No cambia de tamaño con el zoom

### Polyline (Polilínea)
- Línea que conecta múltiples puntos
- Opción `smoothFactor` para suavizar la línea
- Método `addLatLng()` para agregar puntos
- Método `getCenter()` para obtener el centro

### Rectangle (Rectángulo)
- Se define con dos esquinas opuestas (bounds)
- Método `setBounds()` para cambiar dimensiones

### Polygon (Polígono)
- Forma cerrada con múltiples vértices
- Método `toGeoJSON()` para convertir a formato GeoJSON

### Métodos comunes
- `getBounds()` - Obtener extensión/límites
- `setStyle()` - Cambiar estilo dinámicamente
- `bringToFront()` - Traer al frente
- `bringToBack()` - Enviar al fondo
- `remove()` - Eliminar del mapa

---

## 6. Eventos

### Eventos de interacción
- `mouseover` - Al pasar el mouse encima
- `mouseout` - Al salir el mouse
- `click` - Al hacer clic
- `dragend` - Al terminar de arrastrar

### Eventos del mapa
- `zoomend` - Al terminar de hacer zoom
- `layeradd` - Al agregar una capa

---

## 7. GeoJSON

### Estructura básica
- `FeatureCollection` - Colección de features
- `Feature` - Elemento individual con `properties` y `geometry`
- Tipos de geometría: `Point`, `LineString`, `Polygon`, `MultiPoint`, `MultiLineString`, `MultiPolygon`

### Opciones de L.geoJSON()
- `pointToLayer` - Personalizar cómo se renderizan los puntos
- `style` - Definir estilos según propiedades del feature
- `filter` - Filtrar qué features mostrar
- `onEachFeature` - Ejecutar función para cada feature (eventos, popups, etc.)

### Métodos
- `addData()` - Agregar nuevos features dinámicamente
- `resetStyle()` - Reiniciar estilos al original
- `eachLayer()` - Iterar sobre cada capa
- `getLayers()` - Obtener array de todas las capas
- `toGeoJSON()` - Convertir capa a formato GeoJSON

### Importante
- Los tipos de geometría son **case-sensitive** (`Point`, no `point`)
- Los puntos usan `getLatLng()`, no `getBounds()`

---

## 8. Control de Vista

- `fitBounds()` - Ajustar zoom para mostrar una extensión
- `setView()` - Establecer centro y nivel de zoom
- `getZoom()` - Obtener nivel de zoom actual
- `getBounds()` - Obtener límites visibles del mapa
- `getMaxZoom()` - Obtener zoom máximo permitido

---

## 9. Orden de Scripts

Es importante cargar los archivos JavaScript en el orden correcto:
1. Primero las librerías (Leaflet)
2. Luego los datos (GeoJSON)
3. Finalmente el código principal que usa ambos
