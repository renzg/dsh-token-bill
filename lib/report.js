import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { loadSessionSummaries, localParts, classifyText, DOMAIN_LABEL, LEARNING_TOOLS, VERIFY_TOOLS } from './sessions.js'
import { buildRelations } from './relations.js'

const CURRENCY = {
  CNY: { field: 'costCny', symbol: '¥', name: '人民币' },
  USD: { field: 'cost', symbol: '$', name: '美元' },
  EUR: { field: 'costEur', symbol: '€', name: '欧元' },
}

const cache = { ledger: null, at: 0, size: 0, mtimeMs: 0, report: null, reportKey: '' }

function ledgerFile() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  return path.join(home, 'storages', 'cost-meter', 'ledger.json')
}

function readLedger() {
  const file = ledgerFile()
  if (!fs.existsSync(file)) throw new Error('未找到 dsh-cost-meter 账本；请先在「插件」里启用费用插件并产生一次调用')
  const st = fs.statSync(file)
  if (cache.ledger && cache.mtimeMs === st.mtimeMs && cache.size === st.size) return cache.ledger
  try {
    const ledger = JSON.parse(fs.readFileSync(file, 'utf8'))
    cache.ledger = ledger
    cache.mtimeMs = st.mtimeMs
    cache.size = st.size
    return ledger
  } catch (error) {
    if (cache.ledger) return cache.ledger
    throw new Error('账本正在写入，请稍后点「刷新」重试')
  }
}

const money = (row, field) => (typeof row?.[field] === 'number' ? row[field] : typeof row?.cost === 'number' ? row.cost : 0)

function blank() {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, calls: 0, cost: 0 }
}

function add(into, from, field) {
  into.input += from.input || 0
  into.output += from.output || 0
  into.cacheRead += from.cacheRead || 0
  into.cacheWrite += from.cacheWrite || 0
  into.reasoning += from.reasoning || 0
  into.calls += from.calls || 0
  into.cost += money(from, field)
  return into
}

const DAY_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' })

function dayList(from, to) {
  const out = []
  const start = Date.parse(`${from}T00:00:00+08:00`)
  const end = Date.parse(`${to}T00:00:00+08:00`)
  for (let at = start; at <= end; at += 86400000) out.push(DAY_FMT.format(new Date(at)))
  return out
}

function shiftDay(date, days) {
  const at = Date.parse(`${date}T00:00:00+08:00`) + days * 86400000
  return DAY_FMT.format(new Date(at))
}

function isoWeek(date) {
  const day = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7
  const monday = shiftDay(date, -day)
  return { key: monday, label: `${monday.slice(5)}–${shiftDay(monday, 6).slice(5)}` }
}

function niceBucketMs(durationMs) {
  const target = Math.max(60000, durationMs / 26)
  for (const minutes of [1, 2, 5, 10, 15, 30, 60, 120, 240, 720, 1440]) {
    if (minutes * 60000 >= target) return minutes * 60000
  }
  return 1440 * 60000
}

function sessionSeries(summary, totalCost, fromMs, toMs) {
  const calls = (summary?.calls || []).filter(call => call.t >= fromMs && call.t <= toMs).sort((a, b) => a.t - b.t)
  if (!calls.length) return { points: [], bucketMinutes: 0 }
  const first = calls[0].t
  const last = calls[calls.length - 1].t
  const bucketMs = niceBucketMs(Math.max(60000, last - first))
  const start = Math.floor(first / bucketMs) * bucketMs
  const end = Math.floor(last / bucketMs) * bucketMs
  const buckets = new Map()
  let totalWeight = 0
  for (const call of calls) {
    const index = Math.floor((call.t - start) / bucketMs)
    const bucket = buckets.get(index) || { index, weight: 0, tokens: 0, calls: 0 }
    bucket.weight += call.weight
    bucket.tokens += call.input + call.output + call.cacheRead + call.cacheWrite + call.reasoning
    bucket.calls += 1
    totalWeight += call.weight
    buckets.set(index, bucket)
  }
  const count = Math.floor((end - start) / bucketMs) + 1
  const points = []
  let cumulative = 0
  const sameDay = localParts(start).date === localParts(end).date
  for (let index = 0; index < count; index += 1) {
    const bucket = buckets.get(index) || { weight: 0, tokens: 0, calls: 0 }
    const cost = totalWeight > 0 ? totalCost * (bucket.weight || 0) / totalWeight : totalCost / count
    cumulative += cost
    const time = start + index * bucketMs
    const parts = localParts(time)
    points.push({
      t: time,
      label: sameDay ? `${pad2(parts.hour)}:${pad2(parts.minute)}` : `${parts.date.slice(5)} ${pad2(parts.hour)}:${pad2(parts.minute)}`,
      cost,
      cumulative,
      tokens: bucket.tokens,
      calls: bucket.calls,
    })
  }
  // Floating-point remainder goes into the last point so the curve ends at the recorded total.
  if (points.length && Math.abs(cumulative - totalCost) > 0.000001) {
    points[points.length - 1].cumulative = totalCost
    points[points.length - 1].cost += totalCost - cumulative
  }
  return { points, bucketMinutes: bucketMs / 60000 }
}

const COST_TYPE_LABELS = {
  command: '命令执行',
  file_edit: '文件修改',
  file_read: '文件读取',
  web: '网页抓取',
  multi: '多类工具',
  other: '其他工具',
  reply: '模型回复',
}

function toolKind(name) {
  const value = String(name || '')
  if (/^(bash|job_|terminal|shell|exec|process|pty)/.test(value)) return 'command'
  if (/^(write|edit|apply_patch|str_replace|patch|notebook_edit)/.test(value)) return 'file_edit'
  if (/^(read|grep|glob|lsp|workspace_files|list_dir)/.test(value)) return 'file_read'
  if (/^(web_|fetch|browser_|crawl|search_api|web_search|mcp__browser)/.test(value)) return 'web'
  return 'other'
}

