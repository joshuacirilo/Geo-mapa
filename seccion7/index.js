
//mapa
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




//tipos basicos 

//Latlng para fijar altura, longitud y latitud

const latlng = L.latLng(14.573780, -90.505180, 1000);
const latlng2 = L.latLng([15.573780, -90.505180, 1000]);
const latlng3 = L.latLng({
    lat: 16.573780,
    lng: -90.505180,
    alt: 1000
});

const latlng4 = L.latLng(17.573780, -90.505180, 500);

//console.log(latlng);

map.setView(latlng, 18);

//crear marcadores
//const marker = L.marker(latlng3).addTo(map);

/*
//comparar latlng
console.log(latlng.equals(latlng3));

//convertir latlng a string
console.log(latlng.toString());


//distancia entre dos puntos
console.log(latlng.distanceTo(marker.getLatLng()));
*/
//------latlngBounds------

const nuevalatlng = L.latLng(14.579227, -90.427907);

const latlngBounds = L.latLngBounds(latlng, latlng4);
console.log(latlngBounds);

const latlngBounds2 = L.latLngBounds([latlng, latlng4]);
console.log(latlngBounds2);


//modificar objeto principal
latlngBounds.extend(nuevalatlng);
console.log(latlngBounds);

//sacar cuales son los puntos del cuadrado
console.log(latlngBounds.getCenter());
console.log(latlngBounds.getSouth());
console.log(latlngBounds.getNorth());
console.log(latlngBounds.getEast());
console.log(latlngBounds.getWest());


const [cord1, cord2, cord3, cord4, cord5] = [latlngBounds.getSouthWest(), latlngBounds.getNorthWest(), latlngBounds.getNorthEast(), latlngBounds.getSouthEast(), latlngBounds.getCenter()];
/*
L.marker(cord1).addTo(map);
L.marker(cord2).addTo(map);
L.marker(cord3).addTo(map);
L.marker(cord4).addTo(map);
*/
/*
map.fitBounds(latlngBounds);

//contienen
console.log(latlngBounds.contains(latlngBounds2))
//interseccion
console.log(latlngBounds.intersects(latlngBounds2))

//saber extension de una figura
console.log(latlngBounds.toBBoxString())

*/

//-------------tipo punto----------------
// las coorenadas son en pixeles
const points = L.point(200, 300);
const points2 = L.point(200, 300)

console.log(points);
/*
setTimeout(() => {
    map.panBy(points);
}, 3000);
*/
//añadir los pixeles a otro punto
console.log(points.add(points2));

//restar los pixeles a otro punto
console.log(points.subtract(points2));

//multiplicar los pixeles a otro punto
console.log(points.multiplyBy(2));

//dividir los pixeles a otro punto
console.log(points.divideBy(2));

//scalar
console.log(points.scaleBy(2));

//-------------bounds
//es lo mismo que latlngBounds pero en pixeles
const bounds = L.bounds(points, points2);
console.log(bounds);


//-------------Icon----------------
const myIcon = L.icon({
    iconUrl: './assets/images/flecha.png',
    iconSize: [38, 38],
    iconAnchor: [22, 94],
    popupAnchor: [-3, -76],
    //shadowUrl: 'my-icon-shadow.png',
    shadowSize: [68, 95],
    shadowAnchor: [22, 94],
    popupAnchor: [0, -90]
});

const marcadorprueba = L.marker(cord5, { icon: myIcon }).addTo(map);

const info = "La vivienda de esta casa es.....";

//cuando el mouse entra al marcador
marcadorprueba.on('mouseover', function () {
    marcadorprueba.bindPopup(info).openPopup();
});

//cuando el mouse sale del marcador
marcadorprueba.on('mouseout', function () {
    marcadorprueba.closePopup();
});


//--------divicon--------------

//se utiliza para crear marcadores con html
const divIcon = L.divIcon({
    className: 'mi-icono-personalizado',
});

const divIcon2 = L.divIcon({
    className: 'fa-solid fa-tree mi-segundo-icono-personalizado',
});



L.marker(cord1,
    { icon: divIcon2 }
).addTo(map);
L.marker(cord2,
    { icon: divIcon2 }
).addTo(map);
L.marker(cord3,
    { icon: divIcon2 }
).addTo(map);
L.marker(cord4,
    { icon: divIcon2 }
).addTo(map);