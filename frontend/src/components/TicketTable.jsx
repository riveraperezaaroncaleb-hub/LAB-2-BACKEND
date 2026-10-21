import React from 'react';
import { Link } from 'react-router-dom';

// Tabla reutilizable para listar tickets
export default function TicketTable({ tickets }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="empty-state">
        <p>No se encontraron tickets con los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="tickets-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Asunto</th>
            <th>Cliente</th>
            <th>Urgencia</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td className="ticket-id">#{ticket.id}</td>
              <td>
                <div className="ticket-subject">{ticket.asunto}</div>
                <div className="ticket-desc-snippet">{ticket.descripcion.slice(0, 50)}...</div>
              </td>
              <td>
                <div className="client-name">{ticket.cliente_nombre || `Cliente #${ticket.cliente_id}`}</div>
                <div className="client-email">{ticket.cliente_email || 'Sin correo'}</div>
              </td>
              <td>
                <span className={`badge badge-urgencia badge-${ticket.urgencia}`}>
                  {ticket.urgencia}
                </span>
              </td>
              <td>
                <span className={`badge badge-estado badge-${ticket.estado ? ticket.estado.replace(/\s+/g, '-') : 'abierto'}`}>
                  {ticket.estado}
                </span>
              </td>
              <td className="ticket-date">
                {ticket.creado_en ? new Date(ticket.creado_en).toLocaleDateString() : 'Hoy'}
              </td>
              <td>
                <Link to={`/tickets/${ticket.id}`} className="btn-table-action">
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
