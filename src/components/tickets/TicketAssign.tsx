import { useState, useEffect } from 'react';
import { userService } from '../../services/user';
import type { AdminUser } from '../../types/user';
import './TicketAssign.css';

interface TicketAssignProps {
  ticketId?: number | string;
  currentAssignedId?: string;
  onAssign?: (userId: string) => void;
  /** Pre-loaded admin users. If provided, skips the fetch. */
  adminUsersList?: AdminUser[];
}

const TicketAssign = ({ ticketId, currentAssignedId, onAssign, adminUsersList }: TicketAssignProps) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(adminUsersList ?? []);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentAssignedId || '');
  const [pendingAssignment, setPendingAssignment] = useState(false);
  const [loading, setLoading] = useState(!adminUsersList);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetch if admin users were provided as prop
    if (adminUsersList) return;

    const fetchAdminUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const users = await userService.getAdminUsers();
        setAdminUsers(users);
      } catch (err) {
        console.error('Error cargando usuarios ADMIN:', err);
        setError('No se pudieron cargar los administradores');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminUsers();
  }, [adminUsersList]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    // Marcar que hay una asignación pendiente solo si se selecciona un usuario válido
    setPendingAssignment(userId !== '');
  };

  const handleConfirm = () => {
    if (onAssign && selectedUserId) {
      onAssign(selectedUserId);
      setPendingAssignment(false);
    }
  };

  const handleCancel = () => {
    setSelectedUserId(currentAssignedId || '');
    setPendingAssignment(false);
  };

  if (loading) {
    return (
      <div className="ticket-assign">
        <label className="ticket-assign__label">Asignar a:</label>
        <div className="ticket-assign__loading">Cargando usuarios...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-assign">
        <label className="ticket-assign__label">Asignar a:</label>
        <p className="ticket-assign__info text-error">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="ticket-assign">
      <label htmlFor="admin-select" className="ticket-assign__label">
        Asignar a:
      </label>
      <select
        id="admin-select"
        className="ticket-assign__select"
        value={selectedUserId}
        onChange={handleChange}
      >
        <option value="">-- Seleccionar administrador --</option>
        {adminUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.username} ({user.email})
          </option>
        ))}
      </select>
      
      {pendingAssignment && (
        <div className="ticket-assign__actions">
          <button
            className="ticket-assign__btn ticket-assign__btn--confirm"
            onClick={handleConfirm}
            disabled={!selectedUserId}
          >
            Confirmar asignación
          </button>
          <button
            className="ticket-assign__btn ticket-assign__btn--cancel"
            onClick={handleCancel}
          >
            Cancelar
          </button>
        </div>
      )}
      
      {ticketId && (
        <p className="ticket-assign__info">
          {selectedUserId 
            ? pendingAssignment 
              ? `Confirma para asignar Ticket #${ticketId} al administrador seleccionado`
              : `Ticket #${ticketId} asignado`
            : 'Selecciona un administrador para asignar este ticket'
          }
        </p>
      )}
    </div>
  );
};

export default TicketAssign;
