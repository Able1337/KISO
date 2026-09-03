import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Kiso — подготовка к ITPEC и IPA',
  description: 'Интерактивный тренажёр для экзаменов IP и FE систем ITPEC и IPA.',
  openGraph: {
    title: 'Kiso — ITPEC & IPA Exam Lab',
    description: 'Подготовка к экзаменам IP и FE в режимах обучения, пробного экзамена и экзамена.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Kiso — ITPEC & IPA Exam Lab' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kiso — ITPEC & IPA Exam Lab',
    description: 'Интерактивная подготовка к IP и FE.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
