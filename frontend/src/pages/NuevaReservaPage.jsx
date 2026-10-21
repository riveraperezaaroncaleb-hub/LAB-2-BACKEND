import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getClientes, getDisponibilidad, createReserva } from '../services/api';

// Formulario de Reserva con validación en servidor y manejo de errores 400/409
export default function NuevaReservaPage() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [formData, setFormData] = useState({
    cliente_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '14:00',
    personas: 2,
    ubicacion: '',
    mesa_id: '',
    nota: ''
  });

  const [disponibilidad, setDisponibilidad] = useState(null);
  const [consultandoMesas, setConsultandoMesas] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Cargar lista de clientes
  useEffect(() => {
    getClientes()
      .then((data) => {
        setClientes(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, cliente_id: data[0].id }));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Consultar mesas disponibles según fecha, hora y personas
  const consultarMesas = async () => {
    try {
      setConsultandoMesas(true);
      setServerError(null);
      const res = await getDisponibilidad({
        fecha: formData.fecha,
        hora: formData.hora_inicio,
        personas: formData.personas,
        ubicacion: formData.ubicacion
      });
      setDisponibilidad(res);
      if (res.mesa_sugerida) {
        setFormData((prev) => ({ ...prev, mesa_id: res.mesa_sugerida.id }));
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setConsultandoMesas(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (serverError) setServerError(null);
  };

  // Enviar reserva al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mesa_id) {
      return setServerError('Debes seleccionar una mesa disponible para continuar.');
    }

    try {
      setLoadingSubmit(true);
      setServerError(null);

      await createReserva({
        cliente_id: Number(formData.cliente_id),
        mesa_id: Number(formData.mesa_id),
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        personas: Number(formData.personas),
        nota: formData.nota
      });

      navigate('/restaurante');
    } catch (err) {
      // Mostrar exactamente el error retornado por el servidor (400 / 409)
      setServerError(err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const clienteSeleccionado = clientes.find((c) => String(c.id) === String(formData.cliente_id));

  return (
    <div className="page-container">
      <div className="detail-breadcrumb">
        <Link to="/restaurante" className="btn-back">
          ← Volver al Panel
        </Link>
      </div>

      <div className="create-card">
        {/* Strip de imágenes de comida */}
        <div className="reserva-food-strip">
          <div>
            <img src="/corte_parrilla.jpg" alt="Corte a la parrilla" className="reserva-food-strip-img" />
            <div className="reserva-food-strip-caption">🥩 Corte premium a la parrilla</div>
          </div>
          <div>
            <img src="/hero_guiso.jpg" alt="Guiso de la casa" className="reserva-food-strip-img" />
            <div className="reserva-food-strip-caption">🍲 Guiso tradicional de la casa</div>
          </div>
        </div>

        <div className="create-card-header">
          <h1 className="page-title">Reservar Mesa</h1>
          <p className="page-subtitle">
            Toda reserva dura 2 horas exactas y es validada por el servidor
          </p>
        </div>

        {/* Notificación de errores del servidor */}
        {serverError && (
          <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
            <span>🚫 {serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-container">
          {/* Selección de Cliente */}
          <div className="form-group">
            <label htmlFor="cliente_id">Cliente Solicitante</label>
            <select
              id="cliente_id"
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleChange}
              required
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.telefono}) - {c.no_shows} no-shows
                </option>
              ))}
            </select>
            {clienteSeleccionado && clienteSeleccionado.no_shows >= 3 && (
              <small style={{ color: '#ef4444', fontWeight: 600 }}>
                ⚠️ Advertencia: este cliente tiene {clienteSeleccionado.no_shows} no-shows acumulados. El servidor rechazará la reserva con código 409.
              </small>
            )}
          </div>

          {/* Fecha y Hora de Inicio */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="fecha">Fecha</label>
              <input
                id="fecha"
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="hora_inicio">Hora de Inicio (Duración: 2h)</label>
              <input
                id="hora_inicio"
                type="time"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Personas y Ubicación */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="personas">Cantidad de Personas</label>
              <input
                id="personas"
                type="number"
                name="personas"
                min="1"
                max="20"
                value={formData.personas}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="ubicacion">Preferencia de Ubicación</label>
              <select
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
              >
                <option value="">Cualquier ubicación</option>
                <option value="interior">Interior</option>
                <option value="terraza">Terraza</option>
                <option value="barra">Barra</option>
                <option value="vip">Zona VIP</option>
              </select>
            </div>
          </div>

          {/* Botón para consultar disponibilidad en vivo */}
          <button
            type="button"
            onClick={consultarMesas}
            className="btn-secondary"
            disabled={consultandoMesas}
          >
            {consultandoMesas ? 'Verificando horarios...' : '🔍 Buscar Mesas Libres (2h)'}
          </button>

          {/* Resultado de disponibilidad y sugerencia inteligente */}
          {disponibilidad && (
            <div className="metric-box" style={{ background: '#090d16' }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#38bdf8' }}>
                Disponibilidad para {disponibilidad.fecha} ({disponibilidad.hora_inicio.slice(0, 5)} - {disponibilidad.hora_fin.slice(0, 5)})
              </h4>

              {!disponibilidad.disponible ? (
                <div className="alert-error">
                  {disponibilidad.motivo || 'No hay mesas disponibles que cumplan los criterios.'}
                </div>
              ) : (
                <>
                  {disponibilidad.mesa_sugerida && (
                    <div style={{ padding: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '6px', marginBottom: '1rem' }}>
                      <strong>✨ Mesa Sugerida (Reto extra - Óptima por capacidad):</strong>
                      <div>
                        Mesa #{disponibilidad.mesa_sugerida.numero} - {disponibilidad.mesa_sugerida.ubicacion} (Capacidad: {disponibilidad.mesa_sugerida.capacidad} personas)
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="mesa_id">Seleccionar Mesa</label>
                    <select
                      id="mesa_id"
                      name="mesa_id"
                      value={formData.mesa_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Elige una mesa --</option>
                      {disponibilidad.mesas_disponibles.map((m) => (
                        <option key={m.id} value={m.id}>
                          Mesa #{m.numero} - {m.ubicacion} (Capacidad: {m.capacidad} personas)
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Nota */}
          <div className="form-group">
            <label htmlFor="nota">Nota o Requerimiento Especial</label>
            <textarea
              id="nota"
              name="nota"
              rows="3"
              value={formData.nota}
              onChange={handleChange}
              placeholder="Ej: Celebración de aniversario, silla para bebé, etc."
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loadingSubmit}>
            {loadingSubmit ? 'Validando con el servidor...' : 'Confirmar y Guardar Reserva'}
          </button>
        </form>
      </div>
    </div>
  );
}
