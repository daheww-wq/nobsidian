# PLANNING.md — dohohon 구현 계획

> **작성일:** 2026-06-17 | 에이전트 작업 시 이 파일을 기준으로 진행 상황을 업데이트한다.

---

## 1. 기술 스택

```
Frontend
├── Next.js 16.2.9 (App Router)
├── TypeScript 5 (strict)
├── Tailwind CSS v4 (@tailwindcss/postcss)
├── BlockNote ← TipTap/ProseMirror 기반, Notion 스타일 블록 에디터
│   ├── @blocknote/core
│   ├── @blocknote/react
│   └── @blocknote/mantine (UI 컴포넌트)
├── @dnd-kit/sortable (사이드바 드래그앤드롭)
├── Zustand 4 (상태 관리)
├── Octokit (GitHub API)
└── D3.js 7 (지식 그래프, v2)

Backend (Next.js API Routes)
├── /api/auth/*    — OAuth 처리
└── /api/ai/*      — OpenAI 프록시 (v2)

외부 서비스
├── GitHub OAuth App
├── GitHub REST API v3
└── OpenAI API (gpt-4o-mini, v2)

인프라
└── Vercel — Next.js 최적화, httpOnly 쿠키 지원

개발 도구 (이미 설치됨)
├── Husky 9 (pre-commit hooks)
├── Prettier 3 + prettier-plugin-tailwindcss
└── ESLint 9
```

---

## 2. 프로젝트 구조

```
dohohon/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── auth/callback/route.ts
│   ├── (app)/
│   │   ├── select-repo/page.tsx
│   │   └── workspace/
│   │       ├── layout.tsx
│   │       ├── page.tsx              — 노트 미선택 상태
│   │       ├── [noteId]/page.tsx     — 노트 편집
│   │       └── graph/page.tsx        — 지식 그래프 (v2)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── callback/route.ts
│   │   │   ├── session/route.ts
│   │   │   └── logout/route.ts
│   │   └── ai/
│   │       ├── summarize/route.ts    — v2
│   │       └── tag/route.ts          — v2
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatusBar.tsx
│   ├── sidebar/
│   │   ├── FileTree.tsx
│   │   ├── FolderNode.tsx
│   │   ├── NoteNode.tsx
│   │   ├── ContextMenu.tsx
│   │   ├── SidebarToolbar.tsx
│   │   ├── SearchBar.tsx             — 실시간 검색 (v1)
│   │   ├── SearchResults.tsx         — 검색 결과 목록 (v1)
│   │   └── LinkedNotesList.tsx       — 연결 노트 목록 (v1)
│   ├── editor/
│   │   ├── Editor.tsx
│   │   ├── EditorToolbar.tsx
│   │   ├── NoteTitle.tsx
│   │   └── BacklinkNode.tsx          — [[]] 인라인 BlockNote 노드 (v1)
│   ├── detail/                       — v2
│   │   ├── DetailPanel.tsx
│   │   ├── AISummary.tsx
│   │   ├── TagList.tsx
│   │   └── LinkedNotes.tsx
│   ├── graph/                        — v2
│   │   └── KnowledgeGraph.tsx
│   └── ui/
│       ├── Modal.tsx
│       ├── Toast.tsx
│       └── Skeleton.tsx
├── lib/
│   ├── github/
│   │   ├── client.ts                 — Octokit 인스턴스
│   │   ├── fileTree.ts               — 파일 트리 파싱
│   │   └── operations.ts             — CRUD 작업
│   ├── markdown/
│   │   ├── frontmatter.ts            — YAML 파싱
│   │   ├── backlinks.ts              — [[링크]] 파싱 (v1)
│   │   └── search.ts                 — 검색 인덱스 + 쿼리 (v1)
│   ├── editor/
│   │   └── saveQueue.ts              — 배치 저장 큐 (v1)
│   ├── ai/
│   │   ├── summarize.ts              — v2
│   │   └── tag.ts                    — v2
│   └── graph/
│       └── buildGraph.ts             — 그래프 데이터 생성 (v2)
├── store/
│   ├── authStore.ts                  — isAuthenticated, user (토큰 없음)
│   ├── repoStore.ts
│   ├── fileTreeStore.ts
│   ├── editorStore.ts
│   └── searchStore.ts                — 검색 쿼리, 결과 (v1)
├── types/
│   ├── github.ts
│   ├── note.ts
│   └── graph.ts
├── docs/                             — 설계 문서
│   ├── PRD.md
│   ├── IA.md
│   ├── 기능명세서.md
│   ├── AGENT.md
│   └── wireframe.html
└── middleware.ts                      — 인증 미들웨어
```

