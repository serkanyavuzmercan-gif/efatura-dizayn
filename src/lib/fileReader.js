import { isSafeImageSrc } from './designModel'

export async function readXmlText(file) {
  const buffer = await file.arrayBuffer()
  const probe = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 240))
  const match = probe.match(/encoding\s*=\s*["']([^"']+)["']/i)
  const declared = (match?.[1] || 'utf-8').toLowerCase()
  const labels = {
    'utf-8': 'utf-8',
    utf8: 'utf-8',
    'iso-8859-9': 'iso-8859-9',
    'windows-1254': 'windows-1254',
    'iso-8859-1': 'iso-8859-1',
  }
  const label = labels[declared] || 'utf-8'
  try {
    return new TextDecoder(label).decode(buffer).replace(/^\uFEFF/, '')
  } catch {
    return new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, '')
  }
}

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Logo bir görsel dosyası olmalıdır.'))
      return
    }
    if (file.size > 450 * 1024) {
      reject(new Error('Logo 450 KB sınırını aşıyor. Daha küçük bir PNG veya JPG seçin.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result || '')
      if (!isSafeImageSrc(src)) {
        reject(new Error('Logo PNG, JPG, GIF veya WEBP olmalıdır.'))
        return
      }
      resolve(src)
    }
    reader.onerror = () => reject(reader.error || new Error('Logo okunamadı.'))
    reader.readAsDataURL(file)
  })
}

export function fileKind(file) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.xslt') || name.endsWith('.xsl')) return 'xslt'
  if (name.endsWith('.xml')) return 'xml'
  if (file.type.startsWith('image/')) return 'image'
  return 'unknown'
}
