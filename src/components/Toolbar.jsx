import { useRef } from 'react'
import { Download, FileCode2, FileText, RotateCcw } from 'lucide-react'
import { useEditor } from '../context/EditorContext'
import { usePreview } from '../context/EditorContext'
import { Button } from './ui'

export function Toolbar() {
  const xsltInput = useRef(null)
  const xmlInput = useRef(null)
  const {
    xsltName,
    xmlName,
    designDirty,
    importFiles,
    requestReset,
    requestExport,
  } = useEditor()
  const { report, pending } = usePreview()
  const issues = (report?.errorCount || 0) + (report?.warningCount || 0)

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-panel px-4 py-2.5">
      <div className="min-w-40">
        <div className="text-sm font-semibold tracking-tight">e-Fatura Dizayn</div>
        <div className="text-[11px] text-muted">Mikro · GİB XSLT 1.0</div>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <FileChip icon={<FileCode2 size={14} />} name={xsltName} dirty={designDirty} />
        <FileChip icon={<FileText size={14} />} name={xmlName} />
      </div>

      <div className="flex items-center gap-2">
        {issues > 0 ? (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${report.errorCount ? 'bg-red-50 text-danger' : 'bg-amber-50 text-warn'}`}>
            {issues} uyarı
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-pine">
            {pending ? 'Denetleniyor' : 'Uyumlu'}
          </span>
        )}
        <input
          ref={xsltInput}
          type="file"
          accept=".xslt,.xsl"
          className="hidden"
          onChange={(event) => {
            importFiles(event.target.files)
            event.target.value = ''
          }}
        />
        <input
          ref={xmlInput}
          type="file"
          accept=".xml"
          className="hidden"
          onChange={(event) => {
            importFiles(event.target.files)
            event.target.value = ''
          }}
        />
        <Button variant="soft" onClick={() => xsltInput.current?.click()}>
          <FileCode2 size={15} />
          XSLT
        </Button>
        <Button variant="soft" onClick={() => xmlInput.current?.click()}>
          <FileText size={15} />
          XML
        </Button>
        <Button variant="ghost" onClick={requestReset} title="Varsayılan tasarıma dön">
          <RotateCcw size={15} />
          Sıfırla
        </Button>
        <Button onClick={requestExport} title="Dışa aktar (Ctrl+S)">
          <Download size={15} />
          Dışa aktar
        </Button>
      </div>
    </header>
  )
}

function FileChip({ icon, name, dirty = false }) {
  return (
    <span className="inline-flex max-w-56 items-center gap-1.5 rounded-md border border-line bg-white px-2 py-1 text-xs text-ink">
      <span className="text-brass">{icon}</span>
      <span className="truncate">{name}</span>
      {dirty ? <span className="text-brass">●</span> : null}
    </span>
  )
}
