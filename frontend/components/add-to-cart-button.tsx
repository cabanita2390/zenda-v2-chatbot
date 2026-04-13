'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'

interface Product {
  id: number
  name: string
  price: number
  tag: string
  image: string
}

export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Button
      onClick={handleAdd}
      size="lg"
      className="w-full gap-3 bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 hover:shadow-md transition-all"
      aria-label={`Agregar ${product.name} al carrito`}
    >
      {added ? (
        <>
          <Check className="h-5 w-5" />
          ¡Agregado al carrito!
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          Agregar al carrito
        </>
      )}
    </Button>
  )
}
