const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dbConfig = require('../config/db');
const {
  obtenerDiaSemana,
  normalizarHora,
  calcularHoraFin,
  intervaloDentroDeHorario
} = require('../utils/timeUtils');

// Matriz explícita de transiciones de estado permitidas
const TRANSICIONES_PERMITIDAS = {
  pendiente: ['confirmada', 'cancelada', 'no_show'],
  confirmada: ['cumplida', 'cancelada', 'no_show'],
  cumplida: [],
  cancelada: [],
  no_show: []
};

// GET /api/reservas - Listar reservas con filtros opcionales (fecha, estado)
router.get('/', async (req, res) => {
  try {
    const { fecha, estado } = req.query;
    let sql = `
      SELECT r.*, 
             c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email, c.no_shows AS cliente_no_shows,
             m.numero AS mesa_numero, m.capacidad AS mesa_capacidad, m.ubicacion AS mesa_ubicacion
      FROM reservas r
      JOIN clientes c ON r.cliente_id = c.id
      JOIN mesas m ON r.mesa_id = m.id
      WHERE 1=1
    `;
    const params = [];
    if (fecha) {
      sql += ' AND r.fecha = ?';
      params.push(fecha);
    }
    if (estado) {
      sql += ' AND r.estado = ?';
      params.push(estado);
    }
    sql += ' ORDER BY r.fecha DESC, r.hora_inicio ASC';

    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(sql, params);
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reservas/:id - Obtener detalle de una reserva
router.get('/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT r.*, 
             c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email, c.no_shows AS cliente_no_shows,
             m.numero AS mesa_numero, m.capacidad AS mesa_capacidad, m.ubicacion AS mesa_ubicacion
      FROM reservas r
      JOIN clientes c ON r.cliente_id = c.id
      JOIN mesas m ON r.mesa_id = m.id
      WHERE r.id = ?
    `, [req.params.id]);
    await connection.end();

    if (rows.length === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reservas - Crear reserva con todas las validaciones de negocio
router.post('/', async (req, res) => {
  let connection;
  try {
    const { cliente_id, mesa_id, fecha, hora_inicio, personas, nota } = req.body;

    // Validación de campos requeridos
    if (!cliente_id || !mesa_id || !fecha || !hora_inicio || !personas) {
      return res.status(400).json({
        error: 'cliente_id, mesa_id, fecha, hora_inicio y personas son obligatorios'
      });
    }

    if (Number(personas) <= 0) {
      return res.status(400).json({ error: 'La cantidad de personas debe ser mayor a 0' });
    }

    connection = await mysql.createConnection(dbConfig);

    // Regla 5: Historial del cliente y sanción de 3 no-shows
    const [clientes] = await connection.execute('SELECT * FROM clientes WHERE id = ?', [cliente_id]);
    if (clientes.length === 0) {
      await connection.end();
      return res.status(404).json({ error: `El cliente con ID ${cliente_id} no existe` });
    }
    const cliente = clientes[0];
    if (cliente.no_shows >= 3) {
      await connection.end();
      return res.status(409).json({
        error: `El cliente ${cliente.nombre} ha acumulado ${cliente.no_shows} inasistencias (no-shows) y tiene suspendido el derecho a reservar`
      });
    }

    // Regla 3: Capacidad y estado activo de la mesa
    const [mesas] = await connection.execute('SELECT * FROM mesas WHERE id = ?', [mesa_id]);
    if (mesas.length === 0) {
      await connection.end();
      return res.status(404).json({ error: `La mesa con ID ${mesa_id} no existe` });
    }
    const mesa = mesas[0];
    if (!mesa.activa) {
      await connection.end();
      return res.status(400).json({ error: `La mesa #${mesa.numero} no se encuentra activa` });
    }
    if (Number(personas) > mesa.capacidad) {
      await connection.end();
      return res.status(400).json({
        error: `La cantidad de personas (${personas}) supera la capacidad máxima de la mesa #${mesa.numero} (${mesa.capacidad} personas)`
      });
    }

    // Regla 2: hora_fin = hora_inicio + 2h y respeto del horario de atención del día
    const horaInicioNorm = normalizarHora(hora_inicio);
    const horaFinCalculada = calcularHoraFin(horaInicioNorm, 2);
    const diaSemana = obtenerDiaSemana(fecha);

    const [horarios] = await connection.execute('SELECT * FROM horarios WHERE dia_semana = ?', [diaSemana]);
    if (horarios.length === 0) {
      await connection.end();
      return res.status(400).json({
        error: `El restaurante se encuentra cerrado los días ${diaSemana}`
      });
    }
    const horarioDia = horarios[0];
    const dentroDeHorario = intervaloDentroDeHorario(
      horaInicioNorm,
      horaFinCalculada,
      horarioDia.apertura,
      horarioDia.cierre
    );

    if (!dentroDeHorario) {
      await connection.end();
      return res.status(400).json({
        error: `La reserva (${horaInicioNorm.slice(0, 5)} - ${horaFinCalculada.slice(0, 5)}) debe caer completa dentro del horario de atención del ${diaSemana} (${horarioDia.apertura.slice(0, 5)} - ${horarioDia.cierre.slice(0, 5)})`
      });
    }

    // Regla 1: Sin solapamiento (inicioA < finB y inicioB < finA) para reservas activas
    const [solapadas] = await connection.execute(`
      SELECT id, hora_inicio, hora_fin, estado 
      FROM reservas 
      WHERE mesa_id = ? 
        AND fecha = ? 
        AND estado NOT IN ('cancelada', 'no_show')
        AND (hora_inicio < ? AND hora_fin > ?)
    `, [mesa_id, fecha, horaFinCalculada, horaInicioNorm]);

    if (solapadas.length > 0) {
      const conflicto = solapadas[0];
      await connection.end();
      return res.status(409).json({
        error: `Conflicto de solapamiento: la mesa #${mesa.numero} ya tiene una reserva activa (${conflicto.hora_inicio.slice(0, 5)} - ${conflicto.hora_fin.slice(0, 5)}) que se cruza con el intervalo solicitado`
      });
    }

    // Inserción de la nueva reserva
    const [result] = await connection.execute(`
      INSERT INTO reservas (cliente_id, mesa_id, fecha, hora_inicio, hora_fin, personas, estado, nota)
      VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)
    `, [cliente_id, mesa_id, fecha, horaInicioNorm, horaFinCalculada, personas, nota || null]);

    await connection.end();

    res.status(201).json({
      id: result.insertId,
      cliente_id,
      cliente_nombre: cliente.nombre,
      mesa_id,
      mesa_numero: mesa.numero,
      fecha,
      hora_inicio: horaInicioNorm,
      hora_fin: horaFinCalculada,
      personas: Number(personas),
      estado: 'pendiente',
      nota: nota || null
    });
  } catch (error) {
    if (connection) await connection.end();
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/reservas/:id/estado - Transición de estado con máquina de estados y sanción no-show
router.patch('/:id/estado', async (req, res) => {
  let connection;
  try {
    const { estado: nuevoEstado } = req.body;
    if (!nuevoEstado) {
      return res.status(400).json({ error: 'El campo estado es requerido' });
    }

    connection = await mysql.createConnection(dbConfig);
    const [reservas] = await connection.execute('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    if (reservas.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    const reservaActual = reservas[0];
    const estadoActual = reservaActual.estado;

    // Regla 4: Validar transición de estado
    const permitidas = TRANSICIONES_PERMITIDAS[estadoActual] || [];
    if (!permitidas.includes(nuevoEstado)) {
      await connection.end();
      return res.status(409).json({
        error: `Transición no válida: no se puede cambiar de '${estadoActual}' a '${nuevoEstado}'. Transiciones válidas: [${permitidas.join(', ') || 'ninguna (estado final)'}]`
      });
    }

    // Actualizar estado de la reserva
    await connection.execute('UPDATE reservas SET estado = ? WHERE id = ?', [nuevoEstado, req.params.id]);

    // Regla 5: Si pasa a no_show, sumar 1 al cliente
    let noShowsActuales = null;
    if (nuevoEstado === 'no_show') {
      await connection.execute('UPDATE clientes SET no_shows = no_shows + 1 WHERE id = ?', [reservaActual.cliente_id]);
      const [cliUpdated] = await connection.execute('SELECT no_shows FROM clientes WHERE id = ?', [reservaActual.cliente_id]);
      noShowsActuales = cliUpdated[0]?.no_shows;
    }

    await connection.end();

    res.json({
      message: `Estado actualizado a '${nuevoEstado}' correctamente`,
      id: Number(req.params.id),
      estado_anterior: estadoActual,
      nuevo_estado: nuevoEstado,
      cliente_id: reservaActual.cliente_id,
      cliente_no_shows: noShowsActuales
    });
  } catch (error) {
    if (connection) await connection.end();
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/reservas/:id - Eliminar reserva
router.delete('/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM reservas WHERE id = ?', [req.params.id]);
    await connection.end();
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json({ message: 'Reserva eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
