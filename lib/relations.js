import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { classifyText, DOMAIN_LABEL } from './sessions.js'

const STOP = new Set([
  '项目', '任务', '分析', '设计', '构建', '生成', '工作', '内容', '一个', '这个', '我们', '可以', '需要',
  '以及', '进行', '如何', '什么', '问题', '方案', '功能', '实现', '支持', '使用', '通过', '时间', '相关',
  '主要', '一些', '不是', '没有', '现在', '然后', '就是', '还是', '已经', '可能', '如果', '因为', '所以',
])

const GENERIC_TOPICS = /工作日志|待办|用户偏好|项目约定|项目记忆|今日|日志|工作方式/
const WRITE_TOOLS = /^(write|edit|apply_patch|apply-patch|patch|str_replace)/i
const READ_TOOLS = /^(read|grep|glob|search|workspace_files)/i
const GENERIC_FILES = new Set(['index.js', 'client.js', 'report.js', 'icon.svg', 'routes.md', 'package.json', 'readme.md', 'styles.css', 'main.js', 'app.js', 'game.js', 'game.json', 'tsconfig.json', 'memory.md'])

function grams(text, limit = 400) {
  const clean = String(text || '').toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, ' ')
  const out = new Set()
  for (const part of clean.split(' ')) {
    if (!part) continue
    if (/^[\u4e00-\u9fa5]+$/.test(part)) {
      for (let i = 0; i < part.length - 1; i += 1) {
        const gram = part.slice(i, i + 2)
        if (!STOP.has(gram)) out.add(gram)
      }
    } else if (part.length >= 3 && !STOP.has(part)) out.add(part)
    if (out.size >= limit) break
  }
  return out
}

function filePaths(call) {
  const text = call.arguments || ''
  const out = new Set()
  for (const match of text.matchAll(/"(?:file_path|path)"\s*:\s*"([^"]+)"/g)) {
    if (match[1] && match[1].length < 240) out.add(match[1])
  }
  for (const match of text.matchAll(/\*\*\*\s*(?:Add|Update|Delete) File:\s*([^\n*]+)/g)) {
    const value = match[1].trim()
    if (value && value.length < 240) out.add(value)
  }
  return [...out]
}

function memoryFiles(cwds) {
  const files = [path.join(os.homedir(), '.deepseek-harness', 'MEMORY.md')]
  for (const cwd of cwds) {
    if (!cwd) continue
    files.push(path.join(cwd, '.deepseek-harness', 'MEMORY.md'))
  }
  return [...new Set(files)]
}

