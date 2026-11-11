import localFont from 'next/font/local'
import { Hanken_Grotesk } from 'next/font/google'
import { HomeSkeleton } from '../_shared/home-skeleton'
import './lab-a.css'

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

export const metadata = { title: 'Maqueta A · Cuajada | Zenda' }

export default function HomeA() {
  return <HomeSkeleton theme="a" fontClass={`${display.variable} ${body.variable}`} />
}
