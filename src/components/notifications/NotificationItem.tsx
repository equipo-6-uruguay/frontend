import type { Notification } from '../../types/notification';
import { formatDate } from '../../utils/dateFormat';
import './NotificationItem.css';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) => {
  const { id, title, message, read, createdAt } = notification;

  return (
    <div className={`notification-item ${read ? 'read' : 'unread'}`}>
      <div className="notification-content">
        <div className="notification-header">
          <h4 className="notification-title">{title}</h4>
        </div>

        <p className="notification-description">{message}</p>

        <div className="notification-footer">
          <div className="time-info">
            <small className="time-text">{formatDate(createdAt)}</small>
          </div>

          <div className="actions">
            {!read && (
              <button
                className="btn-read"
                onClick={() => onMarkAsRead(id)}
              >
                Marcar como leída
              </button>
            )}

            <button
              className="btn-delete"
              onClick={() => onDelete(id)}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
