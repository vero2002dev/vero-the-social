import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VERO - Authentic Connections',
  description: 'Premium platform for genuine connections',
  openGraph: {
    title: 'VERO - Authentic Connections',
    description: 'Join VERO and find your perfect match today. Experience dating like never before.',
    url: 'https://vero.love',
    siteName: 'VERO',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=2400', // Mood image
        width: 1200,
        height: 630,
        alt: 'VERO Dating App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VERO - Authentic Connections',
    description: 'Premium platform for genuine connections',
    images: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=2400'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${plusJakarta.variable} font-display antialiased`}>
        {children}
      </body>
    </html>
  );
}
