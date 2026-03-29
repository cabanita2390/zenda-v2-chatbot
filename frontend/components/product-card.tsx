'use client'

import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Product, useCart } from '@/lib/cart-context'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-border"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-accent/30">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <CardContent className="p-5">
        <div className="mb-3">
          <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
            {product.tag}
          </span>
        </div>
        <h3 className="mb-2 text-base font-medium leading-tight text-foreground">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-foreground">
            ${product.price.toFixed(2)}
          </span>
          <Button
            size="icon"
            onClick={() => addToCart(product)}
            className="h-9 w-9 rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
