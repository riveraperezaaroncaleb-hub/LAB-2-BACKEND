import React from 'react';
import { NavLink } from 'react-router-dom';

// Barra de navegación superior adaptada a Reservas y Soporte
export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/logo.jpg"
            alt="Sabor y Tradición Logo"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span className="brand-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>Sabor y Tradición</span>
            <small style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Restaurante Familiar
            </small>
          </div>
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
