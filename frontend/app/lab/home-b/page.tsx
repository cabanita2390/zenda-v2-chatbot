import { Bodoni_Moda, Schibsted_Grotesk } from 'next/font/google'
import { HomeSkeleton } from '../_shared/home-skeleton'
import './lab-b.css'

const display = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const body = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata = { title: 'Maqueta B · Cacao | Zenda' }

export default function HomeB() {
  return <HomeSkeleton theme="b" fontClass={`${display.variable} ${body.variable}`} />
}
