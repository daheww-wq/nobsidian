'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

interface NameInputModalProps {
  title: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
  validate?: (name: string) => string | null;
}

export function NameInputModal({
  title,
  defaultValue = '',
  placeholder = '이름 입력...',
  confirmLabel = '확인',
  onConfirm,
  onClose,
  validate,
}: NameInputModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const handleConfirm = () => {
    const val = inputRef.current?.value.trim() ?? '';
    if (!val) return;
    if (validate) {
      const err = validate(val);
      if (err && errorRef.current) {
        errorRef.current.textContent = err;
        return;
      }
    }
    onConfirm(val);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <input
        ref={inputRef}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={100}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        onChange={() => {
          if (errorRef.current) errorRef.current.textContent = '';
        }}
      />
      <p ref={errorRef} className="mt-1.5 min-h-[1rem] text-xs text-red-600" />
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          취소
        </button>
        <button
          onClick={handleConfirm}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = '확인',
  danger = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-gray-600">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          className={`rounded-lg px-4 py-2 text-sm text-white ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-900 hover:bg-gray-700'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
