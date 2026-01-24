import React, { useEffect } from 'react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast: React.FC<ToastMessage & { onRemove: () => void }> = ({ message, type, onRemove }) => {
  useEffect(() => {
    // Faster dismiss (1500ms)
    const timer = setTimeout(() => {
      onRemove();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div className="pointer-events-auto animate-fade-in-up min-w-[200px] bg-content1 border border-white/10 shadow-lg rounded-medium p-3 flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};