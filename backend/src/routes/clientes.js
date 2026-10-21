const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dbConfig = require('../config/db');

// GET /api/clientes - Listar todos los clientes con su historial de no-shows
router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM clientes ORDER BY id ASC');
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clientes/:id - Obtener un cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
    await connection.end();
    if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clientes - Crear un cliente
router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, email, no_shows } = req.body;
    if (!nombre || !telefono) {
      return res.status(400).json({ error: 'nombre y telefono son requeridos' });
    }
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO clientes (nombre, telefono, email, no_shows) VALUES (?, ?, ?, ?)',
      [nombre, telefono, email || null, no_shows || 0]
    );
    await connection.end();
    res.status(201).json({ id: result.insertId, nombre, telefono, email, no_shows: no_shows || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clientes/:id - Actualizar datos del cliente
router.put('/:id', async (req, res) => {
  try {
    const { nombre, telefono, email, no_shows } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'UPDATE clientes SET nombre = COALESCE(?, nombre), telefono = COALESCE(?, telefono), email = COALESCE(?, email), no_shows = COALESCE(?, no_shows) WHERE id = ?',
      [nombre, telefono, email, no_shows !== undefined ? no_shows : null, req.params.id]
    );
    await connection.end();
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ message: 'Cliente actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/clientes/:id - Eliminar un cliente
router.delete('/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM clientes WHERE id = ?', [req.params.id]);
    await connection.end();
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
