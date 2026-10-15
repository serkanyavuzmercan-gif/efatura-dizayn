import {
  columnPercents,
  safeAlign,
  safeColor,
  safeFont,
  safeNotePosition,
  safeNumber,
} from './designModel'
import { findLineTable, slotsOf } from './xsltParser'
import {
  XSL_NS,
  byId,
  createXsl,
  elementChildren,
  parseXml,
  serializeXml,
  xslElements,
} from './xmlDom'

function xpathStringLiteral(value) {
  const text = String(value ?? '').replace(/\r\n/g, '\n')
  if (!text.includes("'")) return `'${text}'`
  const parts = text.split("'").map((part) => `'${part}'`)
  return `concat(${parts.join(`, "'", `)})`
}

function setParam(doc, name, value) {
  let param = xslElements(doc, 'param').find((node) => node.getAttribute('name') === name)
  if (!param) {
    param = createXsl(doc, 'param')
    param.setAttribute('name', name)
    const sheet = doc.documentElement
    const template = xslElements(doc, 'template')[0]
    if (template?.parentNode === sheet) sheet.insertBefore(param, template)
    else sheet.appendChild(param)
  }
  param.setAttribute('select', xpathStringLiteral(value))
}

function columnTokenBlock(columns) {
  const lines = columns.map((column) => `${column.id}|${column.width}|${column.visible ? '1' : '0'}`)
  return `/* efatura-columns\n${lines.join('\n')}\n*/`
}

function tokenBlock(design) {
  const borderWidth = safeNumber(design.borderWidth, 0.5, 4, 1)
  const fontSize = safeNumber(design.fontSize, 8, 16, 11)
  const headingSize = safeNumber(design.headingSize, 14, 28, 18)
  const logoWidth = safeNumber(design.logoWidth, 48, 260, 132)
  return `/* efatura-tokens
primary: ${safeColor(design.primary, '#143d66')}
heading: ${safeColor(design.heading, '#143d66')}
text: ${safeColor(design.text, '#1c2430')}
border: ${safeColor(design.border, '#c5ced9')}
borderWidth: ${borderWidth}
headerBg: ${safeColor(design.headerBg, '#e7eef6')}
font: ${safeFont(design.fontFamily)}
fontSize: ${fontSize}
headingSize: ${headingSize}
logoWidth: ${logoWidth}
*/`
}

export function buildInvoiceCss(design) {
  const primary = safeColor(design.primary, '#143d66')
  const heading = safeColor(design.heading, '#143d66')
  const text = safeColor(design.text, '#1c2430')
  const border = safeColor(design.border, '#c5ced9')
  const borderWidth = safeNumber(design.borderWidth, 0.5, 4, 1)
  const headerBg = safeColor(design.headerBg, '#e7eef6')
  const font = safeFont(design.fontFamily)
  const fontSize = safeNumber(design.fontSize, 8, 16, 11)
  const headingSize = safeNumber(design.headingSize, 14, 28, 18)
  const logoWidth = safeNumber(design.logoWidth, 48, 260, 132)
  return `${tokenBlock(design)}
${columnTokenBlock(design.columns)}
@page { size: A4; margin: 10mm; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body { color: ${text}; font-family: ${font}; font-size: ${fontSize}px; }
.page { padding: 8mm 10mm 12mm; }
table { border-collapse: collapse; }
.head { width: 100%; border-bottom: 2px solid ${primary}; margin-bottom: 8px; }
.head td { vertical-align: top; padding: 0 8px 8px 0; }
.kicker { font-size: 11px; letter-spacing: 0.12em; font-weight: 700; color: ${primary}; }
h1 { margin: 2px 0 0; font-size: ${headingSize}px; line-height: 1.15; color: ${heading}; font-weight: 700; }
.subtitle { margin-top: 2px; color: ${text}; }
#company-logo { width: ${logoWidth}px; height: auto; }
.align-left { text-align: left; }
.align-center { text-align: center; }
.align-right { text-align: right; }
.meta { margin-top: 6px; }
.meta th { text-align: left; font-weight: 700; color: ${heading}; padding: 1px 10px 1px 0; white-space: nowrap; vertical-align: top; }
.meta td { padding: 1px 0; vertical-align: top; color: ${text}; }
.ettn { font-size: 9px; word-break: break-all; }
.qr-cell { text-align: right; }
#gib-qrcode { display: inline-block; width: 28mm; height: 28mm; border: ${borderWidth}px dashed ${border}; text-align: center; color: ${heading}; font-size: 9px; line-height: 28mm; vertical-align: top; }
#gib-qrcode img { width: 24mm; height: 24mm; vertical-align: middle; }
.parties { width: 100%; margin: 8px 0; }
.parties td { width: 50%; vertical-align: top; border: ${borderWidth}px solid ${border}; padding: 6px 8px; }
.parties td + td { border-left: 0; }
.party-title { margin: 0 0 4px; font-size: 10px; letter-spacing: 0.08em; color: ${heading}; font-weight: 700; }
.party-name { font-weight: 700; margin-bottom: 2px; }
#line-table { width: 100%; margin-top: 8px; }
#line-table th, #line-table td { border: ${borderWidth}px solid ${border}; padding: 4px 5px; vertical-align: top; color: ${text}; }
#line-table th { background: ${headerBg}; color: ${heading}; font-weight: 700; }
.num { text-align: right; white-space: nowrap; }
.ctr { text-align: center; }
.item-name { font-weight: 700; }
.item-desc { font-size: 10px; margin-top: 1px; }
.footer { width: 100%; margin-top: 10px; }
.notes { font-size: 10px; line-height: 1.45; color: ${text}; }
.notes p { margin: 0 0 4px; }
.totals { width: 100%; }
.totals td { padding: 3px 4px; vertical-align: top; color: ${text}; }
.totals td.lbl { text-align: left; }
.totals td.val { text-align: right; white-space: nowrap; }
.totals tr.grand td { font-weight: 700; border-top: 2px solid ${primary}; padding-top: 5px; color: ${heading}; }
.fine { margin-top: 8px; font-size: 9px; color: #5c6675; }
`
}

