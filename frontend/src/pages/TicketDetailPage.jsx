import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

// Vista 3: Detalle de ticket y edición de estado / respuesta sugerida
export default function TicketDetailPage({ tickets, onUpdateTicket, onRefresh }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const ticket = tickets.find((t) => String(t.id) === String(id));

  const [estado, setEstado] = useState('abierto');
  const [respuestaSugerida, setRespuestaSugerida] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Sincronizar datos del ticket seleccionado
  useEffect(() => {
    if (ticket) {
      setEstado(ticket.estado || 'abierto');
      setRespuestaSugerida(ticket.respuesta_sugerida || '');
    }
  }, [ticket]);

  if (!ticket) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>Ticket no encontrado</h2>
          <p>No se encontró el ticket con identificador #{id}.</p>
          <Link to="/tickets" className="btn-primary">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  // Guardar cambios en el backend
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      await onUpdateTicket(ticket.id, {
        estado,
        respuesta_sugerida: respuestaSugerida
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Error al actualizar el ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="detail-breadcrumb">
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Volver
        </button>
        <span className="breadcrumb-separator">/</span>
        <span>Ticket #{ticket.id}</span>
      </div>

      <div className="detail-grid">
        {/* Columna izquierda: Información del ticket */}
        <div className="detail-main-card">
          <div className="detail-card-header">
            <span className="ticket-id-large">#{ticket.id}</span>
            <div className="ticket-card-badges">
              <span className={`badge badge-urgencia badge-${ticket.urgencia}`}>
                Urgencia {ticket.urgencia}
              </span>
              <span className={`badge badge-estado badge-${ticket.estado ? ticket.estado.replace(/\s+/g, '-') : 'abierto'}`}>
                {ticket.estado}
              </span>
            </div>
          </div>

          <h1 className="detail-title">{ticket.asunto}</h1>
          <p className="detail-timestamp">
            Registrado el {new Date(ticket.creado_en || Date.now()).toLocaleString()}
          </p>

          <div className="detail-section">
            <h3>Descripción del Problema</h3>
            <div className="detail-desc-box">{ticket.descripcion}</div>
          </div>

          <div className="detail-section">
            <h3>Respuesta Sugerida por IA / Soporte</h3>
            <textarea
              className="textarea-respuesta"
              rows="6"
              placeholder="Aún no hay respuesta generada. Escribe una respuesta o usa el agente de IA..."
              value={respuestaSugerida}
              onChange={(e) => setRespuestaSugerida(e.target.value)}
            />
          </div>
        </div>

        {/* Columna derecha: Gestión y Cliente */}
        <div className="detail-side-column">
          <div className="side-card">
            <h3>Datos del Solicitante</h3>
            <div className="client-info-list">
              <div className="info-item">
                <span className="info-label">Nombre</span>
                <span className="info-value">{ticket.cliente_nombre || 'No asignado'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{ticket.cliente_email || 'No registrado'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">ID Cliente</span>
                <span className="info-value">#{ticket.cliente_id}</span>
              </div>
            </div>
          </div>

          <form className="side-card" onSubmit={handleSave}>
            <h3>Actualizar Estado</h3>

            {saveSuccess && (
              <div className="alert-success">
                <span>✅ Cambios guardados correctamente</span>
              </div>
            )}
            {saveError && (
              <div className="alert-error">
                <span>⚠️ {saveError}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="select-estado">Estado del Ticket</label>
              <select
                id="select-estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="abierto">Abierto</option>
                <option value="en progreso">En progreso</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>

            <button type="submit" className="btn-primary btn-block" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