function readMemoryTopics(cwds) {
  const topics = new Map()
  for (const file of memoryFiles(cwds)) {
    let text
    try { text = fs.readFileSync(file, 'utf8') } catch { continue }
    for (const match of text.matchAll(/^##\s+(.+)$/gm)) {
      const label = match[1].replace(/^#+\s*/, '').trim()
      if (!label || label.length > 18 || GENERIC_TOPICS.test(label)) continue
      if (!topics.has(label)) topics.set(label, { id: `topic:${label}`, label, keywords: grams(label) })
    }
  }
  return [...topics.values()]
}

function domainOf(row, summary) {
  const titleDomain = classifyText(summary?.title || row.title || '')
  if (titleDomain !== 'other') return titleDomain
  return classifyText((summary?.prompts || []).map(prompt => prompt.head).join(' ').slice(0, 2400))
}

/**
 * Build a task-intent graph from evidence that two sessions' goals or outputs touch.
 * Same workspace/date/domain alone is deliberately NOT an edge.
 */
export function buildRelations({ rows, summaryById, limit = 16 }) {
  const selected = rows.slice(0, limit)
  const nodes = selected.map(row => {
    const summary = summaryById.get(row.id)
    const domain = domainOf(row, summary)
    const written = new Set()
    const read = new Set()
    for (const call of summary?.toolCalls || []) {
      const paths = filePaths(call)
      if (!paths.length) continue
      const target = WRITE_TOOLS.test(call.name) ? written : READ_TOOLS.test(call.name) ? read : null
      if (target) for (const item of paths) target.add(item)
    }
    const prompts = (summary?.prompts || []).map(prompt => prompt.head).join(' ')
    return {
      id: row.id,
      title: summary?.title || row.title || row.id,
      cost: row.cost,
      tokens: row.input + row.output + row.cacheRead + row.cacheWrite + row.reasoning,
      date: row.lastDate || row.firstDate,
      at: row.at || summary?.createdAt || 0,
      turns: summary?.turns || 0,
      cwd: summary?.cwd || '',
      parentSession: summary?.parentSession || null,
      domain,
      domainLabel: DOMAIN_LABEL[domain] || '其他',
      grams: grams(`${summary?.title || row.title || ''} ${prompts}`),
      referenceText: `${summary?.title || row.title || ''} ${prompts}`,
      written,
      read,
    }
  })

  const topics = readMemoryTopics([...new Set(nodes.map(node => node.cwd).filter(Boolean))])
  const matchedTopics = []
  const edges = []
  const nodeById = new Map(nodes.map(node => [node.id, node]))
  const direct = new Map()

  const addDirect = (a, b, weight, reason) => {
    if (!a || !b || a === b) return
    const key = [a, b].sort().join('|')
    const existing = direct.get(key)
    if (existing) {
      existing.weight = Math.min(9, existing.weight + weight * 0.6)
      if (!existing.reasons.includes(reason)) existing.reasons.push(reason)
      return
    }
    direct.set(key, { source: a, target: b, weight, reasons: [reason] })
  }

  for (const topic of topics) {
    const hits = []
    for (const node of nodes) {
      const text = `${node.title} ${[...node.grams].join(' ')}`
      let matched = 0
      for (const keyword of topic.keywords) if (text.includes(keyword)) matched += 1
      const score = topic.keywords.size ? matched / topic.keywords.size : 0
      if (matched >= 1 && score >= 0.1) hits.push({ id: node.id, score })
    }
    if (hits.length >= 2) {
      matchedTopics.push({ id: topic.id, label: topic.label, count: hits.length })
      for (const hit of hits) edges.push({ source: topic.id, target: hit.id, weight: 1.8 + hit.score * 3, reasons: ['记忆主题'] })
    }
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i]
      const b = nodes[j]
      const reused = []
      for (const file of a.written) if (b.read.has(file) || b.written.has(file)) reused.push(file)
      for (const file of b.written) if (a.read.has(file) || a.written.has(file)) reused.push(file)
      const distinctive = [...new Set(reused)].filter(file => {
        const base = path.basename(file).toLowerCase()
        return !GENERIC_FILES.has(base) && (base.length >= 10 || base.includes('_') || base.includes('-'))
      })
      if (distinctive.length >= 2 || (distinctive.length === 1 && path.basename(distinctive[0]).length >= 12)) {
        const names = distinctive.map(file => path.basename(file)).slice(0, 2)
        addDirect(a.id, b.id, 4 + Math.min(3, distinctive.length), `产出复用：${names.join('、')}`)
      }
      if (a.title.length >= 6 && b.referenceText.includes(a.title)) addDirect(a.id, b.id, 3.5, `引用：${a.title.slice(0, 14)}`)
      if (b.title.length >= 6 && a.referenceText.includes(b.title)) addDirect(b.id, a.id, 3.5, `引用：${b.title.slice(0, 14)}`)
      for (const file of a.written) {
        const base = path.basename(file)
        if (base.length >= 5 && b.referenceText.includes(base)) addDirect(a.id, b.id, 3.5, `引用产出：${base}`)
      }
      for (const file of b.written) {
        const base = path.basename(file)
        if (base.length >= 5 && a.referenceText.includes(base)) addDirect(b.id, a.id, 3.5, `引用产出：${base}`)
      }
    }
  }

  for (const node of nodes) {
    if (node.parentSession && nodeById.has(node.parentSession)) {
      addDirect(node.parentSession, node.id, 5, '父子会话')
    }
  }

  const directEdges = [...direct.values()]
  edges.push(...directEdges)

  return {
    nodes: nodes.map(({ grams, referenceText, written, read, ...node }) => node),
    edges,
    topics: matchedTopics.sort((a, b) => b.count - a.count).slice(0, 6),
    note: directEdges.length
      ? '只保留可证实的关系：记忆主题、产出文件复用、明确引用与父子会话；其余任务保持孤立。'
      : '没有找到可证实的任务关联；相同工作区/日期不再自动连边，任务以孤点展示。',
  }
}
