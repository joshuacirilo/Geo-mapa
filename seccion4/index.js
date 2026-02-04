//creacion de mapas
const map = L.map('mapa', {
    center: [14.607820, -90.513863],
    zoom: 7,
    zoomControl: true,
    attributionControl: true,
    keyboard: true,
    minZoom: 7,
    maxZoom: 15,
    maxBounds: [[18.44834670293207, -88.04443359375001], [10.692996347925087, -92.98828125]]
});


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


//eventos
map.on("click", (evento) => {
    const {latlng} = evento;
    const {lat, lng} = latlng;
    console.log(lat);
    console.log(lng);
});

map.on("zoomend",(evento) =>{



});



map.on("moveend",(evento) =>{


    const centroMapa = map.getCenter();
console.log(centroMapa);
});


//metodos

//especificaciones pagina
const centroMapa = map.getCenter();
console.log(centroMapa);

//obtener el zoom actual
const zoomActual = map.getZoom();
console.log(zoomActual);


//extension
const extension = map.getBounds();
console.log(extension);

//zoom minimo
const zoomMinimo = map.getMinZoom();
console.log(zoomMinimo);



//modificacion del mapa

/*
//definir intervalo
setInterval(() => {
   //ap.zoomIn();
   //map.zoomOut();
}, 1000);
*/
/*
setTimeout(() => {
map.setView([14.607820, -90.513863],12)
}, 3000);
*/

setTimeout(() => {
    map.flyTo([14.607820, -90.513863],13)

    }, 3000);