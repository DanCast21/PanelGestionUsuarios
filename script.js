/* Panel de Gestión de Usuarios */


// 1. Uso de la API.
const API_URL = "https://jsonplaceholder.typicode.com/users";

let usuarios = [];
const obtenerIdsActuales = () => usuarios.map(({ id }) => id);
let idEditando = null;      // ID del usuario en edición (null = modo agregar).
let temporizadorMensaje;    // Para ocultar los mensajes automáticamente.

// 2. Referencias al DOM.
const form = document.getElementById("formUsuario");
const inputId = document.getElementById("id");
const inputNombre = document.getElementById("nombre");
const inputCorreo = document.getElementById("correo");
const inputCiudad = document.getElementById("ciudad");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const tituloForm = document.getElementById("tituloFormulario");
const buscador = document.getElementById("buscador");
const cuerpoTabla = document.getElementById("cuerpoTabla");
const contador = document.getElementById("contador");
const cajaMensaje = document.getElementById("mensaje");

// 3. Mensajes de estado.
const mostrarMensaje = (tipo, texto) => {
  let clase;
  // Elegimos la clase CSS y el prefijo según el tipo de mensaje.
  switch (tipo) {
    case "exito": clase = "exito"; texto = `✔ ${texto}`; break;
    case "error": clase = "error"; texto = `✖ ${texto}`; break;
    default:      clase = "info";  // informacion y cualquier otro caso.
  }
  cajaMensaje.className = `mensaje ${clase}`;
  cajaMensaje.textContent = texto;

  // tiempo de respuesta.
  clearTimeout(temporizadorMensaje);
  if (tipo !== "info") {
    temporizadorMensaje = setTimeout(() => cajaMensaje.classList.add("oculto"), 4000);
  }
};

const ocultarMensaje = () => cajaMensaje.classList.add("oculto");

// 4. Dibujar la tabla.
// filter() crea una lista nueva.
const obtenerFiltrados = () => {
  const texto = buscador.value.trim().toLowerCase();
  return usuarios.filter(({ nombre }) => nombre.toLowerCase().includes(texto));
};

const dibujarTabla = () => {
  const lista = obtenerFiltrados();
  contador.textContent = usuarios.length;

  // Condicional: si no hay resultados, mostramos un mensaje vacío.
  if (lista.length === 0) {
    cuerpoTabla.innerHTML = `<tr><td colspan="5" class="vacio">No hay usuarios que coincidan.</td></tr>`;
    return;
  }

  // map() + template strings: una fila por usuario.
  cuerpoTabla.innerHTML = lista.map(({ id, nombre, correo, ciudad }) => `
    <tr>
      <td class="id-celda" data-label="ID">${id}</td>
      <td data-label="Nombre">${escapar(nombre)}</td>
      <td data-label="Correo">${escapar(correo)}</td>
      <td data-label="Ciudad">${escapar(ciudad)}</td>
      <td class="acciones">
        <button class="btn btn-editar" data-accion="editar" data-id="${id}">Editar</button>
        <button class="btn btn-eliminar" data-accion="eliminar" data-id="${id}">Eliminar</button>
      </td>
    </tr>`).join("");
};

// Evita que el texto escrito por el usuario se interprete como HTML.
const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Redibuja y registra el arreglo completo en consola cada vez que cambia.
const actualizarVista = () => {
  dibujarTabla();
  console.log(JSON.stringify(usuarios, null, 2));
};

// 5. Validación del formulario.
// Devuelve un texto de error o null si todo está correcto.
const validar = ({ id, nombre, correo, ciudad }) => {
  if (!id || !nombre || !correo || !ciudad) return "Todos los campos son obligatorios.";
  if (!correo.includes("@")) return "El correo debe contener «@».";

  // Solo se valida el ID cuando se agrega (al editar está bloqueado).
  if (idEditando === null) {
    if (!/^\d+$/.test(id)) return "El ID debe ser numérico.";
    const numero = Number(id);
    if (obtenerIdsActuales().includes(numero) || usuarios.some((u) => u.id === numero)) {
      return `El ID ${numero} ya existe.`;
    }
  }
  return null;
};

