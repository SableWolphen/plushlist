import { createWidget, widget, align, text_style } from '@zos/ui'
import { push } from '@zos/router'
import { LocalStorage } from '@zos/storage'

const storage = new LocalStorage()
const W = 480

function title(text, y, size = 34) {
  createWidget(widget.TEXT, {
    x: 40, y, w: 400, h: 52,
    color: 0xffffff,
    text_size: size,
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
    text
  })
}

function button(text, y, color, onTap) {
  createWidget(widget.BUTTON, {
    x: 60, y, w: 360, h: 70,
    radius: 34,
    normal_color: color,
    press_color: 0x8f6ab8,
    color: 0xffffff,
    text_size: 27,
    text,
    click_func: onTap
  })
}

Page({
  build() {
    title('🧸 PlushLife', 34, 38)
    const mood = storage.getItem('mood', '')
    const energy = storage.getItem('energy', '')
    title(mood ? `${mood} · ${energy || 'checked in'}` : 'A gentle moment for you', 91, 22)

    button('💜 Check in', 150, 0x8f5bd4, () => push({ url: 'pages/checkin' }))
    button('🌱 Tiny Step', 232, 0x6f55a8, () => {
      storage.setItem('tinyStep', 'Drink one sip of water')
      push({ url: 'pages/rescue', params: { mode: 'tiny' } })
    })
    button('🛟 PlushRescue', 314, 0xb45283, () => push({ url: 'pages/rescue' }))
    button('🎯 Focus', 396, 0x536ea6, () => push({ url: 'pages/focus' }))
  }
})
