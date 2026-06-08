import './globals.css'
import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-cairo'
})

export const metadata: Metadata = {
  title: 'إدارة HonorLine',
  description: 'لوحة إدارة HonorLine لخدمات الإنترنت والمحاسبة والمخزون',
  icons: {
    icon: '/branding/honorline-logo.png',
    apple: '/branding/honorline-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.variable}>{children}</body>
    </html>
  )
}
