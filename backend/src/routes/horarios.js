const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dbConfig = require('../config/db');

// GET /api/horarios - Listar todos los horarios
router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM horarios ORDER BY FIELD(dia_semana, "lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo")');
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/horarios/:id - Obtener un horario por ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM horarios WHERE id = ?', [req.params.id]);
    await connection.end();
    if (rows.length === 0) return res.status(404).json({ error: 'Horario no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/horarios - Crear un horario
router.post('/', async (req, res) => {
  try {
    const { dia_semana, apertura, cierre } = req.body;
    if (!dia_semana || !apertura || !cierre) {
      return res.status(400).json({ error: 'dia_semana, apertura y cierre son requeridos' });
    }
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO horarios (dia_semana, apertura, cierre) VALUES (?, ?, ?)',
      [dia_semana.toLowerCase(), apertura, cierre]
    );
    await connection.end();
    res.status(201).json({ id: result.insertId, dia_semana: dia_semana.toLowerCase(), apertura, cierre });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/horarios/:id - Actualizar horario
router.put('/:id', async (req, res) => {
  try {
    const { dia_semana, apertura, cierre } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'UPDATE horarios SET dia_semana = COALESCE(?, dia_semana), apertura = COALESCE(?, apertura), cierre = COALESCE(?, cierre) WHERE id = ?',
      [dia_semana ? dia_semana.toLowerCase() : null, apertura, cierre, req.params.id]
    );
    await connection.end();
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Horario no encontrado' });
    res.json({ message: 'Horario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/horarios/:id - Eliminar horario
router.delete('/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM horarios WHERE id = ?', [req.params.id]);
    await connection.end();
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Horario no encontrado' });
    res.json({ message: 'Horario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
