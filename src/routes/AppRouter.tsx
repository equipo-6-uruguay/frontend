import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import TicketList from '../pages/tickets/TicketList';
import CreateTicket from '../pages/tickets/CreateTicket';
import TicketDetail from '../pages/tickets/TicketDetail';
import NotificationList from '../pages/notifications/NotificationList';
import AssignmentList from '../pages/assignments/AssignmentList';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Layout from '../components/layout/Layout';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Redirección inicial */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Tickets - Protegido para usuarios autenticados */}
          <Route 
            path="/tickets" 
            element={
              <ProtectedRoute>
                <TicketList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tickets/new" 
            element={
              <ProtectedRoute>
                <CreateTicket />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tickets/:id" 
            element={
              <ProtectedRoute>
                <TicketDetail />
              </ProtectedRoute>
            } 
          />

          {/* Notificaciones - Solo ADMIN */}
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <NotificationList />
              </ProtectedRoute>
            } 
          />

          {/* Asignaciones - Solo ADMIN */}
          <Route 
            path="/assignments" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AssignmentList />
              </ProtectedRoute>
            } 
          />

          {/* Ruta no encontrada */}
          <Route path="*" element={<h2>404 - Página no encontrada</h2>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default AppRouter;
