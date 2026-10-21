import React from 'react';
import { Link } from 'react-router-dom';

// Tarjeta reutilizable para mostrar un ticket de forma individual
export default function TicketCard({ ticket }) {
  return (
    <div className="ticket-card">
      <div className="ticket-card-header">
        <span className="ticket-id">#{ticket.id}</span>
        <div className="ticket-card-badges">
          <span className={`badge badge-urgencia badge-${ticket.urgencia}`}>
            {ticket.urgencia}
          </span>
          <span className={`badge badge-estado badge-${ticket.estado ? ticket.estado.replace(/\s+/g, '-') : 'abierto'}`}>
            {ticket.estado}
          </span>
        </div>
      </div>
      <h3 className="ticket-card-title">{ticket.asunto}</h3>
      <p className="ticket-card-desc">{ticket.descripcion}</p>
      <div className="ticket-card-footer">
        <div className="ticket-card-meta">
          <strong>{ticket.cliente_nombre || `Cliente #${ticket.cliente_id}`}</strong>
          <small>{ticket.creado_en ? new Date(ticket.creado_en).toLocaleDateString() : 'Hoy'}</small>
        </div>
        <Link to={`/tickets/${ticket.id}`} className="btn-secondary btn-sm">
          Detalle
        </Link>
      </div>
    </div>
  );
}
