import React, { createContext, useCallback, useState, useEffect } from 'react';
import MessageModal from '../Modals/MessageModal';

export const NotificationContext = createContext({
  showNotification: (title, message) => {},
});

const NotificationProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const showNotification = useCallback((t, m) => {
    setTitle(t || 'Notice');
    setMessage(m || '');
    setOpen(true);
  }, []);

  useEffect(() => {
    // Override global alert to use our notification modal
    const originalAlert = window.alert;
    window.alert = (msg) => {
      try {
        showNotification('Notice', String(msg));
      } catch (e) {
        // fallback to original
        originalAlert(msg);
      }
    };

    // expose window.notify for explicit calls
    window.notify = (t, m) => showNotification(t, m);

    return () => {
      window.alert = originalAlert;
      try { delete window.notify; } catch (e) {}
    };
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <MessageModal
        visible={open}
        title={title}
        message={message}
        onClose={() => setOpen(false)}
        okLabel="OK"
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
