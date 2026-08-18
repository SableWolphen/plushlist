import { BasePage } from '@zeppos/zml/base-page'
import { createWidget, widget, align, text_style, prop } from '@zos/ui'
import { push } from '@zos/router'
import { LocalStorage } from '@zos/storage'
import { Vibrator } from '@zos/sensor'

const storage = new LocalStorage()
const vibrator = new Vibrator()
const SUMMARY_KEY = 'plushlife_watch_summary_v2'
const QUEUE_KEY = 'plushlife_watch_completion_queue_v1'
const RECENT_KEY = 'plushlife_watch_recent_action_v1'

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

function whyNextStep(task, dayType) {
  if (!task) return ''
  if (dayType === 'tiny') return 'Tiny enough for today.'
  if (dayType === 'recovery') return 'A gentle essential while you recover.'
  if (dayType === 'soft') return 'A lower-pressure step that still matters.'
  const hour = new Date().getHours()
  const group = String(task.group || '')
  if ((hour < 12 && group === 'morning') || (hour >= 17 && hour < 21 && group === 'evening') || (hour >= 21 && group === 'night')) return 'Fits this part of your day.'
  const minutes = Number(task.estimated_minutes) || 0
  if (minutes && minutes <= 5) return 'A quick win you can finish now.'
  return 'A useful next step, not the whole list.'
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
    x, y, w: 166, h: 52,
    radius: 23,
    normal_color: color,
    press_color: 0x8f6ab8,
    color: 0xffffff,
    text_size: 19,
    text,
    click_func: onTap
  })
}

