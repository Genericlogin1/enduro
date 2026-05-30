import './globals.css';
import type { Metadata } from 'next';
import SwRegister from '@/components/SwRegister';

export const metadata: Metadata = {
  title: 'Enduro World',
  description: 'Global Enduro Community — share rides, plan routes, find tours.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Enduro',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.getItem('theme') === 'light') {
                document.documentElement.classList.add('light');
              }
            } catch(e){}
          `
        }} />
        <meta name="theme-color" content="#0f1110" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-base text-ink min-h-screen">
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
