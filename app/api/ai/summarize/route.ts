import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 });

  const { content } = (await request.json()) as { content: string };
  if (!content?.trim()) return NextResponse.json({ error: 'Empty content' }, { status: 400 });

  // Truncate to ~8000 tokens (roughly 32000 chars)
  const truncated =
    content.length > 16000 ? content.slice(0, 8000) + '\n...\n' + content.slice(-8000) : content;

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            '다음 노트의 핵심 내용을 2-3문장으로 요약하세요. 불필요한 서두 없이 바로 요약 내용만 작성하세요. 언어는 노트와 동일한 언어를 사용하세요.',
        },
        { role: 'user', content: truncated },
      ],
    });
    const summary = completion.choices[0]?.message.content?.trim() ?? '';
    return NextResponse.json({ summary });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 429) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
    console.error('Summarize failed:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
