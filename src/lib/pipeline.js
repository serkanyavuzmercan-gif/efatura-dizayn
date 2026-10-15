import { evaluateCompliance, emptyReport } from './gibRules'
import { transformToHtml } from './xsltEngine'
import { applyDesign } from './xsltExporter'

export { emptyReport }

export async function compileDocuments({
  xsltText,
  xmlText,
  design,
  templateKind,
  designDirty,
  touched,
}) {
  const shouldApply = templateKind === 'builtin' || designDirty
  let applied = xsltText
  let warnings = []
  if (shouldApply) {
    try {
      const result = applyDesign(xsltText, design, { templateKind, touched })
      applied = result.xsltText
      warnings = result.warnings
    } catch (error) {
      const report = evaluateCompliance({
        xsltText,
        xmlText,
        design,
        transformError: error.message || 'Tasarım XSLT içine işlenemedi.',
      })
      return {
        html: '',
        error: error.message || 'Tasarım uygulanamadı.',
        report,
        exportText: xsltText,
      }
    }
  }

  let html = ''
  let transformError = ''
  if (!xmlText?.trim()) {
    transformError = 'Önizleme için bir e-Fatura XML dosyası yükleyin.'
  } else {
    try {
      const transformed = await transformToHtml(applied, xmlText)
      html = transformed.html
      if (transformed.engine === 'library') {
        warnings = warnings.concat({
          id: 'xslt-engine',
          title: 'Yedek dönüşüm motoru kullanıldı',
          detail: 'Tarayıcı XSLT 1.0 motoru sonuç vermedi. Yedek motor bazı şablonlarda eksik önizleme üretebilir.',
        })
      }
    } catch (error) {
      transformError = error.message || 'XSLT dönüşümü başarısız oldu.'
    }
  }

  const exportText = templateKind === 'builtin' || designDirty ? applied : xsltText
  const report = evaluateCompliance({
    xsltText: exportText,
    html,
    xmlText,
    design,
    transformError,
    extraWarnings: warnings,
  })

  return {
    html,
    error: transformError,
    report,
    exportText,
  }
}
