const btn = document.querySelector('button');
const select = document.querySelector('select');
const checkbox = document.querySelector('#checkbox');
const limpiar = document.querySelector('#limpiar');


btn.addEventListener('click', () => {
    const { value } = select;


    if (value) {
        console.log(value);
    }

});



//dibujar poligonos segun los clicks que se realicen en el mapa
let latlngs = [];
let polygon = null;

const onMapClick = (e) => {
    const punto = [e.latlng.lat, e.latlng.lng];
    latlngs.push(punto);

    if (!polygon) {
        polygon = L.polygon(latlngs, { color: 'red' }).addTo(map);
    } else {
        polygon.setLatLngs(latlngs);
    }
};

//activar modo dibujo para dibujar el poligono
const evaluar = () => {
    const activo = select.value === "polygon" && checkbox.checked;

    if (activo) {
        console.log("mode dibujo activado");
        map.on('click', onMapClick);
    }

};

limpiar.addEventListener('click', () => {
    map.removeLayer(polygon);
    polygon = null;
    latlngs = [];
});

select.addEventListener('change', evaluar);
checkbox.addEventListener('change', evaluar);
