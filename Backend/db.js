const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'tienda'
});

conexion.connect((error) => {
    if (error) {
        console.error("Error de conexión:", error);
        return;
    }
    console.log("Conexion exitosa con MYSQL");
});

module.exports = conexion;