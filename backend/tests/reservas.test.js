const request = require('supertest');
const app = require('../server');

// Tests de integración para las reglas de negocio del Restaurante con Base de Datos Real
describe('Reglas de Negocio - Reservas de Restaurante', () => {

  // Regla 1: Sin solapamiento (inicioA < finB y inicioB < finA)
  describe('Regla 1: Prevención de Solapamiento', () => {
    it('debe rechazar con 409 si la mesa ya tiene una reserva en un intervalo que se cruza', async () => {
      // Intentar reservar Mesa 3 en fecha de hoy de 14:30 a 16:30 (se cruza con la reserva existente 14:00 - 16:00)
      const res = await request(app)
        .post('/api/reservas')
        .send({
          cliente_id: 1,
          mesa_id: 3,
          fecha: '2026-10-21',
          hora_inicio: '14:30',
          personas: 2
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/Conflicto de solapamiento/);
    });
  });

  // Regla 2: hora_fin = hora_inicio + 2h y respeto del horario de atención
  describe('Regla 2: Duración 2h y Horario de Atención', () => {
    it('debe rechazar con 400 si la reserva termina después del horario de cierre', async () => {
      // El miércoles el cierre es a las 23:00. Una reserva a las 22:00 dura hasta las 00:00 (fuera de horario)
      const res = await request(app)
        .post('/api/reservas')
        .send({
          cliente_id: 1,
          mesa_id: 1,
          fecha: '2026-10-21',
          hora_inicio: '22:00',
          personas: 2
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/horario de atención/);
    });
  });

  // Regla 3: Capacidad de mesa y mesa activa
  describe('Regla 3: Capacidad y Estado Activo', () => {
    it('debe rechazar con 400 si la cantidad de personas excede la capacidad de la mesa', async () => {
      // Mesa 1 tiene capacidad para 2 personas
      const res = await request(app)
        .post('/api/reservas')
        .send({
          cliente_id: 1,
          mesa_id: 1,
          fecha: '2026-10-21',
          hora_inicio: '17:00',
          personas: 6
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/supera la capacidad máxima/);
    });

    it('debe rechazar con 400 si la mesa no está activa', async () => {
      // Mesa 9 está inactiva (activa = 0)
      const res = await request(app)
        .post('/api/reservas')
        .send({
          cliente_id: 1,
          mesa_id: 9,
          fecha: '2026-10-21',
          hora_inicio: '17:00',
          personas: 2
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/no se encuentra activa/);
    });
  });

  // Regla 4: Máquina de estados y transiciones permitidas
  describe('Regla 4: Máquina de Estados de Reservas', () => {
    it('debe permitir transición válida: pendiente -> confirmada', async () => {
      const nueva = await request(app)
        .post('/api/reservas')
        .send({
          cliente_id: 1,
          mesa_id: 2,
          fecha: '2026-10-24',
          hora_inicio: '15:00',
          personas: 2
        });

      const res = await request(app)
        .patch(`/api/reservas/${nueva.body.id}/estado`)
        .send({ estado: 'confirmada' });

      expect(res.statusCode).toBe(200);
      expect(res.body.nuevo_estado).toBe('confirmada');
    });

    it('debe rechazar con 409 una transición no permitida (ej: cumplida -> pendiente)', async () => {
      // Reserva 3 está cumplida (estado final)
      const res = await request(app)
        .patch('/api/reservas/3/estado')
        .send({ estado: 'pendiente' });

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/Transición no válida/);
    });
  });

  // Regla 5: Penalización y bloqueo por 3 no-shows
  describe('Regla 5: Historial y Sanción por No-Shows', () => {
    it('debe rechazar con 409 si el cliente acumula 3 o más no-shows', async () => {
      // Cliente 4 tiene 3 no-shows en datos semilla
      const res = await request(app)
        .post('/api/reservas')
        .send({
          cliente_id: 4,
          mesa_id: 1,
          fecha: '2026-10-21',
          hora_inicio: '18:00',
          personas: 2
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/tiene suspendido el derecho a reservar/);
    });
  });

  // Reto Extra: Disponibilidad y optimización de capacidad
  describe('Disponibilidad y Reto Extra (Mesa más pequeña que cumpla)', () => {
    it('debe sugerir la mesa de menor capacidad adecuada', async () => {
      const res = await request(app)
        .get('/api/disponibilidad?fecha=2026-10-23&hora=20:00&personas=2');

      expect(res.statusCode).toBe(200);
      expect(res.body.disponible).toBe(true);
      // Para 2 personas debe sugerir mesa de capacidad 2 (ej: mesa 1 o 2), no una mesa de 6 u 8
      expect(res.body.mesa_sugerida.capacidad).toBe(2);
    });
  });

  // Panel
  describe('GET /api/panel', () => {
    it('debe devolver métricas y franjas horarias del día', async () => {
      const res = await request(app).get('/api/panel?fecha=2026-10-21');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('conteo_estados');
      expect(res.body).toHaveProperty('ocupacion_horaria');
      expect(Array.isArray(res.body.ocupacion_horaria)).toBe(true);
    });
  });
});
