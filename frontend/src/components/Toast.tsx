import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from './icons.tsx';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

type ToastContextValue = {
  toast: (options: Omit<Toast, 'id'>) => string;
  remove: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...options
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, remove, clear }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
    }
  };

  return (
    <div
      className={`toast toast--${toast.type}`}
      role="alert"
      aria-labelledby={`toast-${toast.id}-title`}
      aria-describedby={toast.description ? `toast-${toast.id}-description` : undefined}
    >
      <div className="toast__icon">
        {getIcon()}
      </div>

      <div className="toast__content">
        <h4 id={`toast-${toast.id}-title`} className="toast__title">
          {toast.title}
        </h4>
        {toast.description && (
          <p id={`toast-${toast.id}-description`} className="toast__description">
            {toast.description}
          </p>
        )}
      </div>

      <div className="toast__actions">
        {toast.action && (
          <button
            type="button"
            className="toast__action"
            onClick={toast.action.onClick}
          >
            {toast.action.label}
          </button>
        )}
        <button
          type="button"
          className="toast__close"
          onClick={() => onRemove(toast.id)}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration && toast.duration > 0 && (
        <div className="toast__progress">
          <div
            className="toast__progress-bar"
            style={{
              animationDuration: `${toast.duration}ms`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Helper functions for common toast types
export const toast = {
  success: (title: string, description?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'description'>>) => {
    const { toast: createToast } = useToast();
    return createToast({ type: 'success', title, description, ...options });
  },
  error: (title: string, description?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'description'>>) => {
    const { toast: createToast } = useToast();
    return createToast({ type: 'error', title, description, duration: 0, ...options }); // Errors don't auto-dismiss
  },
  warning: (title: string, description?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'description'>>) => {
    const { toast: createToast } = useToast();
    return createToast({ type: 'warning', title, description, ...options });
  },
  info: (title: string, description?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'description'>>) => {
    const { toast: createToast } = useToast();
    return createToast({ type: 'info', title, description, ...options });
  }
};

export default ToastProvider;