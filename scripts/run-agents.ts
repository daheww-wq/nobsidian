/**
 * dohohon 에이전트 오케스트레이터
 *
 * 사용법:
 *   npx ts-node scripts/run-agents.ts "Phase 1 인증 구현"
 *   npx ts-node scripts/run-agents.ts --phase 1
 *   npx ts-node scripts/run-agents.ts --qa-only  (QA 검토만 실행)
 *
 * 환경변수:
 *   ANTHROPIC_API_KEY — Anthropic API 키 필수
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const client = new Anthropic();
const ROOT = process.cwd();

// ─────────────────────────────────────────────
// 에이전트 시스템 프롬프트 로더
// ─────────────────────────────────────────────

function loadAgentPrompt(role: 'plan' | 'work' | 'qa'): string {
  const path = join(ROOT, `.claude/agents/${role}.md`);
  if (!existsSync(path)) {
    throw new Error(`에이전트 지시 파일 없음: ${path}`);
  }
  return readFileSync(path, 'utf-8');
}

function loadContext(): string {
  const files = ['PLANNING.md', 'CLAUDE.md', 'docs/기능명세서.md'];
  return files
    .filter((f) => existsSync(join(ROOT, f)))
    .map((f) => `## ${f}\n\n${readFileSync(join(ROOT, f), 'utf-8')}`)
    .join('\n\n---\n\n');
}

// ─────────────────────────────────────────────
// 단일 에이전트 실행
// ─────────────────────────────────────────────

async function runAgent(
  role: 'plan' | 'work' | 'qa',
  userPrompt: string,
  verbose = true
): Promise<string> {
  const systemPrompt = loadAgentPrompt(role);
  const context = loadContext();

  const label = `[${role.toUpperCase()}]`;
  if (verbose) console.log(`\n${label} 시작...`);

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `${context}\n\n---\n\n## 요청\n\n${userPrompt}`,
      },
    ],
  });

  const textContent = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n');

  if (verbose) {
    console.log(`${label} 완료 (stop_reason: ${response.stop_reason})`);
    console.log(textContent);
  }

  return textContent;
}

// ─────────────────────────────────────────────
// 전체 파이프라인 실행
// ─────────────────────────────────────────────

async function runPipeline(task: string): Promise<void> {
  console.log(`\n🚀 에이전트 파이프라인 시작: "${task}"\n${'─'.repeat(60)}`);

  // 1. Plan 에이전트: 작업 분해
  const planResult = await runAgent(
    'plan',
    `다음 작업을 구체적인 구현 계획으로 분해해줘:\n\n${task}`
  );

  // 2. Work 에이전트: 코드 구현
  const workResult = await runAgent(
    'work',
    `다음 계획을 구현해줘. 각 파일을 실제로 작성하거나 수정해.\n\n${planResult}`
  );

  // 3. QA 에이전트: 검토 및 PLANNING.md 업데이트
  await runAgent('qa', `다음 구현 결과를 검토하고 PLANNING.md를 업데이트해줘:\n\n${workResult}`);

  console.log(`\n${'─'.repeat(60)}\n✅ 파이프라인 완료`);
}

// ─────────────────────────────────────────────
// CLI 진입점
// ─────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('사용법: npx ts-node scripts/run-agents.ts "<작업 설명>"');
    process.exit(1);
  }

  // --qa-only 플래그
  if (args[0] === '--qa-only') {
    await runAgent('qa', '최근 변경된 파일들을 검토하고 PLANNING.md를 업데이트해줘.');
    return;
  }

  // --phase <n> 플래그
  if (args[0] === '--phase' && args[1]) {
    const phase = parseInt(args[1], 10);
    await runPipeline(`PLANNING.md의 Phase ${phase}를 구현해줘.`);
    return;
  }

  // 자유 형식 작업
  await runPipeline(args.join(' '));
}

main().catch((err) => {
  console.error('에러:', err.message);
  process.exit(1);
});
