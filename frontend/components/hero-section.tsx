import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid min-h-[85vh] items-center gap-12 py-20 lg:grid-cols-2 lg:gap-8">
          {/* Left Content */}
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Bienestar Artesanal
            </p>
            <h1 className="text-balance text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              Indulgencia sin culpa.
            </h1>
            <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              Postres artesanales elaborados con ingredientes naturales. Sin azucares anadidos, sin compromisos en el sabor.
            </p>
            <div className="mt-10">
              <Button 
                size="lg"
                className="group relative overflow-hidden bg-primary px-8 py-6 text-sm font-medium uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,182,193,0.4)]"
              >
                <span className="relative z-10">Comprar Ahora</span>
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-3xl bg-accent/30">
              <Image
                src="/images/hero-dessert.jpg"
                alt="Postre saludable elegante con bayas frescas y decoracion de oro"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
