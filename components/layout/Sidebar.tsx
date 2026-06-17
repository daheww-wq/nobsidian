'use client';

import { useRef } from 'react';
import { SidebarToolbar } from '@/components/sidebar/SidebarToolbar';
import { SearchBar } from '@/components/sidebar/SearchBar';
import { SearchResults } from '@/components/sidebar/SearchResults';
import { FileTree, type FileTreeHandle } from '@/components/sidebar/FileTree';
import { LinkedNotesList } from '@/components/sidebar/LinkedNotesList';
import { useSearchStore } from '@/store/searchStore';
import { useEditorStore } from '@/store/editorStore';

export function Sidebar() {
  const { isActive, query } = useSearchStore();
  const { activePath } = useEditorStore();
  const fileTreeRef = useRef<FileTreeHandle>(null);

  const showSearch = isActive || !!query;

  return (
    <aside
      data-testid="sidebar"
      className="flex w-60 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white"
    >
      <SidebarToolbar
        onCreateNote={() => fileTreeRef.current?.openCreate('note')}
        onCreateFolder={() => fileTreeRef.current?.openCreate('folder')}
      />

      {/* 현재 노트 경로 */}
      {activePath && (
        <div
          className="truncate border-b border-gray-100 px-2 py-0.5 text-[10px] text-gray-400"
          title={activePath}
        >
          {activePath}
        </div>
      )}

      <SearchBar />

      {showSearch ? (
        <SearchResults />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <FileTree ref={fileTreeRef} />
          </div>
          <LinkedNotesList />
        </>
      )}
    </aside>
  );
}
