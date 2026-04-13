'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Filter, Loader2 } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/utils'

interface Product {
  id: number
  name: string
  price: number
  tag: string
  image: string
}

const categories = [
  { id: 'todos', label: 'Todos' },
  { id: 'sin-azucar', label: 'Sin Azúcar' },
  { id: 'vegano', label: 'Vegano' },
  { id: 'keto', label: 'Keto' },
  { id: 'sin-gluten', label: 'Sin Gluten' },
  { id: 'sin-lactosa', label: 'Sin Lactosa' },
  { id: 'saludable', label: 'Saludable' },
]

function normalizeTag(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, '-')
}

export function MenuContent() {
  const { addToCart } = useCart()
  const [activeCategory, setActiveCategory] = useState('todos')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/products/`,
          { cache: 'no-store' }
        )
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setProducts(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filteredProducts =
    activeCategory === 'todos'
      ? products
      : products.filter((p) => normalizeTag(p.tag) === activeCategory)

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-12 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground mr-4">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtrar:</span>
          </div>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No se pudo cargar el catálogo. Intenta de nuevo.</p>
            <Button
              variant="outline"
              onClick={() => { window.location.reload() }}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/productos/${product.id}`}
                className="group block"
              >
                <Card className="h-full overflow-hidden border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-border">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <Badge
                      variant="secondary"
                      className="absolute left-4 top-4 bg-background/90 backdrop-blur-sm text-foreground"
                    >
                      {product.tag}
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground text-lg leading-tight">
                          {product.name}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Elaborado con ingredientes naturales premium
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-semibold text-foreground">
                        {formatPrice(product.price)}
                      </span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          addToCart(product)
                        }}
                        className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">
              No hay productos en esta categoría.
            </p>
            <Button
              variant="outline"
              onClick={() => setActiveCategory('todos')}
              className="mt-4"
            >
              Ver todos los productos
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
