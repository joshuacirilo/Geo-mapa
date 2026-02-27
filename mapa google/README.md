# Geo Mapa (Next.js + Google Maps)

Este proyecto usa Next.js con TypeScript y Google Maps JavaScript API.

## Requisitos

- Node.js instalado.
- API key de Google Maps con `Maps JavaScript API` habilitada.
- Para dibujo de circulos: incluir libreria `drawing` (ya se carga en el codigo).

## Variables de entorno

Configura tu key en:

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

## Funciones incluidas

### 1) Map Types

En el panel flotante (arriba a la izquierda) puedes cambiar el tipo de mapa:

- `Carretera` (`roadmap`)
- `Satelite` (`satellite`)
- `Hibrido` (`hybrid`)
- `Relieve` (`terrain`)

Esto cambia la visualizacion en tiempo real sin recargar.

### 2) Tilt & Rotation

En el mismo panel tienes:

- `Tilt 45deg` / `Quitar 45deg`
- `Giro -45deg`
- `Giro +45deg`

Estas acciones usan `setTilt` y `setHeading` del mapa.

Notas:

- Tilt/rotacion dependen de soporte WebGL, navegador y cobertura de datos 3D.
- En algunas zonas o configuraciones, Google puede limitar o ignorar inclinacion/rotacion.

### 3) Dibujo de circulos

Se mantiene el control nativo de dibujo de Google (icono en el mapa) y esta limitado solo a circulos.

- Al crear un nuevo circulo, el anterior se elimina.
- El circulo creado queda editable y arrastrable.

## Ubicacion y limites

- Centro inicial: Ciudad de Guatemala, Zona 10.
- Restriccion del mapa: limites aproximados de Guatemala (`strictBounds: true`).

