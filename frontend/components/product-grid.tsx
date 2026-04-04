'use client'
import { useEffect, useState } from 'react'
import { Product } from '@/lib/cart-context'
import { ProductCard } from './product-card'

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    fetch(`${apiUrl}/api/products/`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching products:', error)
        setLoading(false)
      })
  }, [])
  return (
    <section id="menu" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Nuestra Coleccion
          </p>
          <h2 className="text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Deliciosamente Saludable
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            Cada creacion esta elaborada con ingredientes naturales seleccionados, 
            ofreciendo sabor excepcional sin compromisos.
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="text-muted-foreground animate-pulse">Cargando productos...</span>
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
