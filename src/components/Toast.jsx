import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

let toastId = 0;
const listeners = new Set();

/** Call this anywhere to show a toast. */
export function showToast(message, type = 'info', duration = 4000) {
  const id = ++toastId;
  listeners.forEach((fn) => fn({ id, message, type, duration }));
  return id;
}

/** Internal hook — used once at the root level inside ToastContainer. */
function useToastQueue() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, dismiss };
}

const ICONS = { success: '✅', error: '❌', info: 'ℹ️' };
const COLORS = {
  success: 'border-green-500/40 bg-green-500/10',
  error: 'border-red-500/40 bg-red-500/10',
  info: 'border-accent-purple/40 bg-accent-purple/10',
};

/** Mount once near the app root — renders toasts as a portal. */
export default function ToastContainer() {
  const { toasts, dismiss } = useToastQueue();

  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[min(90vw,360px)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`glass-card border ${COLORS[t.type]} px-4 py-3 flex items-start gap-3 animate-slide-up shadow-lg`}
          role="alert"
        >
          <span className="text-lg flex-shrink-0">{ICONS[t.type]}</span>
          <span className="flex-1 text-sm text-text-primary">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
