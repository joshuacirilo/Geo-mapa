const inputTexto = document.querySelector("#miInput");
const button = document.querySelector("#miButton");



inputTexto.value ="Hola clase";

button.addEventListener("click",() =>{

    const valor = inputTexto.value;
    console.log("mi nombre es:",valor);
    alert(valor);
})



