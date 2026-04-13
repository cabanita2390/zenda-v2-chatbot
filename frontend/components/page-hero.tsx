import { ReactNode } from 'react'

interface PageHeroProps {
  title: string
  description: ReactNode
  children?: ReactNode
  /** Fondo opcional: 'card' (default) | 'transparent' */
  bg?: 'card' | 'transparent'
}

/**
 * Hero banner reutilizable para las páginas internas.
 * Padding reducido respecto al original (py-20/py-28 → py-12/py-16).
 */
export function PageHero({ title, description, children, bg = 'card' }: PageHeroProps) {
  return (
    <section
      className={`border-b border-border ${bg === 'card' ? 'bg-card' : ''}`}
    >
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl text-balance">
            {title}
          </h1>
          <div className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
            {description}
          </div>
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </section>
  )
}
