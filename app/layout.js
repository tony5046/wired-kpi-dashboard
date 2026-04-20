import Providers from './providers';

export const metadata = {
  title: '와이어드 KPI 대시보드',
  description: '와이어드 전사 매출 현황',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
