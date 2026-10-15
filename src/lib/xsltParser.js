import { cloneDesign, columnIsRequired, DEFAULT_DESIGN } from './designModel'
import { XSL_NS, byId, parseXml, visibleText, xslElements } from './xmlDom'

function readXPathLiteral(select) {
  if (!select) return { ok: false, value: '' }
  const source = select.trim()
  const quote = source[0]
  if ((quote === "'" || quote === '"') && source.endsWith(quote) && source.length >= 2) {
    const inner = source.slice(1, -1)
    if (!inner.includes(quote)) return { ok: true, value: inner }
  }
  return { ok: false, value: '' }
}

function readParam(doc, name) {
  const param = xslElements(doc, 'param').find((node) => node.getAttribute('name') === name)
  if (!param) return { found: false, ok: false, value: '' }
  const literal = readXPathLiteral(param.getAttribute('select') || '')
  return { found: true, ...literal }
}

function readBlock(css, name) {
  const match = String(css || '').match(new RegExp(`/\\*\\s*${name}\\s*([\\s\\S]*?)\\*/`))
  return match ? match[1] : ''
}

function readTokens(css) {
  const tokens = {}
  for (const line of readBlock(css, 'efatura-tokens').split(/\r?\n/)) {
    const index = line.indexOf(':')
    if (index === -1) continue
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim()
    if (key && value) tokens[key] = value
  }
  return tokens
}

function readColumnTokens(css) {
  const columns = []
  for (const line of readBlock(css, 'efatura-columns').split(/\r?\n/)) {
    const [id, width, visible] = line.trim().split('|')
    if (!id || width == null || visible == null) continue
    columns.push({
      id,
      width: Number(width),
      visible: visible === '1',
    })
  }
  return columns
}

function headerCells(table) {
  const rows = [...table.getElementsByTagName('tr')]
  const header = rows.find((row) => row.getElementsByTagName('th').length)
  if (!header) return []
  return [...header.getElementsByTagName('th')].map((cell) => ({
    id: cell.getAttribute('data-col') || '',
    label: visibleText(cell),
    width: Number((cell.getAttribute('style') || '').match(/width:\s*([\d.]+)%/)?.[1] || 0),
  }))
}

export function findLineTable(doc) {
  const marked = byId(doc, 'line-table')
  if (marked) return marked
  const loop = xslElements(doc, 'for-each').find((node) => /InvoiceLine/.test(node.getAttribute('select') || ''))
  let node = loop?.parentNode
  while (node && node.nodeType === 1) {
    if (node.localName === 'table') return node
    node = node.parentNode
  }
  return null
}

function countCells(node) {
  if (node.localName === 'th' || node.localName === 'td') return 1
  return [...node.childNodes].reduce((total, child) => (
    child.nodeType === 1 ? total + countCells(child) : total
  ), 0)
}

export function slotsOf(row) {
  const slots = []
  for (const child of [...row.childNodes]) {
    if (child.nodeType !== 1) continue
    if (child.localName === 'th' || child.localName === 'td') {
      slots.push(child)
      continue
    }
    if (child.namespaceURI === XSL_NS && countCells(child) > 0) slots.push(child)
  }
  return slots
}

function canReorderRows(table) {
  const counts = [...table.getElementsByTagName('tr')]
    .map((row) => slotsOf(row).length)
    .filter((count) => count > 0)
  return counts.length >= 2 && counts.every((count) => count === counts[0])
}

function detectKind(doc, text) {
  const style = byId(doc, 'efatura-design')
  if (style?.getAttribute('data-builtin') === '1') return 'builtin'
  if (text.includes('efatura-dizayn-builtin')) return 'builtin'
  if (style && /efatura-tokens/.test(style.textContent || '') && byId(doc, 'line-table')) return 'builtin'
  return 'external'
}

