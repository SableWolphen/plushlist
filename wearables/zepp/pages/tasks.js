import { BasePage } from '@zeppos/zml/base-page'
import { createWidget, widget, align, text_style } from '@zos/ui'
import { LocalStorage } from '@zos/storage'
import { Vibrator } from '@zos/sensor'

const PAGE_SIZE = 3
const storage = new LocalStorage()
const vibrator = new Vibrator()
const CACHE_KEY = 'plushlife_watch_tasks_cache_v2'
const SUMMARY_KEY = 'plushlife_watch_summary_v2'
const QUEUE_KEY = 'plushlife_watch_completion_queue_v1'
const RECENT_KEY = 'plushlife_watch_recent_action_v1'
const GROUP_LABELS = {
  morning: 'Morning',
  habits: 'Habits',
  evening: 'Evening',
  night: 'Night',
  extras: 'Extras',
}

function readJson(key, fallback) {
  try { return JSON.parse(storage.getItem(key, '') || '') }
  catch (_error) { return fallback }
}
function saveJson(key, value) { storage.setItem(key, JSON.stringify(value)) }

function textLabel(text, y, size = 24, color = 0xffffff) {
  return createWidget(widget.TEXT, { x: 48, y, w: 384, h: 54, text, color, text_size: size, align_h: align.CENTER_H, align_v: align.CENTER_V, text_style: text_style.WRAP })
}