function sessionCostTypes(summary, totalCost, fromMs, toMs) {
  const calls = (summary?.calls || []).filter(call => call.t >= fromMs && call.t <= toMs)
  if (!calls.length) return { types: [], steps: 0, calls: 0, avgCost: 0, stepRows: [], attribution: { name: '费用', value: 0, children: [] }, top10Share: 0 }
  const toolsByStep = new Map()
  for (const tool of summary.toolCalls || []) {
    if (tool.t < fromMs || tool.t > toMs) continue
    const key = `${tool.turn}:${tool.step}`
    const list = toolsByStep.get(key) || []
    list.push(tool.name)
    toolsByStep.set(key, list)
  }
  const totalWeight = calls.reduce((sum, call) => sum + call.weight, 0) || 1
  const buckets = new Map()
  const stepRows = []
  const parents = new Map()
  for (const [index, call] of calls.entries()) {
    const names = toolsByStep.get(`${call.turn}:${call.step}`) || []
    const kinds = [...new Set(names.map(toolKind))]
    const kind = names.length === 0 ? 'reply' : kinds.length > 1 ? 'multi' : kinds[0]
    const cost = totalCost * (call.weight / totalWeight)
    const bucket = buckets.get(kind) || { kind, cost: 0, calls: 0 }
    bucket.cost += cost
    bucket.calls += 1
    buckets.set(kind, bucket)
    stepRows.push({
      index, t: call.t, turn: call.turn || 0, step: call.step || 0,
      cost, kind, label: COST_TYPE_LABELS[kind] || kind,
      model: call.model || '', tools: names.slice(0, 4),
    })
    const parent = parents.get(kind) || { name: COST_TYPE_LABELS[kind] || kind, value: 0, children: new Map() }
    parent.value += cost
    if (names.length) {
      const split = cost / names.length
      for (const name of names) {
        const child = parent.children.get(name) || { name, value: 0 }
        child.value += split
        parent.children.set(name, child)
      }
    } else {
      const name = call.model || '模型回复'
      const child = parent.children.get(name) || { name, value: 0 }
      child.value += cost
      parent.children.set(name, child)
    }
    parents.set(kind, parent)
  }
  const types = [...buckets.values()]
    .map(bucket => ({ ...bucket, label: COST_TYPE_LABELS[bucket.kind] || bucket.kind, share: totalCost > 0 ? bucket.cost / totalCost : 0 }))
    .sort((a, b) => b.cost - a.cost)
  const sortedCosts = stepRows.map(row => row.cost).sort((a, b) => b - a)
  const top10 = sortedCosts.slice(0, 10).reduce((sum, value) => sum + value, 0)
  const attribution = {
    name: '费用',
    value: totalCost,
    children: [...parents.values()].map(parent => ({
      name: parent.name, label: parent.name, value: parent.value, cost: parent.value,
      children: [...parent.children.values()].sort((a, b) => b.value - a.value).map(child => ({
        name: child.name, label: child.name, value: child.value, cost: child.value,
      })),
    })).sort((a, b) => b.value - a.value),
  }
  return {
    types,
    steps: calls.length,
    calls: calls.length,
    avgCost: calls.length ? totalCost / calls.length : 0,
    stepRows,
    attribution,
    top10Share: totalCost > 0 ? top10 / totalCost : 0,
  }
}

function clamp(value) { return Math.max(0, Math.min(100, Math.round(value))) }

function isPeak(ms, config) {
  if (!config?.peakEnabled) return false
  const effective = Date.parse(config.peakEffectiveAt || 0)
  if (Number.isFinite(effective) && ms < effective) return false
  const parts = localParts(ms)
  if (parts.weekday === 0 || parts.weekday === 6) return false
  if (Array.isArray(config.peakHolidays) && config.peakHolidays.includes(parts.date)) return false
  const utcHour = new Date(ms).getUTCHours()
  for (const window of config.peakWindows || []) {
    const start = Number(window.start)
    const end = Number(window.end)
    if (utcHour >= start && utcHour < end) return true
  }
  return false
}

function pct(part, whole) { return whole > 0 ? part / whole : 0 }

function pad2(value) { return String(value).padStart(2, '0') }

function peakWindowText(config) {
  return (config?.peakWindows || []).map(window => {
    const start = (Number(window.start) + 8) % 24
    const end = (Number(window.end) + 8) % 24
    return `${pad2(start)}:00–${pad2(end)}:00`
  }).join('、')
}

function fmtTokens(n) {
  if (n >= 1e8) return (n / 1e8).toFixed(2) + ' 亿'
  if (n >= 1e4) return (n / 1e4).toFixed(1) + ' 万'
  return String(Math.round(n))
}

function median(values) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function quantile(values, q) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * q)))]
}

function medianOf(values) { return quantile(values, 0.5) }

function agentProfile(summaries, fromMs, toMs, prompts, totals) {
  const toolCalls = []
  const toolResults = []
  const turnEnds = []
  const latencies = []
  const assistant = []
  const turnsWithTools = new Set()
  for (const session of summaries) {
    for (const call of session.toolCalls) {
      if (call.t < fromMs || call.t > toMs) continue
      toolCalls.push(call)
      turnsWithTools.add(`${session.id}:${call.turn}`)
    }
    for (const result of session.toolResults) if (result.t >= fromMs && result.t <= toMs) toolResults.push(result)
    for (const end of session.turnEnds) if (end.t >= fromMs && end.t <= toMs) turnEnds.push(end)
    for (const latency of session.latencies) if (latency.t >= fromMs && latency.t <= toMs) latencies.push(latency)
    for (const text of session.assistantText) if (text.t >= fromMs && text.t <= toMs) assistant.push(text)
  }
  const toolErrors = toolResults.filter(result => result.error).length
  const toolErrorRate = toolResults.length ? toolErrors / toolResults.length : 0
  const completed = turnEnds.filter(end => end.kind === 'completed').length
  const failed = turnEnds.filter(end => ['error', 'aborted', 'interrupted', 'max-tokens'].includes(end.kind)).length
  const completionRate = turnEnds.length ? completed / turnEnds.length : 0
  const turnErrorRate = turnEnds.length ? failed / turnEnds.length : 0
  const correctionCount = prompts.reduce((sum, prompt) => sum + (prompt.correction ? 1 : 0), 0)
  const correctionRate = prompts.length ? correctionCount / prompts.length : 0

  const latencySecs = latencies.map(entry => entry.ms / 1000).filter(value => Number.isFinite(value) && value > 0)
  const medianLatency = medianOf(latencySecs)
  const p90Latency = quantile(latencySecs, 0.9)
  const latencyScore = latencySecs.length
    ? 100 - (Math.log10(Math.max(0.8, medianLatency)) - Math.log10(2)) / (Math.log10(300) - Math.log10(2)) * 88
    : 50

  const uniqueTools = new Set(toolCalls.map(call => call.name))
  const learningTools = toolCalls.filter(call => LEARNING_TOOLS.has(call.name)).length
  const verifyTools = toolCalls.filter(call => VERIFY_TOOLS.has(call.name)).length
  const memoryTools = toolCalls.filter(call => /memory|skill|session_search|cordis_inspect/.test(call.name)).length
  const turns = Math.max(1, turnEnds.length)
  const toolTurnShare = turnsWithTools.size / turns
  const learningPerTurn = learningTools / turns
  const verifyPerTurn = verifyTools / turns
  const memoryPerTurn = memoryTools / turns
  const avgChars = assistant.length ? assistant.reduce((sum, entry) => sum + entry.chars, 0) / assistant.length : 0
  const cacheShare = totals.input + totals.cacheRead + totals.cacheWrite > 0
    ? totals.cacheRead / (totals.input + totals.cacheRead + totals.cacheWrite) : 0

  const accuracy = clamp(100 - toolErrorRate * 120 - turnErrorRate * 160 - correctionRate * 70)
  const timeliness = clamp(latencyScore)
  const proactivity = clamp(toolTurnShare * 50 + Math.min(20, uniqueTools.size * 2) + Math.min(30, learningPerTurn * 18))
  const explanation = clamp((Math.log10(Math.max(60, avgChars)) - Math.log10(80)) / (Math.log10(2500) - Math.log10(80)) * 100)
  const memory = clamp(cacheShare * 70 + Math.min(30, memoryPerTurn * 20))
  const selfCheck = clamp(completionRate * 45 + Math.min(35, verifyPerTurn * 22) + (1 - correctionRate) * 20)

  const values = { accuracy, timeliness, proactivity, explanation, memory, selfCheck }
  const tags = []
  if (accuracy >= 75) tags.push('少出错')
  if (timeliness >= 72) tags.push('响应快')
  if (proactivity >= 62) tags.push('主动查证')
  if (explanation >= 65) tags.push('解释充分')
  if (memory >= 70) tags.push('记得住上下文')
  if (selfCheck >= 70) tags.push('会自检')
  if (toolTurnShare >= 0.85) tags.push('工具型')
  if (completionRate >= 0.9) tags.push('收得住')

  return {
    values, tags: tags.slice(0, 6),
    metrics: {
      toolCalls: toolCalls.length, toolErrors, toolErrorRate,
      turnEnds: turnEnds.length, completed, failed, completionRate, turnErrorRate,
      correctionCount, correctionRate,
      medianLatencySec: medianLatency, p90LatencySec: p90Latency,
      toolTurnShare, uniqueTools: uniqueTools.size,
      learningTools, verifyTools, memoryTools,
      assistantMessages: assistant.length, avgChars,
      cacheShare,
    },
  }
}

