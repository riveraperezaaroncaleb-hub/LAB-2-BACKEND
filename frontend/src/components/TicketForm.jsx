import React, { useState } from 'react';

// Formulario controlado para crear tickets con validación y manejo de errores
export default function TicketForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    cliente_id: '1',
    asunto: '',
    descripcion: '',
    urgencia: 'media'
  });

  const [validationError, setValidationError] = useState('');

  // Manejador de cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationError) setValidationError('');
  };

  // Validación y envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliente_id) {
      return setValidationError('Por favor selecciona o ingresa el ID del cliente.');
    }
    if (!formData.asunto.trim() || formData.asunto.trim().length < 5) {
      return setValidationError('El asunto debe tener al menos 5 caracteres.');
    }
    if (!formData.descripcion.trim() || formData.descripcion.trim().length < 10) {
      return setValidationError('La descripción debe tener al menos 10 caracteres.');
    }

    try {
      await onSubmit({
        cliente_id: Number(formData.cliente_id),
        asunto: formData.asunto.trim(),
        descripcion: formData.descripcion.trim(),
        urgencia: formData.urgencia
      });
    } catch (err) {
      setValidationError(err.message || 'Error al procesar la solicitud');
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {validationError && (
        <div className="alert-error">
          <span>⚠️ {validationError}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="cliente_id">ID del Cliente</label>
        <input
          id="cliente_id"
          type="number"
          name="cliente_id"
          min="1"
          value={formData.cliente_id}
          onChange={handleChange}
          placeholder="Ej: 1"
          required
        />
        <small className="form-hint">Clientes de prueba en BD: 1 (Juan), 2 (María), 3 (Carlos)</small>
      </div>

      <div className="form-group">
        <label htmlFor="asunto">Asunto del Ticket</label>
        <input
          id="asunto"
          type="text"
          name="asunto"
          value={formData.asunto}
          onChange={handleChange}
          placeholder="Ej: Error al procesar factura"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="urgencia">Nivel de Urgencia</label>
        <select id="urgencia" name="urgencia" value={formData.urgencia} onChange={handleChange}>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="descripcion">Descripción detallada</label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows="5"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe detalladamente el problema o solicitud..."
          required
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Guardando ticket...' : 'Crear Ticket'}
      </button>
    </form>
  );
}
