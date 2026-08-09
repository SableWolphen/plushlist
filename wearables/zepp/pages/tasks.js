import { BasePage } from '@zeppos/zml/base-page'
import { createWidget, widget, align, text_style } from '@zos/ui'

const PAGE_SIZE = 3
const GROUP_LABELS = {
  morning: 'Morning',
  habits: 'Habits',
  evening: 'Evening',
  night: 'Night',
  extras: 'Extras',
}

function textLabel(text, y, size = 24, color = 0xffffff) {
  return createWidget(widget.TEXT, { x: 48, y, w: 384, h: 54, text, color, text_size: size, align_h: align.CENTER_H, align_v: align.CENTER_V, text_style: text_style.WRAP })
}

Page(BasePage({
  state: {
    tasks: [],
    groups: [],
    activeGroup: null,
    offset: 0,
    total: 0,
    hasMore: false,
    phoneTime: '',
  },
  build() {
    textLabel('PlushLife', 20, 34)
    this.status = textLabel('Connecting through your phone...', 64, 18, 0xd8c7e8)
    this.groupTitle = textLabel('Today', 105, 26, 0xb9f2df)

    this.slotTasks = [null, null, null]
    this.taskButtons = [0, 1, 2].map((index) => createWidget(widget.BUTTON, {
      x: 54,
      y: 154 + (index * 74),
      w: 372,
      h: 62,
      radius: 26,
      normal_color: 0x42364f,
      press_color: 0x8f6ab8,
      color: 0xffffff,
      text_size: 19,
      text: '—',
      click_func: () => {
        const task = this.slotTasks[index]
        if (task) this.toggleTask(task, this.taskButtons[index])
      },
    }))

    this.prevButton = createWidget(widget.BUTTON, {
      x: 72, y: 389, w: 132, h: 58, radius: 26,
      normal_color: 0x4f4160, press_color: 0x6f55a8, color: 0xffffff,
      text_size: 22, text: '‹ Back', click_func: () => this.navigate(-1),
    })
    this.nextButton = createWidget(widget.BUTTON, {
      x: 276, y: 389, w: 132, h: 58, radius: 26,
      normal_color: 0x4f4160, press_color: 0x6f55a8, color: 0xffffff,
      text_size: 22, text: 'Next ›', click_func: () => this.navigate(1),
    })

    this.loadTasks()
  },
  loadTasks(group = null, offset = 0) {
    this.status.setProperty(widget.TEXT, { text: 'Syncing with your phone...' })
    this.request({ method: 'plushlife.watch', params: { action: 'sync', group, offset, limit: PAGE_SIZE } })
      .then((result) => result.connected ? this.showTasks(result) : this.register())
      .catch(() => this.register())
  },
  register() {
    this.request({ method: 'plushlife.watch', params: { action: 'register' } })
      .then((result) => result.connected ? this.loadTasks() : this.showPairing(result.pairing_code))
      .catch(() => this.status.setProperty(widget.TEXT, { text: 'Open Zepp on your phone, then try again.' }))
  },
  showPairing(code) {
    this.status.setProperty(widget.TEXT, { text: 'Phone: PlushLife > Settings > Connect Watch' })
    this.groupTitle.setProperty(widget.TEXT, { text: code || 'Try again' })
    this.slotTasks = [null, null, null]
    this.taskButtons.forEach((button, index) => button.setProperty(widget.BUTTON, {
      text: index === 0 ? 'Enter this code on phone' : '—',
      normal_color: 0x42364f,
    }))
  },
  showTasks(result) {
    this.state.tasks = result.tasks || []
    this.state.groups = result.groups || []
    this.state.activeGroup = result.active_group || null
    this.state.offset = Number(result.offset) || 0
    this.state.total = Number(result.total) || 0
    this.state.hasMore = !!result.has_more
    this.state.phoneTime = result.phone_time || ''

    const label = GROUP_LABELS[this.state.activeGroup] || 'Today'
    const page = Math.floor(this.state.offset / PAGE_SIZE) + 1
    const pageCount = Math.max(1, Math.ceil(this.state.total / PAGE_SIZE))
    this.groupTitle.setProperty(widget.TEXT, { text: `${label} · ${page}/${pageCount}` })
    this.status.setProperty(widget.TEXT, {
      text: this.state.phoneTime
        ? `Phone time ${this.state.phoneTime} · tap to check off`
        : 'Tap a task to check it off',
    })

    this.slotTasks = [0, 1, 2].map((index) => this.state.tasks[index] || null)
    this.taskButtons.forEach((button, index) => {
      const task = this.slotTasks[index]
      button.setProperty(widget.BUTTON, {
        text: task ? `${task.completed ? '✓ ' : ''}${String(task.label).slice(0, 31)}` : '—',
        normal_color: task ? (task.completed ? 0x318c79 : 0x6f55a8) : 0x42364f,
      })
    })
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
    button.setProperty(widget.BUTTON, { text: 'Saving...' })
    this.request({ method: 'plushlife.watch', params: { action: 'complete', task_key: task.key, completed } })
      .then((result) => {
        if (!result.connected) throw new Error('Not connected')
        task.completed = completed
        button.setProperty(widget.BUTTON, {
          text: `${completed ? '✓ ' : ''}${String(task.label).slice(0, 31)}`,
          normal_color: completed ? 0x318c79 : 0x6f55a8,
        })
        this.status.setProperty(widget.TEXT, { text: completed ? 'Saved to PlushLife on your phone ✓' : 'Updated on your phone ✓' })
      })
      .catch(() => button.setProperty(widget.BUTTON, { text: 'Could not save · tap again' }))
  },
}))
