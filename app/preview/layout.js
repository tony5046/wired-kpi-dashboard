'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

const TABS = [
  { href: '/preview',         label: '📊 매출 현황',  description: '연간/분기 목표, 파트너 셀러, 마켓 현황' },
  { href: '/preview/brands',  label: '🏷️ 브랜드 관리', description: '브랜드별 매출, 담당자, 거래형태, 마켓 히스토리' },
  { href: '/preview/sellers', label: '🤝 셀러 관리',  description: '셀러별 매출, 파트너 셀러 상세, 노션 연동' },
];

function LoginScreen() {
  return (
    <main style={{ padding: 40, maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h1 style={{ fontSize: 24, margin: 0, marginBottom: 8 }}>로그인이 필요해요</h1>
      <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px' }}>
        @wired.company 구글 계정으로 로그인하면<br />
        실시간 매출 대시보드를 볼 수 있어요
      </p>
      <button
        onClick={() => signIn('google')}
        style={{
          padding: '14px 28px', fontSize: 15, fontWeight: 600,
          background: '#4285F4', color: '#fff',
          border: 'none', borderRadius: 10, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(66,133,244,0.3)',
        }}
      >🔑 Google 계정으로 로그인</button>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 24 }}>
        와이어드 직원 전용 (@wired.company 도메인만 허용)
      </div>
    </main>
  );
}

export default function PreviewLayout({ children }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <main style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>세션 확인 중...</main>;
  }
  if (!session) return <LoginScreen />;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh' }}>
      {/* 탭 네비게이션 */}
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #cbd5e1',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 24px',
          display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map(t => {
              // 정확한 경로 매칭 + 하위 경로 포함
              const active = t.href === '/preview'
                ? pathname === '/preview'
                : pathname?.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  title={t.description}
                  style={{
                    padding: '16px 20px',
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    color: active ? '#2563eb' : '#6b7280',
                    borderBottom: active ? '3px solid #2563eb' : '3px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                >{t.label}</Link>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            {session?.user?.email}
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
