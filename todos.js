/* Instrucciones:
Backend (ExpressJS):
- a. Inicializar un proyecto de Node.js e instalar ExpressJS.
- b. Crear un archivo de servidor (app.js) y configurar ExpressJS.
- c. Definir las rutas para la API (GET, POST, PUT, DELETE) para gestionar las tareas.
- d. Utilizar un array para almacenar las tareas en la memoria del servidor.
 */

const express = require("express"); 
const app = express();
const bodyParser = require("body-parser");

const path=require("path"); //para trabajar con rutas de archivos
const livereload = require("livereload"); //para que se actualice el servidor automaticamente
const connectLivereload = require("connect-livereload"); //para que se actualice el servidor automaticamente




// Lista de tareas opción 1: array simple
//const tareas = ["Estudiar", "Limpiar", "Comprar"];

// Lista de tareas opción 2: array de objetos
const tareas =[
    { id: 32, tarea: "Estudiar", tf_completada: true },
    { id: 2, tarea: "Limpiar", tf_completada: false },
    { id: 3, tarea: '<img src="https://ecampus.com.ar/img/logo.png" alt="logo" width="200">', tf_completada: false},
    { id: 23423, tarea: "Comprar", tf_completada: false }
];

// Lista de tareas opción 3: objeto de objetos (para editar el id directamente usando tareas[id]={...} )
// const tareas ={
//     1: {tarea: "Estudiar", tf_completada: false },
//     2: {tarea: "Limpiar", tf_completada: false },
//     3: {tarea: "Comprar", tf_completada: false }
// };

// live Reload del brower en cambios de código
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));