export function analyzeXslt(text) {
  const design = cloneDesign()
  const caps = {
    kind: 'external',
    columnEdit: 'none',
    reorderEnabled: false,
  }
  let doc
  try {
    doc = parseXml(text, 'XSLT')
  } catch {
    return { design, caps, parseError: true }
  }

  caps.kind = detectKind(doc, text)
  const style = byId(doc, 'efatura-design')
  const css = style?.textContent || ''
  const tokens = readTokens(css)
  if (tokens.primary) design.primary = tokens.primary
  if (tokens.heading) design.heading = tokens.heading
  if (tokens.text) design.text = tokens.text
  if (tokens.border) design.border = tokens.border
  if (tokens.headerBg) design.headerBg = tokens.headerBg
  if (tokens.borderWidth) design.borderWidth = Number.parseFloat(tokens.borderWidth) || design.borderWidth
  if (tokens.fontSize) design.fontSize = Number.parseFloat(tokens.fontSize) || design.fontSize
  if (tokens.headingSize) design.headingSize = Number.parseFloat(tokens.headingSize) || design.headingSize
  if (tokens.logoWidth) design.logoWidth = Number.parseFloat(tokens.logoWidth) || design.logoWidth
  if (tokens.font) design.fontFamily = tokens.font

  const locked = {}
  const takeParam = (name, apply) => {
    const param = readParam(doc, name)
    if (!param.found) return
    if (!param.ok) {
      locked[name] = true
      return
    }
    apply(param.value)
  }
  takeParam('logoSrc', (value) => { design.logoSrc = value })
  takeParam('logoAlign', (value) => { design.logoAlign = value })
  takeParam('noteBank', (value) => { design.notes.bank = value })
  takeParam('notePayment', (value) => { design.notes.payment = value })
  takeParam('noteGeneral', (value) => { design.notes.general = value })
  takeParam('notePosition', (value) => { design.notes.position = value === 'below' ? 'below' : 'side' })
  design.locked = locked

  const table = findLineTable(doc)
  const cells = table ? headerCells(table).filter((cell) => cell.id) : []
  if (cells.length) {
    const saved = readColumnTokens(css)
    const savedOrder = new Map(saved.map((column, index) => [column.id, { ...column, index }]))
    let columns = cells.map((cell, index) => {
      const param = readParam(doc, `col_${cell.id}`)
      const savedColumn = savedOrder.get(cell.id)
      const visible = savedColumn ? savedColumn.visible : (param.ok ? param.value !== '0' : true)
      return {
        id: cell.id,
        label: cell.label || `Kolon ${index + 1}`,
        width: savedColumn?.width || cell.width || DEFAULT_DESIGN.columns.find((item) => item.id === cell.id)?.width || 10,
        visible,
        initialIndex: index,
        required: columnIsRequired(cell.id, cell.label),
      }
    })
    if (saved.length) {
      columns = saved
        .map((item) => columns.find((column) => column.id === item.id))
        .filter(Boolean)
        .concat(columns.filter((column) => !savedOrder.has(column.id)))
    }
    design.columns = columns
    caps.columnEdit = 'structural'
    caps.reorderEnabled = true
  } else if (table) {
    design.columns = []
    caps.columnEdit = canReorderRows(table) ? 'slots' : 'css'
    caps.reorderEnabled = caps.columnEdit === 'slots'
  } else if (caps.kind !== 'builtin') {
    design.columns = []
  }

  return { design: cloneDesign(design), caps }
}

export function detectColumnsFromHtml(html) {
  if (!html || typeof DOMParser === 'undefined') return []
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const tables = [...doc.getElementsByTagName('table')]
  let best = null
  for (const table of tables) {
    const headers = [...table.getElementsByTagName('th')].map((cell) => cell.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean)
    if (headers.length < 3) continue
    const bodyRows = [...table.getElementsByTagName('tr')].filter((row) => row.getElementsByTagName('td').length)
    const score = headers.length + bodyRows.length * 2 + (/mal|hizmet|miktar|kdv/i.test(headers.join(' ')) ? 20 : 0)
    if (!best || score > best.score) best = { headers, score }
  }
  if (!best) return []
  return best.headers.slice(0, 16).map((label, index) => ({
    id: `c${index}`,
    label,
    visible: true,
    width: Math.max(6, Math.round(100 / best.headers.length)),
    initialIndex: index,
    required: columnIsRequired(`c${index}`, label),
  }))
}
