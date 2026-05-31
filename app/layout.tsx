import './globals.css';
import type { Metadata } from 'next';
import SwRegister from '@/components/SwRegister';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Enduro World — мотоэндуро сообщество',
  description: 'Маршруты для эндуро, GPS-треки, групповые покатушки и туры. Находи маршруты, записывай треки, общайся с райдерами.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Enduro',
  },
  openGraph: {
    title: 'Enduro World — мотоэндуро сообщество',
    description: 'Маршруты для эндуро, GPS-треки, групповые покатушки и туры.',
    url: 'https://enduro-world.vercel.app',
    siteName: 'Enduro World',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Enduro World',
    description: 'Маршруты для эндуро, GPS-треки, групповые покатушки и туры.',
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
        <Nav />
      </body>
    </html>
  );
}
