import { createWidget, widget, align } from '@zos/ui'

Page({
  build() {
    createWidget(widget.TEXT, { x: 40, y: 48, w: 400, h: 58, color: 0xffffff, text_size: 34, align_h: align.CENTER_H, align_v: align.CENTER_V, text: '🌙 Calm' })
    createWidget(widget.TEXT, { x: 55, y: 128, w: 370, h: 120, color: 0xe9d8ff, text_size: 27, align_h: align.CENTER_H, align_v: align.CENTER_V, text: 'Breathe in slowly.\nLet the exhale be longer.' })
    createWidget(widget.TEXT, { x: 55, y: 270, w: 370, h: 120, color: 0xffffff, text_size: 24, align_h: align.CENTER_H, align_v: align.CENTER_V, text: 'Nothing else needs to happen\nfor the next few seconds.' })
  }
})