---

## 3. 구현 단계

### Phase 0 — 프로젝트 셋업 ✅ (완료)

- [x] `create-next-app` 초기화 (TypeScript, Tailwind v4, App Router)
- [x] ESLint + Prettier + Husky 설정
- [ ] 환경변수 설정 (`.env.local` 템플릿 생성)
- [ ] Vercel 프로젝트 연결

### Phase 1 — 인증 (1일)

- [ ] GitHub OAuth App 생성 (Client ID/Secret)
- [ ] `/api/auth/login` — state 생성, GitHub 리다이렉트
- [ ] `/api/auth/callback` — code → token 교환, httpOnly 쿠키 설정
- [ ] `/api/auth/session` — `isAuthenticated + user` 반환 (토큰 미포함)
- [ ] `/api/auth/logout` — 쿠키 삭제
- [ ] `middleware.ts` — 비인증 요청 차단
- [ ] 로그인 페이지 UI (GitHub OAuth 권한 범위 설명 포함)

### Phase 2 — 레포 연동 (1일)

- [ ] Octokit 클라이언트 설정 (서버사이드 토큰 자동 주입)
- [ ] `/select-repo` 페이지 — 레포 목록 조회 + 선택 UI
- [ ] 선택된 레포 localStorage 저장 + Zustand 연동
- [ ] `.notegraph/config.json` 초기화 로직
- [ ] 파일 트리 API (`/git/trees`) 호출 + 파싱
- [ ] 기존 마크다운 폴더 가져오기 지원 (frontmatter 없는 .md 파일 허용)

### Phase 3 — 사이드바 + 검색 (2.5일)

- [ ] `FileTree` 컴포넌트 — 재귀 렌더링
- [ ] `FolderNode` — 접기/펼치기, 선택 상태
- [ ] `NoteNode` — 선택 상태, active 스타일
- [ ] `SidebarToolbar` — [+폴더] [+노트] [검색] 버튼
- [ ] `ContextMenu` — 우클릭 메뉴 (아이템 오른쪽, 자동 반전)
- [ ] 폴더 생성/이름변경/삭제 모달 + API 연동
- [ ] 노트 생성/이름변경/삭제 모달 + API 연동
- [ ] 드래그앤드롭 이동 (`@dnd-kit/sortable` — reorder 및 폴더 이동, 800ms hover)
- [ ] **`SearchBar`** — 사이드바 상단 검색 입력창
- [ ] **`SearchResults`** — 제목+본문+태그 실시간 검색 결과 (날짜순/관련도순)
- [ ] **`lib/markdown/search.ts`** — 검색 인덱스 빌드 + 퍼지 매칭
- [ ] **`LinkedNotesList`** — 현재 노트를 참조하는 노트 목록 (사이드바 하단)

### Phase 4 — 에디터 + 백링크 (2.5일)

- [ ] BlockNote 설치 (`@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`)
- [ ] 인라인 툴바 슬림화 (`FormattingToolbarController` — Bold/Italic/Strike/Code/Link 5개)
- [ ] / 슬래시 명령어 — H2/H3, 체크리스트, 표, 코드블록, 이미지, 백링크
- [ ] 이미지 드래그 업로드 → `/assets/images/` GitHub 저장
- [ ] 노트 제목 인라인 편집 (`<NoteTitle>` 컴포넌트)
- [ ] BlockNote JSON ↔ 마크다운 직렬화 (`blocknoteToMarkdown`)
- [ ] **`BacklinkNode`** — `[[notename]]` BlockNote 커스텀 인라인 노드
- [ ] **자동완성 드롭다운** — `[[` 입력 시 노트 목록 팝업 (퍼지 매칭)
- [ ] **깨진 링크 표시** — 존재하지 않는 노트명 시 회색/취소선
- [ ] **`lib/markdown/backlinks.ts`** — `[[]]` 파싱 + 역방향 인덱스 빌드

### Phase 5 — 저장 + 배치 큐 (1일)

- [ ] **`lib/editor/saveQueue.ts`** — 배치 저장 큐 (2초 디바운스 + 30초 배치 윈도우)
- [ ] Zustand `editorStore` — 콘텐츠, saveStatus 관리
- [ ] 자동 저장: 큐에 쌓고 배치 커밋 (`[autosave] N changes`)
- [ ] 수동 저장 (Cmd/Ctrl+S): 큐 즉시 플러시 → `[save]` 커밋
- [ ] SHA 충돌 감지 및 머지 UI
- [ ] 오프라인 감지 + 저장 대기열 (온라인 복구 시 자동 재시도)
- [ ] beforeunload 경고

