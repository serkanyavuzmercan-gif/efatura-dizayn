import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useEditor } from '../context/EditorContext'
import { usePreview } from '../context/EditorContext'

export function PreviewPanel() {
  const { html, error, pending } = usePreview()
  const [zoom, setZoom] = useState(1)
  const [frameHeight, setFrameHeight] = useState(1123)
  const pageWidth = 820

  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-[#e7e1d6]">
      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted">
        <span>Canlı önizleme · A4</span>
        <div className="flex items-center gap-1">
          {pending ? <span>Güncelleniyor</span> : <ShieldCheck size={14} className="text-pine" />}
          {[0.8, 1, 1.15].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setZoom(value)}
              className={`rounded px-2 py-0.5 ${zoom === value ? 'bg-white text-ink' : 'hover:bg-white/60'}`}
            >
              {Math.round(value * 100)}%
            </button>
          ))}
        </div>
      </div>
      <div className="scroll-thin flex flex-1 justify-center overflow-auto px-6 pb-6">
        {error && !html ? (
          <div className="mt-10 max-w-lg rounded-lg bg-white p-5 text-sm shadow">
            <p className="font-medium">Önizleme hazır değil</p>
            <p className="mt-2 leading-6 text-muted">{error}</p>
          </div>
        ) : (
          <div style={{ width: pageWidth * zoom, height: frameHeight * zoom }}>
            <iframe
              title="e-Fatura önizleme"
              sandbox="allow-same-origin"
              srcDoc={html}
              onLoad={(event) => {
                const doc = event.currentTarget.contentDocument
                const height = Math.max(
                  doc?.documentElement?.scrollHeight || 0,
                  doc?.body?.scrollHeight || 0,
                  1123,
                )
                setFrameHeight(height)
              }}
              style={{
                width: pageWidth,
                height: frameHeight,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                background: '#fff',
                border: 0,
                boxShadow: '0 18px 50px rgba(23, 32, 51, 0.14)',
              }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
