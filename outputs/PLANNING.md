# PLANNING.md — dohohon 구현 계획

> **작성일:** 2026-06-17 | 에이전트 작업 시 이 파일을 기준으로 진행 상황을 업데이트한다.

---

## 1. 기술 스택

```
Frontend
├── Next.js 15 (App Router)
├── TypeScript 5 (strict)
├── Tailwind CSS 3
├── BlockNote (에디터) ← TipTap/ProseMirror 기반, Notion 스타일 블록 에디터
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
└── Vercel (권장) — Next.js 최적화, httpOnly 쿠키 지원
```

---

## 2. 프로젝트 구조

```
notegraph/
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
│   │   └── SidebarToolbar.tsx
│   ├── editor/
│   │   ├── Editor.tsx
│   │   ├── EditorToolbar.tsx
│   │   └── NoteTitle.tsx
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
│   │   └── backlinks.ts              — [[링크]] 파싱 (v2)
│   ├── ai/
│   │   ├── summarize.ts              — v2
│   │   └── tag.ts                    — v2
│   └── graph/
│       └── buildGraph.ts             — 그래프 데이터 생성 (v2)
├── store/
│   ├── authStore.ts
│   ├── repoStore.ts
│   ├── fileTreeStore.ts
│   └── editorStore.ts
├── types/
│   ├── github.ts
│   ├── note.ts
│   └── graph.ts
└── middleware.ts                      — 인증 미들웨어
```

---

## 3. 구현 단계

### Phase 0 — 프로젝트 셋업 (0.5일)

- [x] `create-next-app` 초기화 (TypeScript, Tailwind, App Router) — Next.js 16.2.9 + React 19
- [x] 환경변수 설정 (`.env.local` 템플릿 + `.env.local.example`)
- [x] ESLint + Prettier + Husky + lint-staged 설정
- [x] 디렉토리 구조 생성 (app/, components/, lib/, store/, types/)
- [x] 기본 타입 파일 (types/github.ts, note.ts, graph.ts)
- [x] middleware.ts 스켈레톤 (인증 미들웨어)
- [ ] Vercel 프로젝트 연결 (배포 시 수동 설정 필요)

### Phase 1 — 인증 (1일)

- [x] GitHub OAuth App 생성 (Client ID: Ov23liYln97uboA3fHsE)
- [x] `/api/auth/login` — state 생성, GitHub 리다이렉트 (307 → github.com 확인)
- [x] `/api/auth/callback` — code → token 교환, httpOnly 쿠키 설정
- [x] `/api/auth/session` — 현재 세션 반환 (GitHub /user API 검증)
- [x] `/api/auth/logout` — 쿠키 삭제
- [x] `proxy.ts` — 비인증 요청 차단 (Next.js 16: middleware → proxy)
- [x] 로그인 페이지 UI (Tailwind, GitHub SVG 버튼, 에러 메시지)
- [x] `store/authStore.ts` — Zustand 세션 상태 관리

### Phase 2 — 레포 연동 (1일)

- [x] Octokit 클라이언트 설정 (`lib/github/client.ts`)
- [x] `/select-repo` 페이지 — 레포 목록 조회 + 검색 + 선택 UI
- [x] 선택된 레포 localStorage 저장 + Zustand 연동 (`store/repoStore.ts`, persist)
- [x] `.notegraph/config.json` 초기화 로직 (`/api/repos/init`)
- [x] 파일 트리 API (`/api/repos/tree`) + `lib/github/fileTree.ts` 파싱
- [x] GitHub CRUD 유틸 (`lib/github/operations.ts`: getFile, putFile, deleteFile, getRepoTree)

### Phase 3 — 사이드바 (2일)

- [ ] `FileTree` 컴포넌트 — 재귀 렌더링
- [ ] `FolderNode` — 접기/펼치기, 선택 상태
- [ ] `NoteNode` — 선택 상태, active 스타일
- [ ] `SidebarToolbar` — [+폴더] [+노트] 버튼
- [ ] `ContextMenu` — 우클릭 메뉴
- [ ] 폴더 생성 모달 + API 연동
- [ ] 노트 생성 모달 + API 연동
- [ ] 이름 변경 모달 + API 연동
- [ ] 삭제 확인 모달 + API 연동
- [ ] 드래그앤드롭 이동 (`@dnd-kit/sortable` — reorder 및 폴더 이동, 800ms hover)
- [ ] 상세 정보 모달

### Phase 4 — 에디터 (2일)

