'use client'

import { HeroSection } from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { ProductGrid } from '@/components/product-grid'

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ProductGrid />
    </>
  )
}
