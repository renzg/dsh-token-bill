import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'

/** Root of the durable session logs for the running Harness home. */
export function sessionsRoot() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  return path.join(home, 'sessions')
}

/** Local (Asia/Shanghai) day key, hour and weekday for one epoch millisecond. */
export function localParts(ms) {
  const d = new Date(ms)
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]))
  const date = `${parts.year}-${parts.month}-${parts.day}`
  return {
    date,
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
  }
}

export const DOMAIN_LABEL = {
  visual: '视觉设计', code: '开发实现', writing: '内容写作',
  data: '数据分析', research: '研究检索', auto: '自动化', other: '其他',
}

const DOMAINS = [
  ['visual', /设计|视觉|海报|卡片|排版|配色|封面|插画|样卡|字体|图片|摄影|分镜|画面|修图|视频|动画|国风|名片|界面|交互|原型|风格|审美/],
  ['code', /代码|插件|开发|实现|构建|搭建|脚本|接口|api\b|bug|报错|函数|部署|仓库|git\b|前端|后端|数据库|解析|爬虫|命令行|控制台|后台|系统|安装|配置|环境|服务|html|css|js\b|终端|工作台/],
  ['writing', /文案|标题|文章|写|稿|宣传|旁白|剧本|公众号|小红书|诗词|叙事|翻译|推文|内容|文档|图文|文字/],
  ['data', /数据|分析|统计|报表|对比|趋势|指标|excel|表格|csv|图表|账|预算|成本|花费|用量|token|账单|费用/],
  ['research', /查|检索|资料|考据|事实|来源|文献|搜|核实|出处|历史|名录|批次|调研/],
  ['auto', /自动化|批量|定时|工作流|流程|浏览器|抓取|监控|通知|推送|同步|发布|技能|匹配|推荐|路由/],
]

const QUESTION = /[?？]|吗|呢|如何|怎么|为什么|为何|能不能|是否|多少|哪些|哪个|有没有|可否/
// Explicit acceptance language, or a number with a real unit. Bare 页/张/天/周/月
// used to match "今天", "一个", "这张" and inflated the constraint rate.
const SPEC = /要求|必须|不要|不能|至少|不超过|控制在|保证|格式|尺寸|字数|\d+\s*(px|cm|mm|k|万|字|页|秒|分钟|小时|天|周|月|张|条|个|人|次|元|%)/
const CONTEXT = /文件|目录|链接|截图|附件|日志|代码|表格|原文|参考|素材|底稿|根据|基于|下面|以下|这份|这个|上面/
const META = /你(能|会|是|怎么|觉得|有)|你自己|作为[你ai]|模型|prompt|提示词/
const EXPLORE = /如果|试试|看看|建议|想法|方案|方向|可能|也许|或者|对比|评估|选哪个/
const URGENT = /现在|马上|尽快|今天|立刻|急/
const CORRECTION = /不对|错了|不是|重新|再改|改一下|再试|不行|有问题|失败|跑偏|不准确|漏了|忘了|别这样|重做/
export const LEARNING_TOOLS = new Set(['read', 'grep', 'glob', 'web_search', 'web_fetch', 'skill', 'memory_read', 'memory_search', 'cordis_inspect', 'session_search', 'session_event_search'])
export const VERIFY_TOOLS = new Set(['bash', 'read', 'grep', 'glob', 'lsp', 'cordis_inspect'])

const FEATURE_LIMIT = 24000
const ZSTD_MAGIC = 0xfd2fb528
const cache = new Map()

function statKey(file) {
  const st = fs.statSync(file)
  return { size: st.size, mtimeMs: st.mtimeMs }
}

