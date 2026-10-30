import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'KIGOBESHOP | Tienda Online de Moda Urbana y Bolsos',
  description:
    'Descubre las últimas tendencias en moda urbana, ropa juvenil y bolsos exclusivos en KIGOBESHOP. Tu estilo, tus reglas. Envío rápido con GLS.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
