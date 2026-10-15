import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});


export const metadata: Metadata = {
  title: 'KIGOBESHOP — Tu estilo, tus reglas.',
  description:
    'Tienda online juvenil de ropa y bolsos. Descubre las últimas tendencias en moda urbana y expresa tu personalidad.',
  openGraph: {
    title: 'KIGOBESHOP — Tu estilo, tus reglas.',
    description:
      'Tienda online juvenil de ropa y bolsos. Descubre las últimas tendencias en moda urbana.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
