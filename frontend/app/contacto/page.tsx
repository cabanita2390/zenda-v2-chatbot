import { Metadata } from 'next'
import { ContactForm } from '@/components/contact-form'
import { PageHero } from '@/components/page-hero'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contacto | Zenda',
  description: 'Contáctanos para pedidos, preguntas o simplemente para saludarnos. Estamos en Sogamoso, Colombia.',
}

const contactInfo = [
  {
    icon: MapPin,
    label: 'Dirección',
    value: 'Carrera 10 A Bis # 28-35, barrio El Recreo, Sogamoso',
    href: 'https://maps.google.com/?q=Carrera+10A+Bis+%2328-35+Sogamoso+Colombia',
  },
  {
    icon: Phone,
    label: 'Teléfono',
    value: '+57 319 581 1958',
    href: 'tel:+573195811958',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'zenda@gmail.com',
    href: 'mailto:zenda@gmail.com',
  },
  {
    icon: Clock,
    label: 'Horario',
    value: 'Lun - Sab: 9:00 - 20:00',
    href: null,
  },
]

export default function ContactoPage() {
  return (
    <>
      <PageHero
        title="Contáctanos"
        description="Nos encantaría saber de ti. Ya sea para hacer un pedido, preguntar por algún postre especial, coordinar una entrega o simplemente saludarnos — estamos aquí para ayudarte. Escríbenos por el formulario o comunícate directamente a través de nuestros canales."
      />

      {/* Contact Content */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Información de Contacto
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Encuéntranos en Sogamoso o ponte en contacto a través de cualquiera
                de estos canales. Los pedidos se coordinan con mínimo 24h de anticipación.
              </p>
              <dl className="mt-10 space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        {item.label}
                      </dt>
                      <dd className="mt-1">
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-foreground hover:text-primary transition-colors"
                            target={item.href.startsWith('http') ? '_blank' : undefined}
                            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          >
                            {item.value}
                          </a>
                        ) : (
                          <span className="text-foreground">{item.value}</span>
                        )}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>

              {/* Google Maps — Carrera 10 A Bis # 28-35, barrio El Recreo, Sogamoso */}
              <div className="mt-12 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
                <iframe
                  src="https://maps.google.com/maps?q=Carrera+10A+Bis+%2328-35+Sogamoso+Boyaca+Colombia&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de Zenda en Sogamoso"
                />
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Envíanos un Mensaje
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Completa el formulario y te responderemos lo antes posible.
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground text-center mb-12">
            Preguntas Frecuentes
          </h2>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <div>
              <h3 className="font-medium text-foreground">
                ¿Hacen envíos a domicilio?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Sí, realizamos entregas en Sogamoso. También puedes retirar tu pedido directamente
                en nuestro punto. Coordinamos la entrega contigo al confirmar el pedido.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                ¿Puedo hacer pedidos personalizados?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Absolutamente. Contáctanos con al menos 24–48 horas de anticipación
                para pedidos especiales o en cantidades mayores.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                ¿Son aptos para diabéticos?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Nuestros productos sin azúcar utilizan edulcorantes naturales
                como stevia y eritritol. Te recomendamos consultar con tu médico.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                ¿Cuánto tiempo duran los postres?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Recomendamos consumirlos en 3–4 días en refrigeración para
                disfrutar de su máxima frescura. No contienen conservantes artificiales.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
