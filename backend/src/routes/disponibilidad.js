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

// GET /api/disponibilidad?fecha=&hora=&personas=&ubicacion=
// Endpoint optimizado para consulta del Agente de IA en n8n y el frontend
router.get('/', async (req, res) => {
  let connection;
  try {
    const { fecha, hora, personas, ubicacion } = req.query;

    if (!fecha || !hora) {
      return res.status(400).json({ error: 'Los parámetros fecha (YYYY-MM-DD) y hora (HH:MM) son obligatorios' });
    }

    const cantidadPersonas = personas ? Number(personas) : 1;
    const horaInicioNorm = normalizarHora(hora);
    const horaFinCalculada = calcularHoraFin(horaInicioNorm, 2);
    const diaSemana = obtenerDiaSemana(fecha);

    connection = await mysql.createConnection(dbConfig);

    // 1. Validar horario de atención del restaurante
    const [horarios] = await connection.execute('SELECT * FROM horarios WHERE dia_semana = ?', [diaSemana]);
    if (horarios.length === 0) {
      await connection.end();
      return res.json({
        disponible: false,
        motivo: `El restaurante no abre los días ${diaSemana}`,
        mesas_disponibles: [],
        mesa_sugerida: null
      });
    }

    const horarioDia = horarios[0];
    const dentro = intervaloDentroDeHorario(horaInicioNorm, horaFinCalculada, horarioDia.apertura, horarioDia.cierre);
    if (!dentro) {
      await connection.end();
      return res.json({
        disponible: false,
        motivo: `El horario solicitado (${horaInicioNorm.slice(0, 5)} - ${horaFinCalculada.slice(0, 5)}) está fuera del horario de atención del ${diaSemana} (${horarioDia.apertura.slice(0, 5)} - ${horarioDia.cierre.slice(0, 5)})`,
        horario_atencion: { apertura: horarioDia.apertura, cierre: horarioDia.cierre },
        mesas_disponibles: [],
        mesa_sugerida: null
      });
    }

    // 2. Consulta de mesas activas que cumplan capacidad y no tengan solapamiento
    let sql = `
      SELECT m.* 
      FROM mesas m
      WHERE m.activa = 1
        AND m.capacidad >= ?
        AND m.id NOT IN (
          SELECT r.mesa_id 
          FROM reservas r
          WHERE r.fecha = ?
            AND r.estado NOT IN ('cancelada', 'no_show')
            AND (r.hora_inicio < ? AND r.hora_fin > ?)
        )
    `;
    const params = [cantidadPersonas, fecha, horaFinCalculada, horaInicioNorm];

    if (ubicacion) {
      sql += ' AND m.ubicacion = ?';
      params.push(ubicacion.toLowerCase());
    }

    // Reto extra: Ordenar de menor a mayor capacidad para sugerir la más pequeña que cumpla
    sql += ' ORDER BY m.capacidad ASC, m.numero ASC';

    const [mesasDisponibles] = await connection.execute(sql, params);
    await connection.end();

    const mesaSugerida = mesasDisponibles.length > 0 ? mesasDisponibles[0] : null;

    res.json({
      disponible: mesasDisponibles.length > 0,
      fecha,
      dia_semana: diaSemana,
      hora_inicio: horaInicioNorm,
      hora_fin: horaFinCalculada,
      personas: cantidadPersonas,
      ubicacion_filtro: ubicacion || 'cualquiera',
      total_disponibles: mesasDisponibles.length,
      mesa_sugerida: mesaSugerida, // Sugerencia óptima (menor capacidad adecuada)
      mesas_disponibles: mesasDisponibles
    });
  } catch (error) {
    if (connection) await connection.end();
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
