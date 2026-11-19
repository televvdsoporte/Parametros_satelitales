let parametros = [];

const archivosPaises = {
    colombia: "colombia.json",
    peru: "peru.json",
    ecuador: "ecuador.json"
};

const paisSelect = document.getElementById("pais");
const buscarInput = document.getElementById("buscar");
const resultados = document.getElementById("resultados");

// Referencias a los indicadores
const indicadorPais = document.getElementById("indicador-pais");
const indicadorSenales = document.getElementById("indicador-senales");
const indicadorProgramadoras = document.getElementById("indicador-programadoras");

// Actualiza las tarjetas de indicadores
function actualizarIndicadores() {

    const pais = paisSelect.options[paisSelect.selectedIndex]?.text || "—";

    const totalSenales = parametros.length;

    const totalProgramadoras = new Set(
        parametros.map(item => item.programadora || "Sin programadora")
    ).size;

    indicadorPais.textContent = paisSelect.value ? pais : "—";

    indicadorSenales.textContent = totalSenales;

    indicadorProgramadoras.textContent = totalProgramadoras;

}

// Evita que los datos del JSON se interpreten como código HTML.
function escapar(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// Columnas correspondientes a cada formato.
const formatos = {

    general: {
        titulo: "Formato general",
        columnas: [
            ["senal", "Señal"],
            ["satelite", "Satelite"],
            ["polaridad", "Polaridad"],
            ["frecuencia", "Frecuencia"],
            ["sr", "SR"],
            ["net_id", "Net Id"],
            ["modulacion", "Modulacion"],
            ["canal_virtual", "Canal Virtual"]
        ]
    },

    vct_vcn: {
        titulo: "Formato VCT / VCN",
        columnas: [
            ["senal", "Señal"],
            ["satelite", "Satelite"],
            ["polaridad", "Polaridad"],
            ["frecuencia", "Frecuencia"],
            ["sr", "SR"],
            ["modulacion", "Modulacion"],
            ["vct", "VCT"],
            ["vcn", "VCN"]
        ]
    },

    transmision: {
        titulo: "Formato con transmisión",
        columnas: [
            ["senal", "Señal"],
            ["satelite", "Satelite"],
            ["polaridad", "Polaridad"],
            ["frecuencia", "Frecuencia"],
            ["sr", "SR"],
            ["transmision", "Transmision"],
            ["modulacion", "Modulacion"]
        ]
    },

    ecuador_1: {
        titulo: "Formato Ecuador 1",
        columnas: [
            ["senal", "Señal"],
            ["satelite", "Satelite"],
            ["polaridad", "Polaridad"],
            ["frecuencia", "Frecuencia"],
            ["sr", "SR"],
            ["net_id", "Net Id"],
            ["roll_off", "Roll Off"],
            ["canal_virtual", "Canal Virtual"],
            ["modelo", "Modelo"]
        ]
    },

    ecuador_2: {
        titulo: "Formato Ecuador 2",
        columnas: [
            ["senal", "Señal"],
            ["satelite", "Satelite"],
            ["polaridad", "Polaridad"],
            ["frecuencia", "Frecuencia"],
            ["sr", "SR"],
            ["roll_off", "Roll Off"],
            ["vc", "VC"],
            ["vct", "VCT"],
            ["modelo", "Modelo"],
            ["audio", "AUDIO"]
        ]
    }

};


// Carga la información desde el archivo JSON.
async function cargarParametros(archivo) {

    try {

        resultados.innerHTML = `
            <div class="mensaje">
                Cargando parámetros...
            </div>
        `;

        const respuesta = await fetch(archivo);

        if (!respuesta.ok) {
            throw new Error("No fue posible cargar el archivo JSON.");
        }

        parametros = await respuesta.json();

        actualizarIndicadores();

        mostrarResultados();

    } catch (error) {

        resultados.innerHTML = `
            <div class="mensaje error">
                No fue posible cargar los parámetros.
                Verifica que el archivo JSON esté disponible.
            </div>
        `;

        console.error(error);

    }

}


// Crea las opciones de países.
function cargarPaises() {

    paisSelect.innerHTML = `
        <option value="">Seleccionar país</option>
        <option value="colombia">Colombia</option>
        <option value="peru">Perú</option>
        <option value="ecuador">Ecuador</option>
    `;

}


// Escucha el cambio de país.
paisSelect.addEventListener("change", () => {

    buscarInput.value = "";

    parametros = [];

    buscarInput.disabled = !paisSelect.value;
    actualizarIndicadores();

    if (paisSelect.value) {

        const archivo = archivosPaises[paisSelect.value];

        cargarParametros(archivo);

    } else {

        resultados.innerHTML = `
            <div class="mensaje">
                Selecciona un país para consultar las señales disponibles.
            </div>
        `;

    }

});

// Escucha las búsquedas de señales.
buscarInput.addEventListener("input", mostrarResultados);


// Organiza y muestra las señales.
function mostrarResultados() {

    const paisSeleccionado = paisSelect.value;

    const busqueda = buscarInput.value
        .trim()
        .toLowerCase();

    if (!paisSeleccionado) {
        return;
    }

    const registros = parametros.filter(item => {

        const coincideSenal = String(item.senal ?? "")
            .toLowerCase()
            .includes(busqueda);

        return coincideSenal;

    });

    if (registros.length === 0) {

        resultados.innerHTML = `
            <div class="mensaje">
                No se encontraron señales para esta búsqueda.
            </div>
        `;

        return;

    }


    // Agrupa las señales por programadora.
    const programadoras = {};

    registros.forEach(item => {

        const nombre = item.programadora || "Sin programadora";

        if (!programadoras[nombre]) {
            programadoras[nombre] = {};
        }

        // Identifica el formato del registro.
        const formato = formatos[item.formato]
            ? item.formato
            : "general";

        // Separa los modelos del formato Ecuador 2.
        const modelo = formato === "ecuador_2"
            ? (item.modelo || "Sin modelo")
            : "";

        const claveGrupo = modelo
            ? `${formato}::${modelo}`
            : formato;

        if (!programadoras[nombre][claveGrupo]) {
            programadoras[nombre][claveGrupo] = [];
        }

        programadoras[nombre][claveGrupo].push(item);

    });


    let html = "";


    // Construye una sección para cada programadora.
    Object.keys(programadoras).forEach(nombre => {

        html += `
            <section class="programadora">
                <h2>${escapar(nombre)}</h2>
        `;


        // Construye una tabla por cada formato y modelo.
        Object.keys(programadoras[nombre]).forEach(tipo => {

            const [formato, modelo] = tipo.split("::");

            const configuracion = formatos[formato];

            const senales = programadoras[nombre][tipo];

            const encabezadoModelo = modelo
                ? `<h3>${escapar(modelo)}</h3>`
                : "";

            html += `
                <div class="formato">
                    ${encabezadoModelo}

                    <div class="tabla-contenedor">
                        <table>
                            <thead>
                                <tr>
            `;

            configuracion.columnas.forEach(columna => {

                html += `<th>${escapar(columna[1])}</th>`;

            });

            html += `
                                </tr>
                            </thead>
                            <tbody>
            `;


            senales.forEach(senal => {

                html += "<tr>";

                configuracion.columnas.forEach(columna => {

                    html += `
                        <td>${escapar(senal[columna[0]])}</td>
                    `;

                });

                html += "</tr>";

            });


            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

        });


        html += "</section>";

    });


    resultados.innerHTML = html;

}

// Inicia la carga de información.
cargarPaises();
