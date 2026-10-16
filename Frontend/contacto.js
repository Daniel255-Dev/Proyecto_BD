const API_URL = 'https://proyecto-bd-tzbv.onrender.com';
const formularioContacto = document.getElementById('formularioContacto');
const estadoContacto = document.getElementById('estadoContacto');
const botonEnviar = formularioContacto.querySelector('button[type="submit"]');
const formularioAdministrador = document.getElementById('formularioAdministrador');
const contrasenaAdministrador = document.getElementById('contrasenaAdministrador');
const btnAccesoAdministrador = document.getElementById('btnAccesoAdministrador');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
const estadoAdministrador = document.getElementById('estadoAdministrador');
const listaMensajesContacto = document.getElementById('listaMensajesContacto');
let credencialAdministrador = '';

async function leerRespuesta(respuesta) {
  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.mensaje || 'No se pudo completar la operación.');
  }

  return resultado;
}

async function obtenerMensajes(credencial) {
  const respuesta = await fetch(`${API_URL}/contactanos`, {
    headers: { 'X-Admin-Password': credencial }
  });
  return leerRespuesta(respuesta);
}

function mostrarMensajes(mensajes) {
  listaMensajesContacto.replaceChildren();

  if (mensajes.length === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'ayuda-mensajes';
    vacio.textContent = 'No hay mensajes enviados.';
    listaMensajesContacto.appendChild(vacio);
    return;
  }

  mensajes.forEach((mensaje) => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'mensaje-contacto';

    const titulo = document.createElement('h3');
    titulo.textContent = mensaje.asunto;
    const remitente = document.createElement('p');
    remitente.className = 'remitente-mensaje';
    remitente.textContent = `${mensaje.nombre} · ${mensaje.correo}`;
    const contenido = document.createElement('p');
    contenido.className = 'contenido-mensaje';
    contenido.textContent = mensaje.mensaje;

    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button';
    botonEliminar.className = 'btn btn-eliminar-mensaje';
    botonEliminar.textContent = 'Eliminar mensaje';
    botonEliminar.addEventListener('click', () => eliminarMensaje(mensaje.id));

    tarjeta.append(titulo, remitente, contenido, botonEliminar);
    listaMensajesContacto.appendChild(tarjeta);
  });
}

async function actualizarMensajes(credencial) {
  const mensajes = await obtenerMensajes(credencial);
  mostrarMensajes(mensajes);
  listaMensajesContacto.hidden = false;
}

formularioContacto.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const datos = {
    nombre: document.getElementById('nombreCompleto').value.trim(),
    correo: document.getElementById('correoContacto').value.trim(),
    asunto: document.getElementById('asuntoContacto').value.trim(),
    mensaje: document.getElementById('mensajeContacto').value.trim()
  };

  if (Object.values(datos).some((valor) => !valor)) {
    estadoContacto.textContent = 'Por favor completa todos los campos.';
    estadoContacto.setAttribute('role', 'alert');
    return;
  }

  botonEnviar.disabled = true;
  estadoContacto.textContent = 'Enviando mensaje...';
  estadoContacto.setAttribute('role', 'status');

  try {
    const respuesta = await fetch(`${API_URL}/contactanos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || 'No se pudo guardar el mensaje.');
    }

    formularioContacto.reset();
    estadoContacto.textContent = resultado.mensaje;
    if (credencialAdministrador) {
      try {
        await actualizarMensajes(credencialAdministrador);
      } catch (error) {
        console.error('Error al actualizar la lista de mensajes:', error);
        estadoAdministrador.textContent =
          `El mensaje se envió, pero no se pudo actualizar la lista: ${error.message}`;
        estadoAdministrador.setAttribute('role', 'alert');
      }
    }
  } catch (error) {
    console.error('Error al enviar el mensaje de contacto:', error);
    estadoContacto.textContent = `No se pudo enviar el mensaje: ${error.message}`;
    estadoContacto.setAttribute('role', 'alert');
  } finally {
    botonEnviar.disabled = false;
  }
});

formularioAdministrador.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  btnAccesoAdministrador.disabled = true;
  estadoAdministrador.textContent = 'Verificando acceso...';
  estadoAdministrador.setAttribute('role', 'status');

  try {
    const credencial = contrasenaAdministrador.value;
    await actualizarMensajes(credencial);
    credencialAdministrador = credencial;
    contrasenaAdministrador.value = '';
    contrasenaAdministrador.disabled = true;
    btnAccesoAdministrador.hidden = true;
    btnCerrarSesion.hidden = false;
    estadoAdministrador.textContent = 'Acceso administrativo habilitado.';
  } catch (error) {
    console.error('Error al consultar los mensajes de contacto:', error);
    estadoAdministrador.textContent = `No se pudo acceder: ${error.message}`;
    estadoAdministrador.setAttribute('role', 'alert');
  } finally {
    btnAccesoAdministrador.disabled = false;
  }
});

btnCerrarSesion.addEventListener('click', () => {
  credencialAdministrador = '';
  listaMensajesContacto.replaceChildren();
  listaMensajesContacto.hidden = true;
  contrasenaAdministrador.disabled = false;
  formularioAdministrador.reset();
  btnAccesoAdministrador.hidden = false;
  btnCerrarSesion.hidden = true;
  estadoAdministrador.textContent = 'Sesión administrativa cerrada.';
  estadoAdministrador.setAttribute('role', 'status');
});

async function eliminarMensaje(id) {
  if (!window.confirm('¿Seguro que deseas eliminar este mensaje? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/contactanos/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Password': credencialAdministrador }
    });
    const resultado = await leerRespuesta(respuesta);
    await actualizarMensajes(credencialAdministrador);
    estadoAdministrador.textContent = resultado.mensaje;
    estadoAdministrador.setAttribute('role', 'status');
  } catch (error) {
    console.error('Error al eliminar el mensaje de contacto:', error);
    estadoAdministrador.textContent = `No se pudo eliminar el mensaje: ${error.message}`;
    estadoAdministrador.setAttribute('role', 'alert');
  }
}