function matchProfile(dims, agent) {
  if (!agent) return null
  const byKey = new Map(dims.map(dim => [dim.key, dim.value]))
  const m = agent.metrics
  const axes = [
    { key: 'clarity', label: '目标共识', user: byKey.get('clarity') || 0, agent: agent.values.accuracy, hint: '你的明确度 / AI 的准确度', evidence: `工具成功 ${(100 - m.toolErrorRate * 100).toFixed(1)}% · 轮次完成 ${(m.completionRate * 100).toFixed(0)}%` },
    { key: 'density', label: '信息密度', user: byKey.get('density') || 0, agent: agent.values.explanation, hint: '你的供给 / AI 的解释', evidence: `平均解释 ${Math.round(m.avgChars)} 字/条` },
    { key: 'explore', label: '探索共鸣', user: byKey.get('explore') || 0, agent: agent.values.proactivity, hint: '你的探索 / AI 的主动', evidence: `工具 ${m.toolCalls} 次 · 查证 ${m.learningTools} 次` },
    { key: 'iterate', label: '节奏合拍', user: byKey.get('iterate') || 0, agent: agent.values.timeliness, hint: '你的迭代 / AI 的响应', evidence: `首响中位 ${m.medianLatencySec.toFixed(1)}s · P90 ${m.p90LatencySec.toFixed(1)}s` },
    { key: 'context', label: '上下文接力', user: byKey.get('context') || 0, agent: agent.values.memory, hint: '你的供给 / AI 的记忆', evidence: `缓存 ${(m.cacheShare * 100).toFixed(1)}% · 记忆类调用 ${m.memoryTools} 次` },
    { key: 'verify', label: '验收一致', user: byKey.get('verify') || 0, agent: agent.values.selfCheck, hint: '你的验收 / AI 的自检', evidence: `自检类调用 ${m.verifyTools} 次 · 纠正率 ${(m.correctionRate * 100).toFixed(1)}%` },
  ].map(axis => ({ ...axis, gap: Math.abs(axis.user - axis.agent) }))

  const meanGap = axes.reduce((sum, axis) => sum + axis.gap, 0) / axes.length
  const bothLow = axes.filter(axis => axis.user < 40 && axis.agent < 40).length
  const complement = axes.filter(axis => axis.user < 45 && axis.agent >= 65).length
  const sameHigh = axes.filter(axis => axis.user >= 65 && axis.agent >= 65).length
  const score = clamp(100 - meanGap * 0.75 - bothLow * 4 + complement * 2.5 + sameHigh * 2)
  const label = score >= 82 ? '高度默契' : score >= 68 ? '基本合拍' : score >= 55 ? '需要磨合' : '节奏错位'
  const mode = complement >= 2 ? '互补型' : meanGap <= 12 ? '同频型' : '磨合型'
  const sorted = [...axes].sort((a, b) => b.gap - a.gap)
  const biggest = sorted[0]
  const aligned = [...axes].filter(axis => axis.user >= 60 && axis.agent >= 60).sort((a, b) => b.user + b.agent - (a.user + a.agent))[0]
  const sentence = [
    biggest ? `「${biggest.label}」落差最大：你 ${biggest.user}，AI ${biggest.agent}。` : '',
    aligned ? `「${aligned.label}」上你们相对接近。` : '',
    mode === '互补型' ? '整体更像互补：你放开的地方，AI 能接住。' : mode === '同频型' ? '整体节奏接近，配合成本低。' : '整体还需要磨合，先看落差最大的那一维。',
  ].filter(Boolean).join('')

  return { score, label, mode, sentence, meanGap, complement, sameHigh, axes }
}

