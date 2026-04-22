export const EmptyState = ({ eyebrow, title, description }) => (
  <div className="flex min-h-48 flex-col items-center justify-center rounded-[18px] border border-dashed border-[rgba(15,15,15,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(245,241,237,0.7)_100%)] px-6 py-8 text-center">
    <span className="mb-3 rounded-[10px] bg-[rgba(214,164,164,0.16)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a5c5c]">
      {eyebrow}
    </span>
    <h3 className="font-display text-3xl leading-none text-[var(--moran-ink)] sm:text-4xl">
      {title}
    </h3>
    <p className="mt-3 max-w-md text-sm leading-7 text-[var(--moran-soft)]">
      {description}
    </p>
  </div>
)
