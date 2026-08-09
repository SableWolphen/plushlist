import { createWidget, widget, align } from '@zos/ui'
import { LocalStorage } from '@zos/storage'

const storage = new LocalStorage()

function centered(text, y, size = 28) {
  createWidget(widget.TEXT, { x: 42, y, w: 396, h: 62, color: 0xffffff, text_size: size, align_h: align.CENTER_H, align_v: align.CENTER_V, text })
}
function action(label, y, message) {
  createWidget(widget.BUTTON, {
    x: 62, y, w: 356, h: 72, radius: 34,
    normal_color: 0x9a4f7b, press_color: 0xc16f9e,
    color: 0xffffff, text_size: 24, text: label,
    click_func: () => storage.setItem('lastRescueAction', message)
  })
}

Page({
  onInit(params) {
    this.mode = params ? JSON.parse(params).mode : ''
  },
  build() {
    centered(this.mode === 'tiny' ? '🌱 Your Tiny Step' : '🛟 PlushRescue', 42, 34)
    centered(this.mode === 'tiny' ? 'Drink one sip of water.' : 'Pick the easiest thing.', 100, 23)
    action('💧 One sip of water', 176, 'water')
    action('🫶 Unclench + breathe', 260, 'breathe')
    action('🛋️ Sit somewhere safe', 344, 'safe-place')
  }
})