function styleProfile(prompts, sessions) {
  const count = prompts.length
  if (!count) return null
  const lengths = prompts.map(p => p.len)
  const rates = key => prompts.reduce((sum, p) => sum + (p[key] ? 1 : 0), 0) / count
  const avgLen = lengths.reduce((a, b) => a + b, 0) / count
  const sessionIds = new Set(prompts.map(p => p.sessionId))
  const multi = prompts.filter(p => p.sessionIndex > 1).length
  const avgPerSession = count / Math.max(1, sessionIds.size)
  const specRate = rates('spec')
  const questionRate = rates('q')
  const contextRate = rates('ctx')
  const exploreRate = rates('explore')
  const urgentRate = rates('urgent')
  const longShare = lengths.filter(n => n >= 200).length / count
  const shortShare = lengths.filter(n => n < 20).length / count
  const nightShare = prompts.filter(prompt => localParts(prompt.t).hour < 6).length / count

  const domainCount = new Map()
  for (const p of prompts) domainCount.set(p.domain, (domainCount.get(p.domain) || 0) + 1)
  const domains = [...domainCount.entries()].sort((a, b) => b[1] - a[1]).map(([key, n]) => ({
    key, label: DOMAIN_LABEL[key] || key, count: n, share: n / count,
  }))

  const clarity = clamp(specRate / 0.62 * 100)
  const density = clamp((Math.log10(Math.max(10, median(lengths))) - 1) / (Math.log10(320) - 1) * 100)
  const explore = clamp((questionRate * 0.62 + exploreRate * 0.38) / 0.72 * 100)
  const iterate = clamp((avgPerSession - 1) / 4.5 * 100)
  const context = clamp((contextRate * 0.7 + longShare * 0.3) / 0.66 * 100)
  const verify = clamp((specRate * 0.7 + urgentRate * 0.3) / 0.6 * 100)

  const highClarity = clarity >= 45
  const highIterate = iterate >= 45
  const archetype = highClarity
    ? (highIterate
      ? { key: 'coach', label: '教练型', line: '目标清楚，又愿意多轮校准——你更像在带一个执行者。', strength: '能快速纠偏，交付物逐步逼近预期。', risk: '多轮会把上下文越堆越长，后几轮单价更高。' }
      : { key: 'architect', label: '建筑型', line: '先把要求和边界想清楚，再一次交付——返工少，但前期投入高。', strength: '需求一次成型，返工和重复调用少。', risk: '开放任务上容易过度设计，第一次沟通成本偏高。' })
    : (highIterate
      ? { key: 'explorer', label: '探索型', line: '常从问题出发，在对话里逐步收敛方向——适合开放任务，注意别让上下文变贵。', strength: '适合没有标准答案的开放任务。', risk: '目标容易漂移，会话越长账单越难控制。' }
      : { key: 'order', label: '点单型', line: '短指令、快节奏，边看结果边补要求——灵活，但容易多轮返工。', strength: '启动快，适合明确的小任务。', risk: '约束后补，返工多，单次交付的隐性成本高。' })

  const topDomain = domains.find(domain => domain.key !== 'other') || domains[0]
  const tags = []
  if (clarity >= 50) tags.push('目标清晰')
  else if (clarity < 32) tags.push('边聊边定')
  if (iterate >= 60) tags.push('多轮迭代')
  if (median(lengths) < 40) tags.push('短指令')
  if (longShare > 0.25) tags.push('长需求')
  if (explore >= 45) tags.push('开放探索')
  if (context >= 50) tags.push('上下文供给足')
  if (verify >= 50) tags.push('强验收')
  if (questionRate >= 0.32) tags.push('习惯追问')
  if (topDomain && topDomain.key !== 'other') tags.push(`${topDomain.label}偏多`)
  if (nightShare >= 0.25) tags.push('夜间工作')
  if (count >= 80) tags.push('高频使用')
  if (sessionIds.size >= 20) tags.push('多线并行')
  const highlights = []
  highlights.push(`样本 ${count} 条提问，来自 ${sessionIds.size} 个会话；平均每个会话 ${avgPerSession.toFixed(1)} 条。`)
  highlights.push(`提问中位长度 ${Math.round(median(lengths))} 字，${Math.round(longShare * 100)}% 超过 200 字，${Math.round(shortShare * 100)}% 不足 20 字。`)
  if (topDomain) highlights.push(`最常出现的主题是「${topDomain.label}」，占 ${Math.round(topDomain.share * 100)}%。`)
  if (specRate >= 0.35) highlights.push(`${Math.round(specRate * 100)}% 的提问带有明确约束（尺寸、数量、禁项等），验收意识较强。`)
  else highlights.push(`只有 ${Math.round(specRate * 100)}% 的提问带有明确约束，很多要求是在后续轮次里补上的。`)
  if (questionRate >= 0.3) highlights.push(`${Math.round(questionRate * 100)}% 的提问以问句形式出现，偏好先理解再动手。`)

  return {
    count, sessions: sessionIds.size, avgLen: Math.round(avgLen), medianLen: Math.round(median(lengths)),
    shortShare, longShare, questionRate, specRate, contextRate, exploreRate, urgentRate,
    avgPerSession, multiShare: multi / count, nightShare, tags: tags.slice(0, 7), domains,
    dims: [
      { key: 'clarity', label: '目标明确', value: clarity },
      { key: 'density', label: '信息密度', value: density },
      { key: 'explore', label: '探索倾向', value: explore },
      { key: 'iterate', label: '迭代深度', value: iterate },
      { key: 'context', label: '上下文供给', value: context },
      { key: 'verify', label: '验收意识', value: verify },
    ],
    archetype, highlights,
  }
}

