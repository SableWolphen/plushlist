import { BaseSideService } from '@zeppos/zml/base-side'

const ENDPOINT = 'https://pvitdhixycegmcovapyh.supabase.co/functions/v1/watch-sync'

function getSecret(storage) {
  let secret = storage.getItem('plushlife_watch_secret')
  if (!secret) {
    secret = `${Date.now()}-`
    for (let index = 0; index < 8; index += 1) secret += `${Math.random().toString(36).slice(2)}-`
    storage.setItem('plushlife_watch_secret', secret)
  }
  return secret
}

function parseBody(body) {
  if (typeof body !== 'string') return body || {}
  try { return JSON.parse(body) } catch (_error) { return { error: 'Invalid server response' } }
}

AppSideService(BaseSideService({
  onRequest(request, response) {
    if (request.method !== 'plushlife.watch') return response('Unknown request')
    this.fetch({
      url: ENDPOINT,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...request.params, device_secret: getSecret(this.settings), device_name: 'Amazfit Balance 2' }),
      timeout: 15000,
    }).then((result) => {
      const body = parseBody(result.body)
      if (result.status < 200 || result.status >= 300) response(body.error || 'Sync failed')
      else response(null, body)
    }).catch(() => response('Phone connection unavailable'))
  },
}))