// 6. Agregar / Guardar cambios.
form.addEventListener("submit", (evento) => {
  evento.preventDefault(); // Evita que la página se recargue.

  const datos = {
    id: inputId.value.trim(),
    nombre: inputNombre.value.trim(),
    correo: inputCorreo.value.trim(),
    ciudad: inputCiudad.value.trim()
  };

  const error = validar(datos);
  if (error) {
    mostrarMensaje("error", error);
    return;
  }

  if (idEditando === null) {
    // Modo agregar: creamos el objeto y lo añadimos.
    usuarios.push({ ...datos, id: Number(datos.id) });
    mostrarMensaje("exito", `Usuario «${datos.nombre}» agregado.`);
  } else {
    // Modo editar: actualizamos el objeto existente.
    const usuario = usuarios.find((u) => u.id === idEditando);
    usuario.nombre = datos.nombre;
    usuario.correo = datos.correo;
    usuario.ciudad = datos.ciudad;
    mostrarMensaje("exito", `Usuario «${datos.nombre}» actualizado.`);
  }

  salirModoEdicion(); // Limpia el formulario y vuelve al modo agregar.
  actualizarVista();
});

// 7. Modo edición.
const entrarModoEdicion = (id) => {
  const { nombre, correo, ciudad } = usuarios.find((u) => u.id === id);
  idEditando = id;
  inputId.value = id;
  inputId.disabled = true;           // El ID no se puede cambiar.
  inputNombre.value = nombre;
  inputCorreo.value = correo;
  inputCiudad.value = ciudad;
  btnGuardar.textContent = "Guardar cambios";
  tituloForm.textContent = "Editar usuario";
  btnCancelar.classList.remove("oculto");
  inputNombre.focus();
};

const salirModoEdicion = () => {
  idEditando = null;
  form.reset();                      // Limpia todos los campos.
  inputId.disabled = false;
  btnGuardar.textContent = "Agregar usuario";
  tituloForm.textContent = "Nuevo usuario";
  btnCancelar.classList.add("oculto");
};

btnCancelar.addEventListener("click", salirModoEdicion);

// 8. Editar y eliminar.
cuerpoTabla.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const { accion } = boton.dataset;

  if (accion === "editar") {
    entrarModoEdicion(id);
  } else if (accion === "eliminar") {
    const { nombre } = usuarios.find((u) => u.id === id);
    // Confirmación antes de eliminar.
    if (!confirm(`¿Seguro que quieres eliminar a «${nombre}»?`)) return;

    // filter() genera un arreglo nuevo sin el usuario eliminado.
    usuarios = usuarios.filter((u) => u.id !== id);
    if (idEditando === id) salirModoEdicion();
    mostrarMensaje("exito", `Usuario «${nombre}» eliminado.`);
    actualizarVista();
  }
});

// 9. Búsqueda en vivo (evento input).
buscador.addEventListener("input", dibujarTabla);

// 10. Cargar usuarios desde la API.
const cargarUsuarios = async () => {
  mostrarMensaje("info", "Cargando usuarios...");

  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    const datos = await respuesta.json();
    usuarios = datos.map((usuario) => ({
      id: usuario.id,
      nombre: usuario.name,
      correo: usuario.email,
      ciudad: usuario.address?.city || "Sin ciudad"
    }));

    actualizarVista();
    ocultarMensaje();
  } catch (error) {
    console.error("Error al cargar usuarios desde la API:", error);
    mostrarMensaje("error", "No pudimos cargar los usuarios. Verifica tu conexión e inténtalo de nuevo.");
    usuarios = [];
    actualizarVista();
  }
};

// 11. Inicio.
cargarUsuarios();
