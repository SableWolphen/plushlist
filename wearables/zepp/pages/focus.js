import { createWidget, widget, align, prop } from '@zos/ui'
import { LocalStorage } from '@zos/storage'

const storage = new LocalStorage()

Page({
  build() {
    createWidget(widget.TEXT, { x: 40, y: 50, w: 400, h: 58, color: 0xffffff, text_size: 36, align_h: align.CENTER_H, align_v: align.CENTER_V, text: '🎯 PlushFocus' })
    const label = createWidget(widget.TEXT, { x: 40, y: 132, w: 400, h: 80, color: 0xe9d8ff, text_size: 25, align_h: align.CENTER_H, align_v: align.CENTER_V, text: 'Ready for one gentle focus block?' })
    createWidget(widget.BUTTON, {
      x: 70, y: 240, w: 340, h: 82, radius: 38,
      normal_color: 0x536ea6, press_color: 0x7188bc,
      color: 0xffffff, text_size: 28, text: 'Start focus',
      click_func: () => {
        storage.setItem('focusStartedAt', Date.now())
        label.setProperty(prop.TEXT, 'Focus started 💜')
      }
    })
    createWidget(widget.BUTTON, {
      x: 70, y: 342, w: 340, h: 72, radius: 34,
      normal_color: 0x6f55a8, press_color: 0x8f6ab8,
      color: 0xffffff, text_size: 25, text: 'I’m done for now',
      click_func: () => {
        storage.setItem('focusStoppedAt', Date.now())
        label.setProperty(prop.TEXT, 'Nice. That counts.')
      }
    })
  }
})
