//referencias
const sidebar = document.querySelector('#sidebar');
const mensaje = document.querySelector('#mesaje');


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

//funciones

const definirMensaje = ([lat, lng]) => {

    mensaje.classList.remove('hidden');
    mensaje.innerText =`Las coordenadas de la zona seleccionada son: 
    latitud: ${lat}, longitud: ${lng}` ;
}


const limpiarItems = () => {
    const listadoLi = document.querySelectorAll('li');

    listadoLi.forEach(li => {
        li.classList.remove('active');
    });
}


const volar = (latlng) =>{
    map.flyTo(latlng, map.getMaxZoom());
}


const crearItems = () => {
    const ul = document.createElement('ul');
    ul.classList.add('list-group');
    sidebar.prepend(ul);

    lugares.forEach(lugar => {
        const li = document.createElement('li');
        li.innerText = lugar.nombre;
        li.classList.add('list-group-item');
        ul.appendChild(li);
        
        li.addEventListener('click', () => {
            limpiarItems();
            li.classList.add('active');
            volar(lugar.coordenadas);
            definirMensaje(lugar.coordenadas);
            })
    })
}

crearItems();