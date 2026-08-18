import { createWidget, widget, align, text_style, getAppWidgetSize, setAppWidgetSize } from '@zos/ui'
import { LocalStorage } from '@zos/storage'
import { launchApp } from '@zos/router'

const storage = new LocalStorage()
const SUMMARY_KEY = 'plushlife_watch_summary_v2'
const APP_ID = 1122959

function readSummary() {
  try { return JSON.parse(storage.getItem(SUMMARY_KEY, '') || '') }
  catch (_error) { return null }
}

function dayLabel(type) {
  return ({ full: 'Full', soft: 'Soft', tiny: 'Tiny', recovery: 'Recovery', rest: 'Rest' })[type] || 'Today'
}

AppWidget({
  build() {
    const size = getAppWidgetSize()
    const height = Math.min(Math.floor(size.h * 1.05), 250)
    setAppWidgetSize({ h: height })
    const w = size.w
    const pad = Math.max(16, Number(size.margin) || 16)
    const inner = w - (pad * 2)
    const summary = readSummary()
    const done = Number(summary?.progress_done) || 0
    const total = Number(summary?.progress_total) || 0
    const next = summary?.next_step

    createWidget(widget.TEXT, {
      x: pad, y: 14, w: inner, h: 34,
      text: `🧸 PlushLife · ${dayLabel(summary?.day_type)}`,
      color: 0xffffff, text_size: 19,
      align_h: align.LEFT, align_v: align.CENTER_V,
      text_style: text_style.ELLIPSIS,
    })
    createWidget(widget.TEXT, {
      x: pad, y: 48, w: inner, h: 28,
      text: total ? `${done} of ${total} cared for` : (summary?.day_type === 'rest' ? 'Rest is enough today.' : 'Your day, at a glance.'),
      color: 0xb9f2df, text_size: 16,
      align_h: align.LEFT, align_v: align.CENTER_V,
      text_style: text_style.ELLIPSIS,
    })
    createWidget(widget.BUTTON, {
      x: pad, y: 84, w: inner, h: 62,
      radius: Math.min(24, Number(size.radius) || 24),
      normal_color: next ? 0x318c79 : 0x4f4160,
      press_color: 0x6f55a8,
      color: 0xffffff,
      text_size: 18,
      text: next ? `✓ ${String(next.label || 'Next step').slice(0, 34)}` : '💜 Open PlushLife',
      click_func: () => launchApp({ appId: APP_ID, native: false, url: 'pages/index' }),
    })
    createWidget(widget.TEXT, {
      x: pad, y: 154, w: inner, h: 28,
      text: next ? 'Tap to open your next step.' : 'Nothing to catch up on.',
      color: 0x9b8aaa, text_size: 14,
      align_h: align.LEFT, align_v: align.CENTER_V,
      text_style: text_style.ELLIPSIS,
    })
  },
})
