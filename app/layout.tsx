import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enduro World',
  description: 'Global Enduro Community — share rides, plan routes, find tours.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
      </head>
      <body className="bg-base text-ink min-h-screen">
        {children}
      </body>
    </html>
  );
}
