import { buildReport, invalidateReport } from './lib/report.js'
import { exportReport } from './lib/export.js'

const DATE = /^\d{4}-\d{2}-\d{2}$/
const GITHUB_REPO = 'https://github.com/renzg/dsh-token-bill'
const GITHUB_API = 'https://api.github.com/repos/renzg/dsh-token-bill'
let githubCache = { stars: null, at: 0 }

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

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/token-bill/report/export',
    handler: async (req, res) => {
      try {
        if (req.method !== 'GET') return send(res, 405, { error: '只支持 GET' })
        const allowed = origin()
        const requestOrigin = req.headers.origin
        if (allowed && requestOrigin && requestOrigin !== allowed) return send(res, 403, { error: '只接受本机同源请求' })
        const site = req.headers['sec-fetch-site']
        if (site && site !== 'same-origin' && site !== 'none') return send(res, 403, { error: '只接受本机同源请求' })

        const url = new URL(req.url, 'http://127.0.0.1')
        const format = String(url.searchParams.get('format') || '').toLowerCase()
        if (!['html', 'pdf', 'docx', 'json'].includes(format)) return send(res, 400, { error: 'format 需要 html/pdf/docx/json' })
        const from = url.searchParams.get('from') || ''
        const to = url.searchParams.get('to') || ''
        const currency = (url.searchParams.get('currency') || 'CNY').toUpperCase()
        const sessionId = (url.searchParams.get('sessionId') || '').slice(0, 512)
        if (from && !DATE.test(from)) return send(res, 400, { error: 'from 需要 YYYY-MM-DD' })
        if (to && !DATE.test(to)) return send(res, 400, { error: 'to 需要 YYYY-MM-DD' })
        if (from && to && from > to) return send(res, 400, { error: 'from 不能晚于 to' })
        if (!['CNY', 'USD', 'EUR'].includes(currency)) return send(res, 400, { error: 'currency 需要 CNY/USD/EUR' })

        const report = buildReport({ from, to, currency, sessionId })
        const file = await exportReport(format, report)
        res.statusCode = 200
        res.setHeader('content-type', file.type)
        res.setHeader('content-disposition', `attachment; filename="${file.name}"`)
        res.setHeader('content-length', file.body.length)
        res.setHeader('cache-control', 'no-store')
        res.setHeader('x-content-type-options', 'nosniff')
        res.end(file.body)
      } catch (error) {
        if (!res.headersSent) send(res, 500, { error: error?.message || String(error) })
        else res.destroy(error)
      }
    },
  }), 'token-bill: /token-bill/report/export')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/token-bill/github',
    handler: async (req, res) => {
      try {
        if (req.method !== 'GET') return send(res, 405, { error: '只支持 GET' })
        const allowed = origin()
        const requestOrigin = req.headers.origin
        if (allowed && requestOrigin && requestOrigin !== allowed) return send(res, 403, { error: '只接受本机同源请求' })
        const site = req.headers['sec-fetch-site']
        if (site && site !== 'same-origin' && site !== 'none') return send(res, 403, { error: '只接受本机同源请求' })

        if (Date.now() - githubCache.at < 10 * 60 * 1000) {
          return send(res, 200, { stars: githubCache.stars, url: GITHUB_REPO })
        }
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 8000)
        try {
          const response = await fetch(GITHUB_API, {
            headers: { accept: 'application/vnd.github+json', 'user-agent': 'dsh-token-bill' },
            signal: controller.signal,
          })
          const body = await response.json().catch(() => ({}))
          const stars = Number(body?.stargazers_count)
          if (response.ok && Number.isFinite(stars)) githubCache = { stars, at: Date.now() }
          send(res, 200, { stars: Number.isFinite(stars) ? stars : null, url: GITHUB_REPO })
        } finally {
          clearTimeout(timer)
        }
      } catch (error) {
        send(res, 200, { stars: githubCache.stars, url: GITHUB_REPO, error: error?.message || String(error) })
      }
    },
  }), 'token-bill: /token-bill/github')
}
