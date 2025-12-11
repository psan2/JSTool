import React from 'react';
import { Notification } from '../hooks/useNotification';

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onRemove }) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => onRemove(notification.id)}
          style={{ cursor: 'pointer' }}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
