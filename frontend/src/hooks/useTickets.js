import { useState, useEffect, useCallback } from 'react';
import { getTickets, createTicket, updateTicket } from '../services/api';

// Custom Hook para gestionar el estado global de tickets
export function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carga inicial y refresco de tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Handler para agregar ticket y actualizar lista
  const addTicket = async (ticketData) => {
    const nuevo = await createTicket(ticketData);
    await fetchTickets();
    return nuevo;
  };

  // Handler para modificar ticket y actualizar lista
  const editTicket = async (id, updateData) => {
    const updated = await updateTicket(id, updateData);
    await fetchTickets();
    return updated;
  };

  return {
    tickets,
    loading,
    error,
    refreshTickets: fetchTickets,
    addTicket,
    editTicket
  };
}
