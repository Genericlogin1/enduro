import './globals.css';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';

export const metadata: Metadata = {
  title: 'Enduro World',
  description: 'Global Enduro Community — share rides, plan routes, find tours.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={GeistSans.className + ' bg-base text-ink antialiased min-h-screen'}>
        {children}
      </body>
    </html>
  );
}
