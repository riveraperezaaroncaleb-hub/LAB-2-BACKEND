// URL base del backend Express
const API_BASE_URL = 'http://localhost:5000/api';

// ==========================================
// SERVICIOS TICKETS (Existentes)
// ==========================================
export async function getTickets() {
  const response = await fetch(`${API_BASE_URL}/tickets`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: no se pudieron cargar los tickets`);
  }
  return response.json();
}

export async function createTicket(ticketData) {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status} al crear el ticket`);
  }
  return data;
}

export async function updateTicket(id, updateData) {
  const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status} al actualizar el ticket`);
  }
  return data;
}

// ==========================================
// SERVICIOS RESTAURANTE (Nuevos)
// ==========================================

// Obtener datos del panel (ocupación por franja y conteo de estados)
export async function getPanelRestaurante(fecha) {
  const query = fecha ? `?fecha=${fecha}` : '';
  const response = await fetch(`${API_BASE_URL}/panel${query}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al obtener datos del panel');
  }
  return data;
}

// Obtener disponibilidad de mesas (herramienta del agente)
export async function getDisponibilidad({ fecha, hora, personas, ubicacion }) {
  const params = new URLSearchParams({ fecha, hora });
  if (personas) params.append('personas', personas);
  if (ubicacion) params.append('ubicacion', ubicacion);

  const response = await fetch(`${API_BASE_URL}/disponibilidad?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al consultar disponibilidad');
  }
  return data;
}

// Crear una reserva con validaciones de negocio en el servidor
export async function createReserva(reservaData) {
  const response = await fetch(`${API_BASE_URL}/reservas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservaData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status} al crear la reserva`);
  }
  return data;
}

// Cambiar estado de una reserva (valida máquina de estados)
export async function updateEstadoReserva(id, estado) {
  const response = await fetch(`${API_BASE_URL}/reservas/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status} al actualizar estado`);
  }
  return data;
}

// Obtener lista de clientes
export async function getClientes() {
  const response = await fetch(`${API_BASE_URL}/clientes`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al obtener clientes');
  return data;
}

// Obtener lista de mesas
export async function getMesas() {
  const response = await fetch(`${API_BASE_URL}/mesas`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al obtener mesas');
  return data;
}