function buildSuggestions(input) {
  const { total, models, tasks, style, hourly, coverageDays, peakConfig, loopThreshold } = input
  const out = []
  const cost = total.cost
  if (cost <= 0) return out

  const peakShare = hourly.peakShare
  if (peakConfig?.peakEnabled && peakShare > 0.18) {
    const saving = cost * peakShare * 0.5
    out.push({
      id: 'peak', priority: saving >= cost * 0.08 ? 'high' : 'medium', title: '把高峰时段的调用挪到谷时',
      why: `约 ${Math.round(peakShare * 100)}% 的花费、${Math.round((hourly.peakCallShare || 0) * 100)}% 的调用落在峰时（周末与节假日为谷价），峰时单价约为谷时的两倍。`,
      action: `峰时窗口约 ${hourly.peakWindows || '09:00–12:00、14:00–18:00'}（北京时间）。把批量整理、生成、重排这类不赶时间的工作放到谷时；交互式问题留在峰时。`,
      saving, savingLabel: `约 ${CURRENCY.CNY.symbol}${saving.toFixed(2)}`, basis: '按峰时部分节省 50% 粗估',
    })
  }

  const cacheShare = total.input + total.cacheRead + total.cacheWrite > 0
    ? total.cacheRead / (total.input + total.cacheRead + total.cacheWrite) : 0
  if (cacheShare < 0.72) {
    const saving = cost * 0.06 * (1 - cacheShare / 0.72)
    out.push({
      id: 'cache', priority: cacheShare < 0.45 ? 'high' : 'medium', title: '提高缓存命中率',
      why: `缓存读取只占输入 token 的 ${Math.round(cacheShare * 100)}%；重复粘贴的文件和反复改写的上下文都在按全价计费。`,
      action: '同一任务内追加说明，不要整段重发；长文用文件引用代替粘贴；长任务拆成独立子会话，各自带干净上下文。',
      saving, savingLabel: `约 ${CURRENCY.CNY.symbol}${saving.toFixed(2)}`, basis: '按输入侧成本节省 6%–12% 粗估',
    })
  }

  const inputTokens = total.input + total.cacheRead + total.cacheWrite
  const avgInput = total.calls > 0 ? inputTokens / total.calls : 0
  if (avgInput > 24000) {
    const saving = cost * Math.min(0.18, (avgInput - 24000) / avgInput * 0.25)
    out.push({
      id: 'context', priority: avgInput > 60000 ? 'high' : 'medium', title: '给上下文减重',
      why: `平均每次调用携带 ${fmtTokens(avgInput)} 输入 token，上下文越长，每一轮都在为历史付费。`,
      action: '长任务拆成子会话；阶段性用 /compact 压缩；把“已完成”的探索过程移出主上下文。',
      saving, savingLabel: `约 ${CURRENCY.CNY.symbol}${saving.toFixed(2)}`, basis: '按输入侧可压缩 10%–20% 粗估',
    })
  }

  const priced = models.filter(m => m.cost > 0 && m.tokens > 0)
  if (priced.length >= 2) {
    const byPerM = [...priced].sort((a, b) => b.costPerM - a.costPerM)
    const dear = byPerM[0]
    const cheap = [...priced].sort((a, b) => a.costPerM - b.costPerM)[0]
    if (dear.costPerM > cheap.costPerM * 2.5 && dear.cost >= cost * 0.12) {
      const expensiveCalls = dear.calls || 1
      const perCall = dear.cost / expensiveCalls
      const cheapPerCall = cheap.calls ? cheap.cost / cheap.calls : perCall / 4
      const saving = Math.max(0, (perCall - cheapPerCall) * expensiveCalls * 0.3)
      out.push({
        id: 'model', priority: 'medium', title: '把简单任务分给更便宜的模型',
        why: `${dear.model} 每百万 token 成本 ${CURRENCY.CNY.symbol}${dear.costPerM.toFixed(2)}，约为 ${cheap.model} 的 ${(dear.costPerM / Math.max(0.0001, cheap.costPerM)).toFixed(1)} 倍；它承担了 ${Math.round(dear.cost / cost * 100)}% 的费用。`,
        action: '把检索、格式化、短文案、机械改写交给 flash；只有长推理和复杂代码留给高价模型。',
        saving, savingLabel: `约 ${CURRENCY.CNY.symbol}${saving.toFixed(2)}`, basis: '假设 30% 的高价调用可替换',
      })
    }
  }

  const taskCost = total.attributed || tasks.reduce((sum, task) => sum + task.cost, 0)
  if (tasks.length >= 3 && taskCost > 0) {
    const top3 = tasks.slice(0, 3).reduce((sum, task) => sum + task.cost, 0)
    if (top3 / taskCost > 0.55) {
      out.push({
        id: 'focus', priority: 'high', title: '先优化最贵的三个任务',
        why: `前三个任务占了可归因费用的 ${Math.round(top3 / taskCost * 100)}%，它们的写法决定了大部分账单。`,
        action: `优先给「${tasks[0].title.slice(0, 18)}」这类任务建立模板：固定输入、固定验收标准、固定停止条件。`,
        saving: null, savingLabel: '结构性优化', basis: '任务集中度',
      })
    }
  }

  const loopSessions = input.loopSessions || []
  if (loopSessions.length) {
    const loopCost = loopSessions.reduce((sum, row) => sum + row.cost, 0)
    const saving = loopCost * 0.2
    out.push({
      id: 'loops', priority: 'medium', title: '收敛工具调用循环',
      why: `${loopSessions.length} 个会话平均每轮工具调用达到 ${Math.round(loopThreshold || 10)} 次以上（会话的 P90），值得检查是否存在重复搜索或试错循环。`,
      action: '先让 AI 给出计划再执行；给明确的停止条件；把大任务拆成可验收的小步。',
      saving, savingLabel: `约 ${CURRENCY.CNY.symbol}${saving.toFixed(2)}`, basis: '按这些会话节省 20% 粗估',
    })
  }

  if (style) {
    const { archetype, specRate, avgPerSession } = style
    const map = {
      architect: { title: '保持“先规格后执行”的优势', action: '把常用验收标准沉淀成固定模板，进一步减少解释成本。' },
      coach: { title: '把多轮校准变成一次说清', action: '每轮反馈时补一句“这轮只改哪里、不动哪里”，减少重复上下文。' },
      explorer: { title: '先收敛目标，再开始执行', action: '开放任务先让 AI 复述目标与边界，确认后再动手；避免边聊边推翻。' },
      order: { title: '一次性给出验收标准', action: `你的提问里只有 ${Math.round(specRate * 100)}% 带明确约束；补上尺寸、数量、禁项、格式，通常能少一到两轮返工。` },
    }
    const item = map[archetype.key]
    if (item) {
      out.push({
        id: 'style', priority: 'low', title: item.title, why: `画像显示你是「${archetype.label}」：平均每会话 ${avgPerSession.toFixed(1)} 条提问。`,
        action: item.action, saving: null, savingLabel: '降低返工', basis: '提问画像',
      })
    }
  }

  return out
}

