import { buildReport, invalidateReport } from './lib/report.js'

const DATE = /^\d{4}-\d{2}-\d{2}$/

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

/**
 * Host half of the Token 账单 bundle.
 *
 * Serves one read-only snapshot from the local cost-meter ledger plus the
 * durable session logs. Nothing is sent off the machine; the route rejects
 * cross-origin browser requests and answers GET only.
 */
export const inject = ['webServer']

export function apply(ctx) {
  const origin = () => {
    try { return ctx.webServer.getOrigin() } catch { return '' }
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/token-bill/report',
    handler: async (req, res) => {
      try {
        if (req.method !== 'GET') return send(res, 405, { error: '只支持 GET' })
        const allowed = origin()
        const requestOrigin = req.headers.origin
        if (allowed && requestOrigin && requestOrigin !== allowed) return send(res, 403, { error: '只接受本机同源请求' })
        const site = req.headers['sec-fetch-site']
        if (site && site !== 'same-origin' && site !== 'none') return send(res, 403, { error: '只接受本机同源请求' })

        const url = new URL(req.url, 'http://127.0.0.1')
        const from = url.searchParams.get('from') || ''
        const to = url.searchParams.get('to') || ''
        const currency = (url.searchParams.get('currency') || 'CNY').toUpperCase()
        const sessionId = (url.searchParams.get('sessionId') || '').slice(0, 512)
        if (from && !DATE.test(from)) return send(res, 400, { error: 'from 需要 YYYY-MM-DD' })
        if (to && !DATE.test(to)) return send(res, 400, { error: 'to 需要 YYYY-MM-DD' })
        if (from && to && from > to) return send(res, 400, { error: 'from 不能晚于 to' })
        if (!['CNY', 'USD', 'EUR'].includes(currency)) return send(res, 400, { error: 'currency 需要 CNY/USD/EUR' })
        if (url.searchParams.get('refresh') === '1') invalidateReport()

        const report = buildReport({ from, to, currency, sessionId })
        send(res, 200, report)
      } catch (error) {
        send(res, 500, { error: error?.message || String(error) })
      }
    },
  }), 'token-bill: /token-bill/report')
}
