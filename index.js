import { readFileSync } from 'node:fs'
import { buildReport, invalidateReport } from './lib/report.js'
import { exportReport } from './lib/export.js'
import { buildReportHtml } from './lib/report-html.js'
import { readSessionUsage, readSessionCost } from './lib/session-usage.js'
import { getLimits, getDefaultLimits, saveDefaultLimits, saveSessionLimits, clearSessionLimits, evaluateAlerts } from './lib/limits.js'

const DATE = /^\d{4}-\d{2}-\d{2}$/
const GITHUB_REPO = 'https://github.com/renzg/dsh-token-bill'
const GITHUB_API = 'https://api.github.com/repos/renzg/dsh-token-bill'
const GITHUB_LATEST_RELEASE = `${GITHUB_API}/releases/latest`

let CURRENT_VERSION = ''
try {
  CURRENT_VERSION = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version || ''
} catch { CURRENT_VERSION = '' }

let githubCache = { stars: null, latest: null, at: 0 }

function parseVersion(value) {
  const clean = String(value || '').trim().replace(/^v/i, '').replace(/[-+].*$/, '')
  if (!clean) return []
  return clean.split('.').slice(0, 3).map(part => {
    const number = Number.parseInt(part, 10)
    return Number.isFinite(number) ? number : 0
  })
}

function isNewerVersion(latest, current) {
  const next = parseVersion(latest)
  const now = parseVersion(current)
  if (!next.length || !now.length) return false
  for (let index = 0; index < 3; index += 1) {
    const a = next[index] || 0
    const b = now[index] || 0
    if (a !== b) return a > b
  }
  return false
}

function readReportQuery(url) {
  const from = url.searchParams.get('from') || ''
  const to = url.searchParams.get('to') || ''
  const currency = (url.searchParams.get('currency') || 'CNY').toUpperCase()
  const sessionId = (url.searchParams.get('sessionId') || '').slice(0, 512)
  if (from && !DATE.test(from)) return { error: 'from 需要 YYYY-MM-DD' }
  if (to && !DATE.test(to)) return { error: 'to 需要 YYYY-MM-DD' }
  if (from && to && from > to) return { error: 'from 不能晚于 to' }
  if (!['CNY', 'USD', 'EUR'].includes(currency)) return { error: 'currency 需要 CNY/USD/EUR' }
  return { from, to, currency, sessionId }
}

function exportHref(format, params, extra = {}) {
  const query = new URLSearchParams({ format })
  for (const [key, value] of Object.entries({ ...params, ...extra })) {
    if (value) query.set(key, value)
  }
  return `/token-bill/report/export?${query.toString()}`
}

const escapeHtmlAttr = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]))

const PREVIEW_BAR_CSS = `
.tb-dl-bar{position:fixed;right:18px;bottom:18px;z-index:9999;display:flex;align-items:center;gap:12px;padding:9px 12px 9px 16px;border-radius:999px;background:rgba(42,74,120,.95);color:#F5F8FC;font:13px/1.4 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;box-shadow:0 10px 30px rgba(20,35,60,.28)}
.tb-dl-bar .tb-dl-note{font-size:12px;opacity:.85;white-space:nowrap}
.tb-dl-bar a{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;background:#159A99;color:#fff;text-decoration:none;font-weight:600;white-space:nowrap}
.tb-dl-bar a:hover{background:#0f7f7e}
@media print{.tb-dl-bar{display:none!important}}
`

function injectDownloadBar(html, href, label) {
  const bar = `<style>${PREVIEW_BAR_CSS}</style>`
    + `<div class="tb-dl-bar" role="region" aria-label="报告下载"><span class="tb-dl-note">报告已在浏览器打开</span>`
    + `<a href="${escapeHtmlAttr(href)}" download>下载 ${escapeHtmlAttr(label)}</a></div>`
  const at = html.lastIndexOf('</body>')
  return at === -1 ? html + bar : `${html.slice(0, at)}${bar}${html.slice(at)}`
}

