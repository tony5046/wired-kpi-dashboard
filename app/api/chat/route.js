import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// 대시보드 컨텍스트 (모의 데이터 기반, 진짜 데이터로 바꾸려면 lib/cached에서 불러올 것)
const DASHBOARD_CONTEXT = `
[와이어드 매출 대시보드 현재 상태 — 2026-05-20 기준]

## 매출 요약
- 올해 누적 (2026-01-01 ~ 05-19): 6,800백만원 / 목표 20,000백만원 (달성률 34%)
- 이번 분기 Q2 (4-5월): 2,400백만원 / 목표 5,000백만원 (달성률 48%)
- 이번달 (5월): 744백만원
- 전년 동기 대비 -10% (작년 5월 1,679백만원)
- 페이스: 연간 -4%p 뒤처짐, 분기 -7%p 뒤처짐

## 셀러 TOP (올해 누적, 백만원)
1. 오인스 (담당:김규민) 1,480
2. 달빛 (담당:정석호) 980
3. 심플팩토리 (담당:김규민) 590
4. 김영은마켓 (담당:정석호) 410
5. 아임박선생 (담당:강규성) 320

## 브랜드 TOP (올해 누적)
1. 동국제약 720백만원 (3개 셀러, 본사, 담당:정연수) 🔥HOT
2. 오로바일렌 510백만원 (밴더사, 신규)
3. 퓨어레비 490백만원 🔥HOT
4. 드시모네 430백만원
5. 허그베어 320백만원

## 담당자 분포
- 셀러 담당자: 김규민(46.4% · 마켓 124건), 정석호(34.8%), 강규성(12.4%), 최예린(6.1%)
- 상품 담당자: 정연수(40.8%), 김규민(16.7%), 박준호(15.3%), 이호영(10.9%)

## CS율 (반품+취소 / 주문건수, 낮을수록 좋음)
- 전체 평균 3% 정도, 일부 마켓 15%+ 문제 발생
- 색상: <3% 양호 / 3~7% 주의 / 7%+ 위험
`;

const SYSTEM_PROMPT = `당신은 와이어드 매출 대시보드의 AI 어시스턴트예요.
사용자의 질문에 위 대시보드 데이터를 기반으로 답변해주세요.

답변 규칙:
- 한국어, 친근하고 간결한 톤
- 구체적인 숫자 인용 (백만원 단위)
- 5문장 이내로 답변
- 모르는 건 솔직히 "데이터에 없어요"라고 답
- 이모지 1-2개 자연스럽게 사용

${DASHBOARD_CONTEXT}
`;

export async function POST(request) {
  const { message, history = [] } = await request.json().catch(() => ({}));
  if (!message?.trim()) {
    return NextResponse.json({ error: '메시지가 비어있어요' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: 'GEMINI_API_KEY가 설정되어 있지 않아요. Vercel 환경변수 확인 필요.',
    }, { status: 500 });
  }

  // Gemini는 system role이 따로 있고, system_instruction으로 전달
  const contents = [];
  for (const h of (history || [])) {
    contents.push({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({
        error: 'Gemini API 호출 실패',
        details: data?.error?.message || JSON.stringify(data).slice(0, 300),
      }, { status: 500 });
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: '응답이 비어있어요', raw: data }, { status: 500 });
    }
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
