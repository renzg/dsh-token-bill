import fs from 'node:fs'
import path from 'node:path'
import { sessionsRoot, decompressSessionFile } from './sessions.js'

const SESSION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/
const num = value => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
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
  return candidates.length ? path.join(dir, candidates[0].name) : null
}

/** Locate exactly one session's own log; subagent sessions live in their own directory and are excluded. */
export function findSessionLog(sessionId) {
  if (!SESSION_ID.test(sessionId || '')) return null
  let workspaces
  try { workspaces = fs.readdirSync(sessionsRoot(), { withFileTypes: true }) } catch { return null }
  for (const ws of workspaces) {
    if (!ws.isDirectory()) continue
    const file = logFileOf(path.join(sessionsRoot(), ws.name, sessionId))
    if (file) return file
  }
  return null
}

/**
 * Precise cumulative usage for one session, read from that session's own log.
 * Token fields match the rest of this bundle: assistant/message.usage only.
 * `null` means the log is absent or unreadable — callers must degrade quietly.
 */
const usageCache = { key: '', usage: null }

export function readSessionUsage(sessionId) {
  const file = findSessionLog(sessionId)
  if (!file) return null
  let mtimeMs
  try { mtimeMs = fs.statSync(file).mtimeMs } catch { return null }
  const key = `${file}|${mtimeMs}`
  if (usageCache.key === key && usageCache.usage) return usageCache.usage
  let raw
  try { raw = decompressSessionFile(fs.readFileSync(file)) } catch { return null }
  const out = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, calls: 0, tokens: 0 }
  for (const line of raw.toString('utf8').split('\n')) {
    if (!line) continue
    let event
    try { event = JSON.parse(line) } catch { continue }
    if (event.type !== 'assistant/message') continue
    const usage = event.data?.usage
    if (!usage) continue
    out.input += num(usage.inputTokens)
    out.output += num(usage.outputTokens)
    out.cacheRead += num(usage.cacheReadTokens)
    out.cacheWrite += num(usage.cacheWriteTokens)
    out.reasoning += num(usage.reasoningTokens)
    out.calls += 1
  }
  out.tokens = out.input + out.output + out.cacheRead + out.cacheWrite + out.reasoning
  out.file = file
  usageCache.key = key
  usageCache.usage = out
  return out
}

/**
 * Precise cost for one session from the dsh-cost-meter ledger.
 * `field` selects the display currency (cost / costCny / costEur).
 * Returns null when cost-meter is not active or has no record for the session.
 */
export function readSessionCost(sessionId, field = 'costCny') {
  if (!SESSION_ID.test(sessionId || '')) return null
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  const file = path.join(home, 'storages', 'cost-meter', 'ledger.json')
  let ledger
  try { ledger = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return null }
  let cost = 0
  let found = false
  let calls = 0
  for (const day of Object.values(ledger.days || {})) {
    for (const session of day.sessions || []) {
      if (session.id !== sessionId) continue
      found = true
      cost += Number(session[field]) || 0
      calls += Number(session.calls) || 0
    }
  }
  return found ? { cost, calls } : null
}
