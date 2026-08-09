import { createWidget, widget, align } from '@zos/ui'
import { LocalStorage } from '@zos/storage'

const storage = new LocalStorage()

function text(label, y, size = 30) {
  createWidget(widget.TEXT, { x: 40, y, w: 400, h: 52, color: 0xffffff, text_size: size, align_h: align.CENTER_H, align_v: align.CENTER_V, text: label })
}
function btn(label, x, y, onTap) {
  createWidget(widget.BUTTON, { x, y, w: 180, h: 68, radius: 30, normal_color: 0x7652a8, press_color: 0x9b78c5, color: 0xffffff, text_size: 23, text: label, click_func: onTap })
}

Page({
  build() {
    text('How are you feeling?', 50, 32)
    const status = createWidget(widget.TEXT, { x: 40, y: 365, w: 400, h: 70, color: 0xe9d8ff, text_size: 22, align_h: align.CENTER_H, align_v: align.CENTER_V, text: 'Tap a mood, then energy.' })
    const setMood = (value) => { storage.setItem('mood', value); status.setProperty(1, `Mood: ${value}`) }
    const setEnergy = (value) => { storage.setItem('energy', value); status.setProperty(1, `Energy: ${value} ✓`) }
    btn('😊 Good', 50, 125, () => setMood('Good'))
    btn('😐 Okay', 250, 125, () => setMood('Okay'))
    btn('😟 Rough', 50, 205, () => setMood('Rough'))
    btn('😣 Too much', 250, 205, () => setMood('Too much'))
    btn('⚡ Steady', 50, 285, () => setEnergy('Steady'))
    btn('🪫 Low', 250, 285, () => setEnergy('Low'))
  }
})
