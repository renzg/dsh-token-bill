const C = {
  navy: '#2A4A78', teal: '#159A99', moon: '#84A5D2', ivory: '#E8EEF7',
  paper: '#F2ECDE', card: '#FFFDF6', gold: '#D9A441', red: '#B55245',
  gray: '#75878A', jade: '#45B8A1', ink: '#3D3B4F',
}

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const n = value => Number(value || 0)
const money = (value, symbol = '¥') => `${symbol}${n(value).toFixed(2)}`
const pct = (value, digits = 1) => `${(n(value) * 100).toFixed(digits)}%`
const compact = value => {
  const number = n(value)
  if (number >= 1e8) return `${(number / 1e8).toFixed(2)} 亿`
  if (number >= 1e4) return `${(number / 1e4).toFixed(1)} 万`
  return String(Math.round(number))
}
const dateTime = value => {
  try { return new Date(value).toLocaleString('zh-CN', { hour12: false }) } catch { return String(value || '') }
}

function barList(rows, label, value, max, color, suffix = '') {
  if (!rows.length) return '<p class="empty">没有可展示的数据。</p>'
  return `<div class="bars">${rows.map(row => {
    const width = max > 0 ? Math.max(1, (n(row[value]) / max) * 100) : 1
    return `<div class="bar-row"><div class="bar-label">${esc(row[label])}</div><div class="bar-track"><i style="width:${width}%;background:${color}"></i></div><div class="bar-value">${esc(row.display || '')}${suffix}</div></div>`
  }).join('')}</div>`
}

