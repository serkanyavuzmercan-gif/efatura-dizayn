import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { useEditor } from '../context/EditorContext'
import { usePreview } from '../context/EditorContext'
import { Button } from './ui'

export function ComplianceReport() {
  const { report } = usePreview()
  const { addQr } = useEditor()
  const items = report?.items || []
  const problems = items.filter((item) => item.level === 'error' || item.level === 'warning')
  const clean = problems.length === 0

  return (
    <aside className="absolute bottom-4 right-4 z-20 w-80 max-w-[calc(100%-2rem)] rounded-lg border border-line bg-panel/95 shadow-lg backdrop-blur">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        {clean ? <ShieldCheck size={16} className="text-pine" /> : <ShieldAlert size={16} className="text-warn" />}
        <div className="min-w-0">
          <div className="text-sm font-semibold">Uyumluluk raporu</div>
          <div className="text-[11px] text-muted">
            {clean ? 'GİB kontrolleri temiz' : `${report.errorCount || 0} engel · ${report.warningCount || 0} uyarı`}
          </div>
        </div>
      </div>
      {problems.length ? (
        <ul className="scroll-thin max-h-64 space-y-2 overflow-auto px-3 py-2">
          {problems.map((item) => (
            <li key={item.id} className="text-xs leading-5">
              <span className={item.level === 'error' ? 'font-semibold text-danger' : 'font-semibold text-warn'}>
                {item.title}
              </span>
              <span className="mt-0.5 block text-muted">{item.detail}</span>
              {item.fix === 'insert-qr' ? (
                <Button variant="soft" className="mt-1 px-2 py-1 text-xs" onClick={addQr}>
                  Karekod ekle
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-2 text-xs leading-5 text-muted">
          Zorunlu alanlar, karekod ve XSLT 1.0 denetimi bu tasarımda sorun görmüyor.
        </p>
      )}
    </aside>
  )
}
