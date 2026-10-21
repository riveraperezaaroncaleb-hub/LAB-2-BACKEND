import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import RestaurantePanelPage from './pages/RestaurantePanelPage';
import NuevaReservaPage from './pages/NuevaReservaPage';
import MetricsPage from './pages/MetricsPage';
import TicketsListPage from './pages/TicketsListPage';
import TicketDetailPage from './pages/TicketDetailPage';
import TicketCreatePage from './pages/TicketCreatePage';
import { useTickets } from './hooks/useTickets';

// Enrutador principal adaptado para soportar el módulo de Reservas y el módulo previo de Tickets
export default function App() {
  const { tickets, loading, error, refreshTickets, addTicket, editTicket } = useTickets();

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Rutas de Reservas de Restaurante */}
            <Route path="/" element={<Navigate to="/restaurante" replace />} />
            <Route path="/restaurante" element={<RestaurantePanelPage />} />
            <Route path="/reservar" element={<NuevaReservaPage />} />

            {/* Rutas existentes de Soporte de Tickets */}
            <Route
              path="/tickets"
              element={
                <TicketsListPage
                  tickets={tickets}
                  loading={loading}
                  error={error}
                  onRefresh={refreshTickets}
                />
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <TicketDetailPage
                  tickets={tickets}
                  onUpdateTicket={editTicket}
                  onRefresh={refreshTickets}
                />
              }
            />
            <Route
              path="/metricas-tickets"
              element={<MetricsPage tickets={tickets} loading={loading} error={error} />}
            />
            <Route
              path="/nuevo"
              element={<TicketCreatePage onAddTicket={addTicket} />}
            />

            <Route path="*" element={<Navigate to="/restaurante" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
