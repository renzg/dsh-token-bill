import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { buildReportHtml } from './report-html.js'
import { buildReportDocx } from './report-docx.js'

const run = promisify(execFile)

const CONTENT_TYPES = {
  html: 'text/html; charset=utf-8',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  json: 'application/json; charset=utf-8',
}

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

function filename(format, report) {
  const date = new Date(report.generatedAt || Date.now())
  const pad = value => String(value).padStart(2, '0')
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
  return `token-bill-${stamp}.${format}`
}

async function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (!candidate) continue
    try {
      const { stdout } = await run(candidate, ['--version'], { timeout: 10000 })
      if (/Chrome|Chromium|Edge/i.test(stdout)) return candidate
    } catch {}
  }
  return ''
}

async function htmlToPdf(html) {
  const chrome = await findChrome()
  if (!chrome) throw new Error('未找到 Chrome/Edge，无法生成 PDF；请改用 HTML 导出后在浏览器中打印为 PDF')
  const dir = await mkdtemp(join(tmpdir(), 'token-bill-pdf-'))
  const htmlPath = join(dir, 'report.html')
  const pdfPath = join(dir, 'report.pdf')
  const profilePath = join(dir, 'profile')
  try {
    await writeFile(htmlPath, html, 'utf8')
    await run(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--user-data-dir=${profilePath}`,
      '--no-pdf-header-footer',
      '--virtual-time-budget=1500',
      `--print-to-pdf=${pdfPath}`,
      pathToFileURL(htmlPath).href,
    ], { timeout: 60000, maxBuffer: 8 * 1024 * 1024 })
    const pdf = await readFile(pdfPath)
    if (!pdf.length) throw new Error('PDF 生成结果为空')
    return pdf
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

export async function exportReport(format, report) {
  if (!CONTENT_TYPES[format]) throw new Error(`不支持的报告格式：${format}`)
  const name = filename(format, report)
  if (format === 'json') {
    return { name, type: CONTENT_TYPES[format], body: Buffer.from(JSON.stringify(report, null, 2), 'utf8') }
  }
  const html = buildReportHtml(report)
  if (format === 'html') return { name, type: CONTENT_TYPES[format], body: Buffer.from(html, 'utf8') }
  if (format === 'docx') return { name, type: CONTENT_TYPES[format], body: buildReportDocx(report) }
  return { name, type: CONTENT_TYPES[format], body: await htmlToPdf(html) }
}
