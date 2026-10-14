import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { Icon: CheckCircle2, color: 'text-emerald-400' },
  error: { Icon: XCircle, color: 'text-red-400' },
  info: { Icon: Info, color: 'text-sky-400' },
};

/** Avisos rápidos que somem sozinhos. Substitui window.alert() nas mensagens de sucesso/erro simples. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message, { action, duration } = {}) => {
      const id = ++seq.current;
      setToasts((all) => [...all.slice(-3), { id, type, message, action }]);
      setTimeout(() => dismiss(id), duration ?? (type === 'error' ? 7000 : 4000));
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (message, opts) => push('success', message, opts),
      error: (message, opts) => push('error', message, opts),
      info: (message, opts) => push('info', message, opts),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col gap-2 sm:left-auto sm:right-6 sm:w-96"
      >
        {toasts.map(({ id, type, message, action }) => {
          const { Icon, color } = STYLES[type];
          return (
            <div
              key={id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-white/10 bg-[#2a2a32] p-3 shadow-xl animate-dash-toast"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
              <p className="flex-1 text-sm text-white">{message}</p>
              {action && (
                <button
                  onClick={() => { action.onClick(); dismiss(id); }}
                  className="shrink-0 text-sm font-semibold text-[#FF6B6B] hover:underline"
                >
                  {action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(id)}
                aria-label="Fechar aviso"
                className="shrink-0 rounded p-0.5 text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
