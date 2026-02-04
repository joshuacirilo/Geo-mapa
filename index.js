//variables
//primitivos

//numeros
const numero = 10;
var numero2 = 20;
let c=5.6;



console.log(numero);

//strings
const text="Hola mundo";
var text2='Hola mundo';
let text3="Hola mundo";

console.log(text);
console.error(text2);

//booleans
const boolean = true;
var boolean2 = false;
let boolean3 = true;

//undefined
//const
//var
//let



//arreglos

const arreglo =[1, 11111111.111, "hola mundo", true, false, undefined,[1,2,3,4,5,6,7,8,9,10]];
console.log(arreglo);
console.log(arreglo[0]);
console.log(arreglo[1]);

arreglo.forEach( elemento => {console.log(elemento)})

//objetos literales
const miObjeto = {
    nombre: "Juan Camilo", 
    edad: 20,
    titulo: "ingeniero",                                         
    soltero: true,
    salario: undefined,
    cursos: ["leflet", "postres", "java"]
};

console.log(miObjeto);

console.table(miObjeto);

//objetos globales

console.log(console);

console.log(window);

const variableconst = 1;

//funciones 

function myFunction(){

    return "Hola mundo";
}
const myFunction2 = () => {
    return "adios";
}

const myfunction3 = function(){
    return "buenos dias";
}

const saludo = myFunction();
console.log(saludo);

const despedida = myFunction2();
console.log(despedida);

const saludo2 = myfunction3();
console.log(saludo2);

//argumentos de funcion 

const sumar = (a,b) => {
    return a+b    
}

const mySuma = sumar(10,20);
console.log(mySuma);

const mySuma2 = sumar(-10,20);
console.log("suma 2", mySuma2);

const mySuma3 = sumar("hola","mundo");
console.log("suma 3", mySuma3);

//ciclos

const arr = [1,2,3,4,5,6,7,8,9,10];

const mySuma4 = sumar(Array[0],5);
console.log(mySuma4);


for(let elemento of arr){
    const resultado = sumar(elemento,5);
    console.log(resultado);
}

let contador = 0;
while(contador <= 10){
    console.log(contador);
    contador++;
}

//estructura de control

    //condicional if 
const myResultado = sumar(10,0);
    if(myResultado > 10){
        console.log("el resultado es mayor a 10");
    }
    else if(myResultado === 10){
        console.log("el resultado es igual a 10");
    }
    else{
        console.log("el resultado es menor a 10");
    }

    switch(myResultado){
        case 10: 
            console.log("el resultado es igual a 10");
            break;
        case 3:
            console.log("el resultado es igual a 3");
            break;
        default:
            console.log("No se cumple ninguna condicion");
            break;
    }

    