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