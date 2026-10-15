import { parseXml } from './xmlDom'

function normalizePreviewHtml(html) {
  const trimmed = String(html || '').trim()
  if (!trimmed) throw new Error('Dönüşüm boş sonuç verdi.')
  const withoutBanner = trimmed.replace(/<div\b[^>]*>[\s\S]*?This site uses XSLT[\s\S]*?<\/div>/gi, '')
  if (/<html[\s>]/i.test(withoutBanner)) return withoutBanner
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${withoutBanner}</body></html>`
}

function transformNative(xsltText, xmlText) {
  const xsltDoc = parseXml(xsltText, 'XSLT')
  const xmlDoc = parseXml(xmlText, 'XML')
  const processor = new XSLTProcessor()
  processor.importStylesheet(xsltDoc)
  const result = processor.transformToDocument(xmlDoc)
  if (!result?.documentElement) throw new Error('Dönüşüm sonuç üretmedi.')
  if (result.documentElement.localName === 'parsererror') {
    throw new Error(result.documentElement.textContent?.replace(/\s+/g, ' ').trim().slice(0, 280) || 'Dönüşüm başarısız.')
  }
  return normalizePreviewHtml(new XMLSerializer().serializeToString(result))
}

async function transformLibrary(xsltText, xmlText) {
  const mod = await import('xslt-processor')
  const Xslt = mod.Xslt || mod.default?.Xslt
  const XmlParser = mod.XmlParser || mod.default?.XmlParser
  if (!Xslt || !XmlParser) throw new Error('Yedek XSLT motoru yüklenemedi.')
  const xslt = new Xslt()
  const parser = new XmlParser()
  const result = await xslt.xsltProcess(parser.xmlParse(xmlText), parser.xmlParse(xsltText))
  if (typeof result !== 'string') throw new Error('Yedek motor sonuç üretmedi.')
  return normalizePreviewHtml(result)
}

export async function transformToHtml(xsltText, xmlText) {
  if (typeof XSLTProcessor !== 'undefined') {
    try {
      return { html: transformNative(xsltText, xmlText), engine: 'native' }
    } catch (nativeError) {
      try {
        const html = await transformLibrary(xsltText, xmlText)
        return { html, engine: 'library' }
      } catch {
        throw nativeError
      }
    }
  }
  return { html: await transformLibrary(xsltText, xmlText), engine: 'library' }
}