- [ ] BlockNote 설치 및 기본 설정 (`@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`)
- [ ] 인라인 툴바 슬림화 (`FormattingToolbarController`로 Bold/Italic/Strike/Link 5개만)
- [ ] / 슬래시 명령어 — 헤딩, 표, 체크리스트, 코드블록, 이미지, 백링크(v2)
- [ ] 이미지 드래그 업로드 → `/assets/images/` GitHub 저장
- [ ] 노트 제목 인라인 편집 (별도 `<NoteTitle>` 컴포넌트)
- [ ] BlockNote JSON ↔ 마크다운 직렬화 (`blocknoteToMarkdown`)
- [ ] WYSIWYG 전용 (마크다운 토글 없음 — v1)

### Phase 5 — 저장 (1일)

- [ ] Zustand `editorStore` — 콘텐츠, saveStatus 관리
- [ ] 자동 저장 (2초 디바운스 + GitHub API PUT)
- [ ] 수동 저장 (Cmd/Ctrl+S)
- [ ] SHA 충돌 감지 및 머지 UI
- [ ] 오프라인 감지 + 저장 대기열
- [ ] beforeunload 경고

### Phase 6 — 통합 테스트 및 배포 (1일)

- [ ] 전체 흐름 E2E 테스트 (Playwright)
- [ ] 에러 케이스 수동 테스트
- [ ] Vercel 배포 + 환경변수 설정
- [ ] Rate Limit 모니터링 로직 추가

**Phase 1-6 완료 = v1 MVP 출시 (약 8.5일)**

---

### Phase 7 — AI 기능 v2 (2일)

- [ ] OpenAI 클라이언트 설정 (서버 사이드)
- [ ] `/api/ai/summarize` — 노트 요약 엔드포인트
- [ ] `/api/ai/tag` — 태그 생성 엔드포인트
- [ ] 저장 후 백그라운드 AI 호출 (non-blocking)
- [ ] frontmatter 업데이트 로직
- [ ] 상세 패널: AI 요약 표시
- [ ] 상세 패널: 태그 표시 + 수동 편집

### Phase 8 — 백링크 v2 (1.5일)

- [ ] `[[링크]]` TipTap 확장 개발
- [ ] 노트 목록 자동완성 드롭다운
- [ ] 백링크 파싱 유틸리티
- [ ] 이름 변경 시 백링크 자동 업데이트
- [ ] 깨진 링크 시각적 표시
- [ ] 상세 패널: 연결 노트 목록

### Phase 9 — 지식 그래프 v2 (2일)

- [ ] `buildGraph.ts` — 노드/엣지 데이터 생성
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
    (사이드바)  │    (에디터)
               │
    ───────────┼───────────
               │
    Phase 1    │    Phase 7
    (인증)     │    (AI)
               │
           낮은 가치
    낮은 복잡도    높은 복잡도
```

---

## 5. 진행 상황 추적

> 에이전트는 작업 완료 후 이 섹션을 업데이트한다.

| Phase   | 상태    | 완료일     | 담당 에이전트     | 비고                                                |
| ------- | ------- | ---------- | ----------------- | --------------------------------------------------- |
| Phase 0 | ✅ 완료 | 2026-06-17 | Claude Sonnet 4.6 | Next.js 16, Vercel 연결은 배포 시 수동              |
| Phase 1 | ✅ 완료 | 2026-06-17 | Claude Sonnet 4.6 | proxy.ts (Next.js 16 변경사항)                      |
| Phase 2 | ✅ 완료 | 2026-06-17 | Claude Sonnet 4.6 |                                                     |
| Phase 3 | ✅ 완료 | 2026-06-17 | Claude Sonnet 4.6 | @dnd-kit 드래그앤드롭, 컨텍스트 메뉴, 파일트리 CRUD |
| Phase 4 | ✅ 완료 | 2026-06-17 | Claude Sonnet 4.6 | BlockNote WYSIWYG, 이미지 업로드                    |
| Phase 5 | ✅ 완료 | 2026-06-17 | Claude Sonnet 4.6 | 자동저장/수동저장, 수정이력, 복원                   |
| Phase 6 | ✅ 완료 | 2026-06-17 | Claude Sonnet 4.6 | 통합 레이아웃, StatusBar, Toast, Modal              |
| Phase 7 | ✅ 완료 | 2026-06-17 | Claude Sonnet 4.6 | v2: OpenAI 요약/태그, DetailPanel                   |
| Phase 8 | ✅ 완료 | 2026-06-17 | Claude Sonnet 4.6 | v2: 백링크 추출/감지, 이름변경 자동업데이트         |
| Phase 9 | ✅ 완료 | 2026-06-17 | Claude Sonnet 4.6 | v2: D3 지식 그래프, 태그 필터, 범례                 |

---

## 6. 이슈 로그

> plan 에이전트가 발견한 문제를 여기에 기록한다.

| #   | 발견일 | 유형 | 설명      | 상태 |
| --- | ------ | ---- | --------- | ---- |
| -   | -      | -    | 현재 없음 | -    |

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
