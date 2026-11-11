'use client'
import { useEffect, useState } from 'react'
import { Product } from '@/lib/cart-context'
import { ProductCard } from './product-card'
import { Button } from '@/components/ui/button'

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const fetchProducts = async () => {
      setLoading(true)
      setError(false)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const res = await fetch(`${apiUrl}/api/products/`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('Invalid products response')
        if (!cancelled) setProducts(data)
      } catch {
        if (!cancelled) {
          setProducts([])
          setError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProducts()
    return () => {
      cancelled = true
    }
  }, [retryKey])

  return (
    <section id="menu" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Nuestra Colección
          </p>
          <h2 className="text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Deliciosamente Saludable
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            Cada creación está elaborada con ingredientes naturales seleccionados, 
            ofreciendo sabor excepcional sin compromisos.
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="text-muted-foreground animate-pulse">Cargando productos...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No se pudo cargar el catálogo. ¿Está el backend en marcha?
            </p>
            <Button
              variant="outline"
              onClick={() => setRetryKey((k) => k + 1)}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
