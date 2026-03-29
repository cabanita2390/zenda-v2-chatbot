import { Metadata } from 'next'
import { CartProvider } from '@/lib/cart-context'
import { Header } from '@/components/header'
import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { ContactForm } from '@/components/contact-form'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contacto | Nur Patisserie',
  description: 'Ponte en contacto con nosotros. Estamos aqui para responder tus preguntas.',
}

const contactInfo = [
  {
    icon: MapPin,
    label: 'Direccion',
    value: 'Calle Gran Via 42, 28013 Madrid',
    href: 'https://maps.google.com',
  },
  {
    icon: Phone,
    label: 'Telefono',
    value: '+34 912 345 678',
    href: 'tel:+34912345678',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'hola@nurpatisserie.com',
    href: 'mailto:hola@nurpatisserie.com',
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
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          {/* Hero Section */}
          <section className="border-b border-border bg-card">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl text-balance">
                  Contactanos
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                  Nos encantaria saber de ti. Ya sea para consultas sobre pedidos, 
                  colaboraciones o simplemente para saludarnos, estamos aqui para ayudarte.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Content */}
          <section className="py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="grid gap-16 lg:grid-cols-2">
                {/* Contact Info */}
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Informacion de Contacto
                  </h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Visitanos en nuestra boutique o ponte en contacto a traves de cualquiera 
                    de estos canales.
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

                  {/* Map placeholder */}
                  <div className="mt-12 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3037.4234509261795!2d-3.7037902!3d40.4167754!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd42287d72e8a8e3%3A0x5c0e5f5c5f5c5f5c!2sGran%20V%C3%ADa%2C%20Madrid!5e0!3m2!1ses!2ses!4v1234567890"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicacion de Nur Patisserie"
                    />
                  </div>
                </div>

                {/* Contact Form */}
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Envianos un Mensaje
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
                    ¿Hacen envios a domicilio?
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Si, realizamos envios en Madrid capital el mismo dia para pedidos 
                    realizados antes de las 14:00.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    ¿Puedo hacer pedidos personalizados?
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Absolutamente. Contactanos con al menos 48 horas de antelacion 
                    para pedidos especiales.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    ¿Son aptos para diabeticos?
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Nuestros productos sin azucar utilizan edulcorantes naturales 
                    como stevia y eritritol.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    ¿Cuanto tiempo duran los postres?
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Recomendamos consumirlos en 3-4 dias refrigerados para 
                    disfrutar de su maxima frescura.
                  </p>
                </div>
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