export function buildReport({ from, to, currency = 'CNY', sessionId = '' }) {
  const ledger = readLedger()
  const key = [from, to, currency, sessionId, cache.mtimeMs, cache.size].join('|')
  if (cache.report && cache.reportKey === key && Date.now() - cache.at < 30000) return cache.report

  const cur = CURRENCY[currency] || CURRENCY.CNY
  const field = cur.field
  const config = ledger.config || {}
  const days = ledger.days || {}
  const retained = Object.keys(days).sort()
  if (!retained.length) throw new Error('账本还没有任何记录')

  const rangeFrom = from || retained[0]
  const rangeTo = to || retained.at(-1)
  const dates = dayList(rangeFrom, rangeTo)
  const prevDates = dates.map((_, i) => shiftDay(rangeFrom, i - dates.length))

  const totals = blank()
  const prev = blank()
  const daily = []
  const models = new Map()
  const sessions = new Map()

  for (const date of dates) {
    const day = days[date]
    const row = { date, cost: 0, tokens: 0, calls: 0 }
    if (day) {
      add(totals, day, field)
      row.cost = money(day, field)
      row.calls = day.calls || 0
      row.tokens = (day.input || 0) + (day.output || 0) + (day.cacheRead || 0) + (day.cacheWrite || 0) + (day.reasoning || 0)
      for (const [modelKey, bucket] of Object.entries(day.byProviderModel || {})) {
        const [provider, model] = modelKey.includes(':') ? [modelKey.slice(0, modelKey.indexOf(':')), modelKey.slice(modelKey.indexOf(':') + 1)] : ['', modelKey]
        const entry = models.get(modelKey) || { key: modelKey, provider, model, ...blank() }
        add(entry, bucket, field)
        models.set(modelKey, entry)
      }
      for (const session of day.sessions || []) {
        if (!session?.id) continue
        const entry = sessions.get(session.id) || { id: session.id, title: session.title || session.id, firstDate: date, lastDate: date, at: session.at || 0, ...blank() }
        add(entry, session, field)
        if (session.title) entry.title = session.title
        if (session.at) entry.at = Math.min(entry.at || session.at, session.at)
        entry.lastDate = date
        sessions.set(session.id, entry)
      }
    }
    daily.push(row)
  }
  for (const date of prevDates) {
    const day = days[date]
    if (day) add(prev, day, field)
  }

  const entries = [...sessions.values()].sort((a, b) => b.cost - a.cost || b.calls - a.calls)
  const sessionRows = entries.filter(row => row.cost > 0)
  const attributed = sessionRows.reduce((sum, row) => sum + row.cost, 0)

  // ── session-log scan: hourly allocation, turns and question style ──────────
  const fromMs = Date.parse(`${rangeFrom}T00:00:00+08:00`)
  const toMs = Date.parse(`${rangeTo}T23:59:59.999+08:00`)
  const summaries = loadSessionSummaries()
  const summaryById = new Map(summaries.map(s => [s.id, s]))

  const cells = new Map()
  const dayWeight = new Map()
  let peakWeight = 0
  let peakCalls = 0
  let totalWeight = 0
  let callsInRange = 0
  for (const session of summaries) {
    for (const call of session.calls) {
      if (call.t < fromMs || call.t > toMs) continue
      const parts = localParts(call.t)
      const peak = isPeak(call.t, config)
      const weight = call.weight * (peak ? 2 : 1)
      const cellKey = `${parts.weekday}:${parts.hour}`
      const cell = cells.get(cellKey) || { weekday: parts.weekday, hour: parts.hour, byDate: new Map() }
      const perDate = cell.byDate.get(parts.date) || { weight: 0, calls: 0 }
      perDate.weight += weight
      perDate.calls += 1
      cell.byDate.set(parts.date, perDate)
      cells.set(cellKey, cell)
      dayWeight.set(parts.date, (dayWeight.get(parts.date) || 0) + weight)
      totalWeight += weight
      callsInRange += 1
      if (peak) { peakWeight += weight; peakCalls += 1 }
    }
  }

  const dailyByDate = new Map(daily.map(row => [row.date, row]))
  const hourlyCells = new Map()
  for (const cell of cells.values()) {
    cell.cost = 0
    cell.tokens = 0
    cell.calls = 0
    for (const [date, perDate] of cell.byDate) {
      const day = dailyByDate.get(date)
      if (!day) continue
      const dayTotalWeight = dayWeight.get(date) || 0
      const share = dayTotalWeight > 0 ? perDate.weight / dayTotalWeight : 0
      cell.cost += day.cost * share
      cell.tokens += day.tokens * share
      cell.calls += perDate.calls
    }
    hourlyCells.set(`${cell.weekday}:${cell.hour}`, cell)
  }

  const hourly = {
    cells: [...hourlyCells.values()].sort((a, b) => a.weekday - b.weekday || a.hour - b.hour),
    peakShare: totalWeight > 0 ? peakWeight / totalWeight : 0,
    peakCallShare: callsInRange > 0 ? peakCalls / callsInRange : 0,
    top: [...hourlyCells.values()].filter(c => c.cost > 0).sort((a, b) => b.cost - a.cost).slice(0, 5)
      .map(c => ({ weekday: c.weekday, hour: c.hour, cost: c.cost, calls: c.calls })),
    callsInRange,
  }

  const prompts = []
  for (const session of summaries) {
    let index = 0
    for (const prompt of session.prompts) {
      if (prompt.t < fromMs || prompt.t > toMs) continue
      index += 1
      prompts.push({ ...prompt, sessionId: session.id, sessionIndex: index })
    }
  }
  const style = styleProfile(prompts, summaries)
  if (style) {
    style.agent = agentProfile(summaries, fromMs, toMs, prompts, totals)
    style.match = matchProfile(style.dims, style.agent)
  }

  const modelRows = [...models.values()].filter(row => row.calls > 0 || row.cost > 0)
    .map(row => {
      const tokens = row.input + row.output + row.cacheRead + row.cacheWrite + row.reasoning
      const inputTokens = row.input + row.cacheRead + row.cacheWrite
      return {
        key: row.key, provider: row.provider, model: row.model,
        cost: row.cost, tokens, calls: row.calls, input: row.input, output: row.output,
        cacheRead: row.cacheRead, cacheWrite: row.cacheWrite, reasoning: row.reasoning,
        costPerM: tokens > 0 ? row.cost / tokens * 1e6 : 0,
        cacheShare: inputTokens > 0 ? row.cacheRead / inputTokens : 0,
        share: totals.cost > 0 ? row.cost / totals.cost : 0,
      }
    })
    .sort((a, b) => b.cost - a.cost)

  const taskOf = row => {
    const summary = summaryById.get(row.id)
    const displayTitle = summary?.title || row.title || row.id
    const titleDomain = classifyText(displayTitle)
    const promptText = (summary?.prompts || []).map(p => p.head).join(' ').slice(0, 2400)
    const domain = titleDomain !== 'other' ? titleDomain : classifyText(promptText)
    const inputTokens = row.input + row.cacheRead + row.cacheWrite
    const topTools = summary
      ? Object.entries(summary.tools).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }))
      : []
    const toolCount = topTools.reduce((sum, tool) => sum + tool.count, 0)
    const toolResults = summary ? summary.toolResults.filter(result => result.t >= fromMs && result.t <= toMs) : []
    const toolErrors = toolResults.filter(result => result.error).length
    const latencies = summary ? summary.latencies.filter(item => item.t >= fromMs && item.t <= toMs).map(item => item.ms) : []
    const turns = summary?.turns || 0
    return {
      id: row.id, title: displayTitle, date: row.lastDate || row.firstDate,
      cost: row.cost, tokens: row.input + row.output + row.cacheRead + row.cacheWrite + row.reasoning,
      calls: row.calls, turns, prompts: summary?.prompts?.length || 0,
      tools: summary ? Object.values(summary.tools).reduce((a, b) => a + b, 0) : 0,
      toolCount, toolErrors, toolErrorRate: toolResults.length ? toolErrors / toolResults.length : 0,
      medianLatencySec: latencies.length ? quantile(latencies, 0.5) / 1000 : 0,
      costPerTurn: turns > 0 ? row.cost / turns : 0,
      cacheShare: inputTokens > 0 ? row.cacheRead / inputTokens : 0,
      breakdown: { input: row.input, output: row.output, cacheRead: row.cacheRead, cacheWrite: row.cacheWrite, reasoning: row.reasoning },
      domain,
      domainLabel: DOMAIN_LABEL[domain] || '其他',
      models: [...new Set(summary ? summary.calls.map(c => c.model).filter(Boolean) : [])].slice(0, 2),
      toolNames: summary ? Object.keys(summary.tools).sort() : [],
      topTools,
    }
  }
  const tasks = sessionRows.slice(0, 12).map(taskOf)
  const tasksByTokens = [...sessionRows]
    .sort((a, b) => (b.input + b.output + b.cacheRead + b.cacheWrite + b.reasoning) - (a.input + a.output + a.cacheRead + a.cacheWrite + a.reasoning))
    .slice(0, 12)
    .map(taskOf)

  const toolStats = new Map()
  for (const summary of summaries) {
    for (const call of summary.toolCalls) {
      if (call.t < fromMs || call.t > toMs) continue
      const entry = toolStats.get(call.name) || { name: call.name, count: 0, tasks: new Set(), errors: 0, results: 0, durations: [] }
      entry.count += 1
      entry.tasks.add(summary.id)
      toolStats.set(call.name, entry)
    }
    for (const result of summary.toolResults) {
      if (result.t < fromMs || result.t > toMs || !result.name) continue
      const entry = toolStats.get(result.name)
      if (!entry) continue
      entry.results += 1
      if (result.error) entry.errors += 1
    }
    for (const duration of summary.toolDurations) {
      if (duration.t < fromMs || duration.t > toMs) continue
      const entry = toolStats.get(duration.name)
      if (entry) entry.durations.push(duration.ms)
    }
  }
  const tools = [...toolStats.values()].map(entry => ({
    name: entry.name,
    count: entry.count,
    tasks: entry.tasks.size,
    errors: entry.errors,
    errorRate: entry.results ? entry.errors / entry.results : 0,
    medianMs: entry.durations.length ? quantile(entry.durations, 0.5) : 0,
    p90Ms: entry.durations.length ? quantile(entry.durations, 0.9) : 0,
  })).sort((a, b) => b.count - a.count).slice(0, 12)

  const domainCost = new Map()
  const domainBuckets = new Map()
  for (const row of sessionRows) {
    const summary = summaryById.get(row.id)
    const titleDomain = classifyText(summary?.title || row.title)
    const domain = titleDomain !== 'other' ? titleDomain : classifyText((summary?.prompts || []).map(p => p.head).join(' ').slice(0, 2400))
    domainCost.set(domain, (domainCost.get(domain) || 0) + row.cost)
    const bucket = domainBuckets.get(domain) || []
    bucket.push({
      id: row.id,
      title: summary?.title || row.title || row.id,
      cost: row.cost,
      date: row.lastDate || row.firstDate,
    })
    domainBuckets.set(domain, bucket)
  }
  const domains = [...domainCost.entries()].sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ key, label: DOMAIN_LABEL[key] || key, cost: value, share: attributed > 0 ? value / attributed : 0 }))

  const domainTree = {
    name: '任务类型',
    value: attributed,
    children: domains.map(domain => {
      const list = [...(domainBuckets.get(domain.key) || [])].sort((a, b) => b.cost - a.cost)
      const top = list.slice(0, 5).map(item => ({ name: item.title, label: item.title, value: Math.max(0.0001, item.cost), cost: item.cost, id: item.id, date: item.date }))
      const rest = list.slice(5)
      if (rest.length) top.push({ name: `其他 ${rest.length} 个`, label: `其他 ${rest.length} 个`, value: rest.reduce((sum, item) => sum + item.cost, 0), cost: rest.reduce((sum, item) => sum + item.cost, 0), other: true })
      return { name: domain.label, label: domain.label, value: Math.max(0.0001, domain.cost), cost: domain.cost, key: domain.key, children: top }
    }),
  }

  const providerLabel = provider => provider === 'deepseek-account' ? 'DeepSeek 账号' : provider === 'deepseek-official' ? 'DeepSeek 官方' : provider || '其他渠道'
  const modelLabel = model => ({
    'deepseek-flash': 'DeepSeek V4.1 Flash',
    'deepseek-v4.1-flash': 'DeepSeek V4.1 Flash',
    'deepseek-v4-flash': 'DeepSeek V4 Flash',
    'deepseek-v4-pro': 'DeepSeek V4 Pro',
    'deepseek-search-server': 'DeepSeek 搜索服务',
  })[model] || model
  const providerBuckets = new Map()
  for (const row of modelRows) {
    const key = row.provider || '其他渠道'
    const bucket = providerBuckets.get(key) || []
    bucket.push(row)
    providerBuckets.set(key, bucket)
  }
  const modelTree = {
    name: '模型',
    value: totals.cost,
    children: [...providerBuckets.entries()].map(([provider, list]) => ({
      name: providerLabel(provider),
      label: providerLabel(provider),
      value: Math.max(0.0001, list.reduce((sum, row) => sum + row.cost, 0)),
      cost: list.reduce((sum, row) => sum + row.cost, 0),
      children: list.map(row => ({
        name: modelLabel(row.model),
        label: modelLabel(row.model),
        value: Math.max(0.0001, row.cost),
        cost: row.cost,
        tokens: row.tokens,
        calls: row.calls,
        share: row.share,
      })),
    })),
  }

  const loopRatios = sessionRows
    .map(row => {
      const summary = summaryById.get(row.id)
      if (!summary || !summary.turns) return null
      return Object.values(summary.tools).reduce((a, b) => a + b, 0) / summary.turns
    })
    .filter(value => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b)
  const p90 = loopRatios.length ? loopRatios[Math.min(loopRatios.length - 1, Math.floor(loopRatios.length * 0.9))] : Infinity
  const loopThreshold = Math.max(8, p90)
  const loopSessions = sessionRows.filter(row => {
    const summary = summaryById.get(row.id)
    if (!summary || !summary.turns) return false
    const tools = Object.values(summary.tools).reduce((a, b) => a + b, 0)
    return tools / summary.turns >= loopThreshold
  }).slice(0, 5).map(row => ({ id: row.id, title: row.title, cost: row.cost }))

  const relations = buildRelations({ rows: sessionRows, summaryById })

  const totalTokens = totals.input + totals.output + totals.cacheRead + totals.cacheWrite + totals.reasoning
  const coverageDays = dates.length
  const notes = [`账本保留范围 ${retained[0]} 至 ${retained.at(-1)}；费用来自 dsh-cost-meter 账本，小时分布按当时用量与峰谷权重分摊。`]
  if (totals.cost - attributed > 0.05) notes.push(`另有 ${(totals.cost - attributed).toFixed(2)} 元未归因到具体会话，任务与类型占比以可归因金额为分母。`)

  const typeMap = new Map()
  const attributionMap = new Map()
  const allSteps = []
  for (const row of sessionRows) {
    const summary = summaryById.get(row.id)
    if (!summary) continue
    const costTypes = sessionCostTypes(summary, row.cost, fromMs, toMs)
    for (const type of costTypes.types) {
      const entry = typeMap.get(type.kind) || { kind: type.kind, label: type.label, cost: 0, calls: 0 }
      entry.cost += type.cost
      entry.calls += type.calls
      typeMap.set(type.kind, entry)
    }
    for (const parent of costTypes.attribution.children) {
      const entry = attributionMap.get(parent.name) || { name: parent.name, label: parent.name, value: 0, cost: 0, children: new Map() }
      entry.value += parent.value
      entry.cost += parent.value
      for (const child of parent.children) {
        const childEntry = entry.children.get(child.name) || { name: child.name, label: child.name, value: 0, cost: 0 }
        childEntry.value += child.value
        childEntry.cost += child.value
        entry.children.set(child.name, childEntry)
      }
      attributionMap.set(parent.name, entry)
    }
    for (const step of costTypes.stepRows) allSteps.push({ ...step, sessionId: row.id })
  }
  const typeTotal = [...typeMap.values()].reduce((sum, type) => sum + type.cost, 0)
  const costTypes = [...typeMap.values()]
    .map(type => ({ ...type, share: typeTotal > 0 ? type.cost / typeTotal : 0 }))
    .sort((a, b) => b.cost - a.cost)
  const costAttribution = {
    name: '费用',
    value: typeTotal,
    children: [...attributionMap.values()].map(parent => ({
      ...parent,
      children: [...parent.children.values()].sort((a, b) => b.value - a.value),
    })).sort((a, b) => b.value - a.value),
  }
  const sortedStepCosts = allSteps.map(step => step.cost).sort((a, b) => b - a)
  const top10Cost = sortedStepCosts.slice(0, 10).reduce((sum, value) => sum + value, 0)
  const costTypeMeta = {
    steps: allSteps.length,
    calls: allSteps.length,
    avgCost: allSteps.length ? typeTotal / allSteps.length : 0,
    top10Share: typeTotal > 0 ? top10Cost / typeTotal : 0,
  }
  allSteps.sort((a, b) => a.t - b.t).forEach((step, index) => { step.index = index })

  const report = {
    generatedAt: Date.now(),
    source: 'cost-meter ledger',
    currency, symbol: cur.symbol,
    range: { from: rangeFrom, to: rangeTo, days: coverageDays },
    retained: { from: retained[0], to: retained.at(-1) },
    totals: {
      cost: totals.cost, tokens: totalTokens, calls: totals.calls,
      input: totals.input, output: totals.output, cacheRead: totals.cacheRead,
      cacheWrite: totals.cacheWrite, reasoning: totals.reasoning,
      sessions: sessionRows.length,
      attributed,
      unassigned: Math.max(0, totals.cost - attributed),
      costPerCall: totals.calls > 0 ? totals.cost / totals.calls : 0,
      cacheShare: totals.input + totals.cacheRead + totals.cacheWrite > 0
        ? totals.cacheRead / (totals.input + totals.cacheRead + totals.cacheWrite) : 0,
      avgDaily: coverageDays > 0 ? totals.cost / coverageDays : 0,
      avgInputPerCall: totals.calls > 0 ? (totals.input + totals.cacheRead + totals.cacheWrite) / totals.calls : 0,
    },
    previous: { cost: prev.cost, tokens: prev.input + prev.output + prev.cacheRead + prev.cacheWrite + prev.reasoning, calls: prev.calls },
    daily,
    monthly: aggregateBy(daily, row => row.date.slice(0, 7)),
    weekly: aggregateBy(daily, row => isoWeek(row.date).key).map(row => ({ ...row, label: isoWeek(row.key).label })),
    hourly: { ...hourly, peakWindows: peakWindowText(config) },
    models: modelRows.slice(0, 12),
    tasks,
    tasksByTokens,
    tools,
    modelTree,
    domainTree,
    relations,
    coverage: {
      files: summaries.stats?.files || 0,
      parsed: summaries.stats?.parsed || 0,
      failed: summaries.stats?.failed || 0,
      calls: callsInRange,
      prompts: prompts.length,
    },
    domains,
    costTypes,
    costSteps: allSteps,
    costAttribution,
    costTypeMeta,
    style,
    suggestions: buildSuggestions({ total: { ...totals, tokens: totalTokens, attributed }, models: modelRows, tasks, style, hourly, coverageDays, peakConfig: config, loopSessions, loopThreshold }),
    notes,
  }

  let session = null
  if (sessionId) {
    const row = sessions.get(sessionId)
    if (row) {
      session = taskOf(row)
      const summary = summaryById.get(row.id)
      const timeline = sessionSeries(summary, row.cost, fromMs, toMs)
      session.series = timeline.points
      session.bucketMinutes = timeline.bucketMinutes
      const costTypes = sessionCostTypes(summary, row.cost, fromMs, toMs)
      session.costTypes = costTypes.types
      session.costSteps = costTypes.stepRows
      session.costAttribution = costTypes.attribution
      session.costTypeMeta = { steps: costTypes.steps, calls: costTypes.calls, avgCost: costTypes.avgCost, top10Share: costTypes.top10Share }
    }
  }
  report.session = session

  cache.report = report
  cache.reportKey = key
  cache.at = Date.now()
  return report
}

function aggregateBy(rows, keyOf) {
  const map = new Map()
  for (const row of rows) {
    const key = keyOf(row)
    const entry = map.get(key) || { key, cost: 0, tokens: 0, calls: 0 }
    entry.cost += row.cost
    entry.tokens += row.tokens
    entry.calls += row.calls
    map.set(key, entry)
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
}

export function invalidateReport() {
  cache.report = null
  cache.reportKey = ''
  cache.at = 0
}

export { CURRENCY }
