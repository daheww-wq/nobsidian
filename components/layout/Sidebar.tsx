'use client';

import { useCallback, useState } from 'react';
import { SidebarToolbar } from '@/components/sidebar/SidebarToolbar';
import { FileTree } from '@/components/sidebar/FileTree';

export function Sidebar() {
  const [createSignal, setCreateSignal] = useState<{ type: 'note' | 'folder' } | null>(null);

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white">
      <SidebarToolbar
        onCreateNote={() => setCreateSignal({ type: 'note' })}
        onCreateFolder={() => setCreateSignal({ type: 'folder' })}
      />
      <div className="flex-1 overflow-y-auto">
        <FileTree />
      </div>
    </aside>
  );
}
