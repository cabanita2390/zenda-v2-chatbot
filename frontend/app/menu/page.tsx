import { Metadata } from 'next'
import { MenuContent } from '@/components/menu-content'
import { PageHero } from '@/components/page-hero'

export const metadata: Metadata = {
  title: 'Menú | Zenda',
  description: 'Explora nuestra colección completa de postres artesanales. Sin azúcar, veganos, keto, sin gluten y más. Pedidos con 24h de anticipación. Entrega en Sogamoso.',
}

const deliveryPills = (
  <div className="flex flex-wrap gap-5">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">📦</span>
      Pedidos con <strong className="text-foreground ml-1">24h de anticipación</strong>
    </div>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">🛵</span>
      <strong className="text-foreground">Entrega</strong>&nbsp;en Sogamoso o retiro en punto
    </div>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">💳</span>
      Pago contra entrega o&nbsp;<strong className="text-foreground">transferencia</strong>
    </div>
  </div>
)

export default function MenuPage() {
  return (
    <>
      <PageHero
        title="Nuestro Menú"
        description="Cada postre de Zenda es elaborado artesanalmente con ingredientes naturales de alta calidad, sin conservantes artificiales ni colorantes sintéticos. Tenemos opciones para todos los estilos de vida: vegano, keto, sin azúcar, sin gluten y más."
      >
        {deliveryPills}
      </PageHero>
      <MenuContent />
    </>
  )
}
