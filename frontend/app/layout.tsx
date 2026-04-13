import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cart-context'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { ChatbotUI } from '@/components/chatbot-ui'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: 'Zenda | Pastelería Saludable',
  description: 'Descubre nuestra colección de postres y tortas saludables. Opciones sin azúcar y amigables con tu bienestar, preparadas con ingredientes premium.',
  generator: 'Next.js',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <CartProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main>{children}</main>
            <Footer />
            <CartDrawer />
            <ChatbotUI />
          </div>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
