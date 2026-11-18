import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import InstallPrompt from '@/components/InstallPrompt';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'KIGOBESHOP | Tienda Online de Moda Urbana y Bolsos',
  description:
    'Descubre las últimas tendencias en moda urbana, ropa juvenil y bolsos exclusivos en KIGOBESHOP. Tu estilo, tus reglas. Envío rápido con GLS.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'KigobeShop',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'KIGOBESHOP | Tienda Online de Moda Urbana y Bolsos',
    description:
      'Descubre las últimas tendencias en moda urbana, ropa juvenil y bolsos exclusivos en KIGOBESHOP. Tu estilo, tus reglas.',
    url: 'https://kigobeshop.com',
    siteName: 'KIGOBESHOP',
    locale: 'es_ES',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className="antialiased">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
