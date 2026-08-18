import { createWidget, widget, align, prop } from '@zos/ui'
import { LocalStorage } from '@zos/storage'
import { Vibrator } from '@zos/sensor'

const storage = new LocalStorage()
const vibrator = new Vibrator()

function text(label, y, size = 30, color = 0xffffff, height = 48) {
  return createWidget(widget.TEXT, { x: 38, y, w: 404, h: height, color, text_size: size, align_h: align.CENTER_H, align_v: align.CENTER_V, text: label })
}
function btn(label, x, y, onTap, color = 0x7652a8) {
  return createWidget(widget.BUTTON, { x, y, w: 180, h: 58, radius: 26, normal_color: color, press_color: 0x9b78c5, color: 0xffffff, text_size: 21, text: label, click_func: onTap })
}

Page({
  build() {
    text('💜 Quick check-in', 28, 32)
    text('No perfect answer needed.', 76, 18, 0xd8c7e8, 38)

    const currentMood = storage.getItem('mood', '')
    const currentEnergy = storage.getItem('energy', '')
    const status = text(
      currentMood ? `${currentMood}${currentEnergy ? ` · ${currentEnergy} ✓` : ' · now choose energy'}` : 'Choose a mood, then energy.',
      358,
      19,
      0xe9d8ff,
      52
    )
    const hint = text(
      ['Rough', 'Too much'].includes(currentMood) || currentEnergy === 'Low'
        ? 'PlushLife will keep the watch gentler for you.'
        : 'This helps the watch meet you where you are.',
      414,
      15,
      0x9b8aaa,
      36
    )
    const updateHint = () => {
      const mood = storage.getItem('mood', '')
      const energy = storage.getItem('energy', '')
      hint.setProperty(prop.TEXT, ['Rough', 'Too much'].includes(mood) || energy === 'Low'
        ? 'PlushLife will keep the watch gentler for you.'
        : 'This helps the watch meet you where you are.')
    }
    const setMood = (value) => {
      storage.setItem('mood', value)
      status.setProperty(prop.TEXT, `${value} · now choose energy`)
      vibrator.start()
      updateHint()
    }
    const setEnergy = (value) => {
      storage.setItem('energy', value)
      const mood = storage.getItem('mood', '')
      status.setProperty(prop.TEXT, `${mood ? `${mood} · ` : ''}${value} ✓`)
      vibrator.start()
      updateHint()
    }

    btn('😊 Good', 50, 126, () => setMood('Good'))
    btn('😐 Okay', 250, 126, () => setMood('Okay'))
    btn('😟 Rough', 50, 196, () => setMood('Rough'), 0x8c5f95)
    btn('😣 Too much', 250, 196, () => setMood('Too much'), 0x9a4f7b)
    btn('⚡ Steady', 50, 266, () => setEnergy('Steady'), 0x536ea6)
    btn('🪫 Low', 250, 266, () => setEnergy('Low'), 0x6f55a8)
  }
})
