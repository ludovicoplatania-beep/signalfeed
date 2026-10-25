// Genera icona e favicon di Athena (civetta stilizzata, stile hi-fi / Teenage Engineering) da un'unica definizione SVG.
// Uso: npm run icons   (richiede `sharp`)
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const C = { signal: '#ff5a1f', ink: '#141413', cream: '#efede7' }

const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${1024 - x} ${y}`)
const TUFT = 'M296 380 Q262 236 168 104 Q338 166 440 258 Z'

/**
 * Civetta stilizzata come pannello hi-fi: sagoma nera con ciuffi svettanti, sopracciglio inclinato,
 * occhi crema con indicatore arancio, becco, trespolo. detail=false semplifica per le dimensioni
 * minime (favicon). shape: 'rounded' (any) oppure 'square' (full-bleed per iOS e maschere Android,
 * con contenuto ridotto per restare nella zona sicura).
 */
export function iconSvg({ shape = 'rounded', detail = true } = {}) {
  const eye = (sx, id) => {
    const cx = 512 - sx * 112
    const cy = 492
    const x = (v) => 512 - sx * (512 - v)
    return `<clipPath id="${id}"><polygon points="${x(270)},${cy - 84} ${x(520)},${cy - 8} ${x(520)},${cy + 120} ${x(270)},${cy + 120}"/></clipPath>
      <circle cx="${cx}" cy="${cy}" r="${detail ? 104 : 112}" fill="${C.cream}" clip-path="url(#${id})"/>${
      detail ? `<circle cx="${cx}" cy="${cy + 28}" r="36" fill="${C.signal}"/>` : ''}`
  }
  const art = `<path d="${TUFT}" fill="${C.ink}"/><path d="${mirror(TUFT)}" fill="${C.ink}"/>
    <circle cx="512" cy="450" r="250" fill="${C.ink}"/><ellipse cx="512" cy="680" rx="292" ry="206" fill="${C.ink}"/>
    ${eye(1, 'l')}${eye(-1, 'r')}<path d="M482 552 L542 552 L512 628 Z" fill="${C.signal}"/>
    ${detail ? `<rect x="140" y="868" width="744" height="34" fill="${C.cream}"/>` : ''}`
  const scale = shape === 'rounded' ? 0.9 : 0.76
  const g = `<g transform="translate(512 512) scale(${scale}) translate(-512 -503)">${art}</g>`
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
