const generarPuntos = () => {
    const puntos = [];
    for (let i = 0; i < 10; i++) {
        const lat = Math.random() * 10 + 14;
        const lng = Math.random() * 10 - 90;
        puntos.push([lat, lng]);
    }
    return puntos;
}

const puntos = generarPuntos();
console.log(puntos);