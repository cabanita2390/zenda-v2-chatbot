/**
 * Contenido compartido de las maquetas A y B (Fase 0).
 * Datos locales: no dependen del backend. Precios provisionales en COP (plan §5.1).
 */

export const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)

export const nav = [
  { label: 'Dulce', href: '#destacados' },
  { label: 'Sal', href: '#lineas' },
  { label: 'Encargos', href: '#encargos' },
  { label: 'Nosotros', href: '#origen' },
]

export const hero = {
  title: 'Cuidarte nunca supo tan bien.',
  lead: 'Pastelería fit de autor, hecha a mano. Base de frutos secos, endulzada con stevia y fruta fresca.',
  primary: 'Ver el menú',
  secondary: 'Encargar una torta',
  placeholder: 'Aquí irá el cheesecake armándose capa por capa.',
}

export const lines = [
  {
    name: 'Zenda Dulce',
    status: 'Disponible',
    text: 'Cheesecakes, tortas y postres individuales. Equilibrio en cada porción.',
    active: true,
  },
  {
    name: 'Zenda Sal',
    status: 'Muy pronto',
    text: 'Horneados salados con la misma idea: ingredientes claros y cero rellenos de más.',
    active: false,
  },
]

export interface LabProduct {
  name: string
  flavor: string
  note: string
  price: number
  image: string
}

export const products: LabProduct[] = [
  {
    name: 'Cheesecake de uchuva',
    flavor: 'Uchuva',
    note: 'Ácido y dulce, con uchuva fresca de la región.',
    price: 14000,
    image: '/images/products/Cheesecake_de_Uchuva.png',
  },
  {
    name: 'Cheesecake de maracuyá y mango',
    flavor: 'Maracuyá y mango',
    note: 'Tropical, brillante y ligero.',
    price: 14000,
    image: '/images/products/Cheesecake_de_maracuya_y_mango.png',
  },
  {
    name: 'Cheesecake de frutos rojos',
    flavor: 'Frutos rojos',
    note: 'Fresa, mora y arándano sobre el relleno cremoso.',
    price: 14000,
    image: '/images/products/cheescake-frutos-rojos-2.png',
  },
  {
    name: 'Cheesecake de manzana',
    flavor: 'Manzana',
    note: 'Manzana tibia con canela, como en casa.',
    price: 14000,
    image: '/images/products/cheescake-manzana.png',
  },
]

export const ingredients = [
  { title: 'Base de frutos secos', text: 'En lugar de galleta. Más textura y un sabor tostado.' },
  { title: 'Stevia y fruta fresca', text: 'El dulzor viene de la fruta, no del azúcar.' },
  { title: 'Queso con yogur griego', text: 'Un relleno cremoso que se siente liviano.' },
  { title: 'Harina de avena', text: 'Fibra y un fondo suave en cada bocado.' },
]

export const orders = {
  title: 'Tortas para tus fechas especiales',
  lead: 'Cumpleaños, aniversarios o un martes que merece algo rico. Tú eliges el sabor y la hora; nosotros la hacemos a mano.',
  steps: [
    { title: 'Pide con 12 horas de anticipación', text: 'Así la preparamos fresca, solo para ti.' },
    { title: 'Elige la hora de entrega', text: 'Llega a la hora exacta que necesites.' },
    { title: 'Recíbela en tu puerta', text: 'El envío se cobra aparte y lo ves antes de confirmar.' },
  ],
  priceFrom: 95000,
  shipping: 7000,
  cta: 'Encargar por WhatsApp',
}

export const origin = {
  title: 'Hecho a mano en Sogamoso',
  text: 'Una cocina pequeña, recetas propias y fruta de temporada. Cada pieza sale de nuestras manos, nunca de una fábrica.',
  kitchen: '/images/about/kitchen.jpg',
  founder: '/images/about/founder.jpg',
}

export const footer = {
  tagline: 'Pastelería fit de autor.',
  contact: ['WhatsApp +57 300 000 0000', 'Sogamoso, Boyacá'],
  hours: ['Lunes a sábado, 8:00 a. m. a 7:00 p. m.', 'Domingo, con encargo previo'],
  social: 'Instagram',
}
