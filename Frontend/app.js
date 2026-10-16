const API_URL = 'https://proyecto-bd-tzbv.onrender.com';

// Elementos del DOM
const listaProductos = document.getElementById('listaProductos');
const formulario = document.getElementById('formularioProducto');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-Cancelar');
const tituloFormulario = document.getElementById('TituloFormulario');
const productoId = document.getElementById('productoId');
const nombreInput = document.getElementById('nombre');
const precioInput = document.getElementById('precio');
const stockInput = document.getElementById('Stock');
const mensaje = document.createElement('p');

mensaje.setAttribute('role', 'status');
mensaje.setAttribute('aria-live', 'polite');
listaProductos.before(mensaje);

function mostrarMensaje(texto, esError = false) {
  mensaje.textContent = texto;
  mensaje.setAttribute('role', esError ? 'alert' : 'status');
}

async function enviarSolicitud(url, opciones = {}) {
  const respuesta = await fetch(url, opciones);
  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.mensaje || resultado.error || 'No se pudo completar la operación.');
  }

  return resultado;
}

// 1. Función para consultar todos los productos y mostrarlos en el DOM (READ)
async function cargarProductos() {
  try {
    const productos = await enviarSolicitud(`${API_URL}/productos`);
    listaProductos.innerHTML = '';

    if (productos.length === 0) {
      listaProductos.innerHTML = "<p style='color: #64748b;'>No hay productos registrados.</p>";
      return;
    }

    productos.forEach((producto) => {
      const elemento = document.createElement('div');
      elemento.classList.add('producto');

      const datos = document.createElement('div');
      const nombreProducto = document.createElement('h3');
      nombreProducto.textContent = producto.nombre;
      const precioProducto = document.createElement('p');
      precioProducto.classList.add('producto-precio');
      precioProducto.textContent = `Precio: $${producto.precio}`;
      const stockProducto = document.createElement('p');
      stockProducto.textContent = `Stock: ${producto.stock}`;
      datos.append(nombreProducto, precioProducto, stockProducto);

      const acciones = document.createElement('div');
      acciones.classList.add('acciones');

      const btnEditar = document.createElement('button');
      btnEditar.type = 'button';
      btnEditar.className = 'btn btn-editar';
      btnEditar.textContent = 'Editar';
      btnEditar.addEventListener('click', () => {
        cargarEnFormulario(producto);
        formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      const btnEliminar = document.createElement('button');
      btnEliminar.type = 'button';
      btnEliminar.className = 'btn btn-eliminar';
      btnEliminar.textContent = 'Eliminar';
      btnEliminar.addEventListener('click', () => eliminarProducto(producto.id));

      acciones.append(btnEditar, btnEliminar);
      elemento.append(datos, acciones);
      listaProductos.appendChild(elemento);
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    listaProductos.textContent = `Error al cargar productos: ${error.message}`;
  }
}

// 2. Cargar datos del producto en el formulario para editar (UPDATE)
function cargarEnFormulario(producto) {
  productoId.value = producto.id;
  nombreInput.value = producto.nombre;
  precioInput.value = producto.precio;
  stockInput.value = producto.stock;

  tituloFormulario.textContent = 'Editar Producto';
  btnGuardar.textContent = 'Actualizar Producto';
  btnCancelar.style.display = 'block';
  mostrarMensaje(`Editando "${producto.nombre}". Cambia los datos y pulsa "Actualizar Producto".`);
  nombreInput.focus();
}

function cancelarEdicion() {
  formulario.reset();
  productoId.value = '';
  tituloFormulario.textContent = 'Registrar Productos';
  btnGuardar.textContent = 'Guardar Producto';
  btnCancelar.style.display = 'none';
  mostrarMensaje('');
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const nombre = nombreInput.value.trim();
  const precio = Number(precioInput.value);
  const stock = Number(stockInput.value);

  if (!nombre || !Number.isFinite(precio) || precio < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    window.alert('Ingresa un nombre, un precio válido y un stock entero no negativo.');
    return;
  }

  const editando = productoId.value !== '';
  const url = editando
    ? `${API_URL}/productos/${encodeURIComponent(productoId.value)}`
    : `${API_URL}/productos`;

  try {
    await enviarSolicitud(url, {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, precio, stock })
    });
    cancelarEdicion();
    await cargarProductos();
    mostrarMensaje(editando ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
  } catch (error) {
    console.error('Error al guardar el producto:', error);
    mostrarMensaje(`No se pudo guardar el producto: ${error.message}`, true);
  }
});

btnCancelar.addEventListener('click', cancelarEdicion);

async function eliminarProducto(id) {
  if (!window.confirm('¿Seguro que deseas eliminar este producto?')) {
    return;
  }

  try {
    await enviarSolicitud(`${API_URL}/productos/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    await cargarProductos();
    mostrarMensaje('Producto eliminado correctamente.');
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    mostrarMensaje(`No se pudo eliminar el producto: ${error.message}`, true);
  }
}

cargarProductos();
