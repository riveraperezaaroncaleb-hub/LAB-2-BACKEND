import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import TicketTable from '../components/TicketTable';

// Vista 2: Listado de tickets con filtros, búsqueda y ordenamiento
export default function TicketsListPage({ tickets, loading, error, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [urgencyFilter, setUrgencyFilter] = useState('todas');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (recientes) o 'asc' (antiguos)

  // Filtrado y ordenamiento en memoria
  const filteredTickets = useMemo(() => {
    return tickets
      .filter((ticket) => {
        // Búsqueda por asunto, cliente o descripción
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          ticket.asunto.toLowerCase().includes(term) ||
          (ticket.cliente_nombre && ticket.cliente_nombre.toLowerCase().includes(term)) ||
          (ticket.cliente_email && ticket.cliente_email.toLowerCase().includes(term)) ||
          ticket.descripcion.toLowerCase().includes(term);

        // Filtro por estado
        const matchesStatus = statusFilter === 'todos' || ticket.estado === statusFilter;

        // Filtro por urgencia
        const matchesUrgency = urgencyFilter === 'todas' || ticket.urgencia === urgencyFilter;

        return matchesSearch && matchesStatus && matchesUrgency;
      })
      .sort((a, b) => {
        const dateA = new Date(a.creado_en || 0).getTime();
        const dateB = new Date(b.creado_en || 0).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [tickets, searchTerm, statusFilter, urgencyFilter, sortOrder]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Tickets</h1>
          <p className="page-subtitle">Explora, filtra y administra los casos de soporte</p>
        </div>
        <div className="header-actions">
          <button onClick={onRefresh} className="btn-secondary" title="Recargar lista">
            🔄 Refrescar
          </button>
          <Link to="/nuevo" className="btn-primary">
            + Nuevo Ticket
          </Link>
        </div>
      </div>

      {/* Barra de filtros y búsqueda */}
      <div className="filters-card">
        <div className="search-input-wrap">
          <input
            type="text"
            className="filter-control"
            placeholder="🔍 Buscar por asunto, cliente o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-selects-wrap">
          <select
            className="filter-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos los Estados</option>
            <option value="abierto">Abierto</option>
            <option value="en progreso">En progreso</option>
            <option value="cerrado">Cerrado</option>
          </select>

          <select
            className="filter-control"
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
          >
            <option value="todas">Todas las Urgencias</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>

          <select
            className="filter-control"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Más recientes primero</option>
            <option value="asc">Más antiguos primero</option>
          </select>
        </div>
      </div>

      {loading && <div className="loader">Cargando tickets...</div>}
      {error && <div className="alert-error">Error al cargar tickets: {error}</div>}

      {!loading && !error && <TicketTable tickets={filteredTickets} />}
    </div>
  );
}
