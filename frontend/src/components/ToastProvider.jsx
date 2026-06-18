import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ToastContext } from './toastContext';
import { SPRING_SOFT, shouldAnimate } from '../motion/variants';

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});
  const remaining = useRef({});
  const startedAt = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    delete remaining.current[id];
    delete startedAt.current[id];
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'success', duration = 4000, action }) => {
      const id = ++toastId;
      remaining.current[id] = duration;
      startedAt.current[id] = Date.now();
      setToasts((prev) => [...prev, { id, title, message, type, duration, action }]);
      timers.current[id] = setTimeout(() => removeToast(id), duration);
      return id;
    },
    [removeToast],
  );

  const pauseToast = useCallback((id) => {
    clearTimeout(timers.current[id]);
    const elapsed = Date.now() - (startedAt.current[id] || Date.now());
    remaining.current[id] = Math.max(0, (remaining.current[id] || 0) - elapsed);
  }, []);

  const resumeToast = useCallback(
    (id) => {
      const timeLeft = remaining.current[id] ?? 0;
      if (timeLeft <= 0) {
        removeToast(id);
        return;
      }
      startedAt.current[id] = Date.now();
      timers.current[id] = setTimeout(() => removeToast(id), timeLeft);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  useEffect(() => {
    const handleToastEvent = (event) => addToast(event.detail || {});
    window.addEventListener('toast', handleToastEvent);
    return () => window.removeEventListener('toast', handleToastEvent);
  }, [addToast]);

  const iconMap = {
    success: { icon: 'check_circle', bg: 'bg-success/10', text: 'text-success', accent: 'bg-success' },
    error: { icon: 'error', bg: 'bg-error-container', text: 'text-error', accent: 'bg-error' },
    info: { icon: 'info', bg: 'bg-info-blue/10', text: 'text-info-blue', accent: 'bg-info-blue' },
    warning: { icon: 'warning', bg: 'bg-warning/10', text: 'text-warning', accent: 'bg-warning' },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack
        toasts={toasts}
        iconMap={iconMap}
        onRemove={removeToast}
        onPause={pauseToast}
        onResume={resumeToast}
      />
    </ToastContext.Provider>
  );
}

function ToastStack({ toasts, iconMap, onRemove, onPause, onResume }) {
  const reduce = useReducedMotion();
  const animate = shouldAnimate() && !reduce;

  return (
    <div
      className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-2rem)]"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const style = iconMap[toast.type] || iconMap.success;
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              layout={animate}
              initial={animate ? { opacity: 0, y: -20, x: 24, scale: 0.94 } : false}
              animate={
                animate
                  ? {
                      opacity: 1,
                      y: 0,
                      x: 0,
                      scale: 1,
                      ...(isError ? { x: [0, -4, 4, -2, 2, 0] } : {}),
                    }
                  : { opacity: 1 }
              }
              exit={animate ? { opacity: 0, y: -8, scale: 0.94 } : { opacity: 0 }}
              transition={isError ? { duration: 0.35 } : SPRING_SOFT}
              className={`pointer-events-auto bg-surface-container-lowest border border-outline-variant shadow-md rounded-xl overflow-hidden flex flex-col z-50 ${
                isError ? 'border-error/30' : ''
              }`}
              style={{ maxWidth: 380, minWidth: 280 }}
              role={isError ? 'alert' : 'status'}
              onMouseEnter={() => onPause(toast.id)}
              onMouseLeave={() => onResume(toast.id)}
              onFocus={() => onPause(toast.id)}
              onBlur={() => onResume(toast.id)}
            >
              <div className="p-stack-md flex items-start gap-stack-md">
                <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center shrink-0`}>
                  <span
                    className={`material-symbols-outlined ${style.text}`}
                    style={{ fontSize: 20, fontVariationSettings: '"FILL" 1' }}
                    aria-hidden="true"
                  >
                    {style.icon}
                  </span>
                </div>
                <div className="flex-grow min-w-0">
                  {toast.title && (
                    <p className="font-h3 text-h3 text-primary text-sm truncate">{toast.title}</p>
                  )}
                  {toast.message && (
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm line-clamp-2">
                      {toast.message}
                    </p>
                  )}
                  {toast.action && (
                    <button
                      onClick={() => {
                        toast.action.onClick();
                        onRemove(toast.id);
                      }}
                      className="mt-1 font-label-sm text-sm text-secondary hover:underline"
                      type="button"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
                <button
                  className="shrink-0 text-on-surface-variant hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
                  onClick={() => onRemove(toast.id)}
                  aria-label="Dismiss notification"
                  type="button"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
                    close
                  </span>
                </button>
              </div>
              {animate && (
                <motion.div
                  className={`h-[3px] ${style.accent} origin-left`}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
