import localFont from 'next/font/local'
import { Hanken_Grotesk } from 'next/font/google'
import { HomeExperience } from './home'
import './inicio.css'

const display = localFont({
  src: '../_fonts/Gambarino-Regular.woff2',
  variable: '--font-display',
  display: 'swap',
})

const body = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata = {
  title: 'Zenda · Pastelería fit de autor',
  description: 'Cheesecakes, tartas, vasitos y horneados fit, hechos a mano en Sogamoso. Endulzados con stevia y fruta fresca.',
}

export default function InicioPage() {
  return <HomeExperience fontClass={`${display.variable} ${body.variable}`} />
}
