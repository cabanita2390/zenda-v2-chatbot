import localFont from 'next/font/local'
import {
  Bricolage_Grotesque,
  Figtree,
  Fraunces,
  Hanken_Grotesk,
  Instrument_Sans,
  Instrument_Serif,
  Inter,
  Inter_Tight,
  Manrope,
  Plus_Jakarta_Sans,
  Young_Serif,
} from 'next/font/google'
import './fuentes.css'

const gambarino = localFont({ src: '../_fonts/Gambarino-Regular.woff2', display: 'swap' })
const hanken = Hanken_Grotesk({ subsets: ['latin'], display: 'swap' })
const interTight = Inter_Tight({ subsets: ['latin'], weight: ['500', '600', '700'], display: 'swap' })
const inter = Inter({ subsets: ['latin'], display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], axes: ['SOFT', 'opsz'], display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], display: 'swap' })
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', display: 'swap' })
const instrumentSans = Instrument_Sans({ subsets: ['latin'], display: 'swap' })
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap' })
const figtree = Figtree({ subsets: ['latin'], display: 'swap' })
const youngSerif = Young_Serif({ subsets: ['latin'], weight: '400', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap' })

export const metadata = { title: 'Comparación de fuentes | Zenda' }

type Pair = {
  id: string
  name: string
  fonts: string
  feel: string
  display: string
  body: string
  /** Ajustes del titular para que cada fuente luzca en su mejor peso */
  headStyle: React.CSSProperties
}

const PAIRS: Pair[] = [
  {
    id: '1',
    name: 'La actual',
    fonts: 'Gambarino + Hanken Grotesk',
    feel: 'Serif clásica y fina, de revista. Elegante, pero puede sentirse antigua o fría.',
    display: gambarino.className,
    body: hanken.className,
    headStyle: { fontWeight: 400, letterSpacing: '-0.01em' },
  },
  {
    id: '2',
    name: 'Tipo Apple',
    fonts: 'Inter Tight + Inter',
    feel: 'Sans gruesa y compacta, como la de Apple. Moderna, limpia, segura. Menos "pastelería", más marca premium.',
    display: interTight.className,
    body: inter.className,
    headStyle: { fontWeight: 600, letterSpacing: '-0.035em' },
  },
  {
    id: '3',
    name: 'Cálida y suave',
    fonts: 'Fraunces + Manrope',
    feel: 'Serif con curvas suaves, hecha a mano pero cuidada. La más "repostería de autor".',
    display: fraunces.className,
    body: manrope.className,
    headStyle: { fontWeight: 500, letterSpacing: '-0.02em', fontVariationSettings: '"SOFT" 100, "opsz" 144' },
  },
  {
    id: '4',
    name: 'Editorial ligera',
    fonts: 'Instrument Serif + Instrument Sans',
    feel: 'Serif alta y delgada con textos sans muy limpios. Sofisticada y aireada.',
    display: instrumentSerif.className,
    body: instrumentSans.className,
    headStyle: { fontWeight: 400, letterSpacing: '-0.015em' },
  },
  {
    id: '5',
    name: 'Fresca con carácter',
    fonts: 'Bricolage Grotesque + Figtree',
    feel: 'Sans con personalidad, amable y actual. Transmite "fit" y frescura sin perder nivel.',
    display: bricolage.className,
    body: figtree.className,
    headStyle: { fontWeight: 700, letterSpacing: '-0.03em' },
  },
  {
    id: '6',
    name: 'Cercana y redonda',
    fonts: 'Young Serif + Plus Jakarta Sans',
    feel: 'Serif robusta y cálida, muy legible. Más cercana y de barrio premium.',
    display: youngSerif.className,
    body: jakarta.className,
    headStyle: { fontWeight: 400, letterSpacing: '-0.02em' },
  },
]

export default function FontComparison() {
  return (
    <div className="fx">
      <header className="fx-intro">
        <h1>Comparación de fuentes</h1>
        <p>
          Seis parejas de fuentes aplicadas a los mismos textos de Zenda, con la paleta Cuajada. Cada bloque usa una fuente
          para títulos y otra para textos. Elige la que se sienta más Zenda, o dime qué te gusta de cada una para mezclarlas.
        </p>
      </header>

      {PAIRS.map((p) => (
        <section key={p.id} className={`fx-pair ${p.body}`} aria-labelledby={`fx-${p.id}`}>
          <div className="fx-tag">
            <span className="fx-num">{p.id}</span>
            <div>
              <strong id={`fx-${p.id}`}>{p.name}</strong>
              <span>{p.fonts}</span>
            </div>
          </div>

          <div className="fx-hero">
            <div className="fx-bar">
              <span className={`fx-word ${p.display}`} style={p.headStyle}>
                Zenda
              </span>
              <nav aria-hidden>
                <span>Sabores</span>
                <span>Encargos</span>
                <span>Nosotros</span>
                <span>Carrito (0)</span>
              </nav>
            </div>
            <h2 className={`fx-head ${p.display}`} style={p.headStyle}>
              Cuidarte nunca supo tan bien.
            </h2>
            <p className="fx-lead">
              Pastelería fit de autor, hecha a mano en Sogamoso. Base de frutos secos, endulzada con stevia y fruta fresca.
            </p>
            <div className="fx-row">
              <span className="fx-btn">Pedir mi porción</span>
              <span className="fx-btn fx-ghost">Encargar una torta</span>
            </div>
          </div>

          <div className="fx-cards">
            <article className="fx-card">
              <span className="fx-kicker">Sabor de la casa</span>
              <h3 className={p.display} style={p.headStyle}>
                Frutos rojos
              </h3>
              <p>Frambuesa, mora y arándano sobre queso con yogur griego.</p>
              <div className="fx-price">
                <span className={p.display} style={p.headStyle}>
                  $14.000
                </span>
                <small>porción</small>
              </div>
            </article>
            <article className="fx-card">
              <span className="fx-kicker">Encargos</span>
              <h3 className={p.display} style={p.headStyle}>
                Tortas para tus fechas especiales
              </h3>
              <p>Pide con 12 horas de anticipación y elige la hora exacta de entrega. El envío se cobra aparte.</p>
            </article>
            <article className="fx-card fx-big">
              <span className={p.display} style={p.headStyle}>
                Sin pero.
              </span>
              <p>Ni feo, ni aburrido, ni caro.</p>
            </article>
          </div>
          <p className="fx-feel">{p.feel}</p>
        </section>
      ))}
    </div>
  )
}
