'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

export function Header() {
  const { openCart, totalItems } = useCart()

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 duration-300">
          <Image
            src="/logo.png"
            alt="Zenda Pastelería"
            width={120}
            height={40}
            className="object-contain"
            priority
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/menu"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Menu
          </Link>
          <Link
            href="/nosotros"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Nosotros
          </Link>
        </nav>

        {/* Cart */}
        <button
          onClick={openCart}
          className="relative flex items-center justify-center rounded-full p-2 transition-colors hover:bg-accent"
          aria-label="Abrir carrito"
        >
          <ShoppingBag className="h-5 w-5 text-foreground" />
          {totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
