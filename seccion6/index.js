
//mapa

const map = L.map('mapa', {
    center: [14.607820, -90.513863],
    zoom: 7.5,
    zoomControl: true,
    attributionControl: true,
    keyboard: true,
    minZoom: 4,
    maxZoom: 21,

});
//capa general 
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 21,
    maxNativeZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    bounds: [[17.067287403767885, -87.4786376953125], [13.197164523281993, -93.55407714843751]],
    zIndex: 2,
    opacity: 1
}).addTo(map);

//capas en negro
const Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
}).addTo(map);

/*
map.on('zoomend', () => {
    console.log(map.getZoom());
    console.log(map.getBounds());
});

*/

//marker
//marcador de Guatemala
const marcador = L.marker([14.607820, -90.513863],
    {
        //que tan transparente es el marcador
        opacity: 0.5,
        //mover el marcador
        draggable: true
    }
);

//segundo marcador
const marcador2 = L.marker([15.607820, -90.513863],
    {
        //que tan transparente es el marcador
        opacity: 0.5,
        //mover el marcador
        draggable: true,
        interactive: false
    }
);


//nuevo elemento
marcador.on('dragend', () => {

    const nuevasCoordenadas = marcador.getLatLng();
    console.log('las nuevas coordenadas son: ', nuevasCoordenadas);

    //actualizar el marcador en el mapa
    setTimeout(() => {

        //fijar la opacidad, logitud y latitud del marcador
        marcador.setOpacity(1);
        marcador.setLatLng([14.607820, -90.513863]);
    }, 4000);

});


//icono del marcador
//agregar icono nuevo con accion de regresar a su posicion original

