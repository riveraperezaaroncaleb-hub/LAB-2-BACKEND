const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dbConfig = require('../config/db');

// GET /api/mesas - Listar todas las mesas
router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM mesas ORDER BY numero ASC');
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mesas/:id - Obtener una mesa por ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM mesas WHERE id = ?', [req.params.id]);
    await connection.end();
    if (rows.length === 0) return res.status(404).json({ error: 'Mesa no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mesas - Crear una mesa
router.post('/', async (req, res) => {
  try {
    const { numero, capacidad, ubicacion, activa } = req.body;
    if (!numero || !capacidad || !ubicacion) {
      return res.status(400).json({ error: 'numero, capacidad y ubicacion son requeridos' });
    }
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO mesas (numero, capacidad, ubicacion, activa) VALUES (?, ?, ?, ?)',
      [numero, capacidad, ubicacion, activa !== undefined ? (activa ? 1 : 0) : 1]
    );
    await connection.end();
    res.status(201).json({ id: result.insertId, numero, capacidad, ubicacion, activa: activa !== undefined ? activa : 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/mesas/:id - Actualizar una mesa
router.put('/:id', async (req, res) => {
  try {
    const { numero, capacidad, ubicacion, activa } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'UPDATE mesas SET numero = COALESCE(?, numero), capacidad = COALESCE(?, capacidad), ubicacion = COALESCE(?, ubicacion), activa = COALESCE(?, activa) WHERE id = ?',
      [numero, capacidad, ubicacion, activa !== undefined ? (activa ? 1 : 0) : null, req.params.id]
    );
    await connection.end();
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Mesa no encontrada' });
    res.json({ message: 'Mesa actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/mesas/:id - Eliminar una mesa
router.delete('/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM mesas WHERE id = ?', [req.params.id]);
    await connection.end();
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Mesa no encontrada' });
    res.json({ message: 'Mesa eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