// Enable CORS for client 5173
app.use((req, res, next) => {
    //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173', 'https://todo-rcmq.onrender.com');

    const allowedOrigins = ['http://localhost:5173', 'http://localhost'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) { // solo permito los habilitados mas arriba
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  });


// middleware de liveReload para actualizar el browser cuando hay cambios en el código
app.use(connectLivereload()); // para que se actualice el servidor automaticamente

app.use(bodyParser.urlencoded({ extended: false })); // Parse de URL-encode body (como te lo envían los HTML Forms)
app.use(bodyParser.json()); //middleware que pasa el body a req.body --> en req.body se recoge la información que envia el usuario

// Cargar HTML del cliente 
app.use(express.static(path.join(__dirname, 'public'))); 


// Rutas del API
app.get("/tareas/", (req, res) => { //con el metodo get leemos los recursos
    console.log("Tareas:",tareas);
    res.send(tareas); //respondemos enviando el array de tareas
});

app.get("/tareas/:id", (req, res) => { //con el metodo get leemos los recursos
    const tareaID = parseInt(req.params.id); //en este caso params por que estas accediendo al parametro y no al body

    res.send(tareas); //respondemos enviando el array de tareas
});

app.post("/tareas/", (req, res) => { //post para añadir tareas 
    //console.log(req.body);
    const txt_tarea= req.body.txt_tarea;
    if (txt_tarea === undefined || txt_tarea === ""){ //si no se añade ninguna tarea, da error
        res.status(400).send("Tienes que añadir una tarea"); // automáticamente res hace return y no continua con el código
        return;
    }

    // -------------------------------------------------------
    //      Método 1: Si poseo un array simple
    // -------------------------------------------------------
    //
    // tareas.push(txt_tarea);
    //
    // -------------------------------------------------------

    // -------------------------------------------------------
    //      Método 2: Si poseo un array de objetos
    // -------------------------------------------------------
    //
    // utilizo Reduce para encontrar el mayor id. Esto es porque si uso "tareas.length+1", y borro items en el medio, los ids se van a sobreescribir.
    // Reduce recorre todas las tareas, compara el valor del acumulador con el id de cada tarea, y conserva el mayor
        const lastId = tareas.reduce((maxId, tarea) => tarea.id > maxId ? tarea.id : maxId, 0); //maxID es acumulador, 0 es el valor inicial
    //console.log("lastId:",lastId);
        const obj_tarea = {id: lastId+1, tarea: txt_tarea, tf_completada: false}; // creamos un objeto con la tarea y el nuevo id
    // agregar un item si tareas es un array
        tareas.push(obj_tarea); //push actualiza el array
    //
    // -------------------------------------------------------
    
    // -------------------------------------------------------
    //      Método 3: Si poseo un objeto de objetos
    // -------------------------------------------------------
    //
    // const obj_tarea = {tarea: txt_tarea, tf_completada: false}; // creamos un objeto con la tarea y el nuevo id
    // Find the maximum index value in the object
    // const maxIndex = Math.max(...Object.keys(tareas)); // Object.keys devuelve array de indices [1,2,3], y luego obtengo el maximo
    // tareas[maxIndex + 1] = obj_tarea; // agregar un item si tareas es un objeto
    //
    // -------------------------------------------------------
    
    //console.log("Nueva tarea:",obj_tarea);
    //console.log("nueva lista de tareas:",tareas);

    res.status(201).send(`Se ha añadido correctamente la tarea ${txt_tarea}`);
    //res.redirect(301, '/'); // redirect para volver a la página principal
    
});



// Posibilidad de Editar o Marcar como completada en base a su action
app.put("/tareas/:id/:action", (req, res) => {
    //console.log("params:",req.params);
    const tareaID = parseInt(req.params.id); //en este caso params por que estas accediendo al parametro y no al body
    const action = req.params.action;

    if (tareaID < 0) {
        // en realidad debería ver si existe en mi array de tareas
        res.status(404).send("No existe esta tarea");
    }

    if(action == "completada"){
        
        // si mis tareas es un array de objetos, recorro todo el array hasta encontrar la tarea.
        // método 1 usando map(), es el mas moderno pero incluso luego de encontrar la tarea, continua revisando el resto de items
        // tareas = tareas.map(tarea => {
        //     if (tarea.id === 2) {
        //       tarea.tf_completada = true;
        //     }
        //     return tarea;
        // });

        // método 2 usando for(), es el mas eficiente ya que detiene el bucle en cuanto encuentra el primer item.
        for (let i = 0; i < tareas.length; i++) {
            if (tareas[i].id === tareaID) {
            //tareas[i].tf_completada = true; // solo tachar (poner en true)
            tareas[i].tf_completada = !tareas[i].tf_completada; // toggle
            break; // stop the loop since we found the task
            }
        }

        res.status(201).send(`Se ha completado la tarea ${tareaID}`);
    }
    
    if(action == "editar"){
        console.log("editando");
        const txt_tarea= req.body.txt_tarea;
        
        for (let i = 0; i < tareas.length; i++) {
            if (tareas[i].id === tareaID) {
                tareas[i].tarea = txt_tarea;
                break; // stop the loop since we found the task
            }
        }
        console.log("Tareas:",tareas);
        res.status(201).send(`Se ha actualizado la tarea ${tareaID}`);
    }
});

// la elimino
app.delete("/tareas/:id", (req, res) => {
    const tareaID = parseInt(req.params.id);

    // requiere que tareas sea let porque crea un nuevo array duplicado sin ese item
    //tareas = tareas.filter(item => item.id !== tareaID);


    tareas.splice(tareas.findIndex(tarea => tarea.id === tareaID), 1);
    
    // método 2 usando for(), es el mas eficiente ya que detiene el bucle en cuanto encuentra el primer item.
    // for (let i = 0; i < tareas.length; i++) {
    //     if (tareas[i].id === tareaID) {
        
    //         // eliminar la tarea

    //         break; // stop the loop since we found the task
    //     }
    // }
    
    console.log("Tarea eliminada", tareaID);
    res.status(201).send("Tarea Eliminada!");
    //res.redirect(301, '/'); // redirect para volver a la página principal
});


const port= 3000;
app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});
