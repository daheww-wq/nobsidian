// 30초 배치 윈도우: 디바운스된 변경사항을 모아 단일 커밋으로 flush
export class SaveQueue {
  private queue: Array<{ path: string; content: string; isManual: boolean }> = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly BATCH_WINDOW = 30_000;

  private onFlush: (
    items: Array<{ path: string; content: string; isManual: boolean }>
  ) => Promise<void>;

  constructor(
    onFlush: (items: Array<{ path: string; content: string; isManual: boolean }>) => Promise<void>
  ) {
    this.onFlush = onFlush;
  }

  push(path: string, content: string, isManual: boolean) {
    // 같은 경로면 최신 내용으로 덮어쓰기
    const idx = this.queue.findIndex((i) => i.path === path);
    if (idx >= 0) {
      this.queue[idx] = { path, content, isManual };
    } else {
      this.queue.push({ path, content, isManual });
    }

    if (isManual) {
      this.flush();
      return;
    }

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), this.BATCH_WINDOW);
    }
  }

  async flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    if (this.queue.length === 0) return;
    const items = this.queue.splice(0);
    await this.onFlush(items);
  }

  get size() {
    return this.queue.length;
  }

  destroy() {
    if (this.batchTimer) clearTimeout(this.batchTimer);
    this.queue = [];
  }
}
