import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import './Toast.css';

export default function Toast({ message, type, onClose }) {
  const icons = {
    success: <CheckCircle2 size={20} color="var(--green-500)" />,
    error: <AlertCircle size={20} color="var(--red-500)" />,
    info: <Info size={20} color="var(--blue-500)" />,
  };

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__icon">{icons[type] || icons.info}</div>
      <div className="toast__message">{message}</div>
      <button className="toast__close" onClick={onClose}><X size={16} /></button>
    </div>
  );
}
