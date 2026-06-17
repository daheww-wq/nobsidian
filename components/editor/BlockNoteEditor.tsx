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
} from '@blocknote/react';
import { useRepoStore } from '@/store/repoStore';
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
  notePath,
}: BlockNoteEditorProps) {
  const { selectedRepo } = useRepoStore();
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

  return (
    <BlockNoteView editor={editor} onChange={handleChange} theme="light" formattingToolbar={false}>
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
    </BlockNoteView>
  );
}