function upsertStyle(doc, css, { builtin = false, warnings }) {
  let style = byId(doc, 'efatura-design')
  if (!style) {
    style = doc.createElement('style')
    style.setAttribute('id', 'efatura-design')
    style.setAttribute('type', 'text/css')
    const head = doc.getElementsByTagName('head')[0]
    const body = doc.getElementsByTagName('body')[0]
    if (head) head.appendChild(style)
    else if (body) body.insertBefore(style, body.firstChild)
    else {
      warnings.push({
        id: 'style-target',
        title: 'Stil eklenemedi',
        detail: 'XSLT içinde head veya body bulunamadı. Renk değişiklikleri dosyaya yazılamadı.',
      })
      return
    }
  }
  if (builtin) style.setAttribute('data-builtin', '1')
  style.textContent = `\n${css}\n`
}

function slotColumnId(slot) {
  if (slot.getAttribute?.('data-col')) return slot.getAttribute('data-col')
  const all = slot.getElementsByTagName?.('*') || []
  for (let index = 0; index < all.length; index += 1) {
    const id = all[index].getAttribute('data-col')
    if (id) return id
  }
  return ''
}

function reorderStructural(doc, columns) {
  const table = byId(doc, 'line-table')
  if (!table) return false
  let changed = false
  for (const row of [...table.getElementsByTagName('tr')]) {
    const slots = slotsOf(row)
    if (!slots.length) continue
    const byColumn = new Map(slots.map((slot) => [slotColumnId(slot), slot]))
    const ordered = columns.map((column) => byColumn.get(column.id)).filter(Boolean)
    if (ordered.length !== slots.length) return false
    for (const node of ordered) row.appendChild(node)
    changed = true
  }
  return changed
}

function applyStructuralWidths(doc, columns) {
  const percents = columnPercents(columns)
  const all = doc.getElementsByTagName('*')
  for (let index = 0; index < all.length; index += 1) {
    const id = all[index].getAttribute('data-col')
    if (!id || !percents[id]) continue
    if (all[index].localName !== 'th' && all[index].localName !== 'td') continue
    all[index].setAttribute('style', `width:${percents[id].toFixed(2)}%`)
  }
}

function applyBuiltin(doc, design) {
  const locked = design.locked || {}
  if (!locked.logoSrc) setParam(doc, 'logoSrc', design.logoSrc || '')
  if (!locked.logoAlign) setParam(doc, 'logoAlign', safeAlign(design.logoAlign))
  if (!locked.noteBank) setParam(doc, 'noteBank', design.notes?.bank || '')
  if (!locked.notePayment) setParam(doc, 'notePayment', design.notes?.payment || '')
  if (!locked.noteGeneral) setParam(doc, 'noteGeneral', design.notes?.general || '')
  if (!locked.notePosition) setParam(doc, 'notePosition', safeNotePosition(design.notes?.position))
  for (const column of design.columns || []) {
    setParam(doc, `col_${column.id}`, column.visible ? '1' : '0')
  }
  reorderStructural(doc, design.columns || [])
  applyStructuralWidths(doc, design.columns || [])
  upsertStyle(doc, buildInvoiceCss(design), { builtin: true, warnings: [] })
}

function addClass(element, name) {
  const current = element.getAttribute('class') || ''
  const parts = current.split(/\s+/).filter(Boolean)
  if (!parts.includes(name)) element.setAttribute('class', [...parts, name].join(' '))
}

