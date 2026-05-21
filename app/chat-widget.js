'use client';
import { useState, useRef, useEffect } from 'react';

const SAMPLE_QUESTIONS = [
  '이번달 매출 어때?',
  '연간 목표 달성 가능할까?',
  'CS율 높은 브랜드 알려줘',
  'HOT 브랜드 추천해줘',
  '김규민 담당자 실적은?',
  '오인스 셀러 분석해줘',
];

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14,
      border: '2px solid #c7d2fe', borderTopColor: '#4f46e5',
      borderRadius: '50%', animation: 'wkd-spin 0.8s linear infinite',
    }} />
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  async function send(text) {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput('');
    setError(null);
    setHistory(h => [...h, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.details || data.error);
      } else {
        setHistory(h => [...h, { role: 'model', text: data.text }]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`@keyframes wkd-spin { to { transform: rotate(360deg); } }`}</style>

      {/* 플로팅 버튼 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 100,
            padding: '14px 22px',
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: '#fff', border: 'none', borderRadius: 999,
            boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          ✨ AI에게 물어보기
        </button>
      )}

      {/* 채팅 패널 */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          width: 380, maxWidth: 'calc(100vw - 32px)',
          height: 560, maxHeight: 'calc(100vh - 48px)',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* 헤더 */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>✨ 매출 AI 어시스턴트</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>Gemini 2.0 Flash · 무료 (1500회/일)</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)', color: '#fff',
                border: 'none', borderRadius: 8,
                width: 28, height: 28, cursor: 'pointer', fontSize: 16,
              }}
            >×</button>
          </div>

          {/* 메시지 영역 */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: 16,
            background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {history.length === 0 && (
              <div>
                <div style={{
                  padding: '12px 14px', background: '#fff',
                  border: '1px solid #e5e7eb', borderRadius: 12,
                  fontSize: 13, color: '#374151', marginBottom: 12,
                }}>
                  👋 안녕하세요! 대시보드 데이터에 대해 무엇이든 물어보세요.
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>예시 질문:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SAMPLE_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      style={{
                        padding: '8px 12px', fontSize: 12, textAlign: 'left',
                        background: '#fff', color: '#2563eb',
                        border: '1px solid #c7d2fe', borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >💡 {q}</button>
                  ))}
                </div>
              </div>
            )}

            {history.map((h, i) => (
              <div
                key={i}
                style={{
                  alignSelf: h.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  background: h.role === 'user' ? '#2563eb' : '#fff',
                  color: h.role === 'user' ? '#fff' : '#111',
                  border: h.role === 'user' ? 'none' : '1px solid #e5e7eb',
                  borderRadius: 14,
                  fontSize: 13, lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {h.text}
              </div>
            ))}

            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '10px 14px', background: '#fff',
                border: '1px solid #e5e7eb', borderRadius: 14,
                fontSize: 13, color: '#6b7280',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Spinner /> 생각하는 중...
              </div>
            )}

            {error && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '10px 14px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: 14,
                fontSize: 12, color: '#991b1b',
              }}>
                ⚠️ {error}
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* 입력 영역 */}
          <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', background: '#fff' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="질문 입력... (Enter)"
                disabled={loading}
                style={{
                  flex: 1, padding: '10px 12px', fontSize: 13,
                  border: '1px solid #d1d5db', borderRadius: 8,
                  outline: 'none',
                }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  padding: '10px 16px', fontSize: 13, fontWeight: 600,
                  background: input.trim() ? '#2563eb' : '#d1d5db',
                  color: '#fff', border: 'none', borderRadius: 8,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >전송</button>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => { setHistory([]); setError(null); }}
                style={{
                  marginTop: 6, fontSize: 11, color: '#9ca3af',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >대화 초기화</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
