import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import defaultXslt from '../templates/defaultInvoice.xslt?raw'
import sampleXml from '../templates/sampleInvoice.xml?raw'
import { reorderList } from '../lib/designModel'
import { fileKind, readImageFile, readXmlText } from '../lib/fileReader'
import { emptyReport } from '../lib/gibRules'
import { compileDocuments } from '../lib/pipeline'
import { analyzeXslt, detectColumnsFromHtml } from '../lib/xsltParser'
import { downloadTextFile, insertQrBlock } from '../lib/xsltExporter'

const DesignContext = createContext(null)
const PreviewContext = createContext(null)

const DEFAULT_XSLT_NAME = 'varsayilan-efatura.xslt'
const DEFAULT_XML_NAME = 'ornek-efatura.xml'

function bootState() {
  return analyzeXslt(defaultXslt)
}

export function EditorProvider({ children }) {
  const boot = useMemo(() => bootState(), [])
  const [xsltText, setXsltText] = useState(defaultXslt)
  const [xsltName, setXsltName] = useState(DEFAULT_XSLT_NAME)
  const [xmlText, setXmlText] = useState(sampleXml)
  const [xmlName, setXmlName] = useState(DEFAULT_XML_NAME)
  const [design, setDesign] = useState(boot.design)
  const [caps, setCaps] = useState(boot.caps)
  const [touched, setTouched] = useState({})
  const [designDirty, setDesignDirty] = useState(false)
  const [pipeline, setPipeline] = useState(() => ({
    html: '',
    error: '',
    report: emptyReport(),
    exportText: defaultXslt,
  }))
  const [pending, setPending] = useState(true)
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState(null)

  const designRef = useRef(design)
  const pipelineRef = useRef(pipeline)
  const nameRef = useRef(xsltName)
  designRef.current = design
  pipelineRef.current = pipeline
  nameRef.current = xsltName

  const updateDesign = useCallback((updater, keys) => {
    setDesign((prev) => updater(prev))
    if (keys?.length) {
      setTouched((prev) => {
        const next = { ...prev }
        for (const key of keys) next[key] = true
        return next
      })
      setDesignDirty(true)
    }
  }, [])

  const loadXslt = useCallback((text, name) => {
    const analyzed = analyzeXslt(text)
    setXsltText(text)
    setXsltName(name || 'tasarim.xslt')
    setDesign(analyzed.design)
    setCaps(analyzed.caps)
    setTouched({})
    setDesignDirty(false)
    setNotice(analyzed.parseError ? 'XSLT okunamadı. Dosya iyi biçimli XML olmalıdır.' : `${name || 'XSLT'} yüklendi.`)
  }, [])

  const loadXml = useCallback((text, name) => {
    setXmlText(text)
    setXmlName(name || 'fatura.xml')
    setNotice(`${name || 'XML'} yüklendi.`)
  }, [])

  const reset = useCallback(() => {
    const analyzed = analyzeXslt(defaultXslt)
    setXsltText(defaultXslt)
    setXsltName(DEFAULT_XSLT_NAME)
    setXmlText(sampleXml)
    setXmlName(DEFAULT_XML_NAME)
    setDesign(analyzed.design)
    setCaps(analyzed.caps)
    setTouched({})
    setDesignDirty(false)
    setDialog(null)
    setNotice('Varsayılan e-Fatura tasarımına dönüldü.')
  }, [])

  const requestReset = useCallback(() => {
    if (designDirty || xsltName !== DEFAULT_XSLT_NAME || xmlName !== DEFAULT_XML_NAME) setDialog('reset')
    else reset()
  }, [designDirty, reset, xmlName, xsltName])

  const patch = useCallback((key, value) => {
    updateDesign((prev) => ({ ...prev, [key]: value }), [key])
  }, [updateDesign])

  const setLogoSrc = useCallback((logoSrc) => {
    updateDesign((prev) => ({
      ...prev,
      logoSrc,
      locked: { ...prev.locked, logoSrc: false },
    }), ['logoSrc'])
  }, [updateDesign])

  const patchNotes = useCallback((partial) => {
    const unlock = {}
    if ('bank' in partial) unlock.noteBank = false
    if ('payment' in partial) unlock.notePayment = false
    if ('general' in partial) unlock.noteGeneral = false
    if ('position' in partial) unlock.notePosition = false
    updateDesign((prev) => ({
      ...prev,
      notes: { ...prev.notes, ...partial },
      locked: { ...prev.locked, ...unlock },
    }), ['notes'])
  }, [updateDesign])

  const toggleColumn = useCallback((id) => {
    const current = designRef.current
    const target = current.columns.find((column) => column.id === id)
    if (!target) return
    const visibleCount = current.columns.filter((column) => column.visible).length
    if (target.visible && visibleCount === 1) return
    updateDesign((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => (
        column.id === id ? { ...column, visible: !column.visible } : column
      )),
    }), ['columns'])
  }, [updateDesign])

  const setColumnWidth = useCallback((id, width) => {
    const value = Math.min(70, Math.max(4, Number(width) || 4))
    updateDesign((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => (column.id === id ? { ...column, width: value } : column)),
    }), ['columns'])
  }, [updateDesign])

  const moveColumn = useCallback((from, to) => {
    updateDesign((prev) => ({ ...prev, columns: reorderList(prev.columns, from, to) }), ['columns'])
  }, [updateDesign])

  const loadLogoFile = useCallback(async (file) => {
    try {
      const src = await readImageFile(file)
      setLogoSrc(src)
      setNotice('Logo hazır. Önizleme birazdan güncellenir.')
    } catch (error) {
      setNotice(error.message || 'Logo okunamadı.')
    }
  }, [setLogoSrc])

  const importFiles = useCallback(async (fileList) => {
    const files = [...fileList]
    if (!files.length) return
    let known = 0
    for (const file of files) {
      const kind = fileKind(file)
      if (kind === 'xslt') {
        known += 1
        loadXslt(await readXmlText(file), file.name)
      } else if (kind === 'xml') {
        known += 1
        loadXml(await readXmlText(file), file.name)
      } else if (kind === 'image') {
        known += 1
        await loadLogoFile(file)
      }
    }
    if (!known) setNotice('Yalnızca .xslt, .xml veya bir logo görseli bırakın.')
  }, [loadLogoFile, loadXml, loadXslt])

  const addQr = useCallback(() => {
    try {
      const next = insertQrBlock(xsltText)
      if (next === xsltText) {
        setNotice('Karekod alanı zaten var.')
        return
      }
      setXsltText(next)
      setDesignDirty(true)
      setNotice('Karekod alanı şablona eklendi.')
    } catch (error) {
      setNotice(error.message || 'Karekod eklenemedi.')
    }
  }, [xsltText])

  const saveExport = useCallback(() => {
    const current = pipelineRef.current
    if (!current?.exportText) return
    downloadTextFile(nameRef.current || DEFAULT_XSLT_NAME, current.exportText)
    setDialog(null)
  }, [])

  const requestExport = useCallback(() => {
    const current = pipelineRef.current
    if (!current?.exportText) return
    if (current.report?.blocksExport) {
      setDialog('blocked')
      return
    }
    if (current.report?.warningCount > 0) {
      setDialog('export')
      return
    }
    saveExport()
  }, [saveExport])

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        requestExport()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [requestExport])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 5200)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    let cancelled = false
    setPending(true)
    const timer = setTimeout(() => {
      compileDocuments({
        xsltText,
        xmlText,
        design,
        templateKind: caps.kind,
        designDirty,
        touched,
      }).then((result) => {
        if (!cancelled) {
          setPipeline(result)
          setPending(false)
        }
      })
    }, 180)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [caps.kind, design, designDirty, touched, xmlText, xsltText])

  useEffect(() => {
    if (design.columns.length || !pipeline.html || caps.kind === 'builtin') return
    const detected = detectColumnsFromHtml(pipeline.html)
    if (!detected.length) return
    setDesign((prev) => (prev.columns.length ? prev : { ...prev, columns: detected }))
  }, [caps.kind, design.columns.length, pipeline.html])

  const designValue = useMemo(() => ({
    xsltName,
    xmlName,
    design,
    caps,
    designDirty,
    notice,
    dialog,
    setDialog,
    loadXslt,
    loadXml,
    importFiles,
    loadLogoFile,
    reset,
    requestReset,
    patch,
    setLogoSrc,
    patchNotes,
    toggleColumn,
    setColumnWidth,
    moveColumn,
    addQr,
    requestExport,
    saveExport,
  }), [
    addQr,
    caps,
    design,
    designDirty,
    dialog,
    importFiles,
    loadLogoFile,
    loadXml,
    loadXslt,
    moveColumn,
    notice,
    patch,
    patchNotes,
    requestExport,
    requestReset,
    reset,
    saveExport,
    setColumnWidth,
    setLogoSrc,
    toggleColumn,
    xmlName,
    xsltName,
  ])

  const previewValue = useMemo(() => ({
    html: pipeline.html,
    error: pipeline.error,
    report: pipeline.report,
    pending,
  }), [pending, pipeline.error, pipeline.html, pipeline.report])

  return (
    <DesignContext.Provider value={designValue}>
      <PreviewContext.Provider value={previewValue}>
        {children}
      </PreviewContext.Provider>
    </DesignContext.Provider>
  )
}

export function useEditor() {
  const value = useContext(DesignContext)
  if (!value) throw new Error('useEditor EditorProvider içinde kullanılmalıdır.')
  return value
}

export function usePreview() {
  const value = useContext(PreviewContext)
  if (!value) throw new Error('usePreview EditorProvider içinde kullanılmalıdır.')
  return value
}
