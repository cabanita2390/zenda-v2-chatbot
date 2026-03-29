'use client'

import { CartProvider } from '@/lib/cart-context'
import { Header } from '@/components/header'
import { HeroSection } from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { ProductGrid } from '@/components/product-grid'
import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { ChatbotUI } from '@/components/chatbot-ui'

export default function Home() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <ProductGrid />
        </main>
        <Footer />
        <CartDrawer />
        <ChatbotUI />
      </div>
    </CartProvider>
  )
}
