import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 });

  const { content, existingTags } = (await request.json()) as {
    content: string;
    existingTags: string[];
  };

  if (!content?.trim()) return NextResponse.json({ tags: existingTags });

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `다음 노트에서 핵심 키워드 태그를 최대 5개 추출하세요.
규칙:
- 소문자 영문 또는 한글만 사용
- 공백은 하이픈(-)으로 대체
- JSON 배열 형식으로만 응답 (예: ["태그1","태그2"])
- 다른 텍스트 없이 JSON 배열만 출력`,
        },
        { role: 'user', content: content.slice(0, 8000) },
      ],
    });

    const raw = completion.choices[0]?.message.content?.trim() ?? '[]';
    let aiTags: string[] = [];
    try {
      aiTags = JSON.parse(raw) as string[];
    } catch {
      // GPT returned invalid JSON — skip
    }

    // Merge: existing manual tags take priority, AI tags fill up to 10
    const merged = [...new Set([...existingTags, ...aiTags])].slice(0, 10);
    return NextResponse.json({ tags: merged });
  } catch (err) {
    console.error('Tag failed:', err);
    return NextResponse.json({ tags: existingTags });
  }
}
