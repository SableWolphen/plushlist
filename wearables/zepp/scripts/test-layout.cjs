const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const pages = ['index.js', 'tasks.js', 'checkin.js', 'rescue.js', 'focus.js']
const SAFE_LEFT = 44
const SAFE_RIGHT = 436
const SAFE_BOTTOM = 438

let checked = 0
for (const file of pages) {
  const source = fs.readFileSync(path.join(root, 'pages', file), 'utf8')
  const blocks = source.matchAll(/createWidget\(widget\.BUTTON,\s*\{([\s\S]*?)(?:click_func|\}\))/g)
  for (const match of blocks) {
    const block = match[1]
    const number = (name) => {
      const found = block.match(new RegExp(`\\b${name}:\\s*(\\d+)`))
      return found ? Number(found[1]) : null
    }
    const x = number('x')
    const y = number('y')
    const w = number('w')
    const h = number('h')
    if ([x, y, w, h].some((value) => value === null)) continue
    checked += 1
    if (x < SAFE_LEFT || x + w > SAFE_RIGHT) throw new Error(`${file}: button ${x},${y},${w},${h} enters the round-screen side danger zone`)
    if (y + h > SAFE_BOTTOM) throw new Error(`${file}: button ${x},${y},${w},${h} enters the bottom danger zone`)
    if (h < 44) throw new Error(`${file}: button ${x},${y},${w},${h} is too short for a comfortable tap target`)
  }
}

const tasks = fs.readFileSync(path.join(root, 'pages', 'tasks.js'), 'utf8')
if (!tasks.includes('y: 148 + (index * 72)') || !tasks.includes('w: 372, h: 60')) {
  throw new Error('tasks.js: task-button layout changed; review the three dynamic rows for round-screen clipping')
}
if (148 + (2 * 72) + 60 > SAFE_BOTTOM) throw new Error('tasks.js: last dynamic task row clips the safe area')

const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))
const modules = app.targets?.common?.module || {}
if (!modules['app-widget']?.widgets?.length) throw new Error('app.json: PlushLife Today shortcut card is missing')
if (app.app?.version?.code < 6) throw new Error('app.json: expected upgraded Zepp build code')

if (checked < 10) throw new Error(`Only inspected ${checked} static buttons; layout guard likely stopped matching the source shape`)
console.log(`Zepp layout guard passed (${checked} static buttons + dynamic task rows).`)
