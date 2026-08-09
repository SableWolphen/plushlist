import { BasePage } from '@zeppos/zml/base-page'
import { createWidget, widget, align, text_style } from '@zos/ui'

const dayIds = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
function localDay() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return { date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, day_id: dayIds[now.getDay()] }
}
function textLabel(text, y, size = 24, color = 0xffffff) {
  return createWidget(widget.TEXT, { x: 48, y, w: 384, h: 60, text, color, text_size: size, align_h: align.CENTER_H, align_v: align.CENTER_V, text_style: text_style.WRAP })
}

Page(BasePage({
  state: { tasks: [] },
  build() {
    textLabel('PlushLife tasks', 28, 34)
    this.status = textLabel('Connecting through your phone...', 86, 20, 0xd8c7e8)
    this.loadTasks()
  },
  loadTasks() {
    this.request({ method: 'plushlife.watch', params: { action: 'sync', ...localDay() } })
      .then((result) => result.connected ? this.showTasks(result.tasks || []) : this.register())
      .catch(() => this.register())
  },
  register() {
    this.request({ method: 'plushlife.watch', params: { action: 'register' } })
      .then((result) => result.connected ? this.loadTasks() : this.showPairing(result.pairing_code))
      .catch(() => this.status.setProperty(widget.TEXT, { text: 'Open Zepp on your phone, then try again.' }))
  },
  showPairing(code) {
    this.status.setProperty(widget.TEXT, { text: 'Phone: PlushLife > Settings > Connect Watch' })
    textLabel(code || 'Try again', 170, 48, 0xb9f2df)
    textLabel('Enter this code within 15 minutes.', 238, 19, 0xd8c7e8)
    createWidget(widget.BUTTON, { x: 105, y: 320, w: 270, h: 68, radius: 32, normal_color: 0x318c79, press_color: 0x246f61, color: 0xffffff, text_size: 23, text: 'I connected it', click_func: () => this.loadTasks() })
  },
  showTasks(tasks) {
    this.state.tasks = tasks
    this.status.setProperty(widget.TEXT, { text: tasks.length ? 'Tap a task to mark it done' : 'Nothing scheduled today' })
    tasks.slice(0, 4).forEach((task, index) => {
      const button = createWidget(widget.BUTTON, {
        x: 56, y: 145 + (index * 78), w: 368, h: 66, radius: 28,
        normal_color: task.completed ? 0x318c79 : 0x6f55a8, press_color: 0x8f6ab8,
        color: 0xffffff, text_size: 20, text: `${task.completed ? 'Done: ' : ''}${String(task.label).slice(0, 28)}`,
        click_func: () => this.toggleTask(task, button),
      })
    })
  },
  toggleTask(task, button) {
    const completed = !task.completed
    button.setProperty(widget.BUTTON, { text: 'Saving...' })
    this.request({ method: 'plushlife.watch', params: { action: 'complete', task_key: task.key, completed, ...localDay() } })
      .then(() => {
        task.completed = completed
        button.setProperty(widget.BUTTON, { text: `${completed ? 'Done: ' : ''}${String(task.label).slice(0, 28)}`, normal_color: completed ? 0x318c79 : 0x6f55a8 })
      })
      .catch(() => button.setProperty(widget.BUTTON, { text: 'Could not save - tap again' }))
  },
}))
