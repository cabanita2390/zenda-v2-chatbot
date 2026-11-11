import localFont from 'next/font/local'
import { Hanken_Grotesk } from 'next/font/google'
import { ScrollExperience } from './experience'
import './scroll.css'

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

export const metadata = { title: 'Prototipo de scroll | Zenda' }

export default function ScrollPrototype() {
  return <ScrollExperience fontClass={`${display.variable} ${body.variable}`} />
}
