'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFileTreeStore } from '@/store/fileTreeStore';
import { useEditorStore } from '@/store/editorStore';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { NameInputModal, ConfirmModal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useRepoStore } from '@/store/repoStore';
import type { FileTreeNode } from '@/types/note';
import { FileText } from 'lucide-react';

const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1F]/;

interface NoteNodeProps {
  node: FileTreeNode;
  depth: number;
}

export function NoteNode({ node, depth }: NoteNodeProps) {
  const router = useRouter();
  const { activeNotePath, setActiveNote, removeNode, renameNode, failedPaths } = useFileTreeStore();
  const { activePath, saveStatus } = useEditorStore();
  const { selectedRepo } = useRepoStore();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [modal, setModal] = useState<'rename' | 'delete' | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.path,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isActive = activeNotePath === node.path;
  const isFailed = failedPaths.has(node.path);

  const openNote = useCallback(() => {
    if (saveStatus === 'unsaved') {
      if (!confirm('저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?')) return;
    }
    setActiveNote(node.path);
    const noteId = btoa(node.path);
    router.push(`/workspace/${noteId}`);
  }, [node.path, router, saveStatus, setActiveNote]);

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.currentTarget.getBoundingClientRect().right,
      y: e.currentTarget.getBoundingClientRect().top,
    });
  };

  const menuItems: ContextMenuItem[] = [
    { label: '이름 변경', shortcut: 'F2', onClick: () => setModal('rename') },
    {
      label: '경로 복사',
      onClick: () => {
        navigator.clipboard.writeText(node.path);
        toast({ type: 'success', message: '경로가 복사되었습니다.' });
      },
    },
    { label: '삭제', shortcut: 'Del', danger: true, onClick: () => setModal('delete') },
  ];

  const handleRename = async (newName: string) => {
    if (!selectedRepo) return;
    const nameWithExt = newName.endsWith('.md') ? newName : `${newName}.md`;
    const parts = node.path.split('/');
    parts[parts.length - 1] = nameWithExt;
    const newPath = parts.join('/');

    setModal(null);
    renameNode(node.path, nameWithExt);

    try {
      const res = await fetch('/api/notes/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: selectedRepo.full_name.split('/')[0],
          repo: selectedRepo.name,
          oldPath: node.path,
          newPath,
          branch: selectedRepo.default_branch,
        }),
      });
      if (!res.ok) throw new Error();
      if (activePath === node.path) {
        router.push(`/workspace/${btoa(newPath)}`);
      }
    } catch {
      renameNode(newPath, node.name); // rollback
      toast({
        type: 'error',
        message: '이름 변경에 실패했습니다.',
        action: { label: '재시도', onClick: () => setModal('rename') },
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedRepo) return;
    setModal(null);
    removeNode(node.path);

    try {
      const res = await fetch('/api/notes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: selectedRepo.full_name.split('/')[0],
          repo: selectedRepo.name,
          path: node.path,
          sha: node.sha,
        }),
      });
      if (!res.ok) throw new Error();
      if (activePath === node.path) {
        useEditorStore.getState().clearEditor();
        router.push('/workspace');
      }
    } catch {
      toast({ type: 'error', message: '삭제에 실패했습니다.' });
      // re-fetch tree to restore
    }
  };

  return (
    <>
      <div
        data-testid="file-item"
        ref={setNodeRef}
        style={{ ...style, paddingLeft: `${depth * 12 + 8}px` }}
        className={`group flex items-center gap-1 rounded-md py-0.5 pr-2 text-xs select-none ${
          isFailed
            ? 'cursor-not-allowed text-gray-300'
            : isActive
              ? 'cursor-pointer bg-green-50 font-medium text-green-700'
              : 'cursor-pointer text-gray-600 hover:bg-gray-100'
        }`}
        onClick={isFailed ? undefined : openNote}
        onContextMenu={handleRightClick}
      >
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab text-gray-300 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          ⠿
        </span>
        <FileText
          size={13}
          className={`shrink-0 ${isFailed ? 'text-gray-300' : 'text-gray-400'}`}
        />
        <span className={`truncate ${isFailed ? 'line-through' : ''}`}>
          {node.name.replace(/\.md$/, '')}
        </span>
      </div>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}

      {modal === 'rename' && (
        <NameInputModal
          title="노트 이름 변경"
          defaultValue={node.name.replace(/\.md$/, '')}
          onConfirm={handleRename}
          onClose={() => setModal(null)}
          validate={(v) =>
            INVALID_CHARS.test(v) ? '사용할 수 없는 문자가 포함되어 있습니다.' : null
          }
        />
      )}

      {modal === 'delete' && (
        <ConfirmModal
          title="노트 삭제"
          message={`"${node.name.replace(/\.md$/, '')}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          danger
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
