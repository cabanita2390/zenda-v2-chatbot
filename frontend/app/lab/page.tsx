import Link from 'next/link'

export default function LabIndex() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '0 auto', padding: '64px 16px', color: '#222' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Laboratorio Zenda</h1>
      <p style={{ marginBottom: 24, color: '#555' }}>Maquetas de la Fase 0. No están enlazadas en el sitio.</p>
      <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0 }}>
        <li>
          <Link href="/lab/home-a" style={{ textDecoration: 'underline' }}>
            A · Cuajada (editorial cálido)
          </Link>
        </li>
        <li>
          <Link href="/lab/home-b" style={{ textDecoration: 'underline' }}>
            B · Cacao (lujo oscuro)
          </Link>
        </li>
        <li>
          <Link href="/lab/inicio" style={{ textDecoration: 'underline' }}>
            Página de inicio nueva (por secciones, con el video detrás)
          </Link>
        </li>
        <li>
          <Link href="/lab/scroll" style={{ textDecoration: 'underline' }}>
            Prototipo de scroll 3D (cheesecake)
          </Link>
        </li>
        <li>
          <Link href="/lab/secuencia" style={{ textDecoration: 'underline' }}>
            Prototipo de scroll con secuencia de imágenes (tipo Apple)
          </Link>
        </li>
        <li>
          <Link href="/lab/fuentes" style={{ textDecoration: 'underline' }}>
            Comparación de fuentes
          </Link>
        </li>
      </ul>
    </main>
  )
}
