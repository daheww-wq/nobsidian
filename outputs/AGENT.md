# AGENT.md — dohohon 에이전트 시스템

> 이 파일은 dohohon의 자율 운영을 위한 에이전트 정의서다.  
> 최소한의 사용자 개입으로 plan → design → work 순환이 자동으로 진행된다.

---

## 0. 시스템 개요

```
┌──────────────────────────────────────────────────────────┐
│                   사용자 (최소 개입)                       │
│         [컨펌 / 거부 / 방향 수정]만 담당                   │
└────────────────────┬─────────────────────────────────────┘
                     │ 컨펌
                     ▼
┌─────────┐    ┌──────────┐    ┌──────────┐
│  PLAN   │───▶│  DESIGN  │───▶│   WORK   │
│ 에이전트 │    │  에이전트 │    │  에이전트 │
└────┬────┘    └──────────┘    └────┬─────┘
     │                              │
     │◀─────── 이슈/개선점 보고 ─────┘
     │
     ▼
  이슈 로그 (PLANNING.md)
  → 사용자 컨펌 → 다음 순환
```

### 순환 흐름

1. **PLAN** 에이전트가 웹 탐색 + 코드 분석으로 이슈/개선점 발견
2. 발견 내용을 `previous:` 블록으로 사용자에게 보고
3. **사용자 컨펌** → 승인 시 PLAN이 DESIGN에 작업 지시
4. **DESIGN** 에이전트가 UI/UX 개선안 또는 설계 문서 업데이트
5. **WORK** 에이전트가 실제 코드 구현
6. WORK가 PLAN에 완료 보고 → 다음 순환 시작

---

## 1. PLAN 에이전트

### 역할

- 현재 구현 상태를 분석하고 **다음에 해야 할 일**을 결정한다
- 웹 탐색(하네스 엔지니어링)으로 최신 기술 트렌드 및 유사 앱 사례 조사
- 오류/이슈를 탐지하고 사용자에게 우선순위와 함께 보고
- PLANNING.md의 이슈 로그를 관리한다

### 하네스 엔지니어링 기반 탐색 방법

```
1. 현재 상태 파악: PLANNING.md 진행 상황 확인
2. 웹 탐색:
   a. GitHub API 변경사항 확인 (docs.github.com)
   b. 유사 앱 사례 탐색 (Obsidian, Notion, Logseq 업데이트)
   c. 사용 중인 라이브러리 릴리즈 노트 확인
   d. 보안 취약점 CVE 확인 (의존성 라이브러리)
3. 코드베이스 분석: 완료된 Phase의 구현 품질 점검
4. 이슈 분류: Critical / High / Medium / Low
5. previous 블록으로 사용자에게 보고
```

### 보고 형식 (previous 블록)

```markdown
## PLAN 에이전트 보고 — {날짜}

### Previous (탐색 결과)

| #    | 유형 | 발견 내용                              | 영향      | 우선순위 |
| ---- | ---- | -------------------------------------- | --------- | -------- |
| P-01 | 버그 | SHA 충돌 시 기존 데이터 유실 가능      | 저장 실패 | Critical |
| P-02 | 개선 | TipTap v2.5 출시, 테이블 확장 개선     | 에디터 UX | High     |
| P-03 | 보안 | Octokit 취약점 CVE-2026-XXXX           | API 요청  | High     |
| P-04 | 기능 | GitHub App으로 전환 시 rate limit 10배 | 성능      | Medium   |

### 권장 액션

1. P-01, P-03: 즉시 수정 (WORK 에이전트 투입)
2. P-02: 다음 Phase에서 업그레이드
3. P-04: v3 로드맵에 추가

### 현재 Phase 상태

- 완료: Phase 1, 2
- 진행 중: Phase 3 (사이드바) — 60% 완료
- 다음: Phase 4 (에디터)

---

**사용자 컨펌 필요**: [승인] 또는 [수정] 후 답변 주세요.
```

### 실행 지침

1. `CLAUDE.md` 먼저 읽고 미결 사항(OQ-\*) 확인
2. `PLANNING.md`에서 현재 Phase와 완료 여부 확인
3. 웹 탐색으로 최신 이슈 수집 (최소 3개 소스)
4. 발견 내용을 PLANNING.md 이슈 로그에 추가
5. 사용자에게 previous 블록 보고 후 대기
6. 컨펌 받으면 DESIGN/WORK에 지시 전달

### 탐색 대상 URL

- `https://docs.github.com/en/rest` — GitHub API 변경사항
- `https://www.blocknotejs.org/docs` — BlockNote 업데이트 및 API 변경
- `https://github.com/advisories` — 보안 취약점
- `https://github.com/obsidianmd/obsidian-releases` — Obsidian 참조
- `https://openai.com/blog` — OpenAI API 변경사항 (v2)

---

## 2. DESIGN 에이전트

### 역할

- PLAN 에이전트의 지시를 받아 UI/UX 개선안을 설계한다
- `IA.md`, `wireframe.html`, `기능명세서.md` 업데이트
- 새 화면이나 컴포넌트가 필요할 때 와이어프레임 추가
- WORK 에이전트를 위한 구현 가능한 설계 스펙 작성

### 실행 지침

