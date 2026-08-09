const path = require('node:path')
const sharp = require('sharp')

const root = path.resolve(__dirname, '..')
const output = path.join(root, 'store-assets')

function frame(body) {
  return `
    <svg width="360" height="360" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
      <circle cx="180" cy="180" r="180" fill="#07050b"/>
      <style>
        text { font-family: Arial, sans-serif; fill: white; text-anchor: middle; }
        .soft { fill: #e9d8ff; }
      </style>
      ${body}
    </svg>`
}

const screenshots = {
  'home-360.png': frame(`
    <text x="180" y="48" font-size="29" font-weight="700">PlushLife</text>
    <text class="soft" x="180" y="78" font-size="16">A gentle moment for you</text>
    <rect x="45" y="103" width="270" height="51" rx="25" fill="#8f5bd4"/>
    <text x="180" y="136" font-size="20">Check in</text>
    <rect x="45" y="165" width="270" height="51" rx="25" fill="#6f55a8"/>
    <text x="180" y="198" font-size="20">Tiny Step</text>
    <rect x="45" y="227" width="270" height="51" rx="25" fill="#b45283"/>
    <text x="180" y="260" font-size="20">PlushRescue</text>
    <rect x="45" y="289" width="270" height="51" rx="25" fill="#536ea6"/>
    <text x="180" y="322" font-size="20">Focus</text>
  `),
  'checkin-360.png': frame(`
    <text x="180" y="61" font-size="25" font-weight="700">How are you feeling?</text>
    <rect x="38" y="94" width="135" height="51" rx="23" fill="#7652a8"/>
    <text x="105" y="126" font-size="17">Good</text>
    <rect x="188" y="94" width="135" height="51" rx="23" fill="#7652a8"/>
    <text x="255" y="126" font-size="17">Okay</text>
    <rect x="38" y="154" width="135" height="51" rx="23" fill="#7652a8"/>
    <text x="105" y="186" font-size="17">Rough</text>
    <rect x="188" y="154" width="135" height="51" rx="23" fill="#7652a8"/>
    <text x="255" y="186" font-size="17">Too much</text>
    <rect x="38" y="214" width="135" height="51" rx="23" fill="#7652a8"/>
    <text x="105" y="246" font-size="17">Steady</text>
    <rect x="188" y="214" width="135" height="51" rx="23" fill="#7652a8"/>
    <text x="255" y="246" font-size="17">Low</text>
    <text class="soft" x="180" y="307" font-size="16">Tap a mood, then energy.</text>
  `),
  'focus-360.png': frame(`
    <text x="180" y="66" font-size="28" font-weight="700">PlushFocus</text>
    <text class="soft" x="180" y="116" font-size="18">Ready for one gentle</text>
    <text class="soft" x="180" y="140" font-size="18">focus block?</text>
    <rect x="53" y="180" width="255" height="61" rx="29" fill="#536ea6"/>
    <text x="180" y="218" font-size="21">Start focus</text>
    <rect x="53" y="257" width="255" height="54" rx="27" fill="#6f55a8"/>
    <text x="180" y="291" font-size="18">I’m done for now</text>
  `)
}

async function main() {
  await sharp(path.join(root, 'assets/common.w480-r/icon.png'))
    .resize(240, 240)
    .composite([{ input: Buffer.from('<svg width="240" height="240"><circle cx="120" cy="120" r="120" fill="white"/></svg>'), blend: 'dest-in' }])
    .png()
    .toFile(path.join(output, 'icon-240.png'))

  await Promise.all(Object.entries(screenshots).map(([name, svg]) =>
    sharp(Buffer.from(svg)).png().toFile(path.join(output, name))))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
