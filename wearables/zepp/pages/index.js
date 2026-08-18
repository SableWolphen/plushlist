import { createWidget, widget, align, text_style } from '@zos/ui'
import { push } from '@zos/router'
import { LocalStorage } from '@zos/storage'

const storage = new LocalStorage()

function title(text, y, size = 34, color = 0xffffff) {
  createWidget(widget.TEXT, {
    x: 36, y, w: 408, h: 46,
    color,
    text_size: size,
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
    text
  })
}

function button(text, y, color, onTap) {
  createWidget(widget.BUTTON, {
    x: 58, y, w: 364, h: 52,
    radius: 24,
    normal_color: color,
    press_color: 0x8f6ab8,
    color: 0xffffff,
    text_size: 23,
    text,
    click_func: onTap
  })
}

Page({
  build() {
    title('🧸 PlushLife', 24, 36)
    const mood = storage.getItem('mood', '')
    const energy = storage.getItem('energy', '')
    title(mood ? `${mood}${energy ? ` · ${energy}` : ''}` : 'What would help right now?', 73, 20, 0xd8c7e8)

    button('✓ Today’s tasks', 126, 0x318c79, () => push({ url: 'pages/tasks' }))
    button('💜 Quick check-in', 186, 0x8f5bd4, () => push({ url: 'pages/checkin' }))
    button('🌱 Give me one tiny step', 246, 0x6f55a8, () => {
      storage.setItem('tinyStep', 'Drink one sip of water')
      push({ url: 'pages/rescue', params: { mode: 'tiny' } })
    })
    button('🛟 I need a softer moment', 306, 0xb45283, () => push({ url: 'pages/rescue' }))
    button('🎯 Start a focus block', 366, 0x536ea6, () => push({ url: 'pages/focus' }))

    title('Everything fits. Nothing to catch up on.', 426, 16, 0x9b8aaa)
  }
})
