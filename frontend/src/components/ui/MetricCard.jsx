export const MetricCard = ({ label, value, accent, helper }) => (
  <article
    className="glass-panel studio-card relative overflow-hidden rounded-[18px] p-5 sm:rounded-[20px] sm:p-6"
    style={{ borderTop: `3px solid ${accent}` }}
  >
    <div className="relative space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
        {label}
      </p>
      <h3 className="text-[1.75rem] font-semibold leading-none text-[var(--moran-ink)] sm:text-3xl">
        {value}
      </h3>
      <div className="section-divider" />
      <p className="text-sm leading-6 text-[var(--moran-soft)]">{helper}</p>
    </div>
  </article>
)
