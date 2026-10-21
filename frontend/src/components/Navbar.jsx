import React from 'react';
import { NavLink } from 'react-router-dom';

// Barra de navegación superior adaptada a Reservas y Soporte
export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-badge">IA</span>
          <span className="brand-title">Restaurante & Reservas</span>
        </div>
        <nav className="navbar-links">
          <NavLink to="/restaurante" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Panel Restaurante
          </NavLink>
          <NavLink to="/reservar" className={({ isActive }) => (isActive ? 'nav-link active btn-new' : 'nav-link btn-new')}>
            + Nueva Reserva
          </NavLink>
          <NavLink to="/tickets" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Tickets
          </NavLink>
          <NavLink to="/metricas-tickets" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Métricas Tickets
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
