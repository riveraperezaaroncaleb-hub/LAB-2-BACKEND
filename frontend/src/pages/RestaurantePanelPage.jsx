import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPanelRestaurante, updateEstadoReserva } from '../services/api';

// Vista de Panel: Ocupación del día por franja horaria + Conteo por estado + Gestión de reservas
export default function RestaurantePanelPage() {
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [panelData, setPanelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Carga de datos del panel según fecha
  const loadPanel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPanelRestaurante(fecha);
      setPanelData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    loadPanel();
  }, [loadPanel]);

  // Manejar cambio de estado de reserva
  const handleCambiarEstado = async (reservaId, nuevoEstado) => {
    try {
      setActionMessage(null);
      const res = await updateEstadoReserva(reservaId, nuevoEstado);
      setActionMessage({
        tipo: 'success',
        texto: `${res.message} ${res.cliente_no_shows !== null ? `(No-shows acumulados del cliente: ${res.cliente_no_shows})` : ''}`
      });
      await loadPanel();
    } catch (err) {
      setActionMessage({
        tipo: 'error',
        texto: err.message
      });
    }
  };

  return (
    <div className="page-container">

      {/* ── Hero gastronómico ── */}
      <div className="food-hero">
        <div className="food-hero-images">
          <div className="food-hero-img-wrap">
            <img src="/hero_guiso.jpg" alt="Guiso tradicional de la casa" className="food-hero-img" />
            <div className="food-hero-img-overlay">
              <span className="food-hero-badge">🍲 Especialidad</span>
              <p>Guiso tradicional de la casa</p>
            </div>
          </div>
          <div className="food-hero-img-wrap food-hero-img-wrap--lg">
            <img src="/corte_parrilla.jpg" alt="Corte a la parrilla premium" className="food-hero-img" />
            <div className="food-hero-img-overlay">
              <span className="food-hero-badge food-hero-badge--gold">🥩 Parrilla</span>
              <p>Corte premium a la parrilla</p>
            </div>
          </div>
        </div>
        <div className="food-hero-text">
          <div className="food-hero-eyebrow">Bienvenido a</div>
          <h2 className="food-hero-title">Sabor y Tradición</h2>
          <p className="food-hero-desc">
            Cocina de autor con ingredientes frescos de temporada.<br />
            Reserva tu mesa y vive una experiencia gastronómica única.
          </p>
          <div className="food-hero-pills">
            <span className="food-pill">🕐 Abierto todos los días</span>
            <span className="food-pill">🍷 Maridaje incluido</span>
            <span className="food-pill">⭐ Cocina premiada</span>
          </div>
        </div>
      </div>

      {/* Encabezado y filtro de fecha */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de Control de Reservas</h1>
          <p className="page-subtitle">
            Monitoreo en tiempo real de ocupación horaria y estados de mesas
          </p>
        </div>
        <div className="header-actions">
          <input
            type="date"
            className="filter-control date-picker"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <button
            onClick={() => setFecha(new Date().toISOString().split('T')[0])}
            className="btn-secondary"
          >
            Hoy
          </button>
          <Link to="/reservar" className="btn-primary">
            + Nueva Reserva
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className={actionMessage.tipo === 'success' ? 'alert-success' : 'alert-error'}>
          <span>{actionMessage.tipo === 'success' ? '✅' : '⚠️'} {actionMessage.texto}</span>
        </div>
      )}

      {loading && <div className="loader">Cargando ocupación y reservas...</div>}
      {error && <div className="alert-error">Error al cargar panel: {error}</div>}

      {!loading && panelData && (
        <>
          {/* Conteo de reservas por estado */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Reservas</div>
              <div className="stat-value">{panelData.conteo_estados.total}</div>
              <span className="stat-sub">Día {panelData.dia_semana}</span>
            </div>

            <div className="stat-card stat-card-open">
              <div className="stat-label">Pendientes</div>
              <div className="stat-value">{panelData.conteo_estados.pendiente}</div>
              <span className="stat-sub">Por confirmar</span>
            </div>

            <div className="stat-card stat-card-progress">
              <div className="stat-label">Confirmadas</div>
              <div className="stat-value">{panelData.conteo_estados.confirmada}</div>
              <span className="stat-sub">Mesa asegurada</span>
            </div>

            <div className="stat-card stat-card-closed">
              <div className="stat-label">Cumplidas</div>
              <div className="stat-value">{panelData.conteo_estados.cumplida}</div>
              <span className="stat-sub">Cliente asistió</span>
            </div>

            <div className="stat-card stat-card-noshow">
              <div className="stat-label">No-Shows</div>
              <div className="stat-value" style={{ color: '#ef4444' }}>
                {panelData.conteo_estados.no_show}
              </div>
              <span className="stat-sub">Sanción aplicada</span>
            </div>
          </div>

          {/* Grilla / Gráfico de barras de ocupación horaria */}
          <div className="metric-box" style={{ marginBottom: '2rem' }}>
            <div className="box-header-flex">
              <h3 className="section-title">
                📊 Ocupación por Franja Horaria (Horario de Atención: {panelData.horario_atencion ? `${panelData.horario_atencion.apertura.slice(0, 5)} - ${panelData.horario_atencion.cierre.slice(0, 5)}` : 'Cerrado'})
              </h3>
              <span className="form-hint">Capacidad total: {panelData.total_mesas} mesas activas</span>
            </div>

            <div
              className="occupancy-bar-chart"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '0.8rem',
                overflowX: 'auto',
                padding: '1.5rem 1rem 1rem',
                minHeight: '220px',
                background: '#090d16',
                borderRadius: '8px',
                border: '1px solid #242f48'
              }}
            >
              {panelData.ocupacion_horaria.map((slot) => (
                <div
                  key={slot.franja}
                  className="occupancy-col"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    flex: 1,
                    minWidth: '55px',
                    height: '190px'
                  }}
                >
                  <div
                    className="occupancy-value-label"
                    style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.4rem' }}
                  >
                    {slot.porcentaje_ocupacion}%
                  </div>
                  <div
                    className="occupancy-bar-track"
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: '120px',
                      background: '#1f2937',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      className={`occupancy-bar-level ${
                        slot.porcentaje_ocupacion >= 75
                          ? 'level-high'
                          : slot.porcentaje_ocupacion >= 40
                          ? 'level-med'
                          : 'level-low'
                      }`}
                      style={{
                        width: '100%',
                        height: `${Math.max(slot.porcentaje_ocupacion, 6)}%`,
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease',
                        background:
                          slot.porcentaje_ocupacion >= 75
                            ? 'linear-gradient(180deg, #f87171, #dc2626)'
                            : slot.porcentaje_ocupacion >= 40
                            ? 'linear-gradient(180deg, #fbbf24, #d97706)'
                            : 'linear-gradient(180deg, #38bdf8, #2563eb)'
                      }}
                      title={`${slot.reservas_activas} de ${slot.total_mesas} mesas ocupadas`}
                    />
                  </div>
                  <div
                    className="occupancy-slot-label"
                    style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f3f4f6', marginTop: '0.5rem' }}
                  >
                    {slot.franja}
                  </div>
                  <small
                    className="occupancy-sub"
                    style={{ fontSize: '0.7rem', color: '#6b7280' }}
                  >
                    {slot.reservas_activas} mes.
                  </small>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de Reservas del día con transición de estados */}
          <div className="table-responsive">
            <div className="box-header-flex" style={{ padding: '1.2rem 1.2rem 0' }}>
              <h3 className="section-title">Reservas Registradas para el {fecha}</h3>
            </div>

            {panelData.reservas.length === 0 ? (
              <div className="empty-state">
                <p>No hay reservas agendadas para esta fecha.</p>
              </div>
            ) : (
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Horario (2h)</th>
                    <th>Cliente</th>
                    <th>Mesa</th>
                    <th>Personas</th>
                    <th>Estado</th>
                    <th>Acciones de Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {panelData.reservas.map((r) => (
                    <tr key={r.id}>
                      <td className="ticket-id">#{r.id}</td>
                      <td>
                        <strong>{r.hora_inicio.slice(0, 5)} - {r.hora_fin.slice(0, 5)}</strong>
                      </td>
                      <td>
                        <div className="client-name">{r.cliente_nombre}</div>
                        <div className="client-email">{r.cliente_telefono}</div>
                        {r.cliente_no_shows > 0 && (
                          <span className={`badge badge-urgencia ${r.cliente_no_shows >= 3 ? 'badge-alta' : 'badge-media'}`}>
                            {r.cliente_no_shows} no-shows
                          </span>
                        )}
                      </td>
                      <td>
                        <strong>Mesa #{r.mesa_numero}</strong>
                        <div className="ticket-desc-snippet">{r.mesa_ubicacion} (cap. {r.mesa_capacidad})</div>
                      </td>
                      <td>{r.personas} pers.</td>
                      <td>
                        <span className={`badge badge-estado badge-${r.estado}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {r.estado === 'pendiente' && (
                            <>
                              <button
                                onClick={() => handleCambiarEstado(r.id, 'confirmada')}
                                className="btn-table-action"
                                style={{ backgroundColor: '#2563eb' }}
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => handleCambiarEstado(r.id, 'cancelada')}
                                className="btn-table-action"
                                style={{ backgroundColor: '#4b5563' }}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleCambiarEstado(r.id, 'no_show')}
                                className="btn-table-action"
                                style={{ backgroundColor: '#dc2626' }}
                                title="Sanciona al cliente sumando 1 no-show"
                              >
                                No-Show
                              </button>
                            </>
                          )}

                          {r.estado === 'confirmada' && (
                            <>
                              <button
                                onClick={() => handleCambiarEstado(r.id, 'cumplida')}
                                className="btn-table-action"
                                style={{ backgroundColor: '#10b981' }}
                              >
                                Cumplida
                              </button>
                              <button
                                onClick={() => handleCambiarEstado(r.id, 'cancelada')}
                                className="btn-table-action"
                                style={{ backgroundColor: '#4b5563' }}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleCambiarEstado(r.id, 'no_show')}
                                className="btn-table-action"
                                style={{ backgroundColor: '#dc2626' }}
                                title="Sanciona al cliente sumando 1 no-show"
                              >
                                No-Show
                              </button>
                            </>
                          )}

                          {['cumplida', 'cancelada', 'no_show'].includes(r.estado) && (
                            <small className="form-hint">Estado final</small>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
