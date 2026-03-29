'use client'

import Image from 'next/image'
import { Minus, Plus, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'
import { Separator } from '@/components/ui/separator'

export function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeFromCart, subtotal } = useCart()

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex w-full flex-col bg-card sm:max-w-md">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-lg font-medium tracking-tight">
            Tu Carrito ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent">
              <span className="text-4xl text-muted-foreground">🧁</span>
            </div>
            <p className="text-center text-muted-foreground">
              Tu carrito esta vacio
            </p>
            <Button onClick={closeCart} variant="outline" className="mt-2">
              Continuar Comprando
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 rounded-lg border border-border/50 bg-background p-3">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-accent/30">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-medium leading-tight text-foreground">
                          {item.name}
                        </h4>
                        <span className="mt-0.5 inline-block text-xs text-muted-foreground">
                          {item.tag}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent"
                            aria-label="Reducir cantidad"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-foreground">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <SheetFooter className="flex-col gap-4 border-t border-border pt-4">
              <Separator className="mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-medium text-foreground">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Envio e impuestos calculados en el checkout
              </p>
              <Button 
                className="w-full bg-primary py-6 text-sm font-medium uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
              >
                Proceder al Checkout
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
