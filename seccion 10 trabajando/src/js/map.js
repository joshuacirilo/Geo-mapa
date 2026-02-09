import './leaflet'

const map = L.map('map').setView([51.505, -0.09], 13);


//agregar side bar 
const sidebar = L.control.sidebar('sidebar');
map.addControl(sidebar);


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//asi se le da click al marcador se muestra el sidebar
const marker = L.marker([51.505, -0.09], { draggable: true }).addTo(map);

marker.on('click', (e) => {
    sidebar.toggle();
});

marker.on('drag', (e) => {
    const { lat, lng } = marker.getLatLng();

    sidebar.setContent(`
        <h2>Informacion</h2>
        <p>Latitud: ${lat}</p>
        <p>Longitud: ${lng}</p>
    `);
});
