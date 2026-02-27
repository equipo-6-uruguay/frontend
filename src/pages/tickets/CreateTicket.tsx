import { useNavigate } from "react-router-dom";
import { useState } from "react";
import TicketForm from "../../components/tickets/TicketForm";
import { ticketApi } from "../../services/ticketApi";
import { useAuth } from "../../context/AuthContext";
import type { CreateTicketDTO } from "../../types/ticket";
import { useNotifications } from "../../context/NotificationContext";
import "./CreateTicket.css";

const CreateTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshUnread } = useNotifications();
  const [error, setError] = useState("");

  const handleCreate = async (data: Omit<CreateTicketDTO, "user_id">) => {
    try {
      if (!user) {
        setError("Debes iniciar sesión para crear un ticket");
        navigate("/login");
        return;
      }

      const ticketData: CreateTicketDTO = {
        ...data,
        user_id: user.id,
      };

      await ticketApi.createTicket(ticketData);

      refreshUnread();

      navigate("/tickets");
    } catch (err: unknown) {
      console.error("Error creating ticket:", err);
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || "Error al crear el ticket");
    }
  };

  return (
    <div className="page-container">
      <div className="create-ticket-header">
        <h1 className="create-ticket-title">Crear Nuevo Ticket</h1>
        <p className="create-ticket-subtitle">
          Completa el formulario para crear un nuevo ticket de soporte
        </p>
      </div>

      {error && (
        <div className="error-alert" role="alert">
          {error}
        </div>
      )}

      <TicketForm onSubmit={handleCreate} />
    </div>
  );
};

export default CreateTicket;
