'use client'

import Link from 'next/link'
import { Instagram, Twitter, Facebook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function Footer() {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter signup
    setEmail('')
  }

  return (
    <footer id="about" className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight text-foreground">
                ZENDA
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Patisserie
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Postres saludables elaborados con amor y los mejores ingredientes naturales.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-foreground">
              Tienda
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/menu" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Todos los Productos
                </Link>
              </li>
              <li>
                <Link href="/menu?categoria=novedades" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Novedades
                </Link>
              </li>
              <li>
                <Link href="/menu?categoria=populares" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Mas Vendidos
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-foreground">
              Compania
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/nosotros" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Nuestra Historia
                </Link>
              </li>
              <li>
                <Link href="/nosotros#ingredientes" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Ingredientes
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-foreground">
              Newsletter
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Recibe ofertas exclusivas y nuevos lanzamientos.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border-border/50 bg-background placeholder:text-muted-foreground/50 focus:border-primary"
              />
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Enviar
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 md:flex-row">
          <div className="flex flex-col items-center gap-1 md:items-start">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Zenda. Todos los derechos reservados.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Hecho en Sogamoso con ❤️
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="https://www.instagram.com/zenda.postressaludables/"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
