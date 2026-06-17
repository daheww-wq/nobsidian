'use client';

import '@blocknote/mantine/style.css';
import { useCallback, useEffect, useRef } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import {
  FormattingToolbar,
  FormattingToolbarController,
  BasicTextStyleButton,
  CreateLinkButton,
  SuggestionMenuController,
} from '@blocknote/react';
import { useRepoStore } from '@/store/repoStore';
import { useSearchStore } from '@/store/searchStore';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toast';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface BlockNoteEditorProps {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  notePath: string;
}

export default function BlockNoteEditorComponent({
  initialMarkdown,
  onChange,
}: BlockNoteEditorProps) {
  const { selectedRepo } = useRepoStore();
  const { index } = useSearchStore();
  const router = useRouter();
  const initialized = useRef(false);

  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast({
          type: 'error',
          message: '지원하지 않는 이미지 형식입니다. (jpg, png, gif, webp, svg)',
        });
        throw new Error('Invalid file type');
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast({ type: 'error', message: '5MB 이하 이미지만 업로드 가능합니다.' });
        throw new Error('File too large');
      }
      if (!selectedRepo) throw new Error('No repo');

      const ext = file.name.split('.').pop() ?? 'png';
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `assets/images/${filename}`;
      const owner = selectedRepo.full_name.split('/')[0];

      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      const res = await fetch('/api/images/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo: selectedRepo.name, path, base64, mimeType: file.type }),
      });

      if (!res.ok) {
        toast({ type: 'error', message: '이미지 업로드에 실패했습니다.' });
        throw new Error('Upload failed');
      }

      const data = (await res.json()) as { url: string };
      return data.url;
    },
    [selectedRepo]
  );

  const editor = useCreateBlockNote({ uploadFile });

  // editor ref for use inside getItems closure without stale capture
  const editorRef = useRef(editor);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (initialized.current || !initialMarkdown) return;
    initialized.current = true;
    const blocks = editor.tryParseMarkdownToBlocks(initialMarkdown);
    editor.replaceBlocks(editor.document, blocks);
  }, [editor, initialMarkdown]);

  const handleChange = useCallback(async () => {
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    onChange(markdown);
  }, [editor, onChange]);

  // [[백링크]] 자동완성: '[' 입력 후 다시 '[' 입력 시(query가 '[...'로 시작) 노트 목록 표시
  const getBacklinkItems = useCallback(
    async (query: string) => {
      // 두 번째 '[' 이후만 필터링 쿼리로 사용
      if (!query.startsWith('[')) return [];
      const q = query.slice(1).toLowerCase();
      const titles = index
        .filter((item) => !q || item.title.toLowerCase().includes(q))
        .slice(0, 10);

      return titles.map((item) => ({
        title: item.title,
        subtext: item.path,
        onItemClick: () => {
          // BlockNote가 trigger('[') + query('[title...') 를 삭제한 뒤 이 함수를 호출함
          // 따라서 여기서 [[title]] 전체를 삽입
          editorRef.current.insertInlineContent([
            { type: 'text', text: `[[${item.title}]]`, styles: {} },
          ]);
          // 클릭 네비게이션: Ctrl/Cmd 클릭 시 해당 노트로 이동
          // (단순 클릭은 삽입만, 이미 열린 노트로 이동은 LinkedNotesList 클릭으로 처리)
        },
      }));
    },
    [index]
  );

  // 에디터 내 [[...]] 클릭 시 노트로 이동 (Ctrl/Cmd+Click)
  const handleEditorClick = useCallback(
    (e: React.MouseEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const target = e.target as HTMLElement;
      const text = target.textContent ?? '';
      const match = text.match(/\[\[([^\]]+)\]\]/);
      if (!match) return;
      const title = match[1];
      const found = index.find((item) => item.title === title);
      if (found) {
        const encoded = btoa(found.path);
        router.push(`/workspace/${encoded}`);
      }
    },
    [index, router]
  );

  return (
    <div onClick={handleEditorClick} role="presentation">
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme="light"
        formattingToolbar={false}
      >
        <FormattingToolbarController
          formattingToolbar={() => (
            <FormattingToolbar>
              <BasicTextStyleButton basicTextStyle="bold" key="bold" />
              <BasicTextStyleButton basicTextStyle="italic" key="italic" />
              <BasicTextStyleButton basicTextStyle="strike" key="strike" />
              <BasicTextStyleButton basicTextStyle="underline" key="underline" />
              <CreateLinkButton key="link" />
            </FormattingToolbar>
          )}
        />
        {/* [[백링크]] 자동완성 메뉴 */}
        <SuggestionMenuController triggerCharacter="[" getItems={getBacklinkItems} />
      </BlockNoteView>
    </div>
  );
}
