// Genera icona e favicon di Athena (stile hi-fi / Teenage Engineering) da un'unica definizione SVG.
// Uso: npm run icons   (richiede `sharp`)
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const C = { signal: '#ff5a1f', ink: '#141413', cream: '#efede7' }

/**
 * Due occhi-manopola e un becco: il gufo di Athena letto come pannello di un apparecchio hi-fi.
 * detail=false semplifica per le dimensioni minime (favicon): niente indicatori né fila di LED.
 * shape: 'rounded' (any), 'square' (full-bleed per iOS e maschere Android).
 */
export function iconSvg({ shape = 'rounded', detail = true } = {}) {
  const eye = (cx, angle) => `
    <circle cx="${cx}" cy="430" r="172" fill="${C.cream}" stroke="${C.ink}" stroke-width="${detail ? 22 : 34}"/>
    <circle cx="${cx}" cy="430" r="${detail ? 92 : 104}" fill="${C.ink}"/>
    ${detail ? `<line x1="${cx}" y1="430" x2="${cx}" y2="366" stroke="${C.signal}" stroke-width="18" stroke-linecap="round" transform="rotate(${angle} ${cx} 430)"/>` : ''}`
  const leds = detail
    ? [0, 1, 2, 3, 4].map((i) => `<rect x="${372 + i * 60}" y="780" width="40" height="40" fill="${i === 2 ? C.cream : C.ink}"/>`).join('')
    : ''
  const bg = shape === 'rounded'
    ? `<rect width="1024" height="1024" rx="228" fill="${C.signal}"/>`
    : `<rect width="1024" height="1024" fill="${C.signal}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${bg}${eye(328, -22)}${eye(696, 22)}<path d="M452 556 L572 556 L512 676 Z" fill="${C.ink}"/>${leds}</svg>`
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
