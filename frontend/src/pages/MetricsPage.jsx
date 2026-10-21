import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import TicketCard from '../components/TicketCard';

// Vista 1: Panel de métricas simuladas a partir de los datos en tiempo real
export default function MetricsPage({ tickets, loading, error }) {
  // Cálculo de métricas
  const metrics = useMemo(() => {
    const total = tickets.length;
    const abiertos = tickets.filter((t) => t.estado === 'abierto').length;
    const enProgreso = tickets.filter((t) => t.estado === 'en progreso').length;
    const cerrados = tickets.filter((t) => t.estado === 'cerrado').length;
    const alta = tickets.filter((t) => t.urgencia === 'alta').length;
    const media = tickets.filter((t) => t.urgencia === 'media').length;
    const baja = tickets.filter((t) => t.urgencia === 'baja').length;

    return { total, abiertos, enProgreso, cerrados, alta, media, baja };
  }, [tickets]);

  if (loading) return <div className="loader">Cargando métricas...</div>;
  if (error) return <div className="alert-error">Error al cargar datos: {error}</div>;

  const ultimosTickets = tickets.slice(0, 3);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de Métricas</h1>
          <p className="page-subtitle">Resumen ejecutivo del estado de soporte técnico</p>
        </div>
        <Link to="/nuevo" className="btn-primary">
          + Nuevo Ticket
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Tickets</div>
          <div className="stat-value">{metrics.total}</div>
          <span className="stat-sub">Registrados en base de datos</span>
        </div>

        <div className="stat-card stat-card-open">
          <div className="stat-label">Abiertos</div>
          <div className="stat-value">{metrics.abiertos}</div>
          <span className="stat-sub">Requieren atención inmediata</span>
        </div>

        <div className="stat-card stat-card-progress">
          <div className="stat-label">En Progreso</div>
          <div className="stat-value">{metrics.enProgreso}</div>
          <span className="stat-sub">En análisis o resolución</span>
        </div>

        <div className="stat-card stat-card-closed">
          <div className="stat-label">Cerrados</div>
          <div className="stat-value">{metrics.cerrados}</div>
          <span className="stat-sub">Resueltos satisfactoriamente</span>
        </div>
      </div>

      <div className="metrics-breakdown-grid">
        <div className="metric-box">
          <h3 className="section-title">Distribución por Urgencia</h3>
          <div className="urgency-bar-list">
            <div className="urgency-row">
              <span className="badge badge-urgencia badge-alta">Alta</span>
              <div className="bar-track">
                <div
                  className="bar-fill bar-fill-alta"
                  style={{ width: metrics.total ? `${(metrics.alta / metrics.total) * 100}%` : '0%' }}
                />
              </div>
              <span className="urgency-count">{metrics.alta}</span>
            </div>

            <div className="urgency-row">
              <span className="badge badge-urgencia badge-media">Media</span>
              <div className="bar-track">
                <div
                  className="bar-fill bar-fill-media"
                  style={{ width: metrics.total ? `${(metrics.media / metrics.total) * 100}%` : '0%' }}
                />
              </div>
              <span className="urgency-count">{metrics.media}</span>
            </div>

            <div className="urgency-row">
              <span className="badge badge-urgencia badge-baja">Baja</span>
              <div className="bar-track">
                <div
                  className="bar-fill bar-fill-baja"
                  style={{ width: metrics.total ? `${(metrics.baja / metrics.total) * 100}%` : '0%' }}
                />
              </div>
              <span className="urgency-count">{metrics.baja}</span>
            </div>
          </div>
        </div>

        <div className="metric-box">
          <div className="box-header-flex">
            <h3 className="section-title">Tickets Recientes</h3>
            <Link to="/tickets" className="link-inline">
              Ver todos →
            </Link>
          </div>
          <div className="recent-tickets-stack">
            {ultimosTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