const myIcon = L.icon({
    iconUrl: './assets/ubicaciones.png',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

const marcador3 = L.marker([16.607820, -90.513863],
    {
        icon: myIcon,
        draggable: true,
        opacity: 0.5,
    }

)


marcador3.on('dragend', () => {

    const nuevasCoordenadas = marcador.getLatLng();
    console.log('las nuevas coordenadas son: ', nuevasCoordenadas);

    //actualizar el marcador en el mapa
    setTimeout(() => {

        //fijar la opacidad, logitud y latitud del marcador
        marcador3.setOpacity(1);
        marcador3.setLatLng([16.607820, -90.513863]);
    }, 3000);

});


//path linea del objeto que queremos dibujar

//diseño 1
const path = {

    stroke: true,
    color: 'red',
    weight: 2,
    opacity: 1,
    fillColor: 'blue',
    fillOpacity: 0.5,

}
//diseño 2
const path2 = {
    stroke: false,
    fillColor: 'black',
    fillOpacity: 1,
}

//diseño 3
const path3 = {
    stroke: true,
    color: 'orange',
    weight: 5,
    opacity: 1,
    fillOpacity: 0.5,
}


//diseño 4
const path4 = {
    stroke: true,
    color: 'red',
    weight: 5,
    opacity: 1,
    fillOpacity: 0,
    dashArray: [5, 10],
}

//diseño 5
const path5 = {
    stroke: true,
    color: 'brown',
    weight: 5,
    opacity: 1,
    fillOpacity: 1,
    fillColor: 'green',
    dashArray: [10, 20],
}


//circulo y como dibujarlo

const circulo = L.circle([14.589226, -90.512165], { radius: 30000, ...path });
const circulo2 = L.circle([14.2, -90.0], { radius: 30000, ...path });

//obtener extension del circulo (debe estar en el mapa primero)
//const extension = circulo.getBounds();


//ajustar el zoom del mapa a la extension del circulo
//map.fitBounds(extension);

//disminuir el radio del circulo, devolver las coordenadas del circulo, cambiar el estilo del circulo
setTimeout(() => {


    circulo.setRadius(500);
    const latlng = circulo.getLatLng();
    console.log('las coordenadas son: ', latlng);
    //cambiar estilo del circulo
    circulo.setStyle(path2);
    //traer al frente el circulo
    circulo.bringToFront();

}, 3000);


circulo2.on('mouseover', () => {
    circulo2.setStyle(path2);
});

circulo2.on('mouseout', () => {
    circulo2.setStyle(path);
});


//circle marker
//el circle marker tiene el rango en pixeles, no en metros

//const circleMarker = L.circleMarker([14.589226, -90.512165], {radius: 100, ...path3}).addTo(map);
/*

setTimeout(() => {


    circleMarker.setRadius(500);
    const latlng = circleMarker.getLatLng();
    console.log('las coordenadas son: ', latlng);
    //cambiar estilo del circulo
    circleMarker.setStyle(path3);
    //traer al frente el circulo
    circleMarker.bringToFront();
    //remover del mapa
},3000);


circleMarker.on('mouseover', () => {
    circleMarker.setStyle(path3);
});

circleMarker.on('mouseout', () => {
    circleMarker.setStyle(path);
});
*/


//polylinea 
const linea = L.polyline([[14.776897, -90.362852],
[14.863040, -90.329978],
[14.778570, -90.008153]], {
    smoothFactor: 1
    , ...path4
}).addTo(map);

//limites
/*
const extensionLinea = linea.getBounds();
map.fitBounds(extensionLinea);

//cual es el centro de la lina
const centro = linea.getCenter();
console.log('el centro de la linea es: ', centro);

//agregar nueva linea y nuevo limites para que la vista se desplace
setTimeout(() => {
    linea.addLatLng([15.026147, -89.508624]);
    const extensionLinea2 = linea.getBounds();
    //map.fitBounds(extensionLinea2);
}, 3000);

*/
//rectangulo
const extensionRectangulo = [
    [15.917538, -90.076471],
    [15.352612, -89.512931]
];


const rectangulo = L.rectangle(extensionRectangulo, path5);
//map.fitBounds(rectangulo.getBounds());


/*
setTimeout(() => {
    const nuevaExtension = [
        [16.917538, -90.076471], 
        [16.352612, -89.512931]
    ];
    rectangulo.setBounds(nuevaExtension);
    map.fitBounds(nuevaExtension);
}, 3000);
*/


//poligono


const poligono = L.polygon([
    [14.589226, -90.512165],
    [14.352612, -89.512931],
    [14.778570, -90.008153]], {
    color: "red"

});

//map.fitBounds(poligono.getBounds());


//poligono.bringToBack();


//const geoJSON = poligono.toGeoJSON();
console.log(geojson);

const estiloDefault = {
    color: 'green',
    weight: 2,
    opacity: 1,
}

const estiloHover = {
    color: 'red',
    weight: 2,
    opacity: 1,
}

/*
//esto es para tipo puntos para marcar los que estan hechos con puntos
const geojsonLayer = L.geoJSON(geojson,{
    pointToLayer: (feature, latlng) => {

      return L.circleMarker(latlng, {
        radius: 10, color: 'red'
        
    })
}, //para filtrar por tipos de geometria
    style: (feature) => {
        const {nombre} = feature.properties;
        if(nombre === 'linea') {
            return {
                color: 'blue',
                weight: 2,
                opacity: 1,
            }
        }
        if(nombre === 'circulo') {
            return {
                color: 'green',
                weight: 2,
                opacity: 1,
            }
        }
        if(nombre === 'rectangulo') {
            return {
                color: 'red',
                weight: 2,
                opacity: 1,
            }
        }
        if(nombre === 'punto') {
            return {
                color: 'brown',
                weight: 2,
                opacity: 1,
            }
        }
        else {
            return (estiloDefault);
        }
    },
    //cuales quiero mostrar en el mapa
    filter: (feature) => {
        return ["linea", "circulo", "rectangulo", "punto"].includes(feature.properties.nombre);

    }, 
    //para cada elemento que se ponga en rojo individualmente
    onEachFeature: (feature, layer) => {
        layer.on("mouseover", () => {
            layer.setStyle(estiloHover);
        }),
        layer.on("mouseout", () => {
            layer.setStyle(estiloDefault);

        }),
        //al hacer click en el elemento, se ajusta el zoom al elemento
        layer.on("click", () => {
            map.fitBounds(layer.getBounds());
        })

        
        
    }
}).addTo(map);
*/

/*
//ajustar el zoom para el layer
map.fitBounds(geojsonLayer.getBounds());    

geojsonLayer.on('layeradd', (evento) => {
    console.log(evento);
//que se haga el zoom segun el nuevo elemento que se agrego
    const {layer} = evento;
    const {feature} = layer;
//si es un punto, se ajusta el zoom al punto
    if(feature.geometry.type === 'Point') {
   // map.setView(layer.getLatLng(), map.getMaxZoom());
    }
    else {
        map.fitBounds(layer.getBounds());
    }
    layer.setStyle(estiloDefault);

   const feature2 = layer.toGeoJSON();
   console.log(feature2);
    
});

//agregar nueva feature al layer y ajusta segun caracteristicas
setTimeout(() => {
    //reiniciar estilos
    geojsonLayer.resetStyle();
    //agregar nueva feature
    geojsonLayer.addData(nuevafeature);

    //cada layer uno por uno, forma corta para cambiar uno a uno
    geojsonLayer.eachLayer((layer) => {
        console.log(layer);
        layer.setStyle({color: " white"});
    });

    //obtener todos los layers
    const layers = geojsonLayer.getLayers();
    //recorrer cada layer y establecer el estilo, forma larga
    layers.forEach((layer) => {
        layer.setStyle({color: "black"});
    });
    console.log(layers);


}, 3000);

console.log(nuevafeature);
*/

//-------------layer group (usamos featureGroup para poder usar getBounds)----------------
/*
const layerGroup = L.featureGroup().addTo(map);

layerGroup.addLayer(marcador);
layerGroup.addLayer(marcador2);
layerGroup.addLayer(marcador3); 
layerGroup.addLayer(circulo);
layerGroup.addLayer(circulo2);
layerGroup.addLayer(rectangulo);
layerGroup.addLayer(poligono);
layerGroup.addLayer(linea);

//ajustar el zoom para ver todas las capas del grupo
map.fitBounds(layerGroup.getBounds());



layerGroup.on('click', (evento) => {
    console.log(evento);
});

console.log(layerGroup.toGeoJSON());

//remover
layerGroup.removeLayer(marcador);

console.log(layerGroup.hasLayer(linea));

//borrar layers
/*
setTimeout(() => {
    layerGroup.clearLayers();
}, 3000);
*/


//------featuregroup

const featureGroup = L.featureGroup().addTo(map);
/*
featureGroup.bindPopup(
    'Hola, soy un feature group'
);
*/
/*
featureGroup.on('click', (evento) => {

    console.log('se ha dado click a un elemento');
    console.log(evento)
    const {layer} = evento;
// APLICAR A TODOS LOS COMPONENTES 
    layer.setStyle({color: "black"});
    
});
*/
/*
//crear eventos para capa 
featureGroup.on('click', (evento) => { 
    const {layer, latlng} = evento;
    layer.on('click', (evento) => {
        //console.log(evento)
        layer.bindPopup(
            `Se ha dado click en la siguiente ubicacion
            latitud: ${latlng.lat}
            longitud: ${latlng.lng}
            `
            
        ).openPopup();
    });
});  


*/

//each layer





featureGroup.addLayer(marcador);
featureGroup.addLayer(marcador2);
featureGroup.addLayer(marcador3);
featureGroup.addLayer(circulo);
featureGroup.addLayer(circulo2);
featureGroup.addLayer(rectangulo);
featureGroup.addLayer(poligono);
featureGroup.addLayer(linea);

/*
//crear eventos para cada capa y obtener coordenadas para cada capa
featureGroup.eachLayer((layer) => {

    layer.on('click', (evento) => {
        //console.log(evento)
        const {latlng} = evento;
        layer.bindPopup(
            `Se ha dado click en la siguiente ubicacion
            latitud: ${latlng.lat}
            longitud: ${latlng.lng}
            `
            
        ).openPopup();
    });

});
*/

//-------pooup
/*
const popup = L.popup([14.607820, -90.513863],{
    content:"<b>Hola, soy un popup</b>",
    closeButton: false,
    closeOnClick: false,
    closeOnEscape: true,
}).openOn(map);

*/

/*
//forma dinamica
const popup2 = L.popup();

map.on('click', (evento) => {

    const {latlng} = evento;
    popup2
    .setLatLng(latlng)
    .setContent(`<b>se ha dado click en las siguientes coordenadas
        latitud: ${latlng.lat}
        longitud: ${latlng.lng}
        </b>`).openOn(map);


    
    

});
*/

//amarrar a un layer
/*

marcador.on('click', (evento) => {

    marcador.bindPopup(
        'estoy dando click en el marcador'
    ).openPopup();
});

//cambiar por contenido
setTimeout(() => {
    marcador.setPopupContent('el texto ha cambiado');
}, 3000);

*/

//-----------------tootip---------------- como un popup pero cuadrado


//amarrar a un layer


marcador.bindTooltip(
    'esto es una tootip', {

    opacity: 1,
    permanente: true,
    sticky: true,
}
).openTooltip();

const tooltip = L.tooltip();
tooltip.setLatLng([14.607820, -90.513863]);
tooltip.setContent('esto es una tootip');
tooltip.openOn(map);



//----TileLayer. wms, capas para ver humeda sobre la informacion que hay en el link 
const nexrad = L.tileLayer.wms("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
    layers: 'nexrad-n0r-900913',
    format: 'image/png',
    transparent: true,
    attribution: "Weather data © 2012 IEM Nexrad"
}).addTo(map);



//-----imageoverlay, agregar imagen sobre el mapa
const url = "./assets/arbol.jpg";
const extesion = [
    [14.589226, -90.512165],
    [14.352612, -89.512931]];

const imageOverlay = L.imageOverlay(url, extesion, {

    opacity: 0.5,
    interactive: true,


}).addTo(map);


imageOverlay.on('click', (evento) => {
    console.log(evento);
});

//const videoOverlay

const videoUrl = "./assets/video.mp4";
const videoExtesion = [
    [14.589226, -90.512165],
    [14.352612, -89.512931]];

const videoOverlay = L.videoOverlay(videoUrl, videoExtesion, {

    opacity: 0.5,
    interactive: true,

}).addTo(map);


setTimeout(() => {
    const elemento = videoOverlay.getElement();
    console.log(elemento);

    elemento.play();

    elemento.pause();
}, 3000);


