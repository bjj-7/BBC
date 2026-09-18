import type { Metadata, Viewport } from 'next';
import '../src/index.css'; // Global CSS
import ClientLayoutWrapper from './ClientLayoutWrapper';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Basement Buzz Corner',
  description: 'Welcome to Basement Buzz Corner - Your premium store for amazing products.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="root" className="app">
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </div>
      </body>
    </html>
  );
}
