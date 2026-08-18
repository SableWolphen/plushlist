import { createWidget, widget, align, prop } from '@zos/ui'
import { LocalStorage } from '@zos/storage'
import { Vibrator } from '@zos/sensor'

const storage = new LocalStorage()
const vibrator = new Vibrator()

function formatRemaining(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function dayKey() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

Page({
  build() {
    this.durationMinutes = Number(storage.getItem('focusDurationMinutes', 15)) || 15
    this.timerId = null
    this.completedBuzzed = false

    createWidget(widget.TEXT, { x: 40, y: 20, w: 400, h: 46, color: 0xffffff, text_size: 31, align_h: align.CENTER_H, align_v: align.CENTER_V, text: '🎯 PlushFocus' })
    this.label = createWidget(widget.TEXT, {
      x: 48, y: 64, w: 384, h: 58,
      color: 0xe9d8ff, text_size: 18,
      align_h: align.CENTER_H, align_v: align.CENTER_V,
      text: 'One thing. One gentle block. Stopping early still counts.'
    })
    this.timerText = createWidget(widget.TEXT, {
      x: 90, y: 120, w: 300, h: 78,
      color: 0xffffff, text_size: 46,
      align_h: align.CENTER_H, align_v: align.CENTER_V,
      text: `${String(this.durationMinutes).padStart(2, '0')}:00`
    })

    const setDuration = (minutes) => {
      if (Number(storage.getItem('focusStartedAt', 0)) || 0) return
      this.durationMinutes = minutes
      storage.setItem('focusDurationMinutes', minutes)
      this.timerText.setProperty(prop.TEXT, `${String(minutes).padStart(2, '0')}:00`)
      this.label.setProperty(prop.TEXT, `${minutes} gentle minutes. You can stop sooner.`)
      vibrator.start()
    }

    ;[[10, 62], [15, 180], [25, 298]].forEach(([minutes, x]) => createWidget(widget.BUTTON, {
      x, y: 204, w: 120, h: 50, radius: 22,
      normal_color: minutes === this.durationMinutes ? 0x536ea6 : 0x42364f,
      press_color: 0x7188bc, color: 0xffffff, text_size: 19,
      text: `${minutes} min`, click_func: () => setDuration(minutes),
    }))

    this.startButton = createWidget(widget.BUTTON, {
      x: 70, y: 270, w: 340, h: 64, radius: 30,
      normal_color: 0x536ea6, press_color: 0x7188bc,
      color: 0xffffff, text_size: 23, text: 'Start focus',
      click_func: () => this.startFocus()
    })

    this.stopButton = createWidget(widget.BUTTON, {
      x: 90, y: 348, w: 300, h: 56, radius: 26,
      normal_color: 0x6f55a8, press_color: 0x8f6ab8,
      color: 0xffffff, text_size: 20, text: 'Finish for now',
      click_func: () => this.finishFocus(false)
    })

    this.historyText = createWidget(widget.TEXT, { x: 60, y: 412, w: 360, h: 30, color: 0xb9f2df, text_size: 15, align_h: align.CENTER_H, align_v: align.CENTER_V, text: '' })
    this.updateHistory()

    const startedAt = Number(storage.getItem('focusStartedAt', 0)) || 0
    if (startedAt) this.resumeFocus(startedAt)
  },
  updateHistory() {
    const key = `focusMinutes:${dayKey()}`
    const minutes = Number(storage.getItem(key, 0)) || 0
    this.historyText.setProperty(prop.TEXT, minutes ? `Today: ${minutes} gentle focus min` : 'No focus minutes owed today.')
  },
  addMinutes(minutes) {
    const key = `focusMinutes:${dayKey()}`
    const current = Number(storage.getItem(key, 0)) || 0
    storage.setItem(key, current + Math.max(0, Math.round(minutes)))
    this.updateHistory()
  },
  startFocus() {
    const now = Date.now()
    storage.setItem('focusStartedAt', now)
    storage.setItem('focusTargetMinutes', this.durationMinutes)
    this.completedBuzzed = false
    vibrator.start()
    this.label.setProperty(prop.TEXT, 'Focus started 💜 Stay with just one thing.')
    this.startButton.setProperty(widget.BUTTON, { text: 'Focus running…' })
    this.resumeFocus(now)
  },
  resumeFocus(startedAt) {
    if (this.timerId) clearInterval(this.timerId)
    const duration = Number(storage.getItem('focusTargetMinutes', this.durationMinutes)) || this.durationMinutes
    const endAt = startedAt + (duration * 60 * 1000)
    const tick = () => {
      const remaining = endAt - Date.now()
      this.timerText.setProperty(prop.TEXT, formatRemaining(remaining))
      if (remaining <= 0 && !this.completedBuzzed) {
        this.completedBuzzed = true
        vibrator.start()
        this.label.setProperty(prop.TEXT, 'That block is complete. Nice work. 💜')
        this.startButton.setProperty(widget.BUTTON, { text: 'Start another block' })
        storage.setItem('focusStartedAt', 0)
        storage.setItem('focusStoppedAt', Date.now())
        storage.setItem('lastFocusMinutes', duration)
        this.addMinutes(duration)
        if (this.timerId) clearInterval(this.timerId)
        this.timerId = null
      }
    }
    tick()
    if (!this.completedBuzzed) this.timerId = setInterval(tick, 1000)
  },
  finishFocus(completed) {
    const active = Number(storage.getItem('focusStartedAt', 0)) || 0
    if (active) {
      const minutes = Math.max(1, Math.round((Date.now() - active) / 60000))
      storage.setItem('lastFocusMinutes', minutes)
      this.addMinutes(minutes)
    }
    storage.setItem('focusStoppedAt', Date.now())
    storage.setItem('focusStartedAt', 0)
    if (this.timerId) clearInterval(this.timerId)
    this.timerId = null
    vibrator.start()
    this.label.setProperty(prop.TEXT, completed ? 'Done. That counts. 💜' : 'Nice. That counts. No need to squeeze out more.')
    this.timerText.setProperty(prop.TEXT, `${String(this.durationMinutes).padStart(2, '0')}:00`)
    this.startButton.setProperty(widget.BUTTON, { text: 'Start focus' })
  },
  onDestroy() {
    if (this.timerId) clearInterval(this.timerId)
  }
})
