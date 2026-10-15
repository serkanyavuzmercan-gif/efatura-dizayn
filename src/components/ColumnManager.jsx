import { useState } from 'react'
import { Eye, EyeOff, GripVertical, Lock } from 'lucide-react'
import { useEditor } from '../context/EditorContext'

export function ColumnManager() {
  const { design, caps, toggleColumn, setColumnWidth, moveColumn } = useEditor()
  const [dragIndex, setDragIndex] = useState(-1)
  const columns = design.columns

  if (!columns.length) {
    return (
      <p className="text-xs leading-5 text-muted">
        Satır tablosu henüz tanınmadı. InvoiceLine döngüsü bir HTML tablosunun içindeyse kolonlar önizlemeden sonra burada listelenir.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-4 text-muted">
        {caps.reorderEnabled
          ? 'Sırayı sürükleyin. Genişlikler görünür kolonlar arasında oranlanır.'
          : 'Bu şablonda sıra sabit. Kolon gizlenebilir ve genişliği değiştirilebilir.'}
      </p>
      <div className="space-y-1">
        {columns.map((column, index) => (
          <div
            key={column.id}
            className="flex items-center gap-1.5 rounded-md border border-line bg-white px-1.5 py-1"
            onDragOver={(event) => {
              if (!caps.reorderEnabled) return
              event.preventDefault()
            }}
            onDrop={(event) => {
              event.preventDefault()
              const raw = event.dataTransfer.getData('text/plain')
              if (raw === '') return
              moveColumn(Number(raw), index)
              setDragIndex(-1)
            }}
          >
            <button
              type="button"
              draggable={caps.reorderEnabled}
              aria-label={`${column.label} sırasını taşı`}
              className={`rounded p-1 text-muted ${caps.reorderEnabled ? 'cursor-grab' : 'cursor-default opacity-40'}`}
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', String(index))
                event.dataTransfer.effectAllowed = 'move'
                setDragIndex(index)
              }}
              onDragEnd={() => setDragIndex(-1)}
            >
              <GripVertical size={14} />
            </button>
            <div className={`min-w-0 flex-1 truncate text-xs ${dragIndex === index ? 'opacity-50' : ''}`}>
              {column.label}
              {column.required ? <Lock size={10} className="ml-1 inline text-brass" aria-label="Zorunlu alan" /> : null}
            </div>
            <input
              type="number"
              min="4"
              max="70"
              aria-label={`${column.label} genişlik`}
              disabled={!column.visible}
              value={column.width}
              onChange={(event) => setColumnWidth(column.id, event.target.value)}
              className="w-14 rounded border border-line px-1 py-0.5 text-right text-xs disabled:bg-paper"
            />
            <button
              type="button"
              aria-label={column.visible ? `${column.label} gizle` : `${column.label} göster`}
              className="rounded p-1 text-ink hover:bg-paper"
              onClick={() => toggleColumn(column.id)}
            >
              {column.visible ? <Eye size={14} /> : <EyeOff size={14} className="text-muted" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
