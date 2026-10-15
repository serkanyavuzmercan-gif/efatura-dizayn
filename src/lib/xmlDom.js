export const XSL_NS = 'http://www.w3.org/1999/XSL/Transform'

export function parseXml(text, label = 'XML') {
  const source = String(text || '').replace(/^\uFEFF/, '')
  const doc = new DOMParser().parseFromString(source, 'application/xml')
  const root = doc.documentElement
  if (!root || root.localName === 'parsererror' || root.getElementsByTagName('parsererror').length) {
    const message = root?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 280) || 'geçersiz XML'
    throw new Error(`${label} okunamadı: ${message}`)
  }
  return doc
}

export function serializeXml(doc) {
  let xml = new XMLSerializer().serializeToString(doc).replace(/^\uFEFF/, '')
  if (!xml.startsWith('<?xml')) {
    xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`
  }
  return xml
}

export function byId(doc, id) {
  const all = doc.getElementsByTagName('*')
  for (let index = 0; index < all.length; index += 1) {
    if (all[index].getAttribute('id') === id) return all[index]
  }
  return null
}

export function elementChildren(node) {
  const children = []
  const nodes = node?.childNodes || []
  for (let index = 0; index < nodes.length; index += 1) {
    if (nodes[index].nodeType === 1) children.push(nodes[index])
  }
  return children
}

export function visibleText(element) {
  let text = ''
  const nodes = element?.childNodes || []
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    if (node.nodeType === 3) text += node.nodeValue || ''
    else if (node.nodeType === 1 && node.namespaceURI !== XSL_NS) text += visibleText(node)
  }
  return text.replace(/\s+/g, ' ').trim()
}

export function createXsl(doc, localName) {
  return doc.createElementNS(XSL_NS, `xsl:${localName}`)
}

export function xslElements(doc, localName) {
  return [...doc.getElementsByTagNameNS(XSL_NS, localName)]
}
