const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const dbConfig = require('../config/db');


// GET: Obtener todos los tickets (con datos del cliente)
router.get('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
      SELECT t.*, c.nombre AS cliente_nombre, c.email AS cliente_email 
      FROM tickets t 
      JOIN clientes c ON t.cliente_id = c.id
    `);
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Crear un nuevo ticket
router.post('/', async (req, res) => {
    try {
        const { cliente_id, asunto, descripcion, urgencia } = req.body;
        if (!cliente_id || !asunto || !descripcion) {
            return res.status(400).json({ error: 'cliente_id, asunto y descripcion son requeridos' });
        }
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO tickets (cliente_id, asunto, descripcion, urgencia) VALUES (?, ?, ?, ?)',
            [cliente_id, asunto, descripcion, urgencia || 'media']
        );
        await connection.end();
        res.status(201).json({ id: result.insertId, cliente_id, asunto, descripcion, urgencia: urgencia || 'media' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT: Actualizar el estado o respuesta de un ticket
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, respuesta_sugerida } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE tickets SET estado = ?, respuesta_sugerida = ? WHERE id = ?',
            [estado, respuesta_sugerida, id]
        );
        await connection.end();
        res.json({ message: 'Ticket actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;