const request = require('supertest');

// Mock de mysql2/promise para ejecutar tests sin depender de base de datos externa
const mockExecute = jest.fn();
const mockEnd = jest.fn();

jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      execute: mockExecute,
      end: mockEnd
    });
  })
}));

const app = require('../server');

describe('API de Soporte de Tickets - Tests con Coverage > 80%', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('debe responder 200 con el estado del servicio', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.service).toBe('soporte-tickets-api');
    });
  });

  describe('GET /api/db-test', () => {
    it('debe responder 200 si la conexión a MySQL es exitosa', async () => {
      mockExecute.mockResolvedValueOnce([[{ result: 2 }]]);

      const res = await request(app).get('/api/db-test');
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.result).toBe(2);
    });

    it('debe responder 500 si falla la conexión a MySQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Error de conexión'));

      const res = await request(app).get('/api/db-test');
      expect(res.statusCode).toBe(500);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('GET /api/tickets', () => {
    it('debe responder 200 con el listado de tickets', async () => {
      const mockTickets = [
        { id: 1, asunto: 'Error login', cliente_nombre: 'Juan' },
        { id: 2, asunto: 'Fallo pago', cliente_nombre: 'María' }
      ];
      mockExecute.mockResolvedValueOnce([mockTickets]);

      const res = await request(app).get('/api/tickets');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].asunto).toBe('Error login');
    });

    it('debe responder 500 si la consulta SQL falla', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Query error'));

      const res = await request(app).get('/api/tickets');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Query error');
    });
  });

  describe('POST /api/tickets', () => {
    it('debe responder 400 si falta cliente_id', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .send({ asunto: 'Asunto ok', descripcion: 'Desc ok' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/cliente_id, asunto y descripcion son requeridos/);
    });

    it('debe responder 400 si falta asunto', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .send({ cliente_id: 1, descripcion: 'Desc ok' });
      expect(res.statusCode).toBe(400);
    });

    it('debe responder 400 si falta descripcion', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .send({ cliente_id: 1, asunto: 'Asunto ok' });
      expect(res.statusCode).toBe(400);
    });

    it('debe responder 201 y asignar urgencia por defecto "media" si no se envía', async () => {
      mockExecute.mockResolvedValueOnce([{ insertId: 100 }]);
      const res = await request(app)
        .post('/api/tickets')
        .send({
          cliente_id: 2,
          asunto: 'Sin urgencia explícita',
          descripcion: 'Debería asignar media'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.urgencia).toBe('media');
    });

    it('debe responder 201 y crear el ticket correctamente con urgencia explícita', async () => {
      mockExecute.mockResolvedValueOnce([{ insertId: 99 }]);

      const nuevoTicket = {
        cliente_id: 1,
        asunto: 'Problema con facturación',
        descripcion: 'No puedo descargar el PDF de mi factura',
        urgencia: 'alta'
      };

      const res = await request(app)
        .post('/api/tickets')
        .send(nuevoTicket);

      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBe(99);
      expect(res.body.asunto).toBe(nuevoTicket.asunto);
    });


    it('debe responder 500 si falla la inserción en BD', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Insert error'));

      const res = await request(app)
        .post('/api/tickets')
        .send({
          cliente_id: 1,
          asunto: 'Error crítico',
          descripcion: 'Falla total'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Insert error');
    });
  });

  describe('PUT /api/tickets/:id', () => {
    it('debe responder 200 al actualizar un ticket', async () => {
      mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app)
        .put('/api/tickets/1')
        .send({
          estado: 'en progreso',
          respuesta_sugerida: 'Estamos revisando el incidente'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/actualizado correctamente/);
    });

    it('debe responder 500 si falla la actualización en BD', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Update error'));

      const res = await request(app)
        .put('/api/tickets/1')
        .send({ estado: 'cerrado' });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Update error');
    });
  });

  describe('Manejo de errores global', () => {
    it('debe capturar errores con el middleware global', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Content-Type', 'application/json')
        .send('{"invalido":');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Error interno del servidor');
    });
  });

  describe('Configuración de Base de Datos (db.js)', () => {
    it('debe utilizar valores por defecto si faltan variables de entorno', () => {
      const originalEnv = { ...process.env };
      delete process.env.DB_HOST;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;

      let fallbackDb;
      jest.isolateModules(() => {
        fallbackDb = require('../src/config/db');
      });

      expect(fallbackDb.host).toBe('localhost');
      expect(fallbackDb.user).toBe('root');
      expect(fallbackDb.password).toBe('');
      expect(fallbackDb.database).toBe('soporte_tickets');

      process.env = originalEnv;
    });
  });
});
