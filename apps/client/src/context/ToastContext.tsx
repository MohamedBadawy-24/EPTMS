import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: 'success', title, message }),
    [addToast]
  );
  const error = useCallback(
    (title: string, message?: string) => addToast({ type: 'error', title, message }),
    [addToast]
  );
  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    [addToast]
  );
  const info = useCallback(
    (title: string, message?: string) => addToast({ type: 'info', title, message }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const typeStyles = {
          success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          error: 'bg-rose-50 border-rose-200 text-rose-900',
          warning: 'bg-amber-50 border-amber-200 text-amber-900',
          info: 'bg-blue-50 border-blue-200 text-blue-900',
        };

        const iconMap = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
          error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
          info: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
        };

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 transform transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in',
              typeStyles[toast.type]
            )}
          >
            {iconMap[toast.type]}
            <div className="flex-1 space-y-0.5 text-xs">
              <h5 className="font-bold text-scb-dark">{toast.title}</h5>
              {toast.message && <p className="text-scb-dark-muted leading-relaxed">{toast.message}</p>}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded text-scb-dark-muted hover:text-scb-dark transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
