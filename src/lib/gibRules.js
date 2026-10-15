import { parseXml, XSL_NS } from './xmlDom'

export const FORBIDDEN_ELEMENTS = [
  'function',
  'for-each-group',
  'analyze-string',
  'next-match',
  'perform-sort',
  'sequence',
  'result-document',
  'import-schema',
  'character-map',
  'output-character',
]

export const FORBIDDEN_FUNCTIONS = [
  'matches',
  'replace',
  'tokenize',
  'upper-case',
  'lower-case',
  'ends-with',
  'string-join',
  'format-date',
  'format-dateTime',
  'current-date',
  'current-dateTime',
  'unparsed-text',
  'distinct-values',
  'years-from-date',
  'abs',
  'min',
  'max',
  'avg',
]

export const REQUIRED_FIELD_RULES = [
  {
    id: 'invoice-date',
    label: 'Fatura Tarihi',
    detail: 'Şablon cbc:IssueDate alanını basmalıdır.',
    patterns: [/IssueDate/, /local-name\(\)\s*=\s*['"]IssueDate['"]/],
  },
  {
    id: 'invoice-no',
    label: 'Fatura No',
    detail: 'Şablon fatura numarasını (cbc:ID) basmalıdır.',
    patterns: [/cbc:ID/, /local-name\(\)\s*=\s*['"]ID['"]/],
  },
  {
    id: 'supplier-id',
    label: 'Satıcı VKN/TCKN',
    detail: 'Satıcı tarafı AccountingSupplierParty ve VKN/TCKN kimliği ile durmalıdır.',
    patterns: [/AccountingSupplierParty/],
    also: [/VKN|TCKN|PartyIdentification/],
  },
  {
    id: 'customer-id',
    label: 'Alıcı VKN/TCKN',
    detail: 'Alıcı tarafı AccountingCustomerParty içinde durmalıdır.',
    patterns: [/AccountingCustomerParty/],
  },
  {
    id: 'line-total',
    label: 'Mal/Hizmet Toplam Tutarı',
    detail: 'Şablon LineExtensionAmount alanını basmalıdır.',
    patterns: [/LineExtensionAmount/],
  },
  {
    id: 'tax-total',
    label: 'Hesaplanan KDV',
    detail: 'Şablon TaxAmount alanını basmalıdır.',
    patterns: [/TaxAmount/],
  },
  {
    id: 'payable',
    label: 'Genel Toplam',
    detail: 'Şablon PayableAmount alanını basmalıdır.',
    patterns: [/PayableAmount/],
  },
  {
    id: 'unit',
    label: 'Mal/Hizmet birim bilgisi',
    detail: 'Satır miktarı birim koduyla (InvoicedQuantity / unitCode) birlikte durmalıdır.',
    patterns: [/InvoicedQuantity/, /unitCode/],
  },
]

function summarize(items) {
  return {
    items,
    errorCount: items.filter((item) => item.level === 'error').length,
    warningCount: items.filter((item) => item.level === 'warning').length,
    blocksExport: items.some((item) => item.blocksExport),
  }
}

export function emptyReport() {
  return summarize([])
}

function scanXPath(value) {
  const found = []
  for (const name of FORBIDDEN_FUNCTIONS) {
    const pattern = new RegExp(`(^|[^\\w-])${name.replace('-', '\\-')}\\s*\\(`)
    if (pattern.test(value)) found.push(name)
  }
  return found
}

function directChild(element, localName) {
  return [...(element?.children || [])].find((node) => node.localName === localName) || null
}

function firstByLocal(element, localName) {
  const all = element?.getElementsByTagName('*') || []
  for (let index = 0; index < all.length; index += 1) {
    if (all[index].localName === localName) return all[index]
  }
  return null
}

function partyId(invoice, partyName) {
  const party = firstByLocal(invoice, partyName)
  if (!party) return ''
  const ids = [...party.getElementsByTagName('*')].filter((node) => node.localName === 'ID')
  return ids[0]?.textContent?.trim() || ''
}

export function readInvoiceFacts(xmlText) {
  if (!xmlText) return null
  try {
    const doc = parseXml(xmlText, 'XML')
    const invoice = [...doc.getElementsByTagName('*')].find((node) => node.localName === 'Invoice')
    if (!invoice) return null
    const money = (name) => {
      const totals = firstByLocal(invoice, 'LegalMonetaryTotal')
      return directChild(totals, name)?.textContent?.trim() || firstByLocal(invoice, name)?.textContent?.trim() || ''
    }
    return {
      id: directChild(invoice, 'ID')?.textContent?.trim() || '',
      issueDate: directChild(invoice, 'IssueDate')?.textContent?.trim() || '',
      supplierId: partyId(invoice, 'AccountingSupplierParty'),
      customerId: partyId(invoice, 'AccountingCustomerParty'),
      lineExtension: money('LineExtensionAmount'),
      taxAmount: firstByLocal(invoice, 'TaxAmount')?.textContent?.trim() || '',
      payable: money('PayableAmount'),
    }
  } catch {
    return null
  }
}

function dateAppears(html, iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  if (!match) return true
  const [, year, month, day] = match
  return [`${year}-${month}-${day}`, `${day}.${month}.${year}`, `${day}/${month}/${year}`, `${day}-${month}-${year}`]
    .some((value) => html.includes(value))
}

function moneyAppears(html, amount) {
  const number = Number(amount)
  if (!Number.isFinite(number)) return true
  const [intPart, decimal] = number.toFixed(2).split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const variants = [
    `${intPart}.${decimal}`,
    `${intPart},${decimal}`,
    `${grouped},${decimal}`,
    `${grouped}.${decimal}`,
    intPart,
    grouped,
  ]
  const compact = html.replace(/\s+/g, '')
  return variants.some((value) => compact.includes(value))
}

function pushMissing(items, id, label) {
  items.push({
    id: `output-${id}`,
    level: 'warning',
    title: `${label} önizlemede yok`,
    detail: 'XML değeri dönüşmüş faturada bulunamadı. Alan şablondan düşmüş veya biçimi tanınmıyor olabilir.',
  })
}

export function evaluateCompliance({
  xsltText,
  html = '',
  xmlText = '',
  design,
  transformError = '',
  extraWarnings = [],
}) {
  const items = []
  for (const warning of extraWarnings) {
    items.push({ level: 'warning', blocksExport: false, ...warning })
  }

  let doc = null
  try {
    doc = parseXml(xsltText, 'XSLT')
  } catch (error) {
    items.push({
      id: 'well-formed',
      level: 'error',
      blocksExport: true,
      title: 'XSLT iyi biçimli değil',
      detail: error.message,
    })
    return summarize(items)
  }

  const root = doc.documentElement
  if (!['stylesheet', 'transform'].includes(root?.localName || '') || root.namespaceURI !== XSL_NS) {
    items.push({
      id: 'not-xslt',
      level: 'error',
      blocksExport: true,
      title: 'Dosya bir XSLT stil sayfası değil',
      detail: 'Kök öğe xsl:stylesheet veya xsl:transform olmalıdır.',
    })
  }

  const version = root?.getAttribute('version') || ''
  if (version && version !== '1.0') {
    items.push({
      id: 'xslt-version',
      level: 'error',
      blocksExport: true,
      title: 'XSLT sürümü 1.0 değil',
      detail: `Bulunan sürüm ${version}. Mikro ve GİB altyapısı XSLT 1.0 kullanır; 2.0/3.0 dışa aktarılamaz.`,
    })
  }

  const forbiddenElements = FORBIDDEN_ELEMENTS.filter((name) => doc.getElementsByTagNameNS(XSL_NS, name).length)
  if (forbiddenElements.length) {
    items.push({
      id: 'xslt-2-elements',
      level: 'error',
      blocksExport: true,
      title: 'XSLT 2.0/3.0 öğesi var',
      detail: `Kaldırılması gereken öğeler: ${forbiddenElements.join(', ')}.`,
    })
  }

  const functions = new Set()
  const all = doc.getElementsByTagName('*')
  for (let index = 0; index < all.length; index += 1) {
    for (const attr of ['select', 'test', 'match', 'use']) {
      const value = all[index].getAttribute(attr)
      if (!value) continue
      for (const name of scanXPath(value)) functions.add(name)
    }
  }
  if (functions.size) {
    items.push({
      id: 'xslt-2-functions',
      level: 'error',
      blocksExport: true,
      title: 'XSLT 1.0 dışı işlev',
      detail: `Desteklenmeyen işlevler: ${[...functions].join(', ')}.`,
    })
  }

  if (doc.getElementsByTagNameNS(XSL_NS, 'import').length || doc.getElementsByTagNameNS(XSL_NS, 'include').length) {
    items.push({
      id: 'xslt-include',
      level: 'warning',
      title: 'Dış şablon başvurusu var',
      detail: 'xsl:import veya xsl:include tarayıcı önizlemesinde çözülmez. Eksik parçalar faturada görünmeyebilir.',
    })
  }

  for (const rule of REQUIRED_FIELD_RULES) {
    const matched = rule.patterns.some((pattern) => pattern.test(xsltText))
      && (!rule.also || rule.also.some((pattern) => pattern.test(xsltText)))
    if (!matched) {
      items.push({
        id: rule.id,
        level: 'warning',
        title: `${rule.label} eksik`,
        detail: rule.detail,
      })
    }
  }

  const hasQr = /gib-qrcode|QRCODE|KAREKOD|karekod/i.test(xsltText)
  if (!hasQr) {
    items.push({
      id: 'qr',
      level: 'warning',
      title: 'Karekod alanı yok',
      detail: 'GİB karekod alanı şablonda bulunamadı. Tek tıkla eklenebilir.',
      fix: 'insert-qr',
    })
  } else if (html && !/gib-qrcode|Karekod|QRCODE/i.test(html)) {
    items.push({
      id: 'qr-output',
      level: 'warning',
      title: 'Karekod önizlemede yok',
      detail: 'Alan şablonda geçiyor ancak bu XML ile basılmadı.',
    })
  }

  for (const column of design?.columns || []) {
    if (column.required && !column.visible) {
      items.push({
        id: `column-${column.id}`,
        level: 'warning',
        title: `${column.label} gizli`,
        detail: 'Bu kolon e-fatura görünümünde bulunması beklenen bilgilerden biri.',
      })
    }
  }

  if (transformError) {
    items.push({
      id: 'preview',
      level: 'warning',
      title: 'Önizleme üretilemedi',
      detail: transformError,
    })
  } else if (html && xmlText) {
    const facts = readInvoiceFacts(xmlText)
    if (facts) {
      if (facts.id && !html.includes(facts.id)) pushMissing(items, 'id', 'Fatura No')
      if (facts.issueDate && !dateAppears(html, facts.issueDate)) pushMissing(items, 'date', 'Fatura Tarihi')
      if (facts.supplierId && !html.includes(facts.supplierId)) pushMissing(items, 'supplier', 'Satıcı VKN/TCKN')
      if (facts.customerId && !html.includes(facts.customerId)) pushMissing(items, 'customer', 'Alıcı VKN/TCKN')
      if (facts.lineExtension && !moneyAppears(html, facts.lineExtension)) pushMissing(items, 'lines', 'Mal/Hizmet Toplam Tutarı')
      if (facts.taxAmount && !moneyAppears(html, facts.taxAmount)) pushMissing(items, 'tax', 'Hesaplanan KDV')
      if (facts.payable && !moneyAppears(html, facts.payable)) pushMissing(items, 'payable', 'Genel Toplam')
    }
  }

  return summarize(items)
}
