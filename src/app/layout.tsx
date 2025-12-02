// src/app/layout.tsx
// Next.jsのルートレイアウトファイルです。ヘッダーを含みます。

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '日本の人口集中地区グラフ | Yumemi Code Check',
  description: '国土交通データプラットフォームのデータに基づく都道府県ごとの人口集中地区（DID）の人口推移グラフアプリケーション',
};

// ヘッダーコンポーネント
const Header: React.FC = () => (
  <header style={{
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    padding: '16px 24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  }}>
    <h1 style={{
      fontSize: '1.5rem',
      fontWeight: 700,
    }}>日本の人口集中地区グラフ</h1>
  </header>
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