function radarSvg(axes) {
  const size = 340, cx = 170, cy = 165, r = 98, count = axes.length
  const point = (index, ratio) => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / count
    return [cx + Math.cos(angle) * r * ratio, cy + Math.sin(angle) * r * ratio]
  }
  const polygon = ratio => axes.map((_, index) => point(index, ratio).join(',')).join(' ')
  const shape = key => axes.map((axis, index) => point(index, Math.max(0.03, n(axis[key]) / 100)).join(',')).join(' ')
  const labels = axes.map((axis, index) => {
    const [x, y] = point(index, 1.22)
    const anchor = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end'
    return `<text x="${x}" y="${y + 4}" text-anchor="${anchor}" font-size="11" fill="${C.gray}">${esc(axis.label)}</text>`
  }).join('')
  return `<svg viewBox="0 0 ${size} ${size}" class="radar" role="img" aria-label="协作默契雷达图">
    ${[0.25, 0.5, 0.75, 1].map(ratio => `<polygon points="${polygon(ratio)}" fill="none" stroke="rgba(42,74,120,.14)"/>`).join('')}
    ${axes.map((_, index) => { const [x, y] = point(index, 1); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(42,74,120,.12)"/>` }).join('')}
    <polygon points="${shape('user')}" fill="rgba(132,165,210,.18)" stroke="${C.moon}" stroke-width="1.8"/>
    <polygon points="${shape('agent')}" fill="rgba(21,154,153,.16)" stroke="${C.teal}" stroke-width="1.8"/>
    ${labels}
  </svg>`
}

export function buildReportHtml(report) {
  const symbol = report.symbol || '¥'
  const totals = report.totals || {}
  const tasks = (report.tasks || []).slice(0, 8)
  const models = (report.models || []).slice(0, 8)
  const domains = (report.domains || []).slice(0, 8)
  const daily = report.daily || []
  const maxDaily = Math.max(...daily.map(row => n(row.cost)), 0.0001)
  const maxTask = Math.max(...tasks.map(row => n(row.cost)), 0.0001)
  const maxModel = Math.max(...models.map(row => n(row.cost)), 0.0001)
  const maxDomain = Math.max(...domains.map(row => n(row.cost)), 0.0001)
  const top5 = tasks.slice(0, 5).reduce((sum, task) => sum + n(task.cost), 0)
  const base = n(totals.attributed) || n(totals.cost) || 1
  const top = tasks[0]
  const lines = []
  if (top) lines.push(`最贵的一项「${top.title}」占 ${pct(n(top.cost) / base)}，前五项合计占 ${pct(top5 / base)}。`)
  if (report.hourly?.peakShare > 0.2) lines.push(`约 ${pct(report.hourly.peakShare)} 的花费、${pct(report.hourly.peakCallShare || 0)} 的调用落在峰时。`)
  if (n(totals.cacheShare) > 0.8) lines.push(`缓存命中 ${pct(totals.cacheShare)}，重复上下文基本都走了低价缓存。`)
  if (!lines.length) lines.push('这段时间还没有可归因的消费。')

  const style = report.style || {}
  const match = style.match || {}
  const axes = match.axes || []
  const suggestions = report.suggestions || []
  const maxSuggestion = Math.max(...suggestions.map(item => n(item.saving)), 0)

  const dailyBars = daily.map((row, index) => {
    const width = Math.max(1, (n(row.cost) / maxDaily) * 100)
    return `<div class="day"><div class="day-bar"><i style="height:${width}%"></i></div><div class="day-label">${esc(String(row.date || '').slice(5))}</div><div class="day-value">${money(row.cost, symbol)}</div></div>`
  }).join('')

  const taskRows = tasks.map((task, index) => `<tr>
    <td class="num">${index + 1}</td>
    <td><strong>${esc(task.title)}</strong><div class="small">${esc(task.date || '')} · ${esc(task.domainLabel || '')}</div></td>
    <td class="right">${money(task.cost, symbol)}</td>
    <td class="right">${pct(n(task.cost) / base)}</td>
    <td class="right">${compact(task.calls)}</td>
  </tr>`).join('') || '<tr><td colspan="5" class="empty">没有任务记录。</td></tr>'

  const modelRows = models.map((model, index) => `<tr>
    <td class="num">${index + 1}</td>
    <td><strong>${esc(model.label || model.name)}</strong><div class="small">${esc(model.provider || '')}</div></td>
    <td class="right">${money(model.cost, symbol)}</td>
    <td class="right">${pct(model.share || 0)}</td>
    <td class="right">${compact(model.calls)}</td>
  </tr>`).join('') || '<tr><td colspan="5" class="empty">没有模型记录。</td></tr>'

  const domainRows = domains.map((domain, index) => `<tr>
    <td class="num">${index + 1}</td>
    <td><strong>${esc(domain.label || domain.key)}</strong></td>
    <td class="right">${money(domain.cost, symbol)}</td>
    <td class="right">${pct(domain.share || 0)}</td>
  </tr>`).join('') || '<tr><td colspan="4" class="empty">没有类型记录。</td></tr>'

  const axisRows = axes.map(axis => `<tr>
    <td><strong>${esc(axis.label)}</strong><div class="small">${esc(axis.hint || '')}</div></td>
    <td class="right">${n(axis.user)}</td>
    <td class="right">${n(axis.agent)}</td>
    <td class="right">${n(axis.gap)}</td>
  </tr>`).join('') || '<tr><td colspan="4" class="empty">样本不足。</td></tr>'

  const suggestionCards = suggestions.map(item => `<article class="suggestion">
    <div class="suggestion-head"><span class="dot" style="background:${item.priority === 'high' ? C.red : C.gold}"></span><strong>${esc(item.title)}</strong><span class="saving">${esc(item.savingLabel || '')}</span></div>
    <p>${esc(item.why)}</p>
    <p class="action">${esc(item.action)}</p>
    <div class="small">${esc(item.basis || '')}${maxSuggestion > 0 && n(item.saving) > 0 ? ` · 占可优化金额 ${pct(n(item.saving) / maxSuggestion)}` : ''}</div>
  </article>`).join('') || '<p class="empty">暂时没有建议。</p>'

  const tags = list => (list || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Token 账单报告 · ${esc(report.range?.from)} 至 ${esc(report.range?.to)}</title>
<style>
  :root { --ink:${C.ink}; --muted:${C.gray}; --line:rgba(42,74,120,.14); --card:${C.card}; }
  * { box-sizing:border-box; }
  body { margin:0; background:${C.paper}; color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; font-size:13px; line-height:1.6; }
  .page { max-width:980px; margin:0 auto; padding:34px 30px 44px; }
  .hero { border-bottom:2px solid rgba(21,154,153,.35); padding-bottom:16px; margin-bottom:20px; }
  .eyebrow { color:${C.teal}; font-size:10px; letter-spacing:.18em; text-transform:uppercase; }
  h1 { font-family:"Songti SC","STSong","Noto Serif SC",serif; font-size:30px; letter-spacing:.08em; margin:5px 0 6px; color:${C.navy}; }
  h2 { font-size:17px; color:${C.navy}; margin:0 0 12px; letter-spacing:.02em; }
  h3 { font-size:13px; margin:0 0 8px; }
  .meta,.small,.empty { color:var(--muted); font-size:11px; }
  .kpis { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:16px; }
  .kpi { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:13px 14px; }
  .kpi-label { color:var(--muted); font-size:10.5px; }
  .kpi-value { font-size:22px; font-weight:650; letter-spacing:-.2px; margin-top:3px; font-variant-numeric:tabular-nums; }
  .kpi-sub { color:var(--muted); font-size:10.5px; margin-top:2px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px 20px; margin-bottom:14px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; align-items:start; }
  .brief { border-left:3px solid ${C.teal}; padding:2px 0 2px 10px; color:var(--muted); margin:6px 0; }
  .top3 { display:grid; gap:5px; margin-top:8px; }
  .top3-row { display:grid; grid-template-columns:20px 1fr auto; gap:8px; align-items:center; padding:7px 8px; border-radius:8px; background:rgba(42,74,120,.035); }
  .top3-row:nth-child(1) { border-left:3px solid ${C.red}; }
  .top3-row:nth-child(2) { border-left:3px solid ${C.gold}; }
  .top3-row:nth-child(3) { border-left:3px solid ${C.moon}; }
  .rank { font-weight:700; color:var(--muted); font-size:11px; }
  .cost { font-weight:650; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .days { display:flex; align-items:flex-end; gap:5px; height:190px; padding:12px 4px 0; border-bottom:1px solid var(--line); }
  .day { flex:1; height:100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; min-width:0; }
  .day-bar { width:100%; height:150px; display:flex; align-items:flex-end; }
  .day-bar i { display:block; width:100%; min-height:2px; border-radius:5px 5px 0 0; background:linear-gradient(180deg,${C.moon},${C.teal}); }
  .day-label { font-size:9px; color:var(--muted); margin-top:5px; white-space:nowrap; }
  .day-value { display:none; }
  .bars { display:grid; gap:7px; }
  .bar-row { display:grid; grid-template-columns:120px 1fr 84px; gap:8px; align-items:center; }
  .bar-label { font-size:11.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .bar-track { height:7px; border-radius:99px; background:#eee7d7; overflow:hidden; }
  .bar-track i { display:block; height:100%; border-radius:99px; }
  .bar-value { text-align:right; font-size:11px; color:var(--muted); font-variant-numeric:tabular-nums; }
  table { width:100%; border-collapse:collapse; font-size:11.5px; }
  th { text-align:left; color:var(--muted); font-weight:500; font-size:10px; letter-spacing:.04em; border-bottom:1px solid var(--line); padding:6px 5px; }
  td { border-bottom:1px solid rgba(42,74,120,.08); padding:7px 5px; vertical-align:top; }
  tr:last-child td { border-bottom:0; }
  .right { text-align:right; font-variant-numeric:tabular-nums; }
  .num { width:22px; color:var(--muted); font-variant-numeric:tabular-nums; }
  .empty { padding:10px 0; }
  .match { display:flex; gap:18px; align-items:center; background:linear-gradient(135deg,#f7f8f2,${C.card}); border:1px solid var(--line); border-radius:14px; padding:14px 16px; margin-bottom:12px; }
  .score { font-size:38px; font-weight:700; letter-spacing:-1.5px; color:${C.navy}; line-height:1; }
  .score small { font-size:11px; color:var(--muted); font-weight:400; letter-spacing:0; }
  .radar { width:300px; height:300px; display:block; margin:0 auto; }
  .tags { display:flex; flex-wrap:wrap; gap:5px; margin:5px 0 10px; }
  .tag { border:1px solid var(--line); background:#f8f4eb; border-radius:99px; padding:3px 8px; font-size:10.5px; color:var(--muted); }
  .suggestion { border:1px solid var(--line); border-radius:12px; padding:12px 14px; margin-bottom:9px; background:var(--card); break-inside:avoid; }
  .suggestion-head { display:flex; align-items:center; gap:7px; }
  .suggestion-head strong { font-size:12.5px; }
  .dot { width:7px; height:7px; border-radius:99px; flex:none; }
  .saving { margin-left:auto; color:${C.teal}; font-size:11px; white-space:nowrap; }
  .suggestion p { margin:5px 0; color:var(--muted); font-size:11.5px; }
  .suggestion .action { color:var(--ink); border-left:2px solid var(--line); padding-left:8px; }
  .footer { color:var(--muted); font-size:10px; margin-top:16px; border-top:1px solid var(--line); padding-top:10px; }
  @media print { body { background:#fff; } .page { max-width:none; padding:0; } .card,.kpi { box-shadow:none; } .page-break { break-before:page; } }
</style>
</head>
<body>
<div class="page">
  <header class="hero">
    <div class="eyebrow">DeepSeek Harness · Token Bill</div>
    <h1>Token 账单报告</h1>
    <div class="meta">${esc(report.range?.from)} 至 ${esc(report.range?.to)} · 生成于 ${dateTime(report.generatedAt)} · ${esc(report.currency || 'CNY')}</div>
  </header>

  <section class="kpis">
    <div class="kpi"><div class="kpi-label">总花费</div><div class="kpi-value">${money(totals.cost, symbol)}</div><div class="kpi-sub">日均 ${money(totals.avgDaily, symbol)}</div></div>
    <div class="kpi"><div class="kpi-label">Token 总量</div><div class="kpi-value">${compact(totals.tokens)}</div><div class="kpi-sub">输出 ${compact(totals.output)} · 缓存 ${compact(totals.cacheRead)}</div></div>
    <div class="kpi"><div class="kpi-label">调用次数</div><div class="kpi-value">${compact(totals.calls)}</div><div class="kpi-sub">单次 ${money(totals.costPerCall, symbol)}</div></div>
    <div class="kpi"><div class="kpi-label">缓存命中</div><div class="kpi-value">${pct(totals.cacheShare)}</div><div class="kpi-sub">未缓存输入 ${compact(totals.input)}</div></div>
    <div class="kpi"><div class="kpi-label">会话数</div><div class="kpi-value">${compact(totals.sessions)}</div><div class="kpi-sub">覆盖 ${daily.length} 天</div></div>
  </section>

  <div class="grid2">
    <section class="card"><h2>一句话结论</h2>${lines.map(line => `<div class="brief">${esc(line)}</div>`).join('')}</section>
    <section class="card"><h2>消耗成本 Top 5</h2><div class="top3">${tasks.slice(0, 5).map((task, index) => `<div class="top3-row"><span class="rank">${index + 1}</span><div><strong>${esc(task.title)}</strong><div class="small">${esc(task.date || '')} · ${esc(task.domainLabel || '')}</div></div><span class="cost">${money(task.cost, symbol)}</span></div>`).join('') || '<p class="empty">没有任务记录。</p>'}</div></section>
  </div>

  <section class="card"><h2>费用分布</h2><div class="days">${dailyBars || '<p class="empty">没有日数据。</p>'}</div><div class="small" style="margin-top:8px">每日费用，柱高按当期最高日归一。</div></section>

  <section class="card"><h2>任务账单 · Top ${tasks.length}</h2><table><thead><tr><th>#</th><th>任务</th><th class="right">费用</th><th class="right">占比</th><th class="right">调用</th></tr></thead><tbody>${taskRows}</tbody></table></section>

  <div class="grid2">
    <section class="card"><h2>模型分布</h2><table><thead><tr><th>#</th><th>模型</th><th class="right">费用</th><th class="right">占比</th><th class="right">调用</th></tr></thead><tbody>${modelRows}</tbody></table></section>
    <section class="card"><h2>任务类型</h2><table><thead><tr><th>#</th><th>类型</th><th class="right">费用</th><th class="right">占比</th></tr></thead><tbody>${domainRows}</tbody></table></section>
  </div>

  <section class="card page-break"><h2>协作默契度</h2>
    ${axes.length ? `<div class="match"><div class="score">${n(match.score)}<small>/100</small></div><div><strong>${esc(match.label || '')} · ${esc(match.mode || '')}</strong><div class="small">${esc(match.sentence || '')}</div></div></div>
    <div class="grid2"><div>${radarSvg(axes)}<div class="small" style="text-align:center">蓝：你 · 青：AI</div></div><div>
      <h3>你的类型：${esc(style.archetype?.label || '—')}</h3><div class="small">${esc(style.archetype?.line || '')}</div>
      <h3 style="margin-top:12px">你的标签</h3><div class="tags">${tags(style.tags)}</div>
      <h3>AI 的响应标签</h3><div class="tags">${tags(style.agent?.tags)}</div>
    </div></div>
    <table style="margin-top:10px"><thead><tr><th>维度</th><th class="right">你</th><th class="right">AI</th><th class="right">落差</th></tr></thead><tbody>${axisRows}</tbody></table>` : '<p class="empty">样本不足，暂时无法计算默契度。</p>'}
  </section>

  <section class="card"><h2>动作优化</h2>${suggestionCards}</section>

  <div class="footer">本报告由 Token 账单插件在本机生成；数据来自本机 dsh-cost-meter 账本与会话日志。${report.notes?.length ? ` ${report.notes.map(item => esc(item)).join(' ')}` : ''}</div>
</div>
</body>
</html>`
}
