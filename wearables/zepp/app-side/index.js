import { BaseSideService } from '@zeppos/zml/base-side'

const ENDPOINT = 'https://pvitdhixycegmcovapyh.supabase.co/functions/v1/watch-sync'
const DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function secureRandomSegment() {
  const bytes = new Uint8Array(8)
  globalThis.crypto.getRandomValues(bytes)
  let value = ''
  for (let i = 0; i < bytes.length; i += 1) value += bytes[i].toString(16).padStart(2, '0')
  return value
}

function getSecret(storage) {
  let secret = storage.getItem('plushlife_watch_secret')
  if (!secret) {
    secret = `${Date.now()}-`
    for (let index = 0; index < 8; index += 1) secret += `${secureRandomSegment()}-`
    storage.setItem('plushlife_watch_secret', secret)
  }
  return secret
}

function parseBody(body) {
  if (typeof body !== 'string') return body || {}
  try { return JSON.parse(body) } catch (_error) { return { error: 'Invalid server response' } }
}

function phoneContext() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  const hour = now.getHours()
  const minute = now.getMinutes()
  const twelveHour = hour % 12 || 12
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    day_id: DAY_IDS[now.getDay()],
    phone_hour: hour,
    phone_minute: minute,
    phone_time: `${twelveHour}:${pad(minute)} ${hour >= 12 ? 'PM' : 'AM'}`,
    timezone_offset_minutes: -now.getTimezoneOffset(),
  }
}

AppSideService(BaseSideService({
  onRequest(request, response) {
    if (request.method !== 'plushlife.watch') return response('Unknown request')
    const params = request.params || {}
    const timedParams = ['sync', 'complete'].includes(params.action)
      ? { ...params, ...phoneContext() }
      : params
    this.fetch({
      url: ENDPOINT,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...timedParams, device_secret: getSecret(this.settings), device_name: 'Amazfit Balance 2' }),
      timeout: 15000,
    }).then((result) => {
      const body = parseBody(result.body)
      if (result.status < 200 || result.status >= 300) response(body.error || 'Sync failed')
      else response(null, body)
    }).catch(() => response('Phone connection unavailable'))
  },
}))
