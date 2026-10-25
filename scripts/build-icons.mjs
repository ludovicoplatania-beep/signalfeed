// Genera icona e favicon di Athena (civetta stilizzata, stile hi-fi / Teenage Engineering) da un'unica definizione SVG.
// Uso: npm run icons   (richiede `sharp`)
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const C = { signal: '#ff5a1f', ink: '#141413', cream: '#efede7' }

/**
 * Civetta stilizzata come pannello hi-fi: sagoma nera con piccoli ciuffi, occhi ad anello crema
 * con indicatore arancio, becco. detail=false semplifica per le dimensioni minime (favicon).
 * shape: 'rounded' (any), 'square' (full-bleed per iOS e maschere Android, contenuto ridotto
 * per restare nella zona sicura).
 */
export function iconSvg({ shape = 'rounded', detail = true } = {}) {
  const body = 'M200 330 L262 214 L408 288 Q512 262 616 288 L762 214 L824 330 L824 640 Q824 850 512 850 Q200 850 200 640 Z'
  const eye = (cx) => `<circle cx="${cx}" cy="548" r="${detail ? 120 : 112}" fill="none" stroke="${C.cream}" stroke-width="${detail ? 36 : 52}"/>${
    detail ? `<circle cx="${cx}" cy="548" r="40" fill="${C.signal}"/>` : ''}`
  const art = `<path d="${body}" fill="${C.ink}"/>${eye(360)}${eye(664)}<path d="M468 612 L556 612 L512 706 Z" fill="${C.signal}"/>`
  const scale = shape === 'rounded' ? 1 : 0.84
  const g = `<g transform="translate(512 ${512 - 20 * scale}) scale(${scale}) translate(-512 -512)">${art}</g>`
  const bg = shape === 'rounded'
    ? `<rect width="1024" height="1024" rx="228" fill="${C.signal}"/>`
    : `<rect width="1024" height="1024" fill="${C.signal}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${bg}${g}</svg>`
}

const render = (svg, size) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer()

// ICO con voci PNG (supportato da tutti i browser attuali).
function ico(entries) {
  const head = Buffer.alloc(6)
  head.writeUInt16LE(1, 2)
  head.writeUInt16LE(entries.length, 4)
  let offset = 6 + entries.length * 16
  const dir = entries.map(({ size, data }) => {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0)
    e.writeUInt8(size >= 256 ? 0 : size, 1)
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += data.length
    return e
  })
  return Buffer.concat([head, ...dir, ...entries.map((e) => e.data)])
}

const out = (...p) => join(root, ...p)
await mkdir(out('public/icons'), { recursive: true })
await mkdir(out('design'), { recursive: true })

const full = iconSvg()
const square = iconSvg({ shape: 'square' })
const small = iconSvg({ detail: false })
await writeFile(out('design/athena-icon.svg'), full)

const files = [
  ['public/icons/icon-512.png', full, 512],
  ['public/icons/icon-192.png', full, 192],
  ['public/icons/icon-512-maskable.png', square, 512],
  ['public/icons/apple-touch-icon.png', square, 180],
  ['public/icons/favicon-64.png', small, 64],
  ['public/icons/favicon-32.png', small, 32],
  ['public/icons/favicon-16.png', small, 16],
]
for (const [file, svg, size] of files) await writeFile(out(file), await render(svg, size))

const sizes = [16, 32, 48]
await writeFile(out('src/app/favicon.ico'), ico(await Promise.all(sizes.map(async (size) => ({ size, data: await render(small, size) })))))
console.log('Icone generate:', files.map(([f]) => f).join(', '), '+ src/app/favicon.ico')
