export function Button({
  variant = 'solid',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const variants = {
    solid: 'bg-pine text-white hover:bg-pine-dark',
    ghost: 'bg-transparent text-ink hover:bg-paper',
    soft: 'bg-paper text-ink hover:bg-line',
    danger: 'bg-white text-danger hover:bg-red-50',
  }
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.solid} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-4 text-muted">{hint}</span> : null}
    </label>
  )
}

export function Section({ icon, title, children }) {
  return (
    <section className="border-b border-line px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-brass">{icon}</span>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-pine ${props.className || ''}`}
    />
  )
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`w-full resize-y rounded-md border border-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-pine ${props.className || ''}`}
    />
  )
}
