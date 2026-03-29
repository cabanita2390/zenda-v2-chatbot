import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CartProvider } from '@/lib/cart-context'
import { Header } from '@/components/header'
import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Leaf, Heart, Award, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Nosotros | Nur Patisserie',
  description: 'Conoce nuestra historia y filosofia. Postres saludables elaborados con amor y los mejores ingredientes naturales.',
}

const values = [
  {
    icon: Leaf,
    title: 'Ingredientes Naturales',
    description: 'Solo utilizamos ingredientes organicos y de origen responsable.',
  },
  {
    icon: Heart,
    title: 'Hecho con Amor',
    description: 'Cada postre es elaborado artesanalmente con pasion y dedicacion.',
  },
  {
    icon: Award,
    title: 'Calidad Premium',
    description: 'Nos comprometemos con los mas altos estandares de excelencia.',
  },
  {
    icon: Sparkles,
    title: 'Innovacion Constante',
    description: 'Creamos nuevas recetas que sorprenden sin sacrificar la salud.',
  },
]

const ingredients = [
  { name: 'Cacao Organico', origin: 'Ecuador' },
  { name: 'Vainilla de Madagascar', origin: 'Madagascar' },
  { name: 'Almendras Sicilianas', origin: 'Italia' },
  { name: 'Matcha Ceremonial', origin: 'Japon' },
  { name: 'Coco Virgen', origin: 'Sri Lanka' },
  { name: 'Chia Premium', origin: 'Mexico' },
]

export default function NosotrosPage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          {/* Hero Section */}
          <section className="border-b border-border">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
              <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl text-balance">
                    Nuestra Historia
                  </h1>
                  <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                    Nur Patisserie nacio de una vision simple: demostrar que lo saludable puede ser 
                    extraordinariamente delicioso. Fundada en 2019 por Elena Mendoza, pastelera con 
                    formacion en Le Cordon Bleu, nuestra boutique combina tecnicas clasicas francesas 
                    con un compromiso inquebrantable con la salud.
                  </p>
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                    El nombre "Nur" significa "luz" en arabe, simbolizando nuestra mision de iluminar 
                    el camino hacia un estilo de vida mas consciente sin renunciar al placer.
                  </p>
                  <Button asChild className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/menu">
                      Explorar el Menu
                    </Link>
                  </Button>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                  <Image
                    src="/images/about/founder.jpg"
                    alt="Elena Mendoza, fundadora de Nur Patisserie"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="bg-card border-b border-border">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                  Nuestros Valores
                </h2>
                <p className="mt-4 text-muted-foreground text-lg">
                  Los principios que guian cada decision y cada creacion.
                </p>
              </div>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {values.map((value) => (
                  <div key={value.title} className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-6 font-medium text-foreground">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Kitchen Section */}
          <section className="border-b border-border">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
              <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted order-2 lg:order-1">
                  <Image
                    src="/images/about/kitchen.jpg"
                    alt="Nuestra cocina artesanal"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="order-1 lg:order-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                    El Arte de lo Artesanal
                  </h2>
                  <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                    En nuestra cocina, cada postre es una obra de arte. Trabajamos en lotes pequenos 
                    para garantizar la maxima frescura y atencion al detalle. Nuestros procesos 
                    respetan los tiempos naturales de fermentacion y maduracion.
                  </p>
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                    No utilizamos conservantes artificiales, colorantes sinteticos ni azucares 
                    refinados. Cada ingrediente es seleccionado cuidadosamente por su calidad 
                    y beneficios nutricionales.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Ingredients Section */}
          <section id="ingredientes" className="bg-card">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                  Ingredientes de Origen
                </h2>
                <p className="mt-4 text-muted-foreground text-lg">
                  Seleccionamos los mejores ingredientes del mundo para crear experiencias unicas.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ingredients.map((ingredient) => (
                  <div 
                    key={ingredient.name}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-background p-6 transition-colors hover:border-border"
                  >
                    <span className="font-medium text-foreground">{ingredient.name}</span>
                    <span className="text-sm text-muted-foreground">{ingredient.origin}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
        <CartDrawer />
        <Footer />
      </div>
    </CartProvider>
  )
}
