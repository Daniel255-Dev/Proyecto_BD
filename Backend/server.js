const express = require('express');
const cors = require('cors');
const { timingSafeEqual } = require('crypto');
const conexion = require('./db');
const contrasenaAdministrador = '1234';

// Middlewares globales
const app = express();
app.use(cors());
app.use(express.json());

function requiereAdministrador(req, res, next) {
    const contrasenaRecibida = req.get('X-Admin-Password');

    if (typeof contrasenaRecibida !== 'string') {
        return res.status(401).json({
            mensaje: "Contraseña de administrador inválida"
        });
    }

    const esperada = Buffer.from(contrasenaAdministrador, 'utf8');
    const recibida = Buffer.from(contrasenaRecibida, 'utf8');

    if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
        return res.status(401).json({
            mensaje: "Contraseña de administrador inválida"
        });
    }

    next();
}

app.get(['/', '/productos'], (req, res) => {
    const sql = "SELECT * FROM productos";

    conexion.query(sql, (error, results) => {
        if (error) {
            console.error("Error al consultar:", error);
            return res.status(500).json({
                error: "Error al consultar los productos"
            });
        }
        res.json(results);
    });
});
// 2. Crear un producto (CREATE)
app.post('/productos', (req, res) => {
    const { nombre, precio, stock } = req.body;

    //Consulta parametrizada con '?' para prevenir inyeccion en SQL
    const sql = "INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)";
    const valores = [nombre, precio, stock];

    conexion.query(sql, valores, (error, resultado) => {
        if (error) {
            console.error("Error al crear el producto:", error);
            return res.status(500).json({
                mensaje: "Error al crear el producto"
            });
        }
        res.status(201).json({
            mensaje: "Producto creado correctamente",
        });
    });
});

app.post('/contactanos', (req, res) => {
    const { nombre, correo, asunto, mensaje } = req.body || {};
    const datos = [nombre, correo, asunto, mensaje];

    if (datos.some((dato) => typeof dato !== 'string' || !dato.trim())) {
        return res.status(400).json({
            mensaje: "Todos los campos de contacto son obligatorios"
        });
    }

    const valores = datos.map((dato) => dato.trim());
    const [nombreValidado, correoValidado, asuntoValidado, mensajeValidado] = valores;

    if (nombreValidado.length > 100 || correoValidado.length > 100 ||
        asuntoValidado.length > 100 || mensajeValidado.length > 5000 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoValidado)) {
        return res.status(400).json({
            mensaje: "Verifica el correo y la longitud de los campos"
        });
    }

    const sql = "INSERT INTO Contactanos (nombre, correo, asunto, mensaje) VALUES (?, ?, ?, ?)";

    conexion.query(sql, valores, (error) => {
        if (error) {
            console.error("Error al guardar el mensaje de contacto:", error);
            return res.status(500).json({
                mensaje: "Error al guardar el mensaje de contacto"
            });
        }

        res.status(201).json({
            mensaje: "Mensaje de contacto enviado correctamente"
        });
    });
});

app.get('/contactanos', requiereAdministrador, (req, res) => {
    const sql = "SELECT id, nombre, correo, asunto, mensaje FROM Contactanos ORDER BY id DESC";

    conexion.query(sql, (error, resultados) => {
        if (error) {
            console.error("Error al consultar los mensajes de contacto:", error);
            return res.status(500).json({
                mensaje: "Error al consultar los mensajes de contacto"
            });
        }

        res.json(resultados);
    });
});

app.delete('/contactanos/:id', requiereAdministrador, (req, res) => {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            mensaje: "El identificador del mensaje no es válido"
        });
    }

    const sql = "DELETE FROM Contactanos WHERE id = ?";

    conexion.query(sql, [id], (error, resultados) => {
        if (error) {
            console.error("Error al eliminar el mensaje de contacto:", error);
            return res.status(500).json({
                mensaje: "Error al eliminar el mensaje de contacto"
            });
        }

        if (resultados.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el mensaje"
            });
        }

        res.json({
            mensaje: "Mensaje eliminado correctamente"
        });
    });
});

//Actializar un producto existente (UPDATE)
app.put('/productos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, precio, stock } = req.body;

    const sql = "UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?";
    const valores = [nombre, precio, stock, id];

    conexion.query(sql, valores, (error, resultados) => {
        if (error) {
            console.error("Error al actualizar el producto:", error);
            return res.status(500).json({
                mensaje: "Error al actualizar el producto"
            });
        }
        res.status(200).json({
            mensaje: "Producto actualizado correctamente",
        });
    });
});
//eliminar un producto existente (DELETE)
app.delete('/productos/:id', (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM productos WHERE id = ?";

    conexion.query(sql, [id], (error, resultados) => {
        if (error) {
            console.error("Error al eliminar el producto:", error);
            return res.status(500).json({
                mensaje: "Error al eliminar el producto"
            });
        }
        if (resultados.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el producto"
            });
        }
        res.json({
            mensaje: "Producto eliminado correctamente"
        });
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
