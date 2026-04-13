import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ShoppingBag, Leaf, Clock, Star } from 'lucide-react'
import { CartProvider } from '@/lib/cart-context'
import { Header } from '@/components/header'
import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { ChatbotUI } from '@/components/chatbot-ui'
import { productDescriptions } from '@/lib/product-descriptions'
import { formatPrice } from '@/lib/utils'
import { AddToCartButton } from '@/components/add-to-cart-button'

interface Product {
  id: number
  name: string
  price: number
  tag: string
  image: string
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/products/${id}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: 'Producto no encontrado | Zenda' }
  return {
    title: `${product.name} | Zenda`,
    description:
      productDescriptions[product.name] ??
      'Postre artesanal elaborado con ingredientes naturales premium.',
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  const description =
    productDescriptions[product.name] ??
    'Elaborado artesanalmente con ingredientes naturales premium, sin conservantes artificiales.'

  // Características generadas a partir del tag del producto
  const tagFeatures: Record<string, string[]> = {
    'Sin Azucar': ['Sin azúcar refinada', 'Bajo índice glucémico', 'Endulzado naturalmente'],
    Vegano: ['100% vegetal', 'Sin lácteos ni huevos', 'Proteína de origen vegetal'],
    Keto: ['Alto en grasas saludables', 'Bajo en carbohidratos', 'Energía sostenida'],
    'Sin Gluten': ['Libre de gluten', 'Apto para celíacos', 'Sin trigo ni cebada'],
    'Sin Lactosa': ['Sin lácteos', 'Fácil digestión', 'Apto para intolerantes'],
    Saludable: ['Ingredientes naturales', 'Sin conservantes', 'Equilibrado nutricionalmente'],
    Fibra: ['Alto en fibra', 'Beneficioso para la digestión', 'Ingredientes integrales'],
    'Vitamina C': ['Fuente de vitamina C', 'Antioxidante natural', 'Refrescante y nutritivo'],
    Digestivo: ['Enzimas naturales', 'Favorece la digestión', 'Rico en vitaminas'],
  }

  const features = tagFeatures[product.tag] ?? [
    'Elaborado artesanalmente',
    'Ingredientes naturales',
    'Sin conservantes artificiales',
  ]

  return (
    <>
      {/* Back Navigation */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al menú
          </Link>
        </div>
      </div>

      {/* Product Detail */}
      <section className="py-12 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
            {/* Image */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-accent/30 shadow-xl">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {/* Tag badge */}
              <div className="absolute left-4 top-4">
                <span className="inline-flex items-center rounded-full bg-background/90 px-3 py-1 text-xs font-medium uppercase tracking-wider text-foreground backdrop-blur-sm shadow-sm">
                  {product.tag}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col">
              {/* Rating / social proof */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">Artesanal premium</span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl text-balance">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(product.price)}
                </span>
                <span className="text-sm text-muted-foreground">COP</span>
              </div>

              {/* Description */}
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                {description}
              </p>

              {/* Features */}
              <div className="mt-6 rounded-xl border border-border/50 bg-card p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Características
                </h3>
                <ul className="flex flex-col gap-2">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <Leaf className="h-4 w-4 flex-shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Delivery info */}
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>
                  Pedidos con <strong className="text-foreground">24h de anticipación</strong>. Entrega en Sogamoso o retiro en punto.
                </span>
              </div>

              {/* Add to Cart */}
              <div className="mt-8">
                <AddToCartButton product={product} />
              </div>

              {/* Back to menu link */}
              <Link
                href="/menu"
                className="mt-4 inline-flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ShoppingBag className="h-4 w-4" />
                Ver todos los postres
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
