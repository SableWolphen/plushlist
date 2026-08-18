import { createWidget, widget, align, prop } from '@zos/ui'
import { LocalStorage } from '@zos/storage'

const storage = new LocalStorage()

Page({
  build() {
    createWidget(widget.TEXT, { x: 40, y: 34, w: 400, h: 52, color: 0xffffff, text_size: 34, align_h: align.CENTER_H, align_v: align.CENTER_V, text: '🎯 PlushFocus' })
    const startedAt = Number(storage.getItem('focusStartedAt', 0)) || 0
    const label = createWidget(widget.TEXT, {
      x: 48, y: 98, w: 384, h: 92,
      color: 0xe9d8ff, text_size: 22,
      align_h: align.CENTER_H, align_v: align.CENTER_V,
      text: startedAt ? 'A focus block is already waiting for you. Keep it gentle.' : 'One thing. One gentle block. You can stop whenever you need.'
    })

    createWidget(widget.BUTTON, {
      x: 70, y: 214, w: 340, h: 70, radius: 33,
      normal_color: 0x536ea6, press_color: 0x7188bc,
      color: 0xffffff, text_size: 25, text: startedAt ? 'Restart focus' : 'Start focus',
      click_func: () => {
        storage.setItem('focusStartedAt', Date.now())
        label.setProperty(prop.TEXT, 'Focus started 💜\nStay with just one thing.')
      }
    })

    createWidget(widget.BUTTON, {
      x: 70, y: 304, w: 340, h: 66, radius: 31,
      normal_color: 0x6f55a8, press_color: 0x8f6ab8,
      color: 0xffffff, text_size: 23, text: 'Finish for now',
      click_func: () => {
        const active = Number(storage.getItem('focusStartedAt', 0)) || 0
        if (active) storage.setItem('lastFocusMinutes', Math.max(1, Math.round((Date.now() - active) / 60000)))
        storage.setItem('focusStoppedAt', Date.now())
        storage.setItem('focusStartedAt', 0)
        label.setProperty(prop.TEXT, 'Nice. That counts.\nNo need to squeeze out more.')
      }
    })

    createWidget(widget.TEXT, { x: 50, y: 390, w: 380, h: 44, color: 0x9b8aaa, text_size: 17, align_h: align.CENTER_H, align_v: align.CENTER_V, text: 'Stopping early still counts.' })
  }
})
