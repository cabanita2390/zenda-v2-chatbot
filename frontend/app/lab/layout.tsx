import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Laboratorio | Zenda',
  robots: { index: false, follow: false },
}

/**
 * Capa temporal a pantalla completa: tapa el header, el footer y el chatbot
 * del layout global sin modificarlo. Solo para /lab; se borra en la Fase 5.
 */
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-lab-scroller style={{ position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto', background: '#fff' }}>
      {children}
    </div>
  )
}
