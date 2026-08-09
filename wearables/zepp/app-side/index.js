import { BaseSideService } from '@zeppos/zml/base-side'

const ENDPOINT = 'https://pvitdhixycegmcovapyh.supabase.co/functions/v1/watch-sync'
// Same-device loopback only — this never touches Wi-Fi/cellular and costs
// nothing. Entirely separate pairing from ENDPOINT above: a different
// secret, a different (code-free) trust model appropriate to "already
// Bluetooth-paired to this exact phone." See android/.../watchsync/. Only
// ever used to make "tap to mark done" instant; task list sync/pairing
// still always goes through ENDPOINT unchanged.
const LOCAL_ENDPOINT = 'http://127.0.0.1:8787'
const LOCAL_TIMEOUT_MS = 2500
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

// Unlike the cloud secret above, a local secret is only ever set once the
// phone's local server has actually issued one (see tryLocalRegister) — it
// is never locally invented, since the phone is the one deciding whether a
// pairing window is currently open.
function getLocalSecret(storage) {
  return storage.getItem('plushlife_watch_secret_local') || null
}

// Best-effort, silent, and non-blocking: succeeds only if the user has
// recently tapped "Enable instant local sync" on the phone (a short
// pairing window — see WatchSyncBridgePlugin#startPairingMode). Any
// failure here is expected and unremarkable — most of the time no pairing
// window is open, and complete() below already falls back to the cloud
// path exactly as it always has.
function tryLocalRegister(fetchImpl, storage) {
  return fetchImpl({
    url: `${LOCAL_ENDPOINT}/register`,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
    timeout: LOCAL_TIMEOUT_MS,
  }).then((result) => {
    const body = parseBody(result.body)
    if (result.status >= 200 && result.status < 300 && body.device_secret) {
      storage.setItem('plushlife_watch_secret_local', body.device_secret)
    }
  }).catch(() => {})
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

function fetchCloud(fetchImpl, timedParams, storage) {
  return fetchImpl({
    url: ENDPOINT,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...timedParams, device_secret: getSecret(storage), device_name: 'Amazfit Balance 2' }),
    timeout: 15000,
  })
}

AppSideService(BaseSideService({
  onRequest(request, response) {
    if (request.method !== 'plushlife.watch') return response('Unknown request')
    const params = request.params || {}
    const timedParams = ['sync', 'complete'].includes(params.action)
      ? { ...params, ...phoneContext() }
      : params

    // Opportunistic — never blocks or affects this request's own response.
    // Picks up a local secret the moment a phone-side pairing window is
    // open, without the user having to do anything on the watch for it.
    if (!getLocalSecret(this.settings)) tryLocalRegister(this.fetch.bind(this), this.settings)

    const respondFromCloud = () => fetchCloud(this.fetch.bind(this), timedParams, this.settings)
      .then((result) => {
        const body = parseBody(result.body)
        if (result.status < 200 || result.status >= 300) response(body.error || 'Sync failed')
        else response(null, body)
      }).catch(() => response('Phone connection unavailable'))

    const localSecret = getLocalSecret(this.settings)
    if (params.action === 'complete' && localSecret) {
      this.fetch({
        url: `${LOCAL_ENDPOINT}/complete`,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...timedParams, device_secret: localSecret }),
        timeout: LOCAL_TIMEOUT_MS,
      }).then((result) => {
        const body = parseBody(result.body)
        if (result.status >= 200 && result.status < 300) return response(null, body)
        // Local secret revoked/stale (e.g. the phone app's data was
        // cleared) — drop it and fall back to cloud, same as if local
        // sync had never been enabled.
        this.settings.setItem('plushlife_watch_secret_local', '')
        return respondFromCloud()
      }).catch(respondFromCloud)
      return
    }

    respondFromCloud()
  },
}))
