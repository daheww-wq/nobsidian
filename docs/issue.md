# Issue Tracker — dohohon

> 최종 업데이트: 2026-06-19
> 상태 기준: **브라우저에서 직접 확인한 것만 ✅ 완료** 처리

---

## 범례

| 상태           | 의미                             |
| -------------- | -------------------------------- |
| ✅ 완료        | 브라우저에서 동작 확인됨         |
| 🔧 코드 수정됨 | 로컬 파일 수정 완료, 아직 미확인 |
| ❌ 미수정      | 아직 코드 손대지 않음            |
| 🔄 진행 중     | 작업 중                          |

---

## 버그 (Bug)

| #    | 제목                                          | 현상                                                                      | 수정 파일                                                                                            | 상태           |
| ---- | --------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------- |
| B-01 | 폴더 DnD 중복 생성                            | 드래그앤드롭 시 폴더가 두 개로 복사됨                                     | `components/sidebar/FileTree.tsx`                                                                    | ✅ 완료        |
| B-02 | 자동저장 409 반복 (double-save)               | `handleBodyChange`가 `push`+`triggerSave` 이중 호출로 동일 SHA로 동시 PUT | `components/editor/Editor.tsx`                                                                       | 🔧 코드 수정됨 |
| B-03 | 레포 전환 후 같은 경로 노트 저장 시 409       | 인플라이트 save가 전환 후 완료되며 새 노트의 `activeSha`를 오염시킴       | `components/editor/Editor.tsx` (savedPath 캡처 가드)                                                 | 🔧 코드 수정됨 |
| B-04 | 레포 전환 후 이전 레포 트리가 사이드바에 잔류 | `resetTree()` 미호출                                                      | `app/(app)/workspace/layout.tsx`, `store/fileTreeStore.ts`                                           | 🔧 코드 수정됨 |
| B-05 | 기존 노트 제목이 "Untitled"로 표시            | frontmatter `title` 없을 때 H1·파일명 폴백 로직 없음                      | `lib/markdown/frontmatter.ts`                                                                        | 🔧 코드 수정됨 |
| B-06 | 일부 노트 클릭해도 반응 없음                  | GitHub API 실패 시 에러 처리 없이 무한 로딩                               | `app/(app)/workspace/[noteId]/page.tsx`, `store/fileTreeStore.ts`, `components/sidebar/NoteNode.tsx` | 🔧 코드 수정됨 |

---

## UI/UX

| #    | 제목                                  | 현상/요구사항                     | 수정 파일                                                               | 상태           |
| ---- | ------------------------------------- | --------------------------------- | ----------------------------------------------------------------------- | -------------- |
| U-01 | DetailPanel 닫기 버튼                 | X 버튼 없음                       | `components/detail/DetailPanel.tsx`                                     | ✅ 완료        |
| U-02 | DetailPanel 드래그 리사이즈           | 너비 고정                         | `components/detail/DetailPanel.tsx`                                     | ✅ 완료        |
| U-03 | GraphPanel 드래그 리사이즈            | 너비 고정                         | `components/graph/GraphPanel.tsx`                                       | ✅ 완료        |
| U-04 | HistoryPanel 최신 버전 복원 버튼 숨김 | 최신 버전에서도 복원 버튼 노출    | `components/editor/HistoryPanel.tsx`                                    | ✅ 완료        |
| U-05 | 현재 노트 경로 사이드바 상단 표시     | StatusBar에 중복 표시             | `components/layout/Sidebar.tsx`, `components/layout/StatusBar.tsx`      | ✅ 완료        |
| U-06 | 에디터 폰트 크기 조절 (A-/A+)         | 기본 12px, 10~20px 범위           | `components/editor/EditorToolbar.tsx`, `lib/hooks/useEditorFontSize.ts` | ✅ 완료        |
| U-07 | NoteTitle 크기 본문과 동일하게        | 제목이 너무 크게 표시됨           | `components/editor/NoteTitle.tsx`                                       | ✅ 완료        |
| U-08 | 전체 이모지 → Lucide SVG 아이콘 교체  | 이모지 아이콘 사용 중             | 사이드바·헤더·모달·토스트 전체                                          | ✅ 완료        |
| U-09 | 사이드바 폰트 크기 축소 (text-xs)     | text-sm 너무 큼                   | `components/sidebar/NoteNode.tsx` 등                                    | ✅ 완료        |
| U-10 | 코드블록 스타일 (GitHub 라이트)       | 어두운 배경으로 표시됨            | `app/globals.css`                                                       | 🔧 코드 수정됨 |
| U-11 | 인라인 코드 테두리 제거               | 각 인라인 코드마다 테두리 표시    | `app/globals.css`                                                       | 🔧 코드 수정됨 |
| U-12 | 폴더 시각적 구분 (배경색 + 볼드)      | 폴더·파일 구분 어려움, 볼드 안 됨 | `components/sidebar/FolderNode.tsx`                                     | 🔧 코드 수정됨 |
| U-13 | StatusBar 레포명 이모지 제거          | 레포명 앞에 이모지 표시           | `components/layout/StatusBar.tsx`                                       | ✅ 완료        |

