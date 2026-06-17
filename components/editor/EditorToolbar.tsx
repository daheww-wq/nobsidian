'use client';

import { useEditorStore, type SaveStatus } from '@/store/editorStore';

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: '저장됨',
  saving: '저장 중...',
  unsaved: '저장 안 됨',
  error: '저장 실패',
  offline: '오프라인',
};

const STATUS_COLOR: Record<SaveStatus, string> = {
  saved: 'text-green-600',
  saving: 'text-gray-400',
  unsaved: 'text-yellow-600',
  error: 'text-red-600',
  offline: 'text-gray-500',
};

interface EditorToolbarProps {
  onSave: () => void;
}

export function EditorToolbar({ onSave }: EditorToolbarProps) {
  const { saveStatus, toggleHistory, activePath } = useEditorStore();

  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 text-sm">
      <span className={`text-xs font-medium ${STATUS_COLOR[saveStatus]}`}>
        {STATUS_LABEL[saveStatus]}
      </span>
      <div className="flex items-center gap-2">
        {activePath && (
          <button
            onClick={toggleHistory}
            className="rounded-md px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
          >
            이력 보기
          </button>
        )}
        <button
          onClick={onSave}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white hover:bg-gray-700"
        >
          저장
        </button>
      </div>
    </div>
  );
}
