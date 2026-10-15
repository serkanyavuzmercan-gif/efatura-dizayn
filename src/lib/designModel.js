export const FONTS = [
  { id: 'Segoe UI, Arial, sans-serif', label: 'Segoe UI' },
  { id: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { id: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { id: 'Georgia, serif', label: 'Georgia' },
  { id: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { id: '"Courier New", Courier, monospace', label: 'Courier New' },
]

export const DEFAULT_COLUMNS = [
  { id: 'lineNo', label: 'Sıra No', visible: true, width: 6, required: false },
  { id: 'name', label: 'Mal/Hizmet Adı', visible: true, width: 24, required: true },
  { id: 'qty', label: 'Miktar', visible: true, width: 8, required: true },
  { id: 'unit', label: 'Birim', visible: true, width: 8, required: true },
  { id: 'price', label: 'Birim Fiyat', visible: true, width: 12, required: false },
  { id: 'discount', label: 'İskonto', visible: true, width: 10, required: false },
  { id: 'vatRate', label: 'KDV Oranı', visible: true, width: 9, required: true },
  { id: 'vatAmount', label: 'KDV Tutarı', visible: true, width: 11, required: true },
  { id: 'lineTotal', label: 'Toplam', visible: true, width: 12, required: true },
]

export const DEFAULT_NOTES = {
  bank: '',
  payment: '',
  general: 'Bu fatura elektronik ortamda düzenlenmiştir.',
  position: 'side',
}

export const DEFAULT_DESIGN = {
  logoSrc: '',
  logoWidth: 132,
  logoAlign: 'left',
  primary: '#143d66',
  heading: '#143d66',
  text: '#1c2430',
  border: '#c5ced9',
  borderWidth: 1,
  headerBg: '#e7eef6',
  fontFamily: FONTS[0].id,
  fontSize: 11,
  headingSize: 18,
  columns: DEFAULT_COLUMNS,
  notes: DEFAULT_NOTES,
  locked: {},
}

const REQUIRED_IDS = new Set(['name', 'qty', 'unit', 'vatRate', 'vatAmount', 'lineTotal'])

export function columnIsRequired(id, label) {
  if (REQUIRED_IDS.has(id)) return true
  const text = String(label || '').toLocaleLowerCase('tr-TR')
  if (/sıra|sira no|iskonto|birim fiyat/.test(text)) return false
  if (/kdv oran|kdv tutar/.test(text)) return true
  if (/mal|hizmet|açıklama|aciklama/.test(text)) return true
  if (/miktar/.test(text)) return true
  if (text === 'birim' || text.startsWith('birim ')) return true
  if (/^toplam$|^tutar$|satır tutar|satir tutar/.test(text)) return true
  return false
}

export function cloneDesign(design = DEFAULT_DESIGN) {
  return {
    ...DEFAULT_DESIGN,
    ...design,
    columns: (design.columns || DEFAULT_COLUMNS).map((column, index) => ({
      ...column,
      initialIndex: column.initialIndex ?? index,
      required: column.required ?? columnIsRequired(column.id, column.label),
    })),
    notes: { ...DEFAULT_NOTES, ...(design.notes || {}) },
    locked: { ...(design.locked || {}) },
  }
}

export function columnPercents(columns) {
  const visible = columns.filter((column) => column.visible)
  const sum = visible.reduce((total, column) => total + Number(column.width || 0), 0) || 1
  const map = {}
  for (const column of columns) {
    map[column.id] = column.visible ? (Number(column.width) / sum) * 100 : 0
  }
  return map
}

export function safeColor(value, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : fallback
}

export function safeNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

export function safeFont(value) {
  return FONTS.some((font) => font.id === value) ? value : FONTS[0].id
}

export function safeAlign(value) {
  return ['left', 'center', 'right'].includes(value) ? value : 'left'
}

export function safeNotePosition(value) {
  return value === 'below' ? 'below' : 'side'
}

export function isSafeImageSrc(src) {
  if (!src) return true
  if (/^data:image\/(png|jpeg|jpg|gif|webp);base64,[a-z0-9+/=\r\n]+$/i.test(src)) {
    return src.length < 700_000
  }
  return false
}

export function reorderList(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
