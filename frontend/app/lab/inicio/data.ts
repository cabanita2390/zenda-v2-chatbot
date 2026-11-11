/**
 * Contenido de la página de inicio nueva. Precios provisionales en COP
 * (plan §5.1). Las fotos son las del catálogo actual, recortadas para quitar
 * la marca de agua (public/lab/inicio).
 */

export const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)

export type Category = 'Cheesecakes' | 'Tartas' | 'Vasitos' | 'Horneados'

export const CATEGORIES: ('Todo' | Category)[] = ['Todo', 'Cheesecakes', 'Tartas', 'Vasitos', 'Horneados']

export interface MenuItem {
  id: number
  name: string
  category: Category
  note: string
  price: number
  image: string
}

const img = (name: string) => `/lab/inicio/${name}.webp`

export const MENU: MenuItem[] = [
  { id: 101, name: 'Cheesecake de uchuva', category: 'Cheesecakes', note: 'Ácido y dulce, con uchuva fresca de la región.', price: 14000, image: img('uchuva') },
  { id: 2, name: 'Tarta de chocolate negro', category: 'Tartas', note: 'Chocolate intenso con fruta fresca encima.', price: 16000, image: img('chocolate') },
  { id: 1, name: 'Parfait de chía y bayas', category: 'Vasitos', note: 'Chía, yogur griego y bayas, en capas.', price: 12000, image: img('parfait') },
  { id: 102, name: 'Cheesecake de maracuyá y mango', category: 'Cheesecakes', note: 'Tropical, brillante y ligero.', price: 14000, image: img('maracuya') },
  { id: 4, name: 'Mousse de avellana', category: 'Vasitos', note: 'Suave, con avellana tostada encima.', price: 13000, image: img('mousse') },
  { id: 5, name: 'Brownie de almendras', category: 'Horneados', note: 'Húmedo por dentro, con almendra en láminas.', price: 9000, image: img('brownie') },
  { id: 103, name: 'Cheesecake de frutos rojos', category: 'Cheesecakes', note: 'Fresa, mora y arándano sobre el relleno cremoso.', price: 14000, image: img('frutos-rojos') },
  { id: 6, name: 'Panna cotta de coco', category: 'Vasitos', note: 'Coco cremoso con maracuyá.', price: 11000, image: img('panna') },
  { id: 104, name: 'Cheesecake de manzana', category: 'Cheesecakes', note: 'Manzana con canela, como en casa.', price: 14000, image: img('manzana') },
  { id: 3, name: 'Cheesecake de matcha', category: 'Cheesecakes', note: 'Té verde suave y fondo cremoso.', price: 14000, image: img('matcha') },
]

export const INGREDIENTS = [
  { title: 'Fruta fresca', text: 'Uchuva, maracuyá, frutos rojos. Lo que esté en temporada, nunca en almíbar.' },
  { title: 'Endulzado con stevia', text: 'El dulzor viene de la fruta y la stevia, no del azúcar.' },
  { title: 'Queso con yogur griego', text: 'Rellenos cremosos que se sienten livianos.' },
  { title: 'Frutos secos y avena', text: 'Bases con textura y sabor tostado, en lugar de galleta.' },
]

export const ORDER_STEPS = [
  { title: 'Pide con 12 horas de anticipación', text: 'Así la preparamos fresca, solo para ti.' },
  { title: 'Elige la hora de entrega', text: 'Llega a la hora exacta que necesites.' },
  { title: 'Recíbela en tu puerta', text: 'El envío se cobra aparte y lo ves antes de confirmar.' },
]

export const PRICES = { cake: 110000, wholeCheesecake: 95000, shipping: 7000 }
