const variantClasses = {
  primary:
    'bg-[var(--moran-ink)] text-white shadow-[0_18px_36px_rgba(15,15,15,0.18)] hover:-translate-y-0.5 hover:bg-[#1b1b1b]',
  secondary:
    'bg-[linear-gradient(180deg,rgba(214,164,164,0.2),rgba(214,164,164,0.12))] text-[var(--moran-ink)] shadow-[0_14px_30px_rgba(214,164,164,0.12)] hover:-translate-y-0.5 hover:bg-[rgba(214,164,164,0.25)]',
  subtle:
    'bg-[rgba(255,255,255,0.9)] text-[var(--moran-ink)] border border-[rgba(15,15,15,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] hover:-translate-y-0.5',
  olive:
    'bg-[var(--moran-olive)] text-white shadow-[0_16px_30px_rgba(107,112,92,0.24)] hover:-translate-y-0.5 hover:bg-[#5c614e]',
  danger:
    'bg-[#f7e6e6] text-[#8d3c3c] hover:-translate-y-0.5 hover:bg-[#f1d6d6]',
}

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled}
    className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-semibold tracking-[0.01em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,164,164,0.16)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${variantClasses[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
)