### Phase 6 — 통합 테스트 및 배포 (1일)

- [ ] 전체 흐름 E2E 테스트 (Playwright)
- [ ] 에러 케이스 수동 테스트
- [ ] Vercel 배포 + 환경변수 설정
- [ ] Rate Limit 모니터링 + 사용자 피드백

**Phase 0-6 완료 = v1 MVP 출시 (약 9일)**

---

### Phase 7 — AI 기능 v2 (2일)

- [ ] OpenAI 클라이언트 설정 (서버 사이드)
- [ ] `/api/ai/summarize` — 노트 요약 엔드포인트
- [ ] `/api/ai/tag` — 태그 생성 엔드포인트
- [ ] 저장 후 백그라운드 AI 호출 (non-blocking)
- [ ] frontmatter 업데이트 로직
- [ ] 우측 Detail Panel UI (AI 요약, 태그)

### Phase 8 — 백링크 고급 기능 v2 (1.5일)

- [ ] 이름 변경 시 `[[링크]]` 자동 업데이트 (전체 레포 스캔)
- [ ] 연결 노트 목록 → Detail Panel으로 이전 (v1은 사이드바 하단)
- [ ] 백링크 클릭 → 해당 노트로 이동 + 참조 위치 하이라이트

### Phase 9 — 지식 그래프 v2 (2일)

- [ ] `buildGraph.ts` — 노드/엣지 데이터 생성 (백링크 + 공유 태그)
- [ ] D3.js force-directed 시뮬레이션
- [ ] 태그별 색상 시스템
- [ ] 노드 클릭 → 노트 이동
- [ ] 필터링 (태그별, 폴더별)
- [ ] WebWorker 렌더링 최적화

**Phase 7-9 완료 = v2 출시 (추가 5.5일)**

---

## 4. 구현 우선순위 매트릭스

```
           높은 가치
               │
    Phase 3    │    Phase 4
    (사이드바   │    (에디터+
    +검색)     │    백링크)
               │
    ───────────┼───────────
               │
    Phase 1    │    Phase 7
    (인증)     │    (AI v2)
               │
           낮은 가치
    낮은 복잡도    높은 복잡도
```

---

## 5. 진행 상황 추적

> 에이전트는 작업 완료 후 이 섹션을 업데이트한다.

| Phase   | 상태   | 완료일 | 담당 에이전트 | 비고                                  |
| ------- | ------ | ------ | ------------- | ------------------------------------- |
| Phase 0 | 진행중 | -      | -             | 프레임워크 셋업 완료, env/Vercel 남음 |
| Phase 1 | 미시작 | -      | -             |                                       |
| Phase 2 | 미시작 | -      | -             |                                       |
| Phase 3 | 미시작 | -      | -             | 검색 포함 (2.5일)                     |
| Phase 4 | 미시작 | -      | -             | 백링크 포함 (2.5일)                   |
| Phase 5 | 미시작 | -      | -             | 배치 저장 큐 포함                     |
| Phase 6 | 미시작 | -      | -             |                                       |
| Phase 7 | 미시작 | -      | -             | v2                                    |
| Phase 8 | 미시작 | -      | -             | v2 (백링크 고급)                      |
| Phase 9 | 미시작 | -      | -             | v2                                    |

---

## 6. 이슈 로그

| #    | 발견일     | 유형      | 설명                                                              | 상태    |
| ---- | ---------- | --------- | ----------------------------------------------------------------- | ------- |
| I-01 | 2026-06-17 | 보안      | IA.md 클라이언트 상태에 `accessToken` 필드 존재 → ADR-22로 제거   | ✅ 해결 |
| I-02 | 2026-06-17 | 표현 오류 | PRD v1 가치로 "오프라인 접근성" 언급 → v1은 온라인 전용, v3에 PWA | ✅ 해결 |
| I-03 | 2026-06-17 | 설계 위험 | 2초 자동저장마다 GitHub 커밋 → 배치 큐(ADR-20)로 해결             | ✅ 해결 |

---

## 7. 환경변수 목록

```bash
# .env.local (개발)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=           # 세션 암호화 키 (32자 이상)
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=            # v2만 필요
```
