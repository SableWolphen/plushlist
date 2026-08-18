import { createWidget, widget, align, prop } from '@zos/ui'
import { LocalStorage } from '@zos/storage'
import { Vibrator } from '@zos/sensor'

const storage = new LocalStorage()
const vibrator = new Vibrator()

function centered(text, y, size = 28, color = 0xffffff, height = 52) {
  return createWidget(widget.TEXT, { x: 40, y, w: 400, h: height, color, text_size: size, align_h: align.CENTER_H, align_v: align.CENTER_V, text })
}

function action(label, y, message, status) {
  createWidget(widget.BUTTON, {
    x: 62, y, w: 356, h: 62, radius: 29,
    normal_color: 0x9a4f7b, press_color: 0xc16f9e,
    color: 0xffffff, text_size: 22, text: label,
    click_func: () => {
      storage.setItem('lastRescueAction', message)
      storage.setItem('lastRescueAt', Date.now())
      vibrator.start()
      status.setProperty(prop.TEXT, '✓ That counts. Stay here as long as you need. 💜')
    }
  })
}

Page({
  onInit(params) {
    this.mode = params ? JSON.parse(params).mode : ''
  },
  build() {
    centered(this.mode === 'tiny' ? '🌱 One tiny step' : '🛟 PlushRescue', 28, 33)
    const status = centered(
      this.mode === 'tiny' ? 'Small is enough right now.' : 'Pick the easiest thing. Nothing else is required.',
      82,
      19,
      0xe9d8ff,
      66
    )
    action('💧 One sip of water', 160, 'water', status)
    action('🫶 Unclench + breathe', 234, 'breathe', status)
    action('🛋️ Sit somewhere safe', 308, 'safe-place', status)
    centered('One choice is enough. You can stop here.', 386, 16, 0x9b8aaa, 42)
  }
})
