import localFont from 'next/font/local'
import { Hanken_Grotesk } from 'next/font/google'
import { SequenceExperience } from './experience'
import '../scroll/scroll.css'
import './secuencia.css'

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

export const metadata = { title: 'Prototipo de secuencia | Zenda' }

export default function SequencePrototype() {
  return <SequenceExperience fontClass={`${display.variable} ${body.variable}`} />
}
