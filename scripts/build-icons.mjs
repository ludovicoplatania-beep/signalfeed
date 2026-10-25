// Genera icona e favicon di Athena (civetta stilizzata, stile hi-fi / Teenage Engineering) da un'unica definizione SVG.
// Uso: npm run icons   (richiede `sharp`)
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const C = { signal: '#ff5a1f', ink: '#141413', cream: '#efede7' }

const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${1024 - x} ${y}`)
const O = C.signal, K = C.ink, GR = '#8f8d86', RG = '#a8a69e'

/**
 * Civetta "tecnica" dentro un anello: testa a scudo grigia con sopracciglio, occhi-quadrante arancio
 * con tacche, becco, petto a scudo arancio, tracce circuitali, ciuffi a fiamma. Piatta, senza
 * sfumature. detail=false semplifica per le dimensioni minime (favicon). shape: 'rounded' (any) oppure
 * 'square' (full-bleed per iOS e maschere Android, contenuto ridotto per la zona sicura).
 */
export function iconSvg({ detail = true, shape = 'rounded' } = {}){
  const ticks=detail?Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;if(Math.abs(((a+Math.PI)%(2*Math.PI))-Math.PI)<1.3)return '';return `<line x1="${Math.sin(a)*90}" y1="${-Math.cos(a)*90}" x2="${Math.sin(a)*106}" y2="${-Math.cos(a)*106}" stroke="${O}" stroke-width="9" stroke-linecap="round"/>`}).join(''):''
  const eye=(cx)=>`<g transform="translate(${cx} 556)">${ticks}<circle r="70" fill="${K}" stroke="${O}" stroke-width="${detail?16:24}"/>${detail?`<circle r="30" fill="none" stroke="${GR}" stroke-width="9"/><circle r="12" fill="${O}"/>`:`<circle r="22" fill="${O}"/>`}</g>`
  const head='M270 430 Q270 336 380 308 Q512 276 644 308 Q754 336 754 430 L754 620 Q754 780 512 900 Q270 780 270 620 Z'
  const flameL='M312 372 Q236 304 290 214 Q300 166 332 112 Q342 186 384 222 Q432 264 412 330 Q372 360 312 372 Z'
  const flameC='M512 338 Q448 276 486 196 Q496 232 512 206 Q522 148 546 128 Q552 190 566 214 Q592 280 512 338 Z'
  const trace=(d)=>`<path d="${d}" fill="none" stroke="${K}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="${mirror(d)}" fill="none" stroke="${K}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`
  const art=`<circle cx="512" cy="520" r="392" fill="none" stroke="${RG}" stroke-width="${detail?26:40}"/>
  <path d="${flameL}" fill="${O}"/><path d="${mirror(flameL)}" fill="${O}"/><path d="${flameC}" fill="${O}"/>
  <path d="${head}" fill="${GR}"/>
  <path d="M284 404 L512 490 L740 404" fill="none" stroke="${K}" stroke-width="${detail?22:30}" stroke-linejoin="miter"/>
  ${eye(386)}${eye(638)}
  <path d="M484 566 L540 566 L512 650 Z" fill="${C}"/>
  <path d="M512 858 L408 742 L408 700 L512 748 L616 700 L616 742 Z" fill="${O}"/>
  ${detail?trace('M318 680 L318 760 L378 826')+trace('M356 690 L356 750')+`<circle cx="378" cy="826" r="12" fill="${K}"/><circle cx="646" cy="826" r="12" fill="${K}"/>`:''}`
  const s = shape === 'rounded' ? 1 : 0.8
  const g=`<g transform="translate(512 512) scale(${s}) translate(-512 -512)">${art}</g>`
  const bg=shape==='rounded'?`<rect width="1024" height="1024" rx="228" fill="${K}"/>`:`<rect width="1024" height="1024" fill="${K}"/>`
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