function buildExternalCss(design, touched) {
  const rules = []
  if (touched.fontFamily) {
    rules.push(`body, table, td, th, p, div { font-family: ${safeFont(design.fontFamily)} !important; }`)
  }
  if (touched.fontSize) {
    const size = safeNumber(design.fontSize, 8, 16, 11)
    rules.push(`body, table, td, p, div { font-size: ${size}px !important; }`)
  }
  if (touched.headingSize) {
    rules.push(`h1 { font-size: ${safeNumber(design.headingSize, 14, 28, 18)}px !important; }`)
  }
  if (touched.heading) {
    const color = safeColor(design.heading, '#143d66')
    rules.push(`h1, h2, h3 { color: ${color} !important; }`)
  }
  if (touched.primary) {
    rules.push(`th { color: ${safeColor(design.primary, '#143d66')} !important; }`)
  }
  if (touched.text) {
    rules.push(`body, td, p { color: ${safeColor(design.text, '#1c2430')} !important; }`)
  }
  if (touched.headerBg) {
    rules.push(`th { background-color: ${safeColor(design.headerBg, '#e7eef6')} !important; }`)
  }
  if (touched.border) {
    rules.push(`table, th, td { border-color: ${safeColor(design.border, '#c5ced9')} !important; }`)
  }
  if (touched.borderWidth) {
    const width = safeNumber(design.borderWidth, 0.5, 4, 1)
    rules.push(`table, th, td { border-width: ${width}px !important; border-style: solid !important; }`)
  }
  if (touched.columns && design.columns?.length) {
    const percents = columnPercents(design.columns)
    design.columns.forEach((column, index) => {
      const nth = index + 1
      const selector = `.ef-line-table tr > *:nth-child(${nth})`
      if (!column.visible) {
        rules.push(`${selector} { display: none !important; }`)
      } else if (percents[column.id]) {
        rules.push(`.ef-line-table tr > th:nth-child(${nth}), .ef-line-table tr > td:nth-child(${nth}) { width: ${percents[column.id].toFixed(2)}% !important; }`)
      }
    })
  }
  return rules.join('\n')
}

function logoStyle(design, touched) {
  const bits = []
  if (touched.logoWidth) bits.push(`width:${safeNumber(design.logoWidth, 48, 260, 132)}px`, 'height:auto')
  if (touched.logoAlign) {
    const align = safeAlign(design.logoAlign)
    bits.push('display:block')
    if (align === 'center') bits.push('margin-left:auto', 'margin-right:auto')
    else if (align === 'right') bits.push('margin-left:auto', 'margin-right:0')
    else bits.push('margin-left:0', 'margin-right:auto')
  }
  return bits.join(';')
}

function findLogo(doc) {
  const images = [...doc.getElementsByTagName('img')]
  return images.find((img) => img.getAttribute('id') === 'company-logo')
    || images.find((img) => /logo/i.test(`${img.getAttribute('id') || ''} ${img.getAttribute('class') || ''} ${img.getAttribute('alt') || ''} ${img.getAttribute('src') || ''}`))
    || null
}

function clearDynamicSrc(img) {
  for (const child of elementChildren(img)) {
    if (child.namespaceURI === XSL_NS && child.localName === 'attribute' && child.getAttribute('name') === 'src') {
      child.parentNode.removeChild(child)
    }
  }
}

