const CENTRO_GUATEMALA = {
    lat: 14.620833,
    lng: -90.526667,
};

const generarPuntosCategoria = (cantidad, tipo, maxOffset = 0.02) => {
    const puntos = [];
    for (let i = 0; i < cantidad; i++) {
        const lat = CENTRO_GUATEMALA.lat + (Math.random() * 2 - 1) * maxOffset;
        const lng = CENTRO_GUATEMALA.lng + (Math.random() * 2 - 1) * maxOffset;
        puntos.push({
            id: `${tipo}-${i + 1}`,
            tipo,
            lat,
            lng,
        });
    }
    return puntos;
};

const puntos = {
    casas: generarPuntosCategoria(30, "casas"),
    departamentos: generarPuntosCategoria(30, "departamentos"),
    hospitales: generarPuntosCategoria(30, "hospitales"),
    centrocomerciales: generarPuntosCategoria(30, "centrocomerciales"),
};


console.log(puntos);