Page(BasePage({
  state: { summary: null, syncing: false },
  build() {
    title('🧸 PlushLife', 18, 33)
    this.modeText = title('Opening your day…', 56, 18, 0xd8c7e8, 32)
    this.progressText = title('Your last day is ready offline.', 87, 17, 0xb9f2df, 30)
    this.nextCaption = title('NEXT STEP', 116, 14, 0xb9f2df, 25)
    this.nextButton = createWidget(widget.BUTTON, {
      x: 62, y: 142, w: 356, h: 72,
      radius: 30,
      normal_color: 0x318c79,
      press_color: 0x51a58f,
      color: 0xffffff,
      text_size: 21,
      text: '✓ Open today’s tasks',
      click_func: () => this.completeNextStep(),
    })
    this.reasonText = title('One useful thing at a time.', 216, 15, 0x9b8aaa, 27)
    this.recentButton = createWidget(widget.BUTTON, {
      x: 110, y: 246, w: 260, h: 40,
      radius: 18,
      normal_color: 0x342c3d,
      press_color: 0x4f4160,
      color: 0xd8c7e8,
      text_size: 16,
      text: 'Recent actions appear here',
      click_func: () => this.undoRecent(),
    })

    this.tasksButton = smallButton('✓ Tasks', 66, 298, 0x318c79, () => push({ url: 'pages/tasks' }))
    this.checkinButton = smallButton('💜 Check in', 248, 298, 0x8f5bd4, () => push({ url: 'pages/checkin' }))
    this.rescueButton = smallButton('🛟 Rescue', 66, 360, 0xb45283, () => push({ url: 'pages/rescue' }))
    this.focusButton = smallButton('🎯 Focus', 248, 360, 0x536ea6, () => push({ url: 'pages/focus' }))
    this.footer = title('Cached first. Phone sync happens quietly.', 416, 14, 0x81758b, 28)

    const cached = readJson(SUMMARY_KEY, null)
    if (cached) this.renderSummary(cached, true)
    else this.applyFeelingPriority()
    this.renderRecent()
    this.refresh()
  },
  onResume() {
    this.renderRecent()
    this.applyFeelingPriority()
    if (!this.state.syncing) this.refresh()
  },
  applyFeelingPriority() {
    const mood = storage.getItem('mood', '')
    const energy = storage.getItem('energy', '')
    const needsGentle = ['Rough', 'Too much'].includes(mood) || energy === 'Low'
    this.rescueButton.setProperty(widget.BUTTON, {
      text: needsGentle ? '🛟 Rescue first' : '🛟 Rescue',
      normal_color: needsGentle ? 0xc15a8d : 0xb45283,
    })
    this.focusButton.setProperty(widget.BUTTON, {
      text: needsGentle ? '🎯 Gentle focus' : '🎯 Focus',
      normal_color: needsGentle ? 0x4f4160 : 0x536ea6,
    })
    return needsGentle
  },
  renderRecent() {
    const recent = readJson(RECENT_KEY, null)
    if (!recent) {
      this.recentButton.setProperty(widget.BUTTON, { text: 'Recent actions appear here', normal_color: 0x342c3d })
      return
    }
    const label = String(recent.label || 'task').slice(0, 25)
    this.recentButton.setProperty(widget.BUTTON, {
      text: recent.undoable ? `↶ Undo · ${label}` : `✓ Last · ${label}`,
      normal_color: recent.undoable ? 0x4f4160 : 0x342c3d,
    })
  },
  renderSummary(summary, cached = false) {
    this.state.summary = summary
    const dayType = summary.day_type || 'full'
    const done = Number(summary.progress_done) || 0
    const total = Number(summary.progress_total) || 0
    const mood = storage.getItem('mood', '')
    const energy = storage.getItem('energy', '')
    const localFeeling = mood ? ` · ${mood}${energy ? `/${energy}` : ''}` : ''
    const needsGentle = this.applyFeelingPriority()

    this.modeText.setProperty(prop.TEXT, `${dayLabel(dayType)}${localFeeling}`)
    this.progressText.setProperty(prop.TEXT, total ? `${done} of ${total} cared for today` : (dayType === 'rest' ? 'Rest is the plan today.' : 'Nothing required right now.'))

    if (summary.next_step) {
      const label = String(summary.next_step.label || 'Next step').slice(0, 42)
      this.nextCaption.setProperty(prop.TEXT, needsGentle || ['soft', 'tiny', 'recovery'].includes(dayType) ? 'GENTLE NEXT STEP · TAP WHEN DONE' : 'NEXT STEP · TAP WHEN DONE')
      this.nextButton.setProperty(widget.BUTTON, {
        text: `✓ ${label}`,
        normal_color: dayType === 'tiny' || needsGentle ? 0x6f55a8 : 0x318c79,
      })
      this.reasonText.setProperty(prop.TEXT, needsGentle ? 'Keeping this especially gentle right now.' : whyNextStep(summary.next_step, dayType))
    } else {
      this.nextCaption.setProperty(prop.TEXT, dayType === 'rest' ? 'TODAY' : 'ALL CLEAR')
      this.nextButton.setProperty(widget.BUTTON, {
        text: dayType === 'rest' ? '🌴 Rest is enough' : '💜 You’re good for today',
        normal_color: 0x4f4160,
      })
      this.reasonText.setProperty(prop.TEXT, dayType === 'rest' ? 'No catch-up. No hidden checklist.' : 'Essentials are handled. PlushLife can quiet down now.')
    }

    this.footer.setProperty(prop.TEXT, cached ? 'Showing your last sync while I refresh.' : 'Phone + watch are in sync ✓')
  },
  refresh() {
    this.state.syncing = true
    return this.flushQueue().then(() => this.request({ method: 'plushlife.watch', params: { action: 'sync', limit: 5 } }))
      .then((result) => {
        if (!result?.connected) return
        saveJson(SUMMARY_KEY, result)
        this.renderSummary(result, false)
      })
      .catch(() => {
        if (!this.state.summary) this.footer.setProperty(prop.TEXT, 'Phone unavailable · watch still works offline')
      })
      .finally(() => { this.state.syncing = false })
  },
  completeNextStep() {
    const task = this.state.summary?.next_step
    if (!task) return push({ url: 'pages/tasks' })
    this.nextButton.setProperty(widget.BUTTON, { text: 'Saving…' })
    this.request({ method: 'plushlife.watch', params: { action: 'complete', task_key: task.key, completed: true } })
      .then((result) => {
        if (!result?.connected) throw new Error('offline')
        vibrator.start()
        saveJson(RECENT_KEY, { task_key: task.key, label: task.label, completed: true, undoable: true, at: Date.now() })
        this.renderRecent()
        this.footer.setProperty(prop.TEXT, '✓ That counts. Updating today…')
        this.refresh()
      })
      .catch(() => {
        const queue = readJson(QUEUE_KEY, [])
        const filtered = queue.filter((item) => item.task_key !== task.key)
        filtered.push({ task_key: task.key, completed: true })
        saveJson(QUEUE_KEY, filtered.slice(-20))
        vibrator.start()
        saveJson(RECENT_KEY, { task_key: task.key, label: task.label, completed: true, undoable: true, at: Date.now() })
        const summary = { ...this.state.summary, progress_done: Math.min((Number(this.state.summary?.progress_done) || 0) + 1, Number(this.state.summary?.progress_total) || 0), next_step: null }
        saveJson(SUMMARY_KEY, summary)
        this.renderSummary(summary, true)
        this.renderRecent()
        this.footer.setProperty(prop.TEXT, '✓ Saved on watch · will sync when phone returns')
      })
  },
  undoRecent() {
    const recent = readJson(RECENT_KEY, null)
    if (!recent?.undoable || !recent.task_key) return
    this.recentButton.setProperty(widget.BUTTON, { text: 'Undoing…' })
    this.request({ method: 'plushlife.watch', params: { action: 'complete', task_key: recent.task_key, completed: false } })
      .then((result) => {
        if (!result?.connected) throw new Error('offline')
        vibrator.start()
        saveJson(RECENT_KEY, { ...recent, completed: false, undoable: false, at: Date.now() })
        this.renderRecent()
        this.footer.setProperty(prop.TEXT, 'Undone ✓')
        this.refresh()
      })
      .catch(() => {
        const queue = readJson(QUEUE_KEY, []).filter((item) => item.task_key !== recent.task_key)
        queue.push({ task_key: recent.task_key, completed: false })
        saveJson(QUEUE_KEY, queue.slice(-20))
        saveJson(RECENT_KEY, { ...recent, completed: false, undoable: false, at: Date.now() })
        vibrator.start()
        this.renderRecent()
        this.footer.setProperty(prop.TEXT, 'Undo saved on watch · will sync later')
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