function applyExternal(doc, design, touched, warnings) {
  if (touched.logoSrc && design.logoSrc) {
    let image = findLogo(doc)
    if (!image) {
      const body = doc.getElementsByTagName('body')[0]
      if (!body) {
        warnings.push({
          id: 'logo-target',
          title: 'Logo yerleştirilemedi',
          detail: 'XSLT içinde logo resmi veya body öğesi bulunamadı.',
        })
      } else {
        image = doc.createElement('img')
        image.setAttribute('id', 'company-logo')
        image.setAttribute('alt', 'Firma logosu')
        body.insertBefore(image, body.firstChild)
      }
    }
    if (image) {
      clearDynamicSrc(image)
      image.setAttribute('src', design.logoSrc)
      image.setAttribute('alt', image.getAttribute('alt') || 'Firma logosu')
    }
  }

  const image = findLogo(doc)
  const style = logoStyle(design, touched)
  if (image && style) {
    const previous = image.getAttribute('style') || ''
    image.setAttribute('style', `${previous}${previous ? ';' : ''}${style}`)
  }

  if (touched.notes) {
    const notes = design.notes || {}
    const hasParam = xslElements(doc, 'param').some((node) => ['noteBank', 'notePayment', 'noteGeneral', 'notePosition'].includes(node.getAttribute('name')))
    if (hasParam) {
      if (!design.locked?.noteBank) setParam(doc, 'noteBank', notes.bank || '')
      if (!design.locked?.notePayment) setParam(doc, 'notePayment', notes.payment || '')
      if (!design.locked?.noteGeneral) setParam(doc, 'noteGeneral', notes.general || '')
      if (!design.locked?.notePosition) setParam(doc, 'notePosition', safeNotePosition(notes.position))
    } else {
      let block = byId(doc, 'efatura-editor-notes')
      const lines = [notes.bank, notes.payment, notes.general].map((line) => String(line || '').trim()).filter(Boolean)
      if (!lines.length) {
        block?.parentNode?.removeChild(block)
      } else {
        const body = doc.getElementsByTagName('body')[0]
        if (!body) {
          warnings.push({
            id: 'notes-target',
            title: 'Not alanı eklenemedi',
            detail: 'XSLT içinde notların yazılacağı bir body öğesi bulunamadı.',
          })
        } else {
          if (!block) {
            block = doc.createElement('div')
            block.setAttribute('id', 'efatura-editor-notes')
            body.appendChild(block)
          }
          while (block.firstChild) block.removeChild(block.firstChild)
          lines.forEach((line) => {
            const paragraph = doc.createElement('p')
            paragraph.textContent = line
            block.appendChild(paragraph)
          })
        }
      }
    }
  }

  if (touched.columns && design.columns?.length) {
    const table = findLineTable(doc)
    if (!table) {
      warnings.push({
        id: 'column-target',
        title: 'Satır tablosu bulunamadı',
        detail: 'Kolon ayarları önizlemeye işlenemedi. Şablon, InvoiceLine döngüsünü bir tablo içinde tutmalıdır.',
      })
    } else {
      addClass(table, 'ef-line-table')
      const rows = [...table.getElementsByTagName('tr')].filter((row) => slotsOf(row).length)
      const uniform = rows.length >= 2 && rows.every((row) => slotsOf(row).length === design.columns.length)
      if (uniform) {
        for (const row of rows) {
          const slots = slotsOf(row)
          const ordered = design.columns.map((column) => slots[column.initialIndex])
          if (ordered.every(Boolean)) {
            for (const node of ordered) row.appendChild(node)
          }
        }
      } else if (design.columns.some((column, index) => column.initialIndex !== index)) {
        warnings.push({
          id: 'column-reorder',
          title: 'Kolon sırası yazılamadı',
          detail: 'Bu şablonda satır hücreleri düzenli değil. Gizleme ve genişlik uygulanır; sıra mevcut XSLT düzeninde kalır.',
        })
      }
    }
  }

  const css = buildExternalCss(design, touched)
  if (css.trim()) upsertStyle(doc, css, { builtin: false, warnings })
}

export function applyDesign(xsltText, design, { templateKind, touched }) {
  const doc = parseXml(xsltText, 'XSLT')
  const warnings = []
  if (templateKind === 'builtin') applyBuiltin(doc, design)
  else applyExternal(doc, design, touched || {}, warnings)
  return { xsltText: serializeXml(doc), warnings }
}

const QR_SNIPPET = `<?xml version="1.0" encoding="UTF-8"?>
<div xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
     xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
     xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
     id="gib-qrcode"
     style="width:28mm;height:28mm;border:1px dashed #8aa;text-align:center;line-height:28mm;font-size:9px;">
  <xsl:variable name="qrNode" select="(/*[local-name()='Invoice'])[1]/cac:AdditionalDocumentReference[cbc:DocumentType='QRCODE' or cbc:DocumentType='KAREKOD'][1]"/>
  <xsl:variable name="raw" select="normalize-space($qrNode/cac:Attachment/cbc:EmbeddedDocumentBinaryObject)"/>
  <xsl:choose>
    <xsl:when test="$raw != ''">
      <img alt="Karekod" style="width:24mm;height:24mm;vertical-align:middle">
        <xsl:attribute name="src">
          <xsl:text>data:image/png;base64,</xsl:text>
          <xsl:value-of select="$raw"/>
        </xsl:attribute>
      </img>
    </xsl:when>
    <xsl:otherwise>Karekod</xsl:otherwise>
  </xsl:choose>
</div>`

export function xsltHasQr(xsltText) {
  return /gib-qrcode|QRCODE|KAREKOD|karekod/i.test(xsltText || '')
}

export function insertQrBlock(xsltText) {
  if (xsltHasQr(xsltText)) return xsltText
  const doc = parseXml(xsltText, 'XSLT')
  const body = doc.getElementsByTagName('body')[0]
  if (!body) {
    throw new Error('Karekod eklemek için XSLT içinde bir body öğesi bulunamadı.')
  }
  const snippet = parseXml(QR_SNIPPET, 'Karekod')
  body.insertBefore(doc.importNode(snippet.documentElement, true), body.firstChild)
  return serializeXml(doc)
}

export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'application/xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.toLowerCase().endsWith('.xslt') || filename.toLowerCase().endsWith('.xsl')
    ? filename
    : `${filename}.xslt`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
