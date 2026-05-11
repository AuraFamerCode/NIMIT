import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef({});

  const addToast = useCallback(({ message, type = "info", duration = 4000 }) => {
    const id = ++idCounter;
    setToasts(prev => [...prev, { id, message, type, createdAt: Date.now() }]);

    // Auto-dismiss timer
    if (timerRef.current[id]) clearTimeout(timerRef.current[id]);
    timerRef.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timerRef.current[id];
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timerRef.current[id]) {
      clearTimeout(timerRef.current[id]);
      delete timerRef.current[id];
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timerRef.current).forEach(clearTimeout);
    };
  }, []);

  const success = useCallback((msg) => addToast({ message: msg, type: "success" }), [addToast]);
  const error = useCallback((msg) => addToast({ message: msg, type: "error" }), [addToast]);
  const info = useCallback((msg) => addToast({ message: msg, type: "info" }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within ToastProvider");
  return ctx;
}

/* ── Styles ───────────────────────────────────────────── */
const C = {
  success: "#20c997",
  error: "#fa5252",
  info: "#8b8b8b",
  bg: "#2f2f2f",
  text: "#ececec",
  border: "#4a4a4a",
};

function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 9999,
      display: "flex", flexDirection: "column-reverse", gap: 8,
      pointerEvents: "none",
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${C[t.type] || C.info}`,
            borderRadius: 6,
            padding: "10px 16px",
            color: C.text,
            fontSize: 12,
            fontFamily: "'SF Mono','Cascadia Code','Fira Code',monospace",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            transition: "opacity 0.2s, transform 0.2s",
            pointerEvents: "auto",
            maxWidth: 360,
          }}
        >
          <span style={{ marginRight: 8 }}>
            {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}