export const FieldShell = ({ label, hint, children }) => (
  <label className="flex flex-col gap-2.5">
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
        {label}
      </span>
      {hint ? <span className="text-xs leading-5 text-[var(--moran-soft)]">{hint}</span> : null}
    </div>
    {children}
  </label>
)
