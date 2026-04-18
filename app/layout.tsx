import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'CASCADE OS — Life System Debugger',
  description: 'Your life has a bottleneck. CASCADE OS finds it, explains it, and gives you one action to fix it.',
  keywords: ['productivity', 'decision engine', 'life optimization', 'bottleneck', 'focus'],
  authors: [{ name: 'CASCADE OS' }],
  openGraph: {
    title: 'CASCADE OS — Life System Debugger',
    description: 'One decision. Maximum downstream impact.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-black text-slate-200 min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
