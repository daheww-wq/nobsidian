# AGENT.md — dohohon 에이전트 역할 정의

> CLAUDE.md 섹션 7의 "에이전트 작업 규칙"을 보완하는 역할별 상세 정의.
> 에이전트는 반드시 PLANNING.md → 기능명세서.md → CLAUDE.md → 이 파일 순으로 참조한다.

---

## 에이전트 팀 구성

```
오케스트레이터 (Claude Code 메인 세션)
      │
      ├── Plan 에이전트    → 작업 분해 + PLANNING.md 업데이트
      ├── Work 에이전트    → 코드 구현 (ADR 준수)
      └── QA 에이전트     → 리뷰 + 타입 검사 + 이슈 로그
```

---

## Plan 에이전트

**목적**: 요구사항을 구체적인 구현 작업으로 분해하고 PLANNING.md를 최신 상태로 유지한다.

**입력**

- 사용자 요구사항 텍스트
- 현재 `PLANNING.md` (Phase별 진행 상황)
- `docs/기능명세서.md` (예외/보안 케이스)

**수행 작업**

1. `PLANNING.md`의 현재 Phase 및 미완료 항목 파악
2. 요구사항을 5개 이내의 구체적인 파일 단위 작업으로 분해
3. 각 작업에 담당 파일 경로, 구현 요점, ADR 체크 포인트 명시
4. 완료 기준(Definition of Done) 명시
5. 작업 시작 전 `PLANNING.md` 진행 상황 섹션 업데이트

**출력 형식**

```markdown
## 작업 계획 — {날짜}

### 작업 1: {파일명} — {한 줄 설명}

- 파일: `{경로}`
- 구현: {구체적인 변경 내용}
- ADR: ADR-{번호} ({내용})
- 완료 기준: {검증 방법}

### 작업 2: ...
```

**금지 사항**

- PLANNING.md의 완료 표시 없이 다음 Phase로 진행 금지
- ADR 체크 없이 구현 계획 수립 금지

---

## Work 에이전트

**목적**: Plan 에이전트의 작업 계획을 실제 코드로 구현한다.

**입력**

- Plan 에이전트의 작업 계획
- `CLAUDE.md` (ADR 전체 목록)
- `docs/기능명세서.md` (해당 기능의 예외/실패/보안 명세)

**수행 작업**

1. 작업 계획의 파일을 순서대로 구현
2. 구현 전 관련 기존 코드 반드시 `Read` 툴로 확인
3. TypeScript strict 모드 준수 (`any` 타입 금지)
4. 각 파일 구현 후 QA 에이전트에게 리뷰 요청

**필수 ADR 체크리스트** (구현 전 확인)

- [ ] **ADR-22**: 클라이언트 코드에 `accessToken` 없는가?
- [ ] **ADR-23**: `lucide-react`만 사용, 이모지/텍스트 기호 없는가?
- [ ] **ADR-25**: `triggerSave`에서 `savedPath = activePath` 캡처 있는가?
- [ ] **ADR-26**: `parseFrontmatter` 호출 시 `path` 인자 전달하는가?
- [ ] **ADR-27**: 레포 전환 로직에 `resetTree/clearEditor/clearIndex/clearAll` 있는가?

**코딩 원칙**

```typescript
// ✅ 올바른 패턴
import { File, Folder, Plus } from 'lucide-react';
const user = useAuthStore((s) => s.user); // 토큰 없음

// ❌ 금지 패턴
const token = useAuthStore((s) => s.accessToken); // ADR-22 위반
<span>📁</span>  // ADR-23 위반 — lucide-react 사용
```

**GitHub API 호출 원칙**

- 직접 호출 금지 → 반드시 `lib/github/operations.ts` 경유
- 에러 핸들링 필수: 401(재인증), 409(SHA 충돌), 404(파일 없음) 처리
- 자동저장은 `lib/editor/saveQueue.ts` 배치 큐 경유 (ADR-20)

---

## QA 에이전트

**목적**: Work 에이전트의 구현물을 검토하고 PLANNING.md 이슈 로그를 업데이트한다.

**입력**

- Work 에이전트가 수정한 파일 목록
- `CLAUDE.md` (ADR 전체)
- `PLANNING.md` (이슈 로그 섹션)

**수행 작업**

1. TypeScript 오류 확인 (Bash: `npx tsc --noEmit`)
2. ADR 위반 검사 (아래 체크리스트)
3. 보안 취약점 검사 (ADR-22: 토큰 노출 여부)
4. PLANNING.md 해당 Phase 체크박스 업데이트
5. 새 이슈 발견 시 PLANNING.md 이슈 로그에 추가

**ADR 위반 자동 검사**

```bash
# ADR-22: 클라이언트에 accessToken 없는지
grep -r "accessToken" components/ store/ app/ --include="*.tsx,*.ts"

# ADR-23: 이모지 아이콘 없는지 (lucide만 허용)
grep -r "lucide-react" components/ --include="*.tsx" | wc -l

# ADR-25: SHA 가드 패턴 확인
grep -r "savedPath" lib/editor/ --include="*.ts"
```

**PLANNING.md 업데이트 규칙**

- 작업 완료: `- [ ]` → `- [x]`
- Phase 전체 완료: 진행 상황 테이블 `상태` 업데이트 + `완료일` 기입
- 새 이슈: 이슈 로그에 `| I-{n} | {날짜} | {유형} | {설명} | 🔍 발견 |` 형식으로 추가

**합격 기준**

- `npx tsc --noEmit` 에러 0개
- ADR 위반 없음
- 보안 취약점 없음 (특히 ADR-22)

---

## 에이전트 간 통신 프로토콜

```
1. 오케스트레이터 → Plan 에이전트
   입력: "Phase {n}의 {기능명}을 구현해줘"

2. Plan 에이전트 → Work 에이전트
   입력: 구조화된 작업 계획 (파일 경로 + ADR 체크포인트 포함)

3. Work 에이전트 → QA 에이전트
   입력: "다음 파일들을 리뷰해줘: {파일 목록}"

4. QA 에이전트 → 오케스트레이터
   출력: "통과" 또는 "수정 필요: {항목 목록}"
```

---

## 사용 예시

### Claude Code 내에서 sub-agent 호출

```
# 오케스트레이터 (이 세션)에서:
"Phase 1 GitHub OAuth 인증을 구현해줘.
Plan 에이전트로서 먼저 PLANNING.md를 읽고 작업을 분해하고,
Work 에이전트로서 코드를 구현하고,
QA 에이전트로서 검토 후 PLANNING.md를 업데이트해."
```

### 자동화 스크립트 (`scripts/run-agents.ts`)

```bash
npx ts-node scripts/run-agents.ts "Phase 1 인증 구현"
```

---

## 버전 이력

| 날짜       | 버전 | 변경 내용                          |
| ---------- | ---- | ---------------------------------- |
| 2026-06-19 | 0.1  | 최초 작성 (Plan/Work/QA 역할 정의) |
