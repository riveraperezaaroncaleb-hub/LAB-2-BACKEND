import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TicketForm from '../components/TicketForm';

// Vista 4: Formulario para crear un nuevo ticket
export default function TicketCreatePage({ onAddTicket }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Procesar creación y redirigir al listado
  const handleCreate = async (ticketData) => {
    try {
      setLoading(true);
      await onAddTicket(ticketData);
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="detail-breadcrumb">
        <Link to="/tickets" className="btn-back">
          ← Volver a tickets
        </Link>
      </div>

      <div className="create-card">
        <div className="create-card-header">
          <h1 className="page-title">Crear Nuevo Ticket</h1>
          <p className="page-subtitle">Registra una nueva incidencia o solicitud para soporte</p>
        </div>

        <TicketForm onSubmit={handleCreate} loading={loading} />
      </div>
    </div>
  );
}
