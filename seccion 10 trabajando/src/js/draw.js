import { map, sidebarControl } from './map.js';

const btn = document.querySelector('#crear');
const select = document.querySelector('select');
const checkbox = document.querySelector('#checkbox');
const limpiar = document.querySelector('#limpiar');
const sidebarEl = document.querySelector('#sidebar');

const setSidebarHtml = (html) => {
    if (sidebarControl && typeof sidebarControl.setContent === 'function') {
        sidebarControl.setContent(html);
        if (typeof sidebarControl.show === 'function') {
            sidebarControl.show();

        }
        return;
    }
    if (sidebarEl) {
        sidebarEl.innerHTML = html;
    }
};

const setSidebarText = (text) => {
    if (sidebarControl && typeof sidebarControl.setContent === 'function') {
        sidebarControl.setContent(`<p>${text}</p>`);
        if (typeof sidebarControl.show === 'function') {
            sidebarControl.show();
        }
        return;
    }
    if (sidebarEl) {
        sidebarEl.textContent = text;
    }
};

btn.addEventListener('click', () => {
    const { value } = select;

    if (value === 'polygon') {
        if (!polygon || latlngs.length < 3) {
            setSidebarText('Poligono incompleto: agrega al menos 3 puntos.');
            return;
        }

        const geojson = polygon.toGeoJSON();
        setSidebarHtml(`<pre>${JSON.stringify(geojson, null, 2)}</pre>`);
        if (window.filtrarMarcadoresPorBounds) {
            window.filtrarMarcadoresPorBounds(polygon.getBounds());
        }
        return;
    }

    if (value === 'circle') {
        if (!circle || circleCenter) {
            setSidebarText('Circulo incompleto: define centro y radio con 2 clicks.');
            return;
        }

        const geojson = circle.toGeoJSON();
        geojson.properties = {
            ...geojson.properties,
            radius: circle.getRadius(),
        };

        setSidebarHtml(`<pre>${JSON.stringify(geojson, null, 2)}</pre>`);
        if (window.filtrarMarcadoresPorBounds) {
            window.filtrarMarcadoresPorBounds(circle.getBounds());
        }
        return;
    }

    setSidebarText('Selecciona una figura para crear.');
});

//dibujar poligonos segun los clicks que se realicen en el mapa
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

//dibujar circulos segun los clicks que se realicen en el mapa
const onMapClickCircle = (e) => {
    if (!circleCenter) {
        circleCenter = e.latlng;

        if (circle) {
            map.removeLayer(circle);
        }

        circle = L.circle([circleCenter.lat, circleCenter.lng], { radius: 0 }).addTo(map);
        return;
    }

    const radio = circleCenter.distanceTo(e.latlng);
    circle.setRadius(radio);
    circleCenter = null;
    map.off('mousemove', onMapMoveCircle);
};

const onMapMoveCircle = (e) => {
    if (!circleCenter || !circle) {
        return;
    }

    const radio = circleCenter.distanceTo(e.latlng);
    circle.setRadius(radio);
};

//activar modo dibujo para dibujar el poligono y circulo
const evaluar = () => {
    const activo = checkbox.checked;
    const modo = select.value;

    map.off('click', onMapClickPolygon);
    map.off('click', onMapClickCircle);
    map.off('mousemove', onMapMoveCircle);

    if (!activo) {
        return;
    }

    if (modo === 'polygon') {
        console.log('mode dibujo poligono activado');
        map.on('click', onMapClickPolygon);
    }

    if (modo === 'circle') {
        console.log('mode dibujo circulo activado');
        map.on('click', onMapClickCircle);
        map.on('mousemove', onMapMoveCircle);
    }
};

//limpiar el mapa
limpiar.addEventListener('click', () => {
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
    if (window.resetFiltroMarcadores) {
        window.resetFiltroMarcadores();
    }
});

select.addEventListener('change', evaluar);
checkbox.addEventListener('change', evaluar);