function pdfPreviewPage(params) {
  const inline = exportHref('pdf', params, { inline: '1' })
  const download = exportHref('pdf', params)
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Token 账单报告 · PDF</title>
<style>
html,body{margin:0;height:100%;background:#EEF1F6}
#pdf{display:block;width:100%;height:100%;border:0;background:#fff}
#status{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#75878A;font:13px/1.4 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;pointer-events:none}
#status.err{color:#B55245}
${PREVIEW_BAR_CSS}
</style>
</head>
<body>
<iframe id="pdf" title="Token 账单报告 PDF"></iframe>
<div id="status">正在生成 PDF…</div>
<div class="tb-dl-bar" role="region" aria-label="报告下载">
  <span class="tb-dl-note">PDF 已在本页打开</span>
  <a href="${escapeHtmlAttr(download)}" download>下载 PDF</a>
</div>
<script>
  const source = ${JSON.stringify(inline)};
  const frame = document.getElementById('pdf');
  const status = document.getElementById('status');
  fetch(source, { headers: { accept: 'application/pdf' } }).then(async response => {
    if (!response.ok) {
      let message = 'HTTP ' + response.status;
      try { const body = await response.json(); if (body && body.error) message = body.error; } catch (error) {}
      throw new Error(message);
    }
    return response.blob();
  }).then(blob => {
    frame.src = URL.createObjectURL(blob);
    status.remove();
  }).catch(error => {
    status.textContent = 'PDF 生成失败：' + (error && error.message ? error.message : String(error));
    status.classList.add('err');
  });
</script>
</body>
</html>`
}

function githubPayload() {
  return {
    stars: Number.isFinite(githubCache.stars) ? githubCache.stars : null,
    url: GITHUB_REPO,
    current: CURRENT_VERSION || null,
    latest: githubCache.latest || null,
    hasUpdate: Boolean(CURRENT_VERSION && githubCache.latest && isNewerVersion(githubCache.latest, CURRENT_VERSION)),
    releasesUrl: `${GITHUB_REPO}/releases/latest`,
  }
}

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function sameOrigin(req, origin) {
  const requestOrigin = req.headers.origin
  if (origin && requestOrigin && requestOrigin !== origin) return false
  const site = req.headers['sec-fetch-site']
  if (site && site !== 'same-origin' && site !== 'none') return false
  return true
}

const COST_FIELDS = { CNY: 'costCny', USD: 'cost', EUR: 'costEur' }

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', chunk => {
      size += chunk.length
      if (size > 8192) { reject(new Error('请求体过大')); req.destroy(); return }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}) } catch { reject(new Error('请求体不是合法 JSON')) }
    })
    req.on('error', reject)
  })
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
        const inline = url.searchParams.get('inline') === '1'
        res.statusCode = 200
        res.setHeader('content-type', file.type)
        res.setHeader('content-disposition', `${inline ? 'inline' : 'attachment'}; filename="${file.name}"`)
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
    path: '/token-bill/report/preview',
    handler: async (req, res) => {
      try {
        if (req.method !== 'GET') return send(res, 405, { error: '只支持 GET' })
        const allowed = origin()
        const requestOrigin = req.headers.origin
        if (allowed && requestOrigin && requestOrigin !== allowed) return send(res, 403, { error: '只接受本机同源请求' })
        const site = req.headers['sec-fetch-site']
        if (site && site !== 'same-origin' && site !== 'none') return send(res, 403, { error: '只接受本机同源请求' })

        const url = new URL(req.url, 'http://127.0.0.1')
        const format = String(url.searchParams.get('format') || 'html').toLowerCase()
        if (!['html', 'pdf'].includes(format)) return send(res, 400, { error: 'format 需要 html 或 pdf' })
        const params = readReportQuery(url)
        if (params.error) return send(res, 400, { error: params.error })

        let body
        if (format === 'html') {
          const report = buildReport(params)
          body = injectDownloadBar(buildReportHtml(report), exportHref('html', params), 'HTML')
        } else {
          body = pdfPreviewPage(params)
        }
        res.statusCode = 200
        res.setHeader('content-type', 'text/html; charset=utf-8')
        res.setHeader('content-length', Buffer.byteLength(body))
        res.setHeader('cache-control', 'no-store')
        res.setHeader('x-content-type-options', 'nosniff')
        res.end(body)
      } catch (error) {
        if (!res.headersSent) send(res, 500, { error: error?.message || String(error) })
        else res.destroy(error)
      }
    },
  }), 'token-bill: /token-bill/report/preview')

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
          return send(res, 200, githubPayload())
        }
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 8000)
        try {
          const headers = { accept: 'application/vnd.github+json', 'user-agent': 'dsh-token-bill' }
          const [repoResult, releaseResult] = await Promise.allSettled([
            fetch(GITHUB_API, { headers, signal: controller.signal }),
            fetch(GITHUB_LATEST_RELEASE, { headers, signal: controller.signal }),
          ])
          let stars = githubCache.stars
          let latest = githubCache.latest
          if (repoResult.status === 'fulfilled' && repoResult.value.ok) {
            const body = await repoResult.value.json().catch(() => ({}))
            const value = Number(body?.stargazers_count)
            if (Number.isFinite(value)) stars = value
          }
          if (releaseResult.status === 'fulfilled' && releaseResult.value.ok) {
            const body = await releaseResult.value.json().catch(() => ({}))
            if (typeof body?.tag_name === 'string' && body.tag_name) latest = body.tag_name
          }
          if (stars !== null || latest !== null) githubCache = { stars, latest, at: Date.now() }
          send(res, 200, githubPayload())
        } finally {
          clearTimeout(timer)
        }
      } catch (error) {
        send(res, 200, { ...githubPayload(), error: error?.message || String(error) })
      }
    },
  }), 'token-bill: /token-bill/github')

  // ---- Per-session usage / limit settings / turn-tail warnings ----------------

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/token-bill/limits/session',
    handler: async (req, res) => {
      try {
        if (!sameOrigin(req, origin())) return send(res, 403, { error: '只接受本机同源请求' })
        const url = new URL(req.url, 'http://127.0.0.1')
        const sessionId = (url.searchParams.get('sessionId') || '').slice(0, 512)
        if (!sessionId) return send(res, 400, { error: '缺少 sessionId' })
        const currency = (url.searchParams.get('currency') || 'CNY').toUpperCase()
        const field = COST_FIELDS[currency] || 'costCny'

        if (req.method === 'GET') {
          const usage = readSessionUsage(sessionId)
          const cost = readSessionCost(sessionId, field)
          return send(res, 200, {
            sessionId,
            usage: usage ? { input: usage.input, output: usage.output, cacheRead: usage.cacheRead, cacheWrite: usage.cacheWrite, reasoning: usage.reasoning, tokens: usage.tokens, calls: usage.calls } : null,
            cost: cost ? { value: cost.cost, calls: cost.calls, currency } : null,
            limits: getLimits(sessionId),
            defaultLimits: getDefaultLimits(),
          })
        }

        if (req.method === 'POST') {
          const body = await readJsonBody(req)
          const tokenLimit = body.tokenLimit === null || body.tokenLimit === '' ? null : body.tokenLimit
          const costLimit = body.costLimit === null || body.costLimit === '' ? null : body.costLimit
          if (body.clear) return send(res, 200, { limits: clearSessionLimits(sessionId) })
          return send(res, 200, { limits: saveSessionLimits(sessionId, { tokenLimit, costLimit }) })
        }

        return send(res, 405, { error: '只支持 GET / POST' })
      } catch (error) {
        send(res, error?.message === '会话 ID 无效' ? 400 : 500, { error: error?.message || String(error) })
      }
    },
  }), 'token-bill: /token-bill/limits/session')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/token-bill/limits/default',
    handler: async (req, res) => {
      try {
        if (!sameOrigin(req, origin())) return send(res, 403, { error: '只接受本机同源请求' })
        if (req.method === 'GET') return send(res, 200, { limits: getDefaultLimits() })
        if (req.method === 'POST') {
          const body = await readJsonBody(req)
          const tokenLimit = body.tokenLimit === null || body.tokenLimit === '' ? null : body.tokenLimit
          const costLimit = body.costLimit === null || body.costLimit === '' ? null : body.costLimit
          return send(res, 200, { limits: saveDefaultLimits({ tokenLimit, costLimit }) })
        }
        return send(res, 405, { error: '只支持 GET / POST' })
      } catch (error) {
        send(res, 500, { error: error?.message || String(error) })
      }
    },
  }), 'token-bill: /token-bill/limits/default')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/token-bill/limits/alert',
    handler: async (req, res) => {
      try {
        if (req.method !== 'POST') return send(res, 405, { error: '只支持 POST' })
        if (!sameOrigin(req, origin())) return send(res, 403, { error: '只接受本机同源请求' })
        const body = await readJsonBody(req)
        const sessionId = String(body.sessionId || '').slice(0, 512)
        const seq = Number(body.seq)
        if (!sessionId || !Number.isSafeInteger(seq) || seq < 0) return send(res, 400, { error: '缺少 sessionId 或 seq' })
        const currency = (String(body.currency || 'CNY').toUpperCase())
        const field = COST_FIELDS[currency] || 'costCny'
        const usage = readSessionUsage(sessionId)
        const cost = readSessionCost(sessionId, field)
        const limits = getLimits(sessionId)
        const warnings = evaluateAlerts({
          sessionId,
          seq,
          usage,
          cost: cost ? cost.cost : null,
          limits,
        })
        return send(res, 200, { warnings, usage: usage ? { tokens: usage.tokens, calls: usage.calls } : null, cost: cost ? cost.cost : null, limits })
      } catch (error) {
        send(res, 500, { error: error?.message || String(error) })
      }
    },
  }), 'token-bill: /token-bill/limits/alert')
}
