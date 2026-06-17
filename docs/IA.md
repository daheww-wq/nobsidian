# IA — dohohon (Information Architecture)

> **버전:** 0.3 | **작성일:** 2026-06-17

---

## 1. 사이트맵 (Sitemap)

```
dohohon (Web App)
│
├── 인증 (Auth)
│   ├── /login                    — GitHub OAuth 진입점
│   ├── /auth/callback            — OAuth 콜백 처리
│   └── /auth/logout              — 세션 종료
│
├── 레포 선택 (Onboarding)
│   └── /select-repo              — 최초 또는 레포 변경 시
│
└── 메인 앱 (Workspace)
    ├── /workspace                — 기본 화면 (노트 미선택)
    ├── /workspace/[noteId]       — 노트 편집 화면
    └── /workspace/graph          — 지식 그래프 (v2)
```

---

## 2. 화면 구성 (Screen Layout)

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: 앱 로고 | 레포 선택 | 저장 상태 | 이력보기 | ☰패널 | 프로필   │
├───────────────────┬───────────────────────────┬─────────────────┤
│  Sidebar (240px)  │  Editor (flex, max 960px)  │  Detail Panel   │
│                   │                            │  (256px, v2)    │
│  [+폴더] [+노트]  │  노트 제목                 │  ☰ 토글로       │
│                   │  ─────────────             │  슬라이드 열기/ │
│  📁 폴더1         │                            │  닫기           │
│    📄 노트1       │  에디터 본문               │                 │
│    📄 노트2       │  (BlockNote WYSIWYG)       │  요약 (v2)      │
│  📁 폴더2         │                            │  태그 (v2)      │
│    📁 하위폴더    │  ┌──인라인 툴바──┐          │  연결 노트 (v2) │
│      📄 노트3     │  │ B I S ` 🔗 │ ← 텍스트  │  마지막 수정    │
│  📄 루트노트      │  └─────────────┘   선택 시 │                 │
│                   │                    선택 위 │                 │
│                   │                    플로팅  │                 │
└───────────────────┴───────────────────────────┴─────────────────┘
│  Status Bar: Saved | Last saved 2분 전 | GitHub: repo-name       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 네비게이션 구조 (Navigation Flow)

```
[진입]
  │
  ▼
로그인 여부 확인
  ├─ NO  → /login → GitHub OAuth → /auth/callback → 레포 선택 여부 확인
  │                                                      ├─ NO  → /select-repo
  │                                                      └─ YES → /workspace
  └─ YES → 레포 선택 여부 확인
               ├─ NO  → /select-repo
               └─ YES → /workspace

[워크스페이스 내]
사이드바 노트 클릭 → /workspace/[noteId] (URL 업데이트, 페이지 리로드 없음)
사이드바 폴더 클릭 → 접기/펼치기 (상태만 변경)
그래프 아이콘 클릭 → /workspace/graph (v2)
툴바 ☰ 패널 버튼 → 우측 Detail Panel 슬라이드 토글 (v2)
```

---

## 4. 데이터 모델 (Data Model)

### 4.1 GitHub 레포 파일 구조

```
{repo-root}/
├── .notegraph/
│   └── config.json               — 앱 메타데이터 (폴더 색상 등)
├── assets/
│   └── images/                   — 에디터 내 업로드 이미지
├── 폴더명/
│   ├── _meta.json                — 폴더 상세설명 (선택)
│   ├── 노트1.md
│   └── 하위폴더/
│       └── 노트2.md
└── 루트노트.md
```

### 4.2 노트 파일 (마크다운 frontmatter)

```yaml
---
id: uuid-v4
title: 노트 제목
created: 2026-06-17T10:00:00Z
updated: 2026-06-17T12:30:00Z
tags: [태그1, 태그2] # v2: AI 자동 + 수동
summary: 'AI 생성 요약' # v2
---
노트 본문 마크다운 내용

[[다른노트명]]  ← 백링크 문법 (v1 기본)
```

### 4.3 클라이언트 상태 모델

```typescript
// 전역 상태 (Zustand)
interface AppState {
  // 인증 — accessToken은 절대 클라이언트에 없음 (httpOnly 쿠키 전용)
  isAuthenticated: boolean;
  user: GitHubUser | null;

  // 레포
  selectedRepo: Repository | null;

  // 파일 트리
  fileTree: FileNode[];
  expandedFolders: Set<string>;

  // 검색 (v1)
  searchQuery: string;
  searchResults: SearchResult[];

  // 에디터
  activeNote: Note | null;
  editorContent: Block[]; // BlockNote JSON 형식
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  saveQueue: SaveQueueItem[]; // 배치 저장 큐

  // UI
  isDetailPanelOpen: boolean; // 우측 패널 토글 상태 (v2)

  // v2
  knowledgeGraph: GraphData | null;
}

// ❌ 절대 클라이언트 상태에 없어야 할 것:
// accessToken: string  → httpOnly 쿠키로만 관리, 서버사이드 전용

interface FileNode {
  id: string; // GitHub 파일 SHA
  path: string; // 전체 경로
  name: string; // 파일/폴더명
  type: 'file' | 'dir';
  children?: FileNode[];
  meta?: FolderMeta;
}

