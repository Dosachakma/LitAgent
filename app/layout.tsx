import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'LitAgent — The AI Companion for the LitVM Ecosystem',
  description:
    'Explore the LitVM ecosystem through AI, discover projects, follow official updates, connect wallets, track portfolios, complete ecosystem missions, and navigate everything from one dashboard.',
  icons: {
    icon: '/litagent-logo.png',
    shortcut: '/litagent-logo.png',
    apple: '/litagent-logo.png',
  },
  openGraph: {
    title: 'LitAgent — The AI Companion for the LitVM Ecosystem',
    description:
      'Explore the LitVM ecosystem through AI, discover projects, connect wallets, track portfolios, and complete missions.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LitAgent — The AI Companion for the LitVM Ecosystem',
    description:
      'Explore the LitVM ecosystem through AI, discover projects, connect wallets, track portfolios, and complete missions.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
