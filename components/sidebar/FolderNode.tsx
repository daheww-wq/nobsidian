'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFileTreeStore } from '@/store/fileTreeStore';
import { useRepoStore } from '@/store/repoStore';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { NameInputModal, ConfirmModal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import type { FileTreeNode } from '@/types/note';
import { NoteNode } from './NoteNode';

const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1F]/;
const HOVER_OPEN_DELAY = 800;

interface FolderNodeProps {
  node: FileTreeNode;
  depth: number;
  onCreateNote?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
}

export function FolderNode({ node, depth, onCreateNote, onCreateFolder }: FolderNodeProps) {
  const { expandedPaths, toggleExpand, removeNode, renameNode, addNode } = useFileTreeStore();
  const { selectedRepo } = useRepoStore();
  const isExpanded = expandedPaths.has(node.path);

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [modal, setModal] = useState<'rename' | 'delete' | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: node.path,
    });

  useEffect(() => {
    if (isOver && !isExpanded) {
      hoverTimer.current = setTimeout(() => toggleExpand(node.path), HOVER_OPEN_DELAY);
    } else {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    }
  }, [isOver, isExpanded, node.path, toggleExpand]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.currentTarget.getBoundingClientRect().right,
      y: e.currentTarget.getBoundingClientRect().top,
    });
  };

  const menuItems: ContextMenuItem[] = [
    { label: '새 노트', shortcut: 'N', onClick: () => onCreateNote?.(node.path) },
    { label: '새 폴더', shortcut: '⇧N', onClick: () => onCreateFolder?.(node.path) },
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

  const countFiles = (n: FileTreeNode): number => {
    if (n.type === 'file') return 1;
    return (n.children ?? []).reduce((acc, c) => acc + countFiles(c), 0);
  };

  const handleRename = async (newName: string) => {
    if (!selectedRepo) return;
    const parts = node.path.split('/');
    parts[parts.length - 1] = newName;
    const newPath = parts.join('/');
    setModal(null);
    renameNode(node.path, newName);

    try {
      const res = await fetch('/api/folders/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: selectedRepo.full_name.split('/')[0],
          repo: selectedRepo.name,
          oldPath: node.path,
          newPath,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      renameNode(newPath, node.name);
      toast({ type: 'error', message: '폴더 이름 변경에 실패했습니다.' });
    }
  };

  const handleDelete = async () => {
    if (!selectedRepo) return;
    setModal(null);
    const snapshot = node;
    removeNode(node.path);

    try {
      const res = await fetch('/api/folders/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: selectedRepo.full_name.split('/')[0],
          repo: selectedRepo.name,
          path: node.path,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      addNode(snapshot, null); // best-effort rollback
      toast({ type: 'error', message: '폴더 삭제에 실패했습니다.' });
    }
  };

  return (
    <>
      <div ref={setNodeRef} style={style}>
        <div
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={`group flex cursor-pointer items-center gap-1.5 rounded-md py-1 pr-2 text-sm select-none ${
            isOver ? 'bg-green-50 ring-1 ring-green-400' : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => toggleExpand(node.path)}
          onContextMenu={handleRightClick}
        >
          <span
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab text-gray-300 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            ⠿
          </span>
          <span
            className="shrink-0 text-xs text-gray-400 transition-transform"
            style={{ transform: isExpanded ? 'rotate(90deg)' : '' }}
          >
            ▶
          </span>
          <span className="shrink-0 text-base">{isExpanded ? '📂' : '📁'}</span>
          <span className="truncate">{node.name}</span>
        </div>

        {isExpanded && node.children && (
          <div>
            {node.children.map((child) =>
              child.type === 'folder' ? (
                <FolderNode
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  onCreateNote={onCreateNote}
                  onCreateFolder={onCreateFolder}
                />
              ) : (
                <NoteNode key={child.path} node={child} depth={depth + 1} />
              )
            )}
          </div>
        )}
      </div>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}

      {modal === 'rename' && (
        <NameInputModal
          title="폴더 이름 변경"
          defaultValue={node.name}
          onConfirm={handleRename}
          onClose={() => setModal(null)}
          validate={(v) =>
            INVALID_CHARS.test(v) ? '사용할 수 없는 문자가 포함되어 있습니다.' : null
          }
        />
      )}

      {modal === 'delete' && (
        <ConfirmModal
          title="폴더 삭제"
          message={`"${node.name}" 폴더와 ${countFiles(node)}개의 노트가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          danger
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
