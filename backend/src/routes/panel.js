const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dbConfig = require('../config/db');
const { obtenerDiaSemana } = require('../utils/timeUtils');

// GET /api/panel?fecha=YYYY-MM-DD - Métricas del día, ocupación por franja horaria y estado de reservas
router.get('/', async (req, res) => {
  let connection;
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const diaSemana = obtenerDiaSemana(fecha);

    connection = await mysql.createConnection(dbConfig);

    // 1. Horario del día y total de mesas activas
    const [horarios] = await connection.execute('SELECT * FROM horarios WHERE dia_semana = ?', [diaSemana]);
    const [mesasActivas] = await connection.execute('SELECT COUNT(*) AS total FROM mesas WHERE activa = 1');
    const totalMesas = mesasActivas[0].total || 1;

    // 2. Reservas del día
    const [reservas] = await connection.execute(`
      SELECT r.*, 
             c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.no_shows AS cliente_no_shows,
             m.numero AS mesa_numero, m.capacidad AS mesa_capacidad, m.ubicacion AS mesa_ubicacion
      FROM reservas r
      JOIN clientes c ON r.cliente_id = c.id
      JOIN mesas m ON r.mesa_id = m.id
      WHERE r.fecha = ?
      ORDER BY r.hora_inicio ASC
    `, [fecha]);

    // 3. Conteo de reservas por estado
    const conteoEstados = {
      pendiente: 0,
      confirmada: 0,
      cumplida: 0,
      cancelada: 0,
      no_show: 0,
      total: reservas.length
    };

    reservas.forEach((r) => {
      if (conteoEstados[r.estado] !== undefined) {
        conteoEstados[r.estado]++;
      }
    });

    // 4. Cálculo de ocupación por franjas horarias (por cada hora que abre el restaurante)
    const ocupacionHoraria = [];
    if (horarios.length > 0) {
      const aperturaH = parseInt(horarios[0].apertura.split(':')[0], 10);
      const cierreH = parseInt(horarios[0].cierre.split(':')[0], 10);
      const limiteH = cierreH === 0 ? 24 : (cierreH < aperturaH ? cierreH + 24 : cierreH);

      for (let h = aperturaH; h <= limiteH; h++) {
        const horaReal = h % 24;
        const horaStr = `${String(horaReal).padStart(2, '0')}:00:00`;
        const horaDisplay = `${String(horaReal).padStart(2, '0')}:00`;

        // Contar reservas activas cuyo intervalo cubra esta hora
        const reservasEnFranja = reservas.filter((r) => {
          if (['cancelada', 'no_show'].includes(r.estado)) return false;
          return r.hora_inicio <= horaStr && r.hora_fin > horaStr;
        });

        const ocupadas = reservasEnFranja.length;
        const porcentaje = Math.min(100, Math.round((ocupadas / totalMesas) * 100));

        ocupacionHoraria.push({
          franja: horaDisplay,
          reservas_activas: ocupadas,
          total_mesas: totalMesas,
          porcentaje_ocupacion: porcentaje
        });
      }
    }

    await connection.end();

    res.json({
      fecha,
      dia_semana: diaSemana,
      horario_atencion: horarios[0] || null,
      total_mesas: totalMesas,
      conteo_estados: conteoEstados,
      ocupacion_horaria: ocupacionHoraria,
      reservas
    });
  } catch (error) {
    if (connection) await connection.end();
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
