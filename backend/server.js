require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas existentes
const ticketsRoutes = require('./src/routes/tickets');
app.use('/api/tickets', ticketsRoutes);

// Rutas del Restaurante
app.use('/api/mesas', require('./src/routes/mesas'));
app.use('/api/clientes', require('./src/routes/clientes'));
app.use('/api/horarios', require('./src/routes/horarios'));
app.use('/api/reservas', require('./src/routes/reservas'));
app.use('/api/disponibilidad', require('./src/routes/disponibilidad'));
app.use('/api/panel', require('./src/routes/panel'));


// Configuración de la Base de Datos (MySQL)
const dbConfig = require('./src/config/db');


// Ruta de salud (para probar que el server arranca)
app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'soporte-tickets-api', ts: new Date().toISOString() });
});

// Ruta de prueba para verificar conexión a la Base de Datos
app.get('/api/db-test', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        await connection.end();
        res.json({ ok: true, message: 'Conexión a MySQL exitosa 🚀', result: rows[0].result });
    } catch (error) {
        console.error('Error de BD:', error.message);
        res.status(500).json({ ok: false, error: 'No se pudo conectar a MySQL', details: error.message });
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Arranque del servidor
const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
        console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    });
}

module.exports = app;