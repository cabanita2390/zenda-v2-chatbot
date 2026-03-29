import { Leaf, Heart, Award } from 'lucide-react'

const features = [
  {
    icon: Leaf,
    title: '100% Natural',
    description: 'Ingredientes organicos sin aditivos artificiales ni conservantes.',
  },
  {
    icon: Heart,
    title: 'Bienestar Consciente',
    description: 'Opciones sin azucar, veganas y aptas para dietas keto.',
  },
  {
    icon: Award,
    title: 'Calidad Artesanal',
    description: 'Cada postre elaborado a mano por nuestros maestros pasteleros.',
  },
]

export function FeaturesSection() {
  return (
    <section className="border-y border-border bg-card py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <feature.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="mb-3 text-lg font-medium text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
