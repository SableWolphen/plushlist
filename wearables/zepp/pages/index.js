import { BasePage } from '@zeppos/zml/base-page'
import { createWidget, widget, align, text_style, prop } from '@zos/ui'
import { push } from '@zos/router'
import { LocalStorage } from '@zos/storage'
import { Vibrator } from '@zos/sensor'

const storage = new LocalStorage()
const vibrator = new Vibrator()
const SUMMARY_KEY = 'plushlife_watch_summary_v2'
const QUEUE_KEY = 'plushlife_watch_completion_queue_v1'

function readJson(key, fallback) {
  try { return JSON.parse(storage.getItem(key, '') || '') }
  catch (_error) { return fallback }
}

function saveJson(key, value) {
  storage.setItem(key, JSON.stringify(value))
}

function dayLabel(dayType) {
  const labels = {
    full: '☀ Full Day',
    soft: '🌤 Soft Day',
    tiny: '🌱 Tiny Day',
    recovery: '↺ Recovery Day',
    rest: '🌴 Rest Day',
  }
  return labels[dayType] || labels.full
}

function title(text, y, size = 34, color = 0xffffff, height = 42) {
  return createWidget(widget.TEXT, {
    x: 44, y, w: 392, h: height,
    color,
    text_size: size,
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: text_style.WRAP,
    text
  })
}

function smallButton(text, x, y, color, onTap) {
  return createWidget(widget.BUTTON, {
    x, y, w: 166, h: 54,
    radius: 24,
    normal_color: color,
    press_color: 0x8f6ab8,
    color: 0xffffff,
    text_size: 19,
    text,
    click_func: onTap
  })
}

Page(BasePage({
  state: { summary: null },
  build() {
    title('🧸 PlushLife', 22, 34)
    this.modeText = title('Opening your day…', 64, 18, 0xd8c7e8, 34)
    this.progressText = title('Your last day is ready offline.', 96, 17, 0x9b8aaa, 34)
    this.nextCaption = title('NEXT STEP', 129, 14, 0xb9f2df, 28)
    this.nextButton = createWidget(widget.BUTTON, {
      x: 62, y: 157, w: 356, h: 78,
      radius: 31,
      normal_color: 0x318c79,
      press_color: 0x51a58f,
      color: 0xffffff,
      text_size: 22,
      text: '✓ Open today’s tasks',
      click_func: () => this.completeNextStep(),
    })

    smallButton('✓ Tasks', 66, 258, 0x318c79, () => push({ url: 'pages/tasks' }))
    smallButton('💜 Check in', 248, 258, 0x8f5bd4, () => push({ url: 'pages/checkin' }))
    smallButton('🛟 Rescue', 66, 326, 0xb45283, () => push({ url: 'pages/rescue' }))
    smallButton('🎯 Focus', 248, 326, 0x536ea6, () => push({ url: 'pages/focus' }))
    this.footer = title('Cached first. Phone sync happens quietly.', 397, 15, 0x81758b, 34)

    const cached = readJson(SUMMARY_KEY, null)
    if (cached) this.renderSummary(cached, true)
    this.refresh()
  },
  renderSummary(summary, cached = false) {
    this.state.summary = summary
    const dayType = summary.day_type || 'full'
    const done = Number(summary.progress_done) || 0
    const total = Number(summary.progress_total) || 0
    const mood = storage.getItem('mood', '')
    const energy = storage.getItem('energy', '')
    const localFeeling = mood ? ` · ${mood}${energy ? `/${energy}` : ''}` : ''
    this.modeText.setProperty(prop.TEXT, `${dayLabel(dayType)}${localFeeling}`)
    this.progressText.setProperty(prop.TEXT, total ? `${done} of ${total} cared for today` : (dayType === 'rest' ? 'Rest is the plan today.' : 'Nothing required right now.'))

    if (summary.next_step) {
      const label = String(summary.next_step.label || 'Next step').slice(0, 42)
      this.nextCaption.setProperty(prop.TEXT, 'NEXT STEP · TAP WHEN DONE')
      this.nextButton.setProperty(widget.BUTTON, {
        text: `✓ ${label}`,
        normal_color: dayType === 'tiny' ? 0x6f55a8 : 0x318c79,
      })
    } else {
      this.nextCaption.setProperty(prop.TEXT, dayType === 'rest' ? 'TODAY' : 'ALL CLEAR')
      this.nextButton.setProperty(widget.BUTTON, {
        text: dayType === 'rest' ? '🌴 Rest is enough' : '💜 You’re caught up',
        normal_color: 0x4f4160,
      })
    }
    this.footer.setProperty(prop.TEXT, cached ? 'Showing your last sync while I refresh.' : 'Phone + watch are in sync ✓')
  },
  refresh() {
    this.flushQueue().then(() => this.request({ method: 'plushlife.watch', params: { action: 'sync', limit: 5 } }))
      .then((result) => {
        if (!result?.connected) return
        saveJson(SUMMARY_KEY, result)
        this.renderSummary(result, false)
      })
      .catch(() => {
        if (!this.state.summary) this.footer.setProperty(prop.TEXT, 'Phone unavailable · watch still works offline')
      })
  },
  completeNextStep() {
    const task = this.state.summary?.next_step
    if (!task) return push({ url: 'pages/tasks' })
    this.nextButton.setProperty(widget.BUTTON, { text: 'Saving…' })
    this.request({ method: 'plushlife.watch', params: { action: 'complete', task_key: task.key, completed: true } })
      .then((result) => {
        if (!result?.connected) throw new Error('offline')
        vibrator.start()
        this.footer.setProperty(prop.TEXT, '✓ That counts. Updating today…')
        this.refresh()
      })
      .catch(() => {
        const queue = readJson(QUEUE_KEY, [])
        const filtered = queue.filter((item) => item.task_key !== task.key)
        filtered.push({ task_key: task.key, completed: true })
        saveJson(QUEUE_KEY, filtered.slice(-20))
        vibrator.start()
        const summary = { ...this.state.summary, progress_done: Math.min((Number(this.state.summary?.progress_done) || 0) + 1, Number(this.state.summary?.progress_total) || 0), next_step: null }
        saveJson(SUMMARY_KEY, summary)
        this.renderSummary(summary, true)
        this.footer.setProperty(prop.TEXT, '✓ Saved on watch · will sync when phone returns')
      })
  },
  flushQueue() {
    const queue = readJson(QUEUE_KEY, [])
    if (!queue.length) return Promise.resolve()
    let chain = Promise.resolve()
    const remaining = [...queue]
    queue.forEach((item) => {
      chain = chain.then(() => this.request({ method: 'plushlife.watch', params: { action: 'complete', task_key: item.task_key, completed: !!item.completed } })
        .then((result) => {
          if (!result?.connected) throw new Error('offline')
          remaining.shift()
          saveJson(QUEUE_KEY, remaining)
        }))
    })
    return chain.catch(() => {})
  },
}))
