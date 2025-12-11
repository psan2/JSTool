import { useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    const id = Date.now().toString();
    const notification: Notification = { id, message, type };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    notifications,
    showNotification,
    removeNotification
  };
};
