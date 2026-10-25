// Genera icone e favicon di Athena dal logo sorgente in design/athena-logo-source.png.
// Uso: npm run icons   (richiede `sharp`)
// Il logo è un cerchio (centro e raggio misurati sul sorgente) su fondo blu notte: lo si ritaglia,
// si maschera fuori dall'anello e lo si ricompone su una piastra tinta unita.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = (...p) => join(root, ...p)

const SOURCE = out('design/athena-logo-source.png')
const PLATE = { r: 14, g: 35, b: 59, alpha: 1 } // blu notte del sorgente, misurato fuori dall'anello
const CROP = { left: 288, top: 60, size: 448 } // quadrato attorno all'anello (raggio ≈ 220, centro ≈ 512, 283.5)
const MASK_R = 222

async function circleBuffer() {
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CROP.size}" height="${CROP.size}"><circle cx="${CROP.size / 2}" cy="${283.5 - CROP.top}" r="${MASK_R}" fill="#fff"/></svg>`)
  return sharp(SOURCE)
    .extract({ left: CROP.left, top: CROP.top, width: CROP.size, height: CROP.size })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

/** shape 'rounded' = icona "any" con angoli arrotondati; 'square' = full-bleed (iOS, maschere Android). */
async function render(circle, size, { shape = 'rounded', fill = 0.88 } = {}) {
  const d = Math.round(size * fill)
  const logo = await sharp(circle).resize(d, d, { kernel: 'lanczos3' }).png().toBuffer()
  let img = sharp({ create: { width: size, height: size, channels: 4, background: PLATE } })
    .composite([{ input: logo, left: Math.round((size - d) / 2), top: Math.round((size - d) / 2) }])
  if (shape === 'rounded') {
    const r = Math.round(size * 0.223)
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="#fff"/></svg>`)
    img = sharp(await img.png().toBuffer()).composite([{ input: mask, blend: 'dest-in' }])
  }
  return img.png({ compressionLevel: 9 }).toBuffer()
}

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

await mkdir(out('public/icons'), { recursive: true })
const circle = await circleBuffer()

const files = [
  ['public/icons/icon-512.png', 512, { fill: 0.88 }],
  ['public/icons/icon-192.png', 192, { fill: 0.88 }],
  ['public/icons/icon-512-maskable.png', 512, { shape: 'square', fill: 0.76 }],
  ['public/icons/apple-touch-icon.png', 180, { shape: 'square', fill: 0.8 }],
  ['public/icons/favicon-64.png', 64, { fill: 0.94 }],
  ['public/icons/favicon-32.png', 32, { fill: 0.94 }],
  ['public/icons/favicon-16.png', 16, { fill: 0.96 }],
]
for (const [file, size, opts] of files) await writeFile(out(file), await render(circle, size, opts))

const sizes = [16, 32, 48]
await writeFile(out('src/app/favicon.ico'), ico(await Promise.all(sizes.map(async (size) => ({ size, data: await render(circle, size, { fill: 0.94 }) })))))
console.log('Icone generate:', files.map(([f]) => f).join(', '), '+ src/app/favicon.ico')