interface Note {
  path: string;
  sha: string; // GitHub 파일 SHA (업데이트 시 필요)
  frontmatter: NoteFrontmatter;
  content: string; // frontmatter 제외 본문 (마크다운)
}
```

---

## 5. 컴포넌트 계층 (Component Hierarchy)

```
<App>
├── <AuthProvider>               — OAuth 상태, 토큰 갱신
├── <RepoProvider>               — 선택된 레포, GitHub API 클라이언트
└── <Layout>
    ├── <Header>
    │   ├── <Logo>               — "dohohon"
    │   ├── <RepoSelector>
    │   ├── <SaveStatus>
    │   └── <UserMenu>
    ├── <Sidebar>
    │   ├── <SidebarToolbar>     — [+폴더] [+노트] 버튼
    │   ├── <SearchBar>          — 실시간 검색 입력창 (v1)
    │   ├── <SearchResults>      — 검색 결과 목록, 빈 쿼리 시 최근 노트 (v1)
    │   ├── <FileTree>           — @dnd-kit/sortable (검색 중 숨김)
    │   │   ├── <FolderNode>
    │   │   │   ├── <DragHandle> — ⠿ 아이콘, 클릭 후 드래그
    │   │   │   ├── <FolderName>
    │   │   │   ├── <ContextMenu>— 우클릭 시 아이템 바로 오른쪽에 표시
    │   │   │   └── <FileTree>   — 재귀
    │   │   └── <NoteNode>
    │   │       ├── <DragHandle>
    │   │       ├── <NoteName>
    │   │       └── <ContextMenu>
    │   └── <LinkedNotesList>    — 현재 노트 참조하는 노트 목록 (v1, 사이드바 하단)
    ├── <Editor>
    │   ├── <NoteTitle>          — H1 인라인 편집
    │   ├── <BlockNoteEditor>    — max-width: 960px
    │   │   ├── <FormattingToolbarController>  — 커스텀 인라인 툴바
    │   │   │   └── <SlimFormattingToolbar>    — B/I/S/`/Link 5버튼, 흰 배경
    │   │   ├── <BacklinkNode>   — [[notename]] 커스텀 인라인 노드 (v1)
    │   │   │   └── <BacklinkAutocomplete>     — [[ 입력 시 노트 목록 드롭다운
    │   │   └── <EditorContent>
    │   └── <EditorFooter>       — 글자수, 경로
    └── <DetailPanel> (v2)       — width 토글: 0 ↔ 256px, transition .2s
        ├── <AISummary>
        ├── <TagList>
        └── <LinkedNotes>
```

---

## 6. API 인터페이스 요약

### 6.1 GitHub API (Octokit)

| 용도           | 엔드포인트                                          | 메서드 |
| -------------- | --------------------------------------------------- | ------ |
| 레포 목록      | `/user/repos`                                       | GET    |
| 파일 트리      | `/repos/{owner}/{repo}/git/trees/{sha}?recursive=1` | GET    |
| 파일 읽기      | `/repos/{owner}/{repo}/contents/{path}`             | GET    |
| 파일 생성/수정 | `/repos/{owner}/{repo}/contents/{path}`             | PUT    |
| 파일 삭제      | `/repos/{owner}/{repo}/contents/{path}`             | DELETE |
| 수정 이력      | `/repos/{owner}/{repo}/commits?path={filePath}`     | GET    |

### 6.2 내부 API Routes (Next.js)

| 용도       | 경로                 | 메서드 |
| ---------- | -------------------- | ------ |
| OAuth 시작 | `/api/auth/login`    | GET    |
| OAuth 콜백 | `/api/auth/callback` | GET    |
| 세션 확인  | `/api/auth/session`  | GET    |
| 로그아웃   | `/api/auth/logout`   | POST   |
| AI 요약    | `/api/ai/summarize`  | POST   |
| AI 태그    | `/api/ai/tag`        | POST   |

---

## 7. URL 파라미터 규칙

| URL                   | 파라미터                  | 설명                  |
| --------------------- | ------------------------- | --------------------- |
| `/workspace/[noteId]` | noteId = base64(filePath) | 파일 경로 인코딩      |
| `/workspace/graph`    | `?tag=태그명`             | 특정 태그 필터 (v2)   |
| `/workspace/graph`    | `?note=noteId`            | 특정 노트 포커스 (v2) |

---

## 8. 에디터 레이아웃 상세

### 8.1 에디터 너비

- `ws-ed`: `flex: 1`, 사이드바(240px) + 우측 패널(0~256px) 이외 나머지 공간
- `ed-body`: `max-width: 960px; margin: 0 auto; padding: 48px 80px`
- 넓은 화면에서도 적절한 라인 길이 유지

### 8.2 인라인 툴바 (FormattingToolbar)

- **트리거**: 텍스트 드래그 선택
- **위치**: 선택 영역 위 중앙 (`position: absolute`, `bottom: calc(100% + 6px)`)
- **스타일**: 흰 배경 (`#fff`), `border: 1px solid #e5e7eb`, `border-radius: 8px`, `box-shadow`
- **버튼**: Bold / Italic / Strikethrough / InlineCode / Link (5개)
- **구현**: `FormattingToolbarController` + `FormattingToolbar` + `BasicTextStyleButton`

### 8.3 우측 Detail Panel (v2)

- **기본 상태**: 닫힘 (width: 0)
- **열기**: 툴바 "☰ 패널" 버튼 클릭 → `width: 256px`, `transition: width .2s`
- **표시 내용**: AI 요약, 태그(수동 편집 가능), 연결 노트, 파일 정보
