import './leaflet'

export const map = L.map('map', {
    center: [14.607820, -90.513863],
    zoom: 7,
    //zoom control son los controles del mapa que tenemos a la derecha
    zoomControl: false,
    attributionControl: true,
    keyboard: true,
    minZoom: 7,
    maxZoom: 16,
    maxBounds: [[18.44834670293207, -88.04443359375001], [10.692996347925087, -92.98828125]]
});


//agregar side bar 
export const sidebarControl = L.control.sidebar('sidebar', { position: 'right' });
map.addControl(sidebarControl);


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


