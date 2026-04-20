'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <main style={{ padding: 40 }}>로딩 중...</main>;
  }

  if (!session) {
    return (
      <main
        style={{
          padding: 40,
          maxWidth: 480,
          margin: '80px auto',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>와이어드 KPI 대시보드</h1>
        <p style={{ color: '#666', marginBottom: 32, lineHeight: 1.5 }}>
          와이어드 직원 전용 매출 현황판입니다.
          <br />
          Google 계정으로 로그인해주세요.
        </p>
        <button
          onClick={() => signIn('google')}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            background: '#4285F4',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Google 계정으로 로그인
        </button>
        <p style={{ color: '#999', fontSize: 13, marginTop: 24 }}>
          @wired.company 이메일만 접근 가능
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, maxWidth: 960, margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          borderBottom: '1px solid #eee',
          paddingBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>🏠 와이어드 KPI 대시보드</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#666', fontSize: 14 }}>
            {session.user.name} ({session.user.email})
          </span>
          <button
            onClick={() => signOut()}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <section
        style={{
          padding: 32,
          background: '#f9fafb',
          borderRadius: 12,
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 18, color: '#333', marginBottom: 8 }}>
          ✅ 로그인 성공!
        </p>
        <p style={{ color: '#999', fontSize: 14 }}>
          다음 단계: 매출 데이터 연동 🚧
        </p>
      </section>
    </main>
  );
}