function textOf(content) {
  if (!Array.isArray(content)) return ''
  const parts = []
  for (const block of content) {
    if (!block) continue
    if (typeof block === 'string') parts.push(block)
    else if (typeof block.text === 'string') parts.push(block.text)
    else if (block.type === 'image') parts.push('[图片]')
    else if (block.type === 'file') parts.push('[文件]')
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export function classifyText(text) {
  let best = 'other'
  let bestHits = 0
  for (const [name, re] of DOMAINS) {
    const hits = (text.match(new RegExp(re.source, 'g')) || []).length
    if (hits > bestHits) { best = name; bestHits = hits }
  }
  return best
}

/** Scan one complete zstd frame's byte range without decompressing it. */
function scanFrame(buffer, start) {
  let offset = start
  if (buffer.length - offset < 4) return { status: 'incomplete' }
  if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) return { status: 'invalid' }
  offset += 4
  if (offset === buffer.length) return { status: 'incomplete' }
  const descriptor = buffer.readUInt8(offset)
  offset += 1
  if ((descriptor & 24) !== 0) return { status: 'invalid' }
  const contentSizeFlag = descriptor >>> 6
  const singleSegment = (descriptor & 32) !== 0
  const checksum = (descriptor & 4) !== 0
  const dictionaryFlag = descriptor & 3
  const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag
  const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag
  const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes
  if (buffer.length - offset < remainingHeaderBytes) return { status: 'incomplete' }
  offset += remainingHeaderBytes
  for (;;) {
    if (buffer.length - offset < 3) return { status: 'incomplete' }
    const blockHeader = buffer.readUIntLE(offset, 3)
    offset += 3
    const lastBlock = (blockHeader & 1) !== 0
    const blockType = (blockHeader >>> 1) & 3
    const blockSize = blockHeader >>> 3
    if (blockType === 3) return { status: 'invalid' }
    const payloadBytes = blockType === 1 ? 1 : blockSize
    if (buffer.length - offset < payloadBytes) return { status: 'incomplete' }
    offset += payloadBytes
    if (lastBlock) break
  }
  if (checksum) {
    if (buffer.length - offset < 4) return { status: 'incomplete' }
    offset += 4
  }
  return { status: 'complete', end: offset }
}

/**
 * Decompress a session log that may be a concatenation of many zstd frames.
 *
 * Electron's Node 24 decodes all concatenated frames in one call; some newer
 * runtimes stop at the first frame (which is just the session header). Probe
 * the first frame, and split frames only when the one-shot result is truncated.
 */
export function decompressSessionFile(buffer) {
  if (buffer.length < 4 || buffer.readUInt32LE(0) !== ZSTD_MAGIC) return buffer
  let whole
  try { whole = zlib.zstdDecompressSync(buffer) } catch { whole = null }
  const first = scanFrame(buffer, 0)
  if (first.status !== 'complete' || first.end >= buffer.length) return whole || Buffer.alloc(0)
  let firstPlain
  try { firstPlain = zlib.zstdDecompressSync(buffer.subarray(0, first.end)) } catch { firstPlain = Buffer.alloc(0) }
  if (whole && whole.length > firstPlain.length) return whole
  // Fallback for first-frame-only runtimes: decompress every frame and concatenate.
  const parts = []
  let offset = 0
  while (offset < buffer.length) {
    const frame = scanFrame(buffer, offset)
    if (frame.status !== 'complete') break
    try { parts.push(zlib.zstdDecompressSync(buffer.subarray(offset, frame.end))) } catch { break }
    offset = frame.end
  }
  return parts.length ? Buffer.concat(parts) : (whole || Buffer.alloc(0))
}

function logFileOf(dir) {
  let names
  try { names = fs.readdirSync(dir) } catch { return null }
  const candidates = names
    .map(name => {
      const match = /^session(?:\.v(\d+))?\.jsonl(\.zstd)?$/.exec(name)
      if (!match) return null
      return { name, version: match[1] ? Number(match[1]) : 0, zstd: Boolean(match[2]) }
    })
    .filter(Boolean)
    .sort((a, b) => b.version - a.version || Number(b.zstd) - Number(a.zstd))
  if (!candidates.length) return null
  return path.join(dir, candidates[0].name)
}

function summarize(file) {
  let raw
  try {
    raw = decompressSessionFile(fs.readFileSync(file))
  } catch {
    return null
  }
  const summary = {
    id: path.basename(path.dirname(file)),
    file,
    createdAt: 0,
    cwd: null,
    title: '',
    parentSession: null,
    origin: null,
    agentPreset: null,
    firstAt: 0,
    lastAt: 0,
    turns: 0,
    calls: [],
    prompts: [],
    tools: {},
    toolCalls: [],
    toolResults: [],
    toolDurations: [],
    turnEnds: [],
    latencies: [],
    assistantText: [],
  }
  const text = raw.toString('utf8')
  let currentTurn = 0
  let pendingUser = 0
  const openCalls = new Map()
  for (const line of text.split('\n')) {
    if (!line) continue
    let event
    try { event = JSON.parse(line) } catch { continue }
    const type = event.type
    const time = typeof event.time === 'number' ? event.time : 0
    if (time) {
      if (!summary.firstAt || time < summary.firstAt) summary.firstAt = time
      if (time > summary.lastAt) summary.lastAt = time
    }
    if (type === 'session') {
      summary.id = event.id || summary.id
      summary.createdAt = event.createdAt || time
      summary.cwd = event.cwd || summary.cwd
      summary.parentSession = event.parentSession || null
      summary.origin = event.origin || null
      summary.agentPreset = event.agentPreset || null
    } else if (type === 'session/title') {
      if (event.data?.title) summary.title = event.data.title
    } else if (type === 'turn/start') {
      summary.turns += 1
      currentTurn = event.data?.turn || summary.turns
      pendingUser = 0
    } else if (type === 'turn/end') {
      summary.turnEnds.push({ t: time, kind: event.data?.reason?.kind || 'unknown' })
      pendingUser = 0
    } else if (type === 'user/message') {
      const src = event.data?.source
      if (src && src.kind !== 'user') continue
      const body = textOf(event.data?.content)
      if (!body) continue
      const len = body.length
      if (time && !pendingUser) pendingUser = time
      summary.prompts.push({
        t: time,
        len,
        q: QUESTION.test(body) ? 1 : 0,
        spec: SPEC.test(body) ? 1 : 0,
        ctx: CONTEXT.test(body) ? 1 : 0,
        meta: META.test(body) ? 1 : 0,
        explore: EXPLORE.test(body) ? 1 : 0,
        urgent: URGENT.test(body) ? 1 : 0,
        correction: CORRECTION.test(body) ? 1 : 0,
        domain: classifyText(body),
        head: body.slice(0, 60),
      })
    } else if (type === 'assistant/message') {
      const usage = event.data?.usage
      if (!usage) continue
      const src = event.data?.message?.source || {}
      const input = usage.inputTokens || 0
      const output = usage.outputTokens || 0
      const cacheRead = usage.cacheReadTokens || 0
      const cacheWrite = usage.cacheWriteTokens || 0
      const reasoning = usage.reasoningTokens || 0
      if (pendingUser && time >= pendingUser) {
        summary.latencies.push({ t: time, ms: time - pendingUser })
        pendingUser = 0
      }
      summary.assistantText.push({ t: time, chars: textOf(event.data?.message?.content).length, outputTokens: output })
      summary.calls.push({
        t: time,
        turn: event.data?.turn ?? currentTurn,
        step: event.data?.step ?? 0,
        provider: src.provider || '',
        model: src.model || '',
        input, output, cacheRead, cacheWrite, reasoning,
        weight: input + cacheRead * 0.06 + cacheWrite * 0.2 + output * 4 + reasoning * 4,
      })
    } else if (type === 'tool/call') {
      const name = event.data?.name
      if (name) {
        summary.tools[name] = (summary.tools[name] || 0) + 1
        const rawArgs = typeof event.data?.arguments === 'string' ? event.data.arguments.slice(0, 8000) : ''
        const call = { t: time, name, callId: event.data?.callId, turn: event.data?.turn ?? currentTurn, step: event.data?.step ?? 0, arguments: rawArgs }
        summary.toolCalls.push(call)
        if (call.callId) openCalls.set(call.callId, call)
      }
    } else if (type === 'tool/result') {
      const error = Boolean(event.data?.error) || event.data?.message?.isError === true
      const call = event.data?.message?.toolCallId ? openCalls.get(event.data.message.toolCallId) : undefined
      summary.toolResults.push({ t: time, error, name: call?.name || null })
      if (call) {
        summary.toolDurations.push({ t: time, ms: time - call.t, name: call.name })
        openCalls.delete(call.callId)
      }
    }
  }
  for (const key of ['calls', 'prompts', 'toolCalls', 'toolResults', 'toolDurations', 'turnEnds', 'latencies', 'assistantText']) {
    if (summary[key].length > FEATURE_LIMIT) summary[key] = summary[key].slice(-FEATURE_LIMIT)
  }
  return summary
}

/** Summaries for every session log, re-reading only files whose stat changed. */
export function loadSessionSummaries() {
  const root = sessionsRoot()
  const out = []
  let files = 0
  let failed = 0
  let entries
  try { entries = fs.readdirSync(root, { withFileTypes: true }) } catch { out.stats = { files, failed, parsed: 0, calls: 0, prompts: 0 }; return out }
  for (const group of entries) {
    if (!group.isDirectory()) continue
    const groupDir = path.join(root, group.name)
    let sessions
    try { sessions = fs.readdirSync(groupDir, { withFileTypes: true }) } catch { continue }
    for (const session of sessions) {
      if (!session.isDirectory()) continue
      const file = logFileOf(path.join(groupDir, session.name))
      if (!file) continue
      files += 1
      let st
      try { st = statKey(file) } catch { continue }
      const hit = cache.get(file)
      let summary
      if (hit && hit.size === st.size && hit.mtimeMs === st.mtimeMs) summary = hit.summary
      else {
        summary = summarize(file)
        cache.set(file, { ...st, summary })
      }
      if (summary) out.push(summary)
      else failed += 1
    }
  }
  for (const file of cache.keys()) if (!fs.existsSync(file)) cache.delete(file)
  out.stats = {
    files,
    failed,
    parsed: out.length,
    calls: out.reduce((sum, session) => sum + session.calls.length, 0),
    prompts: out.reduce((sum, session) => sum + session.prompts.length, 0),
  }
  return out
}
