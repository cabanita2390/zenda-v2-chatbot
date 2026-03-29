import { Metadata } from 'next'
import { CartProvider } from '@/lib/cart-context'
import { Header } from '@/components/header'
import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { MenuContent } from '@/components/menu-content'
import { ChatbotUI } from '@/components/chatbot-ui'

export const metadata: Metadata = {
  title: 'Menu | Nur Patisserie',
  description: 'Explora nuestra coleccion completa de postres saludables. Sin azucar, veganos, keto y sin gluten.',
}

export default function MenuPage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          {/* Hero Section */}
          <section className="border-b border-border bg-card">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl text-balance">
                  Nuestro Menu
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                  Cada postre esta elaborado con ingredientes naturales y sin comprometer el sabor. 
                  Descubre opciones para todos los estilos de vida.
                </p>
              </div>
            </div>
          </section>

          <MenuContent />
        </main>
        <CartDrawer />
        <ChatbotUI />
        <Footer />
      </div>
    </CartProvider>
  )
}