---

## 왜 🔧 항목들이 브라우저에서 안 보이나?

> **결론: 로컬 변경사항이 커밋·배포되지 않았기 때문**

| 상황                  | 상세                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Vercel 배포 기준 커밋 | `a4d60b6` (폴더 배경색 구분 + 코드블록 GitHub 스타일)                                                                            |
| 현재 로컬 변경        | 10개 파일 수정됨, 아직 `git add` 조차 안 함                                                                                      |
| 코드블록 테두리 원인  | 커밋 `a4d60b6`의 globals.css에 `border: 1px solid #e1e4e8 !important` 가 **의도적으로** 추가됨 → 이번 세션에서 제거했으나 미커밋 |
| 폴더 볼드 미적용 원인 | 커밋된 FolderNode.tsx는 `font-medium`이고, 로컬에서 `font-bold`로 바꿨으나 미커밋                                                |

**내일 할 일 순서:**

1. `git add` + `git commit` + `git push`
2. Vercel 자동 배포 대기 (보통 1~2분)
3. 브라우저에서 아래 체크리스트 확인

---

## 미확인 이슈 (브라우저 검증 필요)

### 확인 체크리스트

- [ ] **B-02** 자동저장 409: 빠르게 타이핑 → 30초 대기 → 409 에러 토스트 뜨지 않는지
- [ ] **B-03** 레포 전환 409: 레포A 편집 중 → 레포B 전환 → 동일 경로 노트 열고 저장 → 409 없는지
- [ ] **B-04** 레포 전환 트리: 레포A → 레포B 전환 시 사이드바가 B 트리만 보이는지
- [ ] **B-05** 제목 폴백: frontmatter 없는 기존 마크다운 열었을 때 H1 또는 파일명으로 제목 표시되는지
- [ ] **B-06** 실패 노트 취소선: 존재하지 않는 노트 클릭 → 취소선 + 클릭 불가가 되는지
- [ ] **U-10/U-11** 코드블록 테두리: 코드블록 삽입 시 라인마다 테두리 없는지
- [ ] **U-12** 폴더 볼드: 사이드바 폴더명이 굵게 보이는지

---

## 수정된 파일 전체 목록 (🔧 미확인 항목)

```
app/(app)/workspace/[noteId]/page.tsx  — B-06: markFailed 호출
app/(app)/workspace/layout.tsx         — B-04: resetTree() 무조건 호출
app/globals.css                        — U-10/U-11: 코드블록 border 제거, GitHub 스타일
components/editor/Editor.tsx           — B-02/B-03: isSavingRef 락, savedPath 가드
components/sidebar/FolderNode.tsx      — U-12: font-bold 정적 class 적용
components/sidebar/NoteNode.tsx        — B-06: failedPaths 취소선 UI
lib/markdown/frontmatter.ts            — B-05: H1·파일명 폴백
store/fileTreeStore.ts                 — B-04/B-06: resetTree, markFailed, failedPaths
docs/기능명세서.md                      — 예외 케이스 추가 (v0.5)
CLAUDE.md                              — ADR 23-27 추가 (v0.6)
```

---

## 다음 작업 순서 (내일)

1. `git add -p` 로 변경 파일 스테이징 검토
2. `git commit -m "fix: 0619 버그 수정 일괄"`
3. `git push` → Vercel 자동 배포 대기
4. 브라우저에서 위 체크리스트 순서대로 확인
5. 안 되는 항목 → DevTools로 실제 DOM/CSS 확인 후 재수정
