import { Component, useEffect, useState } from 'react'
import { EditorProvider, useEditor } from './context/EditorContext'
import { ComplianceReport } from './components/ComplianceReport'
import { EditorPanel } from './components/EditorPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { Toolbar } from './components/Toolbar'
import { Button } from './components/ui'

export default function App() {
  return (
    <ErrorBoundary>
      <EditorProvider>
        <Shell />
      </EditorProvider>
    </ErrorBoundary>
  )
}

function Shell() {
  const {
    notice,
    dialog,
    setDialog,
    reset,
    saveExport,
    importFiles,
  } = useEditor()
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    let depth = 0
    const hasFiles = (event) => [...(event.dataTransfer?.types || [])].includes('Files')
    const onEnter = (event) => {
      if (!hasFiles(event)) return
      depth += 1
      setDragging(true)
    }
    const onLeave = () => {
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const onOver = (event) => {
      if (hasFiles(event)) event.preventDefault()
    }
    const onDrop = (event) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      depth = 0
      setDragging(false)
      importFiles(event.dataTransfer.files)
    }
    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('dragover', onOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [importFiles])

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <Toolbar />
      {notice ? <div className="border-b border-line bg-amber-50 px-4 py-2 text-xs text-warn">{notice}</div> : null}
      <div className="flex min-h-0 flex-1">
        <EditorPanel />
        <div className="relative flex min-w-0 flex-1">
          <PreviewPanel />
          <ComplianceReport />
        </div>
      </div>
      <p className="border-t border-line bg-panel px-4 py-1.5 text-[11px] text-muted">
        Dönüşüm bu bilgisayarda, bellek içinde yapılır. XSLT ve XML dosyaları sunucuya gönderilmez.
      </p>
      {dragging ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-ink/40">
          <div className="rounded-xl bg-panel px-6 py-5 text-center shadow-xl">
            <div className="text-base font-semibold">Dosyayı bırakın</div>
            <div className="mt-1 text-sm text-muted">.xslt tasarım, .xml e-Fatura veya logo görseli</div>
          </div>
        </div>
      ) : null}
      {dialog ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/35 p-4">
          <div className="w-full max-w-md rounded-xl bg-panel p-5 shadow-2xl">
            {dialog === 'reset' ? (
              <>
                <h2 className="text-base font-semibold">Varsayılan tasarıma dönülsün mü?</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Yüklenen XSLT, XML ve yapılan görünüm değişiklikleri bu oturumdan silinir. İndirilmiş dosyalar durur.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setDialog(null)}>Vazgeç</Button>
                  <Button onClick={reset}>Sıfırla</Button>
                </div>
              </>
            ) : null}
            {dialog === 'export' ? (
              <>
                <h2 className="text-base font-semibold">Uyumluluk uyarıları var</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Dosya yine de indirilebilir. Mikro veya GİB aktarımından önce sağ alttaki raporu gözden geçirin.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setDialog(null)}>Vazgeç</Button>
                  <Button onClick={saveExport}>Yine de indir</Button>
                </div>
              </>
            ) : null}
            {dialog === 'blocked' ? (
              <>
                <h2 className="text-base font-semibold">Dışa aktarma durduruldu</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Şablon XSLT 1.0 değil veya 2.0/3.0 işlevleri içeriyor. Mikro ve GİB bu sürümü işlemez.
                </p>
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setDialog(null)}>Tamam</Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6">
          <h1 className="text-lg font-semibold">Ekran açılamadı</h1>
          <p className="mt-2 text-sm text-muted">{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
