import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const SESSION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/

function storeFile() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  return path.join(home, 'storages', 'token-bill-limits.json')
}

function readStore() {
  const file = storeFile()
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  } catch {
    return {}
  }
}

function writeStore(data) {
  const file = storeFile()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(tmp, file)
}

const positive = value => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Resolve the effective limits for one session.
 * Per-session overrides live in the store; defaults come from plugin config.
 */
const DEFAULT_KEY = '__default__'

export function getLimits(sessionId) {
  const store = readStore()
  const fallback = store[DEFAULT_KEY]?.limits || {}
  const override = SESSION_ID.test(sessionId || '') ? store[sessionId]?.limits || {} : {}
  const tokenLimit = positive(override.tokenLimit) ?? positive(fallback.tokenLimit)
  const costLimit = positive(override.costLimit) ?? positive(fallback.costLimit)
  return {
    tokenLimit,
    costLimit,
    perSession: Boolean(override.tokenLimit || override.costLimit),
    fromDefault: !override.tokenLimit && !override.costLimit && Boolean(fallback.tokenLimit || fallback.costLimit),
  }
}

export function getDefaultLimits() {
  const store = readStore()
  const fallback = store[DEFAULT_KEY]?.limits || {}
  return { tokenLimit: positive(fallback.tokenLimit), costLimit: positive(fallback.costLimit) }
}

export function saveDefaultLimits(limits) {
  const store = readStore()
  const next = {}
  const tokenLimit = positive(limits?.tokenLimit)
  const costLimit = positive(limits?.costLimit)
  if (tokenLimit) next.tokenLimit = tokenLimit
  if (costLimit) next.costLimit = costLimit
  if (Object.keys(next).length) store[DEFAULT_KEY] = { limits: next }
  else delete store[DEFAULT_KEY]
  writeStore(store)
  return getDefaultLimits()
}

export function saveSessionLimits(sessionId, limits) {
  if (!SESSION_ID.test(sessionId || '')) throw new Error('会话 ID 无效')
  const store = readStore()
  const entry = store[sessionId] || (store[sessionId] = {})
  const next = {}
  const tokenLimit = positive(limits?.tokenLimit)
  const costLimit = positive(limits?.costLimit)
  if (tokenLimit) next.tokenLimit = tokenLimit
  if (costLimit) next.costLimit = costLimit
  if (Object.keys(next).length) entry.limits = next
  else delete entry.limits
  writeStore(store)
  return getLimits(sessionId)
}

export function clearSessionLimits(sessionId) {
  if (!SESSION_ID.test(sessionId || '')) throw new Error('会话 ID 无效')
  const store = readStore()
  if (store[sessionId]) {
    delete store[sessionId].limits
    if (!Object.keys(store[sessionId]).length) delete store[sessionId]
    writeStore(store)
  }
  return getLimits(sessionId)
}

/**
 * Advance and read the alert state for one turn.
 * A warning is returned only on the exact turn that first crossed the line,
 * identified by the turn's end `seq`, so re-renders and other turns stay quiet.
 */
export function evaluateAlerts({ sessionId, seq, usage, limits, cost }) {
  if (!SESSION_ID.test(sessionId || '') || !Number.isSafeInteger(seq) || seq < 0) return []
  const store = readStore()
  const entry = store[SESSION_ID.test(sessionId || '') ? sessionId : DEFAULT_KEY] || (store[SESSION_ID.test(sessionId || '') ? sessionId : DEFAULT_KEY] = {})
  const alerts = entry.alerts || (entry.alerts = {})
  const warnings = []
  let changed = false

  const metrics = []
  if (limits.tokenLimit && usage?.tokens != null) {
    metrics.push({ key: 'token', value: usage.tokens, limit: limits.tokenLimit, kind: 'token' })
  }
  if (limits.costLimit && cost != null) {
    metrics.push({ key: 'cost', value: cost, limit: limits.costLimit, kind: 'cost' })
  }

  for (const metric of metrics) {
    const ratio = metric.limit > 0 ? metric.value / metric.limit : 0
    let state = alerts[metric.key]
    // A changed limit starts a fresh alert cycle; old crossings no longer apply.
    if (!state || state.limit !== metric.limit) {
      state = { limit: metric.limit }
      alerts[metric.key] = state
      changed = true
    }
    const level = ratio >= 1 ? 'crossed' : ratio >= 0.8 ? 'warn80' : 'ok'
    if (level !== 'ok' && !state[level]) {
      state[level] = { seq, at: Date.now() }
      changed = true
      warnings.push({
        metric: metric.key,
        kind: level,
        ratio,
        value: metric.value,
        limit: metric.limit,
        unit: metric.key === 'cost' ? 'currency' : 'token',
      })
    }
  }

  if (changed) writeStore(store)
  return warnings
}
