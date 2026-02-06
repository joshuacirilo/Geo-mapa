
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

const baselayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//control de zoom
const control = L.control.zoom({
    zoomInText: "+",
    zoomInTitle: "Acercar",
    zoomOutText: "-",
    zoomOutTitle: "Alejar",
    position: "topright"

}).addTo(map);

//console.log(control.getPosition());

//atributions






const atributions = L.control.attribution({
    position: "bottomright",
    prefix: "Busca tu propiedad"
}).addTo(map);

//console.log(atributions.getPosition());


//control layers, control para ver las capas que se muestran en el mapa

map.setView([14.022323, -90.403314], 10);

const marcador = L.marker([14.022323, -90.403314]).addTo(map);
const marcador2 = L.marker([14.244024, -90.412723]).addTo(map);

const shadow = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
});


const baseMaps = {
    "Mapa base": baselayer,
    "Mapa oscuro": shadow
}


const overlay = {
    "Marcador 1": marcador,
    "Marcador 2": marcador2
}

const controllayers = L.control.layers(
    baseMaps,
    overlay,
    {
        //collapsed: false, //para que no se cierre el control layers
        collapsed: true,
        //sortLayers: true, //para que se ordenen las capas
        sortLayers: true,
        //position: "topright"
        position: "topleft"
    }
).addTo(map);


//-----scale control-----
const scale = L.control.scale({

    //esto es para ver el tamaño de la vara
    maxWidth: 1000,
    //kilometros 
    metric: true,
    //millas
    imperial: false,
    //posición
    position: "bottomleft"

}).addTo(map);