1. PLAN 에이전트의 보고에서 UI/설계 관련 항목 추출
2. 기존 IA.md, wireframe.html 검토
3. 변경이 필요한 화면/컴포넌트 파악
4. 마크다운 스펙 또는 wireframe.html 업데이트
5. "설계 완료" 보고를 PLAN에 전달 (WORK 투입 요청)

### 설계 스펙 형식

````markdown
## DESIGN 스펙 — {기능명}

### 변경 요약

- 변경 이유: {PLAN 에이전트 보고 번호}
- 영향 컴포넌트: FileTree.tsx, ContextMenu.tsx

### UI 변경사항

- [이전] 컨텍스트 메뉴 아이템 5개
- [이후] 아이템 6개 + 단축키 표시

### 컴포넌트 인터페이스

```typescript
interface ContextMenuProps {
  targetPath: string;
  targetType: 'file' | 'dir';
  onRename: (path: string) => void;
  onDelete: (path: string) => void;
  onMove: (path: string) => void; // NEW
}
```
````

### 와이어프레임 참조

wireframe.html 탭 ④ 업데이트 완료

```

### 설계 원칙
- 기존 컴포넌트 변경 최소화 (Breaking Change 방지)
- TypeScript 인터페이스 먼저 정의 후 구현
- 새 기능은 기능명세서.md에 케이스 추가 후 설계

---

## 3. WORK 에이전트

### 역할
- DESIGN 에이전트의 스펙을 받아 실제 코드를 구현한다
- PLANNING.md의 Phase 체크리스트를 항목별로 완료 처리
- 구현 중 발견한 버그/이슈를 PLAN에 보고

### 실행 지침
1. DESIGN 스펙 문서 확인
2. PLANNING.md에서 해당 Phase 항목 확인
3. CLAUDE.md의 코딩 원칙 준수
4. 구현 완료 후 자체 검증:
   - TypeScript 컴파일 에러 없음
   - 기능명세서의 예외 케이스 처리 여부 확인
   - 보안 요구사항 체크리스트 확인
5. PLANNING.md Phase 체크리스트 업데이트
6. 발견된 새 이슈 PLANNING.md 이슈 로그에 추가
7. PLAN 에이전트에 완료 보고

### 자체 검증 체크리스트
```

구현 완료 전 확인:
□ TypeScript strict 모드 에러 없음
□ 해당 기능의 기능명세서 예외 케이스 모두 처리
□ 에러 상태 UI 구현 (로딩, 에러, 빈 상태)
□ 환경변수 클라이언트 노출 없음
□ GitHub API 요청마다 에러 핸들링 포함
□ Optimistic UI 사용 시 롤백 로직 구현

```

### 금지 사항
- `any` 타입 사용 (TypeScript strict 위반)
- 클라이언트에서 GitHub token 또는 OpenAI API 키 직접 사용
- 기능명세서에 없는 보안 우회 로직
- PLANNING.md 무단 Phase 순서 변경

---

## 4. 에이전트 간 통신 프로토콜

### 지시 메시지 형식
```

TO: {DESIGN | WORK | PLAN}
FROM: {발신 에이전트}
TASK: {작업 ID, e.g. P-01}
ACTION: {구체적 지시 내용}
REFS: {참조 파일 목록}
DEADLINE: {예상 완료 시간}

```

### 완료 보고 형식
```

TO: PLAN
FROM: WORK
TASK: P-01
STATUS: COMPLETED | FAILED | BLOCKED
SUMMARY: {완료 내용 또는 블로커}
ISSUES_FOUND: [{새로 발견한 이슈}]
FILES_CHANGED: [{수정된 파일 목록}]

```

---

## 5. 순환 주기

| 순환 | 트리거 | 예상 소요 |
|------|--------|----------|
| 일반 순환 | Phase 완료 후 | 1-2일 |
| 긴급 순환 | Critical 이슈 발견 | 즉시 |
| 주간 점검 | 매주 월요일 | 30분 |

### 순환 조건
- **계속**: 이슈 발견 또는 다음 Phase 작업 필요
- **일시 중단**: 사용자 컨펌 대기
- **종료**: 모든 Phase 완료 + 이슈 없음

---

## 6. 에이전트 제약 조건

모든 에이전트는 다음을 준수한다:

1. **CLAUDE.md 우선**: 모든 결정은 CLAUDE.md의 기술 결정(ADR)을 따른다
2. **단방향 지시**: WORK → DESIGN, DESIGN → PLAN으로 역방향 지시 불가
3. **미결 사항 존중**: OQ-* 항목은 사용자 결정 전까지 임의 구현 금지
4. **문서 동기화**: 코드 변경 시 관련 MD 파일 동시 업데이트
5. **이슈 투명성**: 발견한 모든 이슈는 은폐 없이 PLANNING.md에 기록

---

## 7. 최초 순환 시작 방법

사용자가 "시작" 또는 "다음 단계 진행해줘"라고 하면:

```

1. PLAN 에이전트 활성화
2. CLAUDE.md + PLANNING.md 읽기
3. Phase 0 (프로젝트 셋업) 착수 여부 확인
4. previous 블록으로 첫 보고 작성
5. 사용자 컨펌 대기

```

```
