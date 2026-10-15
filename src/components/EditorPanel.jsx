import { useRef } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ImagePlus, Palette, Table2, Type } from 'lucide-react'
import { FONTS } from '../lib/designModel'
import { useEditor } from '../context/EditorContext'
import { ColumnManager } from './ColumnManager'
import { Field, Section, TextArea, TextInput } from './ui'

export function EditorPanel() {
  const logoInput = useRef(null)
  const { design, caps, patch, setLogoSrc, patchNotes, loadLogoFile } = useEditor()

  return (
    <aside className="scroll-thin w-[380px] shrink-0 overflow-y-auto border-r border-line bg-panel">
      <Section icon={<ImagePlus size={16} />} title="Kurumsal kimlik">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-md border border-dashed border-line bg-white">
            {design.logoSrc ? (
              <img src={design.logoSrc} alt="Firma logosu" className="max-h-14 max-w-20 object-contain" />
            ) : (
              <span className="px-2 text-center text-[11px] text-muted">Logo yok</span>
            )}
          </div>
          <div className="space-y-1.5">
            <input
              ref={logoInput}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) loadLogoFile(file)
                event.target.value = ''
              }}
            />
            <button type="button" className="text-sm font-medium text-pine" onClick={() => logoInput.current?.click()}>
              Logo yükle
            </button>
            {design.logoSrc ? (
              <button type="button" className="block text-xs text-muted" onClick={() => setLogoSrc('')}>
                Logoyu kaldır
              </button>
            ) : null}
          </div>
        </div>
        <Field label="Logo genişliği" hint={`${design.logoWidth} px`}>
          <input
            type="range"
            min="48"
            max="260"
            value={design.logoWidth}
            onChange={(event) => patch('logoWidth', Number(event.target.value))}
            className="w-full accent-pine"
          />
        </Field>
        <div className="flex gap-1">
          {[
            ['left', AlignLeft, 'Sola hizala'],
            ['center', AlignCenter, 'Ortala'],
            ['right', AlignRight, 'Sağa hizala'],
          ].map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              aria-label={label}
              title={label}
              onClick={() => patch('logoAlign', value)}
              className={`rounded-md border px-3 py-1.5 ${design.logoAlign === value ? 'border-pine bg-emerald-50 text-pine' : 'border-line bg-white text-ink'}`}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </Section>

      <Section icon={<Palette size={16} />} title="Tipografi ve renkler">
        {caps.kind === 'external' ? (
          <p className="text-[11px] leading-4 text-muted">
            Değiştirdiğiniz değerler mevcut şablonun üzerine yazılır. Diğer renkler olduğu gibi kalır.
          </p>
        ) : null}
        <Field label="Yazı tipi">
          <select
            value={FONTS.some((font) => font.id === design.fontFamily) ? design.fontFamily : FONTS[0].id}
            onChange={(event) => patch('fontFamily', event.target.value)}
            className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm"
          >
            {FONTS.map((font) => (
              <option key={font.id} value={font.id}>{font.label}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gövde yazısı" hint={`${design.fontSize} px`}>
            <input type="range" min="8" max="16" value={design.fontSize} onChange={(event) => patch('fontSize', Number(event.target.value))} className="w-full accent-pine" />
          </Field>
          <Field label="Başlık" hint={`${design.headingSize} px`}>
            <input type="range" min="14" max="28" value={design.headingSize} onChange={(event) => patch('headingSize', Number(event.target.value))} className="w-full accent-pine" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Ana renk" value={design.primary} onChange={(value) => patch('primary', value)} />
          <ColorField label="Başlık rengi" value={design.heading} onChange={(value) => patch('heading', value)} />
          <ColorField label="Metin" value={design.text} onChange={(value) => patch('text', value)} />
          <ColorField label="Tablo başlığı" value={design.headerBg} onChange={(value) => patch('headerBg', value)} />
          <ColorField label="Kenarlık" value={design.border} onChange={(value) => patch('border', value)} />
          <Field label="Kenarlık kalınlığı" hint={`${design.borderWidth} px`}>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={design.borderWidth}
              onChange={(event) => patch('borderWidth', Number(event.target.value))}
              className="w-full accent-pine"
            />
          </Field>
        </div>
      </Section>

      <Section icon={<Table2 size={16} />} title="Tablo kolonları">
        <ColumnManager />
      </Section>

      <Section icon={<Type size={16} />} title="Dipnot ve notlar">
        <Field label="Banka bilgileri" hint="XML'deki ödeme hesabına ek olarak şablona yazılır.">
          <TextArea rows={2} value={design.notes.bank} onChange={(event) => patchNotes({ bank: event.target.value })} />
        </Field>
        <Field label="Ödeme koşulları">
          <TextInput value={design.notes.payment} onChange={(event) => patchNotes({ payment: event.target.value })} />
        </Field>
        <Field label="Genel not">
          <TextArea rows={2} value={design.notes.general} onChange={(event) => patchNotes({ general: event.target.value })} />
        </Field>
        {caps.kind === 'builtin' ? (
          <Field label="Konum">
            <select
              value={design.notes.position}
              onChange={(event) => patchNotes({ position: event.target.value })}
              className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm"
            >
              <option value="side">Toplamların solunda</option>
              <option value="below">Toplamların altında</option>
            </select>
          </Field>
        ) : (
          <p className="text-[11px] leading-4 text-muted">
            Dış şablonda bu notlar sayfanın sonuna eklenir.
          </p>
        )}
      </Section>
    </aside>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <span className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#143d66'}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-line bg-white p-0.5"
        />
        <span className="font-mono text-xs text-muted">{value}</span>
      </span>
    </Field>
  )
}