Page(BasePage({
  state: {
    tasks: [], groups: [], activeGroup: null, offset: 0, total: 0, hasMore: false, phoneTime: '', dayType: 'full', syncing: false,
  },
  build() {
    textLabel('✓ Today’s tasks', 18, 32)
    this.status = textLabel('Opening your last synced list…', 60, 17, 0xd8c7e8)
    this.groupTitle = textLabel('Today', 98, 24, 0xb9f2df)

    this.slotTasks = [null, null, null]
    this.taskButtons = [0, 1, 2].map((index) => createWidget(widget.BUTTON, {
      x: 54, y: 148 + (index * 72), w: 372, h: 60,
      radius: 26, normal_color: 0x42364f, press_color: 0x8f6ab8,
      color: 0xffffff, text_size: 18, text: '—',
      click_func: () => {
        const task = this.slotTasks[index]
        if (task) this.toggleTask(task, this.taskButtons[index])
      },
    }))

    this.prevButton = createWidget(widget.BUTTON, {
      x: 74, y: 376, w: 130, h: 54, radius: 24,
      normal_color: 0x4f4160, press_color: 0x6f55a8, color: 0xffffff,
      text_size: 20, text: '‹ Back', click_func: () => this.navigate(-1),
    })
    this.nextButton = createWidget(widget.BUTTON, {
      x: 276, y: 376, w: 130, h: 54, radius: 24,
      normal_color: 0x4f4160, press_color: 0x6f55a8, color: 0xffffff,
      text_size: 20, text: 'Next ›', click_func: () => this.navigate(1),
    })
    this.offlineNote = textLabel('Tap once. Completions can wait safely for your phone.', 432, 14, 0x81758b)

    const cached = readJson(CACHE_KEY, null)
    if (cached) this.showTasks(cached, true)
    this.flushQueue().then(() => this.loadTasks())
  },
  onResume() {
    if (!this.state.syncing) this.loadTasks(this.state.activeGroup, this.state.offset)
  },
  loadTasks(group = null, offset = 0) {
    this.state.syncing = true
    this.status.setProperty(widget.TEXT, { text: 'Syncing quietly with your phone…' })
    return this.request({ method: 'plushlife.watch', params: { action: 'sync', group, offset, limit: PAGE_SIZE } })
      .then((result) => {
        if (!result?.connected) return this.register()
        saveJson(CACHE_KEY, result)
        saveJson(SUMMARY_KEY, result)
        this.showTasks(result, false)
      })
      .catch(() => {
        const cached = readJson(CACHE_KEY, null)
        if (cached) this.showTasks(cached, true)
        else this.status.setProperty(widget.TEXT, { text: 'Phone unavailable · open PlushLife when you can.' })
      })
      .finally(() => { this.state.syncing = false })
  },
  register() {
    return this.request({ method: 'plushlife.watch', params: { action: 'register' } })
      .then((result) => result.connected ? this.loadTasks() : this.showPairing(result.pairing_code))
      .catch(() => this.status.setProperty(widget.TEXT, { text: 'Open Zepp on your phone, then try again.' }))
  },
  showPairing(code) {
    this.status.setProperty(widget.TEXT, { text: 'Phone: PlushLife > Settings > Connect Watch' })
    this.groupTitle.setProperty(widget.TEXT, { text: code || 'Try again' })
    this.slotTasks = [null, null, null]
    this.taskButtons.forEach((button, index) => button.setProperty(widget.BUTTON, {
      text: index === 0 ? 'Enter this code on phone' : '—', normal_color: 0x42364f,
    }))
  },
  showTasks(result, cached = false) {
    this.state.tasks = result.tasks || []
    this.state.groups = result.groups || []
    this.state.activeGroup = result.active_group || null
    this.state.offset = Number(result.offset) || 0
    this.state.total = Number(result.total) || 0
    this.state.hasMore = !!result.has_more
    this.state.phoneTime = result.phone_time || ''
    this.state.dayType = result.day_type || 'full'

    const label = GROUP_LABELS[this.state.activeGroup] || (this.state.dayType === 'rest' ? 'Rest Day' : 'Today')
    const page = Math.floor(this.state.offset / PAGE_SIZE) + 1
    const pageCount = Math.max(1, Math.ceil(this.state.total / PAGE_SIZE))
    this.groupTitle.setProperty(widget.TEXT, { text: this.state.total ? `${label} · ${page}/${pageCount}` : label })
    this.status.setProperty(widget.TEXT, {
      text: cached
        ? 'Offline copy · changes will sync later'
        : (result.progress_total ? `${result.progress_done || 0}/${result.progress_total} done · tap to check off` : (this.state.dayType === 'rest' ? 'Nothing to do. Rest is the plan.' : 'Tap a task to check it off')),
    })

    this.slotTasks = [0, 1, 2].map((index) => this.state.tasks[index] || null)
    this.taskButtons.forEach((button, index) => {
      const task = this.slotTasks[index]
      button.setProperty(widget.BUTTON, {
        text: task ? `${task.completed ? '✓ ' : ''}${String(task.label).slice(0, 34)}` : '—',
        normal_color: task ? (task.completed ? 0x318c79 : (this.state.dayType === 'tiny' ? 0x6f55a8 : 0x5d4771)) : 0x342c3d,
      })
    })
    this.offlineNote.setProperty(widget.TEXT, { text: cached ? 'Saved locally. Reconnect whenever it’s convenient.' : 'Phone + watch are in sync ✓' })
  },
  navigate(direction) {
    if (!this.state.groups.length || !this.state.activeGroup) return
    const currentIndex = this.state.groups.findIndex((group) => group.id === this.state.activeGroup)
    if (currentIndex < 0) return
    if (direction > 0) {
      if (this.state.hasMore) return this.loadTasks(this.state.activeGroup, this.state.offset + PAGE_SIZE)
      const next = this.state.groups[(currentIndex + 1) % this.state.groups.length]
      return this.loadTasks(next.id, 0)
    }
    if (this.state.offset > 0) return this.loadTasks(this.state.activeGroup, Math.max(0, this.state.offset - PAGE_SIZE))
    const previous = this.state.groups[(currentIndex - 1 + this.state.groups.length) % this.state.groups.length]
    const previousOffset = Math.max(0, Math.floor((Math.max(1, previous.count) - 1) / PAGE_SIZE) * PAGE_SIZE)
    this.loadTasks(previous.id, previousOffset)
  },
  toggleTask(task, button) {
    const completed = !task.completed
    button.setProperty(widget.BUTTON, { text: 'Saving…' })
    this.request({ method: 'plushlife.watch', params: { action: 'complete', task_key: task.key, completed } })
      .then((result) => {
        if (!result?.connected) throw new Error('offline')
        task.completed = completed
        saveJson(RECENT_KEY, { task_key: task.key, label: task.label, completed, undoable: completed, at: Date.now() })
        vibrator.start()
        button.setProperty(widget.BUTTON, {
          text: `${completed ? '✓ ' : ''}${String(task.label).slice(0, 34)}`,
          normal_color: completed ? 0x318c79 : 0x5d4771,
        })
        this.status.setProperty(widget.TEXT, { text: completed ? '✓ That counts. Saved to PlushLife.' : 'Updated on your phone ✓' })
        this.loadTasks(this.state.activeGroup, this.state.offset)
      })
      .catch(() => {
        task.completed = completed
        const queue = readJson(QUEUE_KEY, []).filter((item) => item.task_key !== task.key)
        queue.push({ task_key: task.key, completed })
        saveJson(QUEUE_KEY, queue.slice(-20))
        saveJson(RECENT_KEY, { task_key: task.key, label: task.label, completed, undoable: completed, at: Date.now() })
        const cached = { ...readJson(CACHE_KEY, {}), tasks: this.state.tasks }
        saveJson(CACHE_KEY, cached)
        vibrator.start()
        button.setProperty(widget.BUTTON, {
          text: `${completed ? '✓ ' : ''}${String(task.label).slice(0, 34)}`,
          normal_color: completed ? 0x318c79 : 0x5d4771,
        })
        this.status.setProperty(widget.TEXT, { text: '✓ Saved on watch · will sync later' })
        this.offlineNote.setProperty(widget.TEXT, { text: 'No connection needed to keep moving.' })
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
