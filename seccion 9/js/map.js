//mapa
const map = L.map('mapa', {
    center: [14.607820, -90.513863],
    zoom: 7,
    //zoom control son los controles del mapa que tenemos a la derecha
    zoomControl: false,
    attributionControl: true,
    keyboard: true,
    minZoom: 7,
    maxZoom: 15,
    maxBounds: [[18.44834670293207, -88.04443359375001], [10.692996347925087, -92.98828125]]
});

//mapa base
const baseMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//mapa oscuro
var mapaOscuro = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
});



//capas
const group = L.featureGroup().addTo(map);

const baseLayers = {

    "Mapa Base": baseMap,
    "Mapa Oscuro": mapaOscuro,

}

const overlays = {
    "Casas": group
}

const controlLayers = L.control.layers(baseLayers, overlays).addTo(map);


