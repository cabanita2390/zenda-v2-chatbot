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
  title: 'Nosotros | Zenda',
  description: 'Conoce la historia y filosofía de Zenda. Postres artesanales elaborados con amor, ingredientes naturales y sin conservantes artificiales, directo desde Sogamoso.',
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

const pillars = [
  {
    title: 'Sin conservantes artificiales',
    description: 'Todos nuestros postres se elaboran sin colorantes sintéticos ni conservantes. Frescura real, sabor real.',
  },
  {
    title: 'Apto para dietas especiales',
    description: 'Tenemos opciones veganas, keto, sin azúcar, sin gluten y sin lactosa para que nadie se quede sin postre.',
  },
  {
    title: 'Hecho en Sogamoso',
    description: 'Somos una pequeña pastería local. Cada pedido se elabora por encargo con tiempo y dedicación.',
  },
  {
    title: 'Ingredientes de calidad',
    description: 'Seleccionamos materia prima de alta calidad: chocolates de especialidad, frutas frescas y alimentos naturales.',
  },
  {
    title: 'Entrega personalizada',
    description: 'Coordinamos la entrega directamente contigo. Pedidos con 24h de anticipación para garantizar frescura.',
  },
  {
    title: 'Postres con propósito',
    description: 'Creemos que cuidar la alimentación no significa renunciar al placer. Lo saludable puede ser delicioso.',
  },
]

export default function NosotrosPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl text-balance">
                Nuestra Historia
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                Zenda nació de una visión simple: demostrar que lo saludable puede ser 
                extraordinariamente delicioso. Somos una pequeña pastería artesanal con base 
                en Sogamoso, Colombia, donde cada postre se elabora por encargo con pasión 
                y dedicación.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                Nuestro compromiso es ofrecer postres sin conservantes artificiales, aptos para 
                diferentes estilos de vida, sin sacrificar el sabor ni la presentación.
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

      {/* Pillars Section */}
      <section id="ingredientes" className="bg-card">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              ¿Por qué Zenda?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Lo que nos hace diferentes en cada postre que preparamos.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="flex flex-col rounded-xl border border-border/50 bg-background p-6 transition-all duration-300 hover:border-border hover:shadow-sm"
              >
                <span className="font-medium text-foreground">{pillar.title}</span>
                <span className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
