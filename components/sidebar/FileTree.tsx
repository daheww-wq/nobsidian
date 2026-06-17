'use client';

import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useFileTreeStore } from '@/store/fileTreeStore';
import { useRepoStore } from '@/store/repoStore';
import { FolderNode } from './FolderNode';
import { NoteNode } from './NoteNode';
import { SidebarSkeleton } from '@/components/ui/Skeleton';
import { NameInputModal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { buildInitialNote } from '@/lib/markdown/frontmatter';
import type { FileTreeNode } from '@/types/note';

const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1F]/;

// forwardRef + useImperativeHandle로 부모가 직접 모달을 열도록 위임
// useEffect를 통한 prop→state 동기화 패턴(set-state-in-effect) 제거
export interface FileTreeHandle {
  openCreate: (type: 'note' | 'folder') => void;
}

export const FileTree = forwardRef<FileTreeHandle>(function FileTree(_props, ref) {
  const { tree, isLoading, addNode } = useFileTreeStore();
  const { selectedRepo } = useRepoStore();

  const [createModal, setCreateModal] = useState<{
    type: 'note' | 'folder';
    parentPath: string | null;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    openCreate: (type) => setCreateModal({ type, parentPath: null }),
  }));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const allIds = tree.flatMap(flattenIds);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !selectedRepo) return;

      const srcPath = active.id as string;
      const dstPath = over.id as string;

      const dstNode = findNode(tree, dstPath);
      if (dstNode?.type !== 'folder') return;

      const srcNode = findNode(tree, srcPath);
      if (!srcNode) return;

      if (dstPath.startsWith(srcPath + '/')) {
        toast({ type: 'error', message: '폴더를 자신의 하위로 이동할 수 없습니다.' });
        return;
      }

      const newPath = `${dstPath}/${srcNode.name}`;
      useFileTreeStore.getState().removeNode(srcPath);
      addNode({ ...srcNode, path: newPath }, dstPath);

      try {
        const res = await fetch('/api/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: selectedRepo.full_name.split('/')[0],
            repo: selectedRepo.name,
            oldPath: srcPath,
            newPath,
          }),
        });
        if (!res.ok) throw new Error();
      } catch {
        useFileTreeStore.getState().removeNode(newPath);
        addNode(srcNode, null);
        toast({ type: 'error', message: '이동에 실패했습니다.' });
      }
    },
    [tree, selectedRepo, addNode]
  );

  const handleCreateNote = async (name: string, parentPath: string | null) => {
    if (!selectedRepo) return;
    const nameWithExt = name.endsWith('.md') ? name : `${name}.md`;
    const path = parentPath ? `${parentPath}/${nameWithExt}` : nameWithExt;
    const owner = selectedRepo.full_name.split('/')[0];
    const content = buildInitialNote(name);

    const tempNode: FileTreeNode = { name: nameWithExt, path, type: 'file', sha: '' };
    addNode(tempNode, parentPath);
    setCreateModal(null);

    try {
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo: selectedRepo.name, path, content }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { sha: string };
      useFileTreeStore.getState().removeNode(path);
      addNode({ ...tempNode, sha: data.sha }, parentPath);
    } catch {
      useFileTreeStore.getState().removeNode(path);
      toast({ type: 'error', message: '노트 생성에 실패했습니다.' });
    }
  };

  const handleCreateFolder = async (name: string, parentPath: string | null) => {
    if (!selectedRepo) return;
    const path = parentPath ? `${parentPath}/${name}` : name;
    const keepPath = `${path}/.gitkeep`;
    const owner = selectedRepo.full_name.split('/')[0];

    const tempNode: FileTreeNode = { name, path, type: 'folder', sha: '', children: [] };
    addNode(tempNode, parentPath);
    setCreateModal(null);

    try {
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo: selectedRepo.name, path: keepPath, content: '' }),
      });
      if (!res.ok) throw new Error();
    } catch {
      useFileTreeStore.getState().removeNode(path);
      toast({ type: 'error', message: '폴더 생성에 실패했습니다.' });
    }
  };

  if (isLoading) return <SidebarSkeleton />;

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <span className="text-2xl">📝</span>
        <p className="text-xs text-gray-500">첫 노트를 만들어보세요!</p>
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
          <div className="px-1 py-1">
            {tree.map((node) =>
              node.type === 'folder' ? (
                <FolderNode
                  key={node.path}
                  node={node}
                  depth={0}
                  onCreateNote={(p) => setCreateModal({ type: 'note', parentPath: p })}
                  onCreateFolder={(p) => setCreateModal({ type: 'folder', parentPath: p })}
                />
              ) : (
                <NoteNode key={node.path} node={node} depth={0} />
              )
            )}
          </div>
        </SortableContext>
      </DndContext>

      {createModal?.type === 'note' && (
        <NameInputModal
          title="새 노트"
          placeholder="노트 이름..."
          confirmLabel="만들기"
          onConfirm={(name) => handleCreateNote(name, createModal.parentPath)}
          onClose={() => setCreateModal(null)}
          validate={(v) =>
            INVALID_CHARS.test(v) ? '사용할 수 없는 문자가 포함되어 있습니다.' : null
          }
        />
      )}

      {createModal?.type === 'folder' && (
        <NameInputModal
          title="새 폴더"
          placeholder="폴더 이름..."
          confirmLabel="만들기"
          onConfirm={(name) => handleCreateFolder(name, createModal.parentPath)}
          onClose={() => setCreateModal(null)}
          validate={(v) =>
            INVALID_CHARS.test(v) ? '사용할 수 없는 문자가 포함되어 있습니다.' : null
          }
        />
      )}
    </>
  );
});

function flattenIds(node: FileTreeNode): string[] {
  if (node.type === 'file') return [node.path];
  return [node.path, ...(node.children ?? []).flatMap(flattenIds)];
}

function findNode(tree: FileTreeNode[], path: string): FileTreeNode | null {
  for (const n of tree) {
    if (n.path === path) return n;
    if (n.children) {
      const found = findNode(n.children, path);
      if (found) return found;
    }
  }
  return null;
}
