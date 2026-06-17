'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
  action?: { label: string; onClick: () => void };
}

let listeners: Array<(t: ToastData) => void> = [];

export function toast(data: Omit<ToastData, 'id'>) {
  const t: ToastData = { ...data, id: Math.random().toString(36).slice(2) };
  listeners.forEach((fn) => fn(t));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handler = (t: ToastData) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(
        () => {
          setToasts((prev) => prev.filter((x) => x.id !== t.id));
        },
        t.type === 'error' ? 8000 : 4000
      );
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((fn) => fn !== handler);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex max-w-sm items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
            t.type === 'error'
              ? 'bg-red-600'
              : t.type === 'success'
                ? 'bg-green-600'
                : 'bg-gray-800'
          }`}
        >
          <span className="flex-1">{t.message}</span>
          <div className="flex gap-2">
            {t.action && (
              <button
                onClick={t.action.onClick}
                className="font-medium underline hover:no-underline"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="opacity-70 hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
