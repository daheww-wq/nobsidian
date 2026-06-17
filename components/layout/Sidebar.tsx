'use client';

import { useState } from 'react';
import { SidebarToolbar } from '@/components/sidebar/SidebarToolbar';
import { SearchBar } from '@/components/sidebar/SearchBar';
import { SearchResults } from '@/components/sidebar/SearchResults';
import { FileTree } from '@/components/sidebar/FileTree';
import { LinkedNotesList } from '@/components/sidebar/LinkedNotesList';
import { useSearchStore } from '@/store/searchStore';

export function Sidebar() {
  const { isActive, query } = useSearchStore();
  const [createSignal, setCreateSignal] = useState<{ type: 'note' | 'folder' } | null>(null);

  const showSearch = isActive || !!query;

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white">
      <SidebarToolbar
        onCreateNote={() => setCreateSignal({ type: 'note' })}
        onCreateFolder={() => setCreateSignal({ type: 'folder' })}
      />
      <SearchBar />

      {showSearch ? (
        <SearchResults />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <FileTree
              createSignal={createSignal}
              onCreateSignalConsumed={() => setCreateSignal(null)}
            />
          </div>
          <LinkedNotesList />
        </>
      )}
    </aside>
  );
}
