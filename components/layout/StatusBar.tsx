'use client';

import { useEditorStore } from '@/store/editorStore';
import { useRepoStore } from '@/store/repoStore';

export function StatusBar() {
  const { markdownBody, activePath } = useEditorStore();
  const { selectedRepo } = useRepoStore();

  const charCount = markdownBody.length;
  const wordCount = markdownBody.trim() ? markdownBody.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-6 shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50 px-4 text-xs text-gray-400">
      <div className="flex items-center gap-3" />
      <div className="flex items-center gap-3">
        {activePath && (
          <span>
            {wordCount}단어 · {charCount}자
          </span>
        )}
        {selectedRepo && <span>{selectedRepo.full_name}</span>}
      </div>
    </div>
  );
}
