class carro{
    llantas;
    motor;
    marca;
    mecanico;
    peso;
    indicador;

    constructor(llantas,motor,marca,mecanico,peso){
        this.llantas = llantas;
        this.motor = motor;
        this.marca = marca;
        this.mecanico = mecanico;
        this.peso = peso;

        this.calcularIndicador();
    }

    calcularIndicador(){
        this.indicador = this.motor/this.peso;
    }
}

const miCarro1 = {
    llantas: 4,
    motor: 1000,
    marca: "Toyota",
    mecanico: "true",
}

const miCarro2 = {
    llantas: 6,
    motor: 1000,
    marca: "Toyota",
    mecanico: "false",
}

console.log(miCarro1);
console.log(miCarro2);


const instanciaCarro = new carro(4,1000,"Toyota","true",100);
console.log(instanciaCarro);



const instanciaCarro2 = new carro(4,20000,"Toyota","true",300);
console.log(instanciaCarro2);