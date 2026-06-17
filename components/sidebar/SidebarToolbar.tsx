'use client';

import { FolderPlus, FilePlus } from 'lucide-react';

interface SidebarToolbarProps {
  onCreateNote: () => void;
  onCreateFolder: () => void;
}

export function SidebarToolbar({ onCreateNote, onCreateFolder }: SidebarToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-gray-100 px-2 py-1.5">
      <button
        onClick={onCreateFolder}
        title="새 폴더"
        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100"
      >
        <FolderPlus size={13} />
        <span>+폴더</span>
      </button>
      <button
        onClick={onCreateNote}
        title="새 노트"
        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100"
      >
        <FilePlus size={13} />
        <span>+노트</span>
      </button>
    </div>
  );
}
