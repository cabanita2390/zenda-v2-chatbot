import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Solo en desarrollo: guarda los fotogramas renderizados de la secuencia en
 * public/lab/seq/<dir>/. Lo usa la página /lab/secuencia/render.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') return new Response('No disponible', { status: 404 })
  const { dir, name, dataUrl, json } = (await req.json()) as { dir: string; name: string; dataUrl?: string; json?: unknown }
  if (!/^[a-z0-9-]+$/.test(dir) || !/^[a-z0-9-]+\.(webp|jpg|json)$/.test(name)) {
    return new Response('Nombre inválido', { status: 400 })
  }
  const outDir = path.join(process.cwd(), 'public', 'lab', 'seq', dir)
  await mkdir(outDir, { recursive: true })
  const file = path.join(outDir, name)
  if (json !== undefined) await writeFile(file, JSON.stringify(json))
  else if (dataUrl) await writeFile(file, Buffer.from(dataUrl.split(',')[1], 'base64'))
  else return new Response('Sin contenido', { status: 400 })
  return Response.json({ ok: true })
}
