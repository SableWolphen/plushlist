import { createWidget, widget, align, prop } from '@zos/ui'
import { LocalStorage } from '@zos/storage'
import { Vibrator } from '@zos/sensor'

const storage = new LocalStorage()
const vibrator = new Vibrator()
const SCORES_KEY = 'plushlife_rescue_helpful_v1'

function readScores() {
  try { return JSON.parse(storage.getItem(SCORES_KEY, '') || '{}') }
  catch (_error) { return {} }
}

function centered(text, y, size = 28, color = 0xffffff, height = 52) {
  return createWidget(widget.TEXT, { x: 40, y, w: 400, h: height, color, text_size: size, align_h: align.CENTER_H, align_v: align.CENTER_V, text })
}

Page({
  onInit(params) {
    this.mode = params ? JSON.parse(params).mode : ''
    this.selected = null
  },
  build() {
    centered(this.mode === 'tiny' ? '🌱 One tiny step' : '🛟 PlushRescue', 24, 32)
    this.status = centered(
      this.mode === 'tiny' ? 'Small is enough right now.' : 'Pick the easiest thing. Nothing else is required.',
      72,
      18,
      0xe9d8ff,
      62
    )

    const choices = [
      { key: 'water', label: '💧 One sip of water' },
      { key: 'breathe', label: '🫶 Unclench + breathe' },
      { key: 'safe-place', label: '🛋️ Sit somewhere safe' },
    ]
    const scores = readScores()
    choices.sort((a, b) => (Number(scores[b.key]) || 0) - (Number(scores[a.key]) || 0))

    choices.forEach((choice, index) => createWidget(widget.BUTTON, {
      x: 62, y: 144 + (index * 68), w: 356, h: 58, radius: 27,
      normal_color: index === 0 && Number(scores[choice.key]) > 1 ? 0xb45283 : 0x9a4f7b,
      press_color: 0xc16f9e,
      color: 0xffffff, text_size: 21, text: choice.label,
      click_func: () => {
        this.selected = choice
        storage.setItem('lastRescueAction', choice.key)
        storage.setItem('lastRescueAt', Date.now())
        vibrator.start()
        this.status.setProperty(prop.TEXT, '✓ That counts. Did this help a little?')
        this.helpButton.setProperty(widget.BUTTON, { text: '💜 Yes, keep this one' })
      }
    }))

    this.helpButton = createWidget(widget.BUTTON, {
      x: 96, y: 354, w: 288, h: 48, radius: 22,
      normal_color: 0x4f4160, press_color: 0x6f55a8,
      color: 0xffffff, text_size: 18, text: 'Choose one first',
      click_func: () => {
        if (!this.selected) return
        const nextScores = readScores()
        nextScores[this.selected.key] = Math.min(20, (Number(nextScores[this.selected.key]) || 0) + 1)
        storage.setItem(SCORES_KEY, JSON.stringify(nextScores))
        vibrator.start()
        this.status.setProperty(prop.TEXT, 'Saved. I’ll put what helps you closer next time. 💜')
        this.helpButton.setProperty(widget.BUTTON, { text: '✓ Remembered' })
      }
    })

    centered('One choice is enough. You can stop here.', 408, 15, 0x9b8aaa, 30)
  }
})
