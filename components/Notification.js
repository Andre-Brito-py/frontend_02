import { useEffect } from 'react';

export default function Notification({ type = 'success', message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [message, onClose, duration]);

  if (!message) return null;

  const base = 'fixed right-4 top-4 z-50 px-4 py-3 rounded shadow text-sm border';
  const styles = type === 'error'
    ? 'bg-red-50 text-red-800 border-red-200'
    : 'bg-green-50 text-green-800 border-green-200';

  return (
    <div className={`${base} ${styles}`} role="alert" aria-live="polite">
      <div className="flex items-start gap-2">
        <span className="font-medium">{type === 'error' ? 'Erro' : 'Sucesso'}</span>
        <span className="opacity-90">— {message}</span>
        <button
          onClick={onClose}
          aria-label="Fechar notificação"
          className="ml-3 text-xs opacity-60 hover:opacity-100"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}