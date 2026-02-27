import { useEffect, useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { notificationsApi } from '../../services/notification';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState, EmptyState, PageHeader } from '../../components/common';
import ConfirmModal from '../../components/ui/ConfirmModal';
import NotificationItem from '../../components/notifications/NotificationItem';
import type { Notification } from '../../types/notification';
import './NotificationList.css';

const NotificationList = () => {
  const { trigger, refreshUnread } = useNotifications();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    confirmLabel: 'Eliminar',
    onConfirm: () => {},
  });

  /**
   * Carga las notificaciones desde la API con AbortController
   */
  const loadNotifications = async (signal?: AbortSignal) => {
    try {
      const data = await notificationsApi.getNotifications(signal);
      setNotifications(data);
    } catch (error) {
      // Ignorar errores de cancelación (AbortError)
      if ((error as Error).name !== 'AbortError') {
        console.error('Error cargando notificaciones', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar notificaciones una sola vez en el montaje (con AbortController)
  useFetch(
    (signal) => notificationsApi.getNotifications(signal),
    (data) => {
      setNotifications(data);
      setLoading(false);
    },
    (error) => {
      console.error('Error cargando notificaciones', error);
      setLoading(false);
    }
  );

  // Recargar notificaciones cuando trigger cambie (por ej. después de acciones del usuario)
  useEffect(() => {
    if (trigger > 0) {
      loadNotifications();
    }
  }, [trigger]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      loadNotifications();
      refreshUnread();
    } catch (error) {
      console.error('Error marcando como leída', error);
    }
  };

  const confirmClearAll = () => {
    setModalState({
      isOpen: true,
      message: '¿Seguro que deseas eliminar todas las notificaciones?',
      confirmLabel: 'Limpiar todo',
      onConfirm: async () => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
        try {
          await notificationsApi.clearAll();
          setNotifications([]);
          refreshUnread();
          showToast('Notificaciones eliminadas', 'success');
        } catch (error) {
          console.error('Error eliminando notificaciones', error);
          showToast('No se pudieron eliminar las notificaciones', 'error');
        }
      },
    });
  };

  const confirmDelete = (id: number) => {
    setModalState({
      isOpen: true,
      message: '¿Seguro que deseas eliminar esta notificación?',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
        try {
          await notificationsApi.deleteNotification(id);
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          refreshUnread();
        } catch (error) {
          console.error('Error eliminando notificación', error);
          showToast('No se pudo eliminar la notificación', 'error');
        }
      }
    });
  };

  if (loading) {
    return <LoadingState message="Cargando notificaciones..." />;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Notificaciones"
        subtitle={`${notifications.length} mensajes`}
        action={
          notifications.length > 0 && (
            <button className="btn-clear" onClick={confirmClearAll}>
              Limpiar todo
            </button>
          )
        }
      />

      {notifications.length === 0 ? (
        <EmptyState message="No tienes notificaciones." />
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={confirmDelete}
            />
          ))}
        </div>
      )}

      {modalState.isOpen && (
        <ConfirmModal
          message={modalState.message}
          confirmLabel={modalState.confirmLabel}
          onConfirm={modalState.onConfirm}
          onCancel={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};

export default NotificationList;
