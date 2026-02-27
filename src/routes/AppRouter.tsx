import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import Layout from '../components/layout/Layout';
import { LoadingState } from '../components/common';

// Lazy-loaded pages
const TicketList = lazy(() => import('../pages/tickets/TicketList'));
const CreateTicket = lazy(() => import('../pages/tickets/CreateTicket'));
const TicketDetail = lazy(() => import('../pages/tickets/TicketDetail'));
const NotificationList = lazy(() => import('../pages/notifications/NotificationList'));
const AssignmentList = lazy(() => import('../pages/assignments/AssignmentList'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const NotFound = lazy(() => import('../pages/NotFound'));

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<LoadingState message="Cargando página..." />}>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
};

export default AppRouter;
