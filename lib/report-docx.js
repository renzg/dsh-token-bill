import { zipStore } from './zip.js'

const C = { navy: '2A4A78', teal: '159A99', moon: '84A5D2', gold: 'D9A441', red: 'B55245', gray: '75878A', ivory: 'E8EEF7' }
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

function run(text, options = {}) {
  const props = []
  if (options.bold) props.push('<w:b/>')
  if (options.color) props.push(`<w:color w:val="${options.color}"/>`)
  if (options.size) props.push(`<w:sz w:val="${options.size}"/><w:szCs w:val="${options.size}"/>`)
  return `<w:r>${props.length ? `<w:rPr>${props.join('')}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`
}

function para(text, options = {}) {
  const props = []
  if (options.style) props.push(`<w:pStyle w:val="${options.style}"/>`)
  if (options.after !== undefined) props.push(`<w:spacing w:after="${options.after}"/>`)
  if (options.align) props.push(`<w:jc w:val="${options.align}"/>`)
  return `<w:p>${props.length ? `<w:pPr>${props.join('')}</w:pPr>` : ''}${run(text, options)}</w:p>`
}

function cell(text, options = {}) {
  const props = [`<w:tcW w:w="${options.width || 1500}" w:type="dxa"/>`]
  if (options.fill) props.push(`<w:shd w:val="clear" w:color="auto" w:fill="${options.fill}"/>`)
  const paragraphs = String(text).split('\n').map((line, index) => para(line, { bold: options.bold, color: options.color, size: options.size || 19, after: index === 0 ? 0 : 20, align: options.align })).join('')
  return `<w:tc><w:tcPr>${props.join('')}</w:tcPr>${paragraphs}</w:tc>`
}

function table(headers, rows, widths, options = {}) {
  const total = widths.reduce((sum, width) => sum + width, 0) || 1
  const grid = widths.map(width => `<w:gridCol w:w="${Math.round(width / total * 9000)}"/>`).join('')
  const header = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${headers.map((text, index) => cell(text, {
    width: Math.round(widths[index] / total * 9000), fill: C.ivory, bold: true, color: C.navy, size: 17,
    align: options.aligns?.[index] || (index === 0 ? 'left' : (options.align || 'right')),
  })).join('')}</w:tr>`
  const body = rows.map((row, rowIndex) => `<w:tr>${row.map((text, index) => cell(text, {
    width: Math.round(widths[index] / total * 9000),
    fill: rowIndex % 2 ? 'FBF8F0' : undefined,
    size: 18,
    bold: index === 1,
    align: options.aligns?.[index] || (index === 0 ? 'left' : (options.align || 'right')),
  })).join('')}</w:tr>`).join('')
  return `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(side => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="E3DBCB"/>`).join('')}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="70" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="70" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${header}${body}</w:tbl><w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>`
}

function documentXml(report) {
  const symbol = report.symbol || '¥'
  const totals = report.totals || {}
  const tasks = (report.tasks || []).slice(0, 8)
  const models = (report.models || []).slice(0, 8)
  const domains = (report.domains || []).slice(0, 8)
  const daily = report.daily || []
  const style = report.style || {}
  const match = style.match || {}
  const axes = match.axes || []
  const top5 = tasks.slice(0, 5).reduce((sum, task) => sum + n(task.cost), 0)
  const base = n(totals.attributed) || n(totals.cost) || 1
  const top = tasks[0]
  const lines = []
  if (top) lines.push(`最贵的一项「${top.title}」占 ${pct(n(top.cost) / base)}，前五项合计占 ${pct(top5 / base)}。`)
  if (report.hourly?.peakShare > 0.2) lines.push(`约 ${pct(report.hourly.peakShare)} 的花费、${pct(report.hourly.peakCallShare || 0)} 的调用落在峰时。`)
  if (n(totals.cacheShare) > 0.8) lines.push(`缓存命中 ${pct(totals.cacheShare)}，重复上下文基本都走了低价缓存。`)
  if (!lines.length) lines.push('这段时间还没有可归因的消费。')

  const kpis = `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(side => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="E3DBCB"/>`).join('')}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${Array.from({ length: 5 }, () => '<w:gridCol w:w="1800"/>').join('')}</w:tblGrid><w:tr>${['总花费', 'Token 总量', '调用次数', '缓存命中', '会话数'].map(text => cell(text, { width: 1800, fill: C.ivory, color: C.navy, size: 17, bold: true, align: 'left' })).join('')}</w:tr><w:tr>${[money(totals.cost, symbol), compact(totals.tokens), compact(totals.calls), pct(totals.cacheShare), compact(totals.sessions)].map(text => cell(text, { width: 1800, size: 26, bold: true, align: 'left' })).join('')}</w:tr></w:tbl><w:p><w:pPr><w:spacing w:after="100"/></w:pPr></w:p>`

  const taskTable = table(['#', '任务', '费用', '占比', '调用'], tasks.map((task, index) => [String(index + 1), `${task.title}\n${task.date || ''} · ${task.domainLabel || ''}`, money(task.cost, symbol), pct(n(task.cost) / base), compact(task.calls)]), [300, 3900, 1200, 1100, 1000], { aligns: ['left', 'left', 'right', 'right', 'right'] })
  const dailyTable = table(['日期', '费用', 'Token', '调用'], daily.slice(-14).map(row => [row.date, money(row.cost, symbol), compact(row.tokens), compact(row.calls)]), [2200, 2200, 2300, 1600], { aligns: ['left', 'right', 'right', 'right'] })
  const maxDaily = Math.max(...daily.map(row => n(row.cost)), 0.0001)
  const dailyBars = daily.slice(-14).map(row => {
    const width = Math.max(1, Math.round((n(row.cost) / maxDaily) * 26))
    return `<w:p><w:pPr><w:spacing w:after="20"/></w:pPr>${run(row.date, { color: C.gray, size: 16 })}  ${run('█'.repeat(width), { color: C.moon, size: 18 })}  ${run(money(row.cost, symbol), { size: 17 })}</w:p>`
  }).join('')
  const modelTable = table(['#', '模型', '费用', '占比', '调用'], models.map((model, index) => [String(index + 1), `${model.provider || ''} / ${model.model || model.label || ''}`, money(model.cost, symbol), pct(model.share || 0), compact(model.calls)]), [300, 3800, 1200, 1100, 1000], { aligns: ['left', 'left', 'right', 'right', 'right'] })
  const domainTable = table(['#', '类型', '费用', '占比'], domains.map((domain, index) => [String(index + 1), domain.label || domain.key, money(domain.cost, symbol), pct(domain.share || 0)]), [300, 4200, 1800, 1200], { aligns: ['left', 'left', 'right', 'right'] })
  const axisTable = table(['维度', '你', 'AI', '落差'], axes.map(axis => [`${axis.label}\n${axis.hint || ''}`, String(n(axis.user)), String(n(axis.agent)), String(n(axis.gap))]), [4300, 1200, 1200, 1200], { aligns: ['left', 'right', 'right', 'right'] })

  const suggestions = (report.suggestions || []).map(item => `<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>${run(`${item.title}  `, { bold: true, color: item.priority === 'high' ? C.red : C.gold, size: 20 })}${run(item.savingLabel || '', { color: C.teal, size: 18 })}</w:p><w:p><w:pPr><w:spacing w:after="40"/></w:pPr>${run(item.why, { color: C.gray, size: 18 })}</w:p><w:p><w:pPr><w:spacing w:after="140"/><w:ind w:left="240"/></w:pPr>${run(item.action, { size: 18 })}</w:p>`).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
${para('Token 账单报告', { style: 'Title', after: 80 })}
${para(`${report.range?.from} 至 ${report.range?.to} · 生成于 ${new Date(report.generatedAt).toLocaleString('zh-CN', { hour12: false })} · ${report.currency || 'CNY'}`, { color: C.gray, size: 17, after: 220 })}
${para('总览', { style: 'Heading1' })}
${kpis}
${para('一句话结论', { style: 'Heading2' })}
${lines.map(line => para(`• ${line}`, { color: C.gray, size: 18, after: 50 })).join('')}
${para('消耗成本 Top 5', { style: 'Heading2' })}
${tasks.slice(0, 5).map((task, index) => para(`${index + 1}. ${task.title}   ${money(task.cost, symbol)}   ${pct(n(task.cost) / base)}`, { size: 19, after: 40 })).join('') || para('没有任务记录。', { color: C.gray })}
${para('费用分布', { style: 'Heading1' })}
${dailyBars}
${dailyTable}
${para('任务账单 · Top ' + tasks.length, { style: 'Heading1' })}
${taskTable}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
${para('模型分布', { style: 'Heading1' })}
${modelTable}
${para('任务类型', { style: 'Heading1' })}
${domainTable}
${para('协作默契度', { style: 'Heading1' })}
${axes.length ? `${para(`${n(match.score)}/100 · ${match.label || ''} · ${match.mode || ''}`, { bold: true, color: C.navy, size: 24, after: 60 })}${para(match.sentence || '', { color: C.gray, size: 18, after: 100 })}${para(`你的类型：${style.archetype?.label || '—'}`, { bold: true, size: 19, after: 30 })}${para(style.archetype?.line || '', { color: C.gray, size: 18, after: 80 })}${para(`你的标签：${(style.tags || []).join(' / ')}`, { size: 18, after: 30 })}${para(`AI 的响应标签：${(style.agent?.tags || []).join(' / ')}`, { size: 18, after: 80 })}${axisTable}` : para('样本不足，暂时无法计算默契度。', { color: C.gray })}
${para('动作优化', { style: 'Heading1' })}
${suggestions || para('暂时没有建议。', { color: C.gray })}
${para('本报告由 Token 账单插件在本机生成；数据来自本机 dsh-cost-meter 账本与会话日志。', { color: C.gray, size: 15, after: 0 })}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>
</w:body>
</w:document>`
}

const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="PingFang SC" w:eastAsia="PingFang SC" w:hAnsi="PingFang SC"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="21"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="${C.navy}"/><w:sz w:val="54"/><w:szCs w:val="54"/><w:rFonts w:ascii="Songti SC" w:eastAsia="Songti SC"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:rPr><w:b/><w:color w:val="${C.navy}"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:pPr><w:spacing w:before="260" w:after="100"/><w:keepNext/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:rPr><w:b/><w:color w:val="${C.ink || '3D3B4F'}"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:pPr><w:spacing w:before="180" w:after="60"/><w:keepNext/></w:pPr></w:style>
</w:styles>`

export function buildReportDocx(report) {
  return zipStore([
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>` },
    { name: 'word/document.xml', data: documentXml(report) },
    { name: 'word/styles.xml', data: styles },
    { name: 'word/_rels/document.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>` },
  ])
}
