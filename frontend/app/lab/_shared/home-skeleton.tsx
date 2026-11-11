import Image from 'next/image'
import { footer, formatCOP, hero, ingredients, lines, nav, orders, origin, products } from './content'

/**
 * Estructura común de las maquetas. Cada tema la estiliza con su propio CSS
 * bajo `.lab-a` o `.lab-b`: mismo contenido, distinto tratamiento visual.
 */
export function HomeSkeleton({ theme, fontClass }: { theme: 'a' | 'b'; fontClass: string }) {
  return (
    <div className={`lab-${theme} ${fontClass}`}>
      <a className="z-skip" href="#contenido">
        Saltar al contenido
      </a>

      <header className="z-header">
        <a href="#" className="z-wordmark" aria-label="Zenda, inicio">
          Zenda
        </a>
        <nav aria-label="Principal" className="z-nav">
          {nav.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a href="#" className="z-cart">
          Carrito <span aria-label="0 productos">(0)</span>
        </a>
      </header>

      <main id="contenido">
        <section className="z-hero" aria-labelledby="hero-title">
          <div className="z-hero-copy">
            <h1 id="hero-title">{hero.title}</h1>
            <p className="z-lead">{hero.lead}</p>
            <div className="z-actions">
              <a href="#destacados" className="z-btn z-btn-primary">
                {hero.primary}
              </a>
              <a href="#encargos" className="z-btn z-btn-ghost">
                {hero.secondary}
              </a>
            </div>
          </div>
          <div className="z-hero-stage" role="img" aria-label="Espacio reservado para la animación del hero">
            <p>{hero.placeholder}</p>
          </div>
        </section>

        <section id="lineas" className="z-lines" aria-labelledby="lineas-title">
          <h2 id="lineas-title" className="z-h2">
            Nuestras líneas
          </h2>
          <div className="z-lines-grid">
            {lines.map((line) => (
              <article key={line.name} className={`z-line ${line.active ? 'is-active' : 'is-soon'}`}>
                <h3>{line.name}</h3>
                <p className="z-line-status">{line.status}</p>
                <p>{line.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="destacados" className="z-featured" aria-labelledby="destacados-title">
          <div className="z-section-head">
            <h2 id="destacados-title" className="z-h2">
              Los favoritos de la casa
            </h2>
            <p>Porción individual a {formatCOP(products[0].price)}. Entero de 22 cm a {formatCOP(orders.priceFrom)}.</p>
          </div>
          <ul className="z-products">
            {products.map((product) => (
              <li key={product.name} className="z-product">
                <div className="z-product-media">
                  <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 25vw" />
                </div>
                <div className="z-product-body">
                  <h3>{product.flavor}</h3>
                  <p>{product.note}</p>
                  <div className="z-product-foot">
                    <span className="z-price">{formatCOP(product.price)}</span>
                    <button type="button" className="z-add" aria-label={`Agregar ${product.name} al carrito`}>
                      Agregar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="z-ingredients" aria-labelledby="ingredientes-title">
          <h2 id="ingredientes-title" className="z-h2">
            Qué lleva
          </h2>
          <p className="z-ingredients-note">La receta es de la casa, pero te contamos qué lleva.</p>
          <dl className="z-ingredients-list">
            {ingredients.map((item) => (
              <div key={item.title}>
                <dt>{item.title}</dt>
                <dd>{item.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="encargos" className="z-orders" aria-labelledby="encargos-title">
          <div className="z-orders-intro">
            <h2 id="encargos-title" className="z-h2">
              {orders.title}
            </h2>
            <p>{orders.lead}</p>
            <p className="z-orders-price">
              <span>Tortas desde {formatCOP(orders.priceFrom)}</span>
              <span>Envío desde {formatCOP(orders.shipping)}</span>
            </p>
            <a href="#" className="z-btn z-btn-primary">
              {orders.cta}
            </a>
          </div>
          <ol className="z-steps">
            {orders.steps.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="origen" className="z-origin" aria-labelledby="origen-title">
          <div className="z-origin-media">
            <Image src={origin.kitchen} alt="Cocina de Zenda con fruta fresca sobre el mesón" fill sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
          <div className="z-origin-copy">
            <h2 id="origen-title" className="z-h2">
              {origin.title}
            </h2>
            <p>{origin.text}</p>
          </div>
        </section>
      </main>

      <footer className="z-footer">
        <div>
          <p className="z-wordmark">Zenda</p>
          <p>{footer.tagline}</p>
        </div>
        <div>
          <h2>Contacto</h2>
          {footer.contact.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div>
          <h2>Horario</h2>
          {footer.hours.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <p className="z-legal">© 2026 Zenda. Maqueta de prueba, no publicar.</p>
      </footer>
    </div>
  )
}
