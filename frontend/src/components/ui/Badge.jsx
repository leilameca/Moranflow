const colorMap = {
  active: 'bg-[rgba(107,112,92,0.14)] text-[var(--moran-olive)] ring-1 ring-[rgba(107,112,92,0.12)]',
  inactive: 'bg-[rgba(15,15,15,0.06)] text-[var(--moran-soft)] ring-1 ring-[rgba(15,15,15,0.06)]',
  paid: 'bg-[rgba(107,112,92,0.14)] text-[var(--moran-olive)] ring-1 ring-[rgba(107,112,92,0.12)]',
  partial: 'bg-[rgba(214,164,164,0.2)] text-[#875d5d] ring-1 ring-[rgba(214,164,164,0.16)]',
  pending: 'bg-[rgba(15,15,15,0.08)] text-[var(--moran-ink)] ring-1 ring-[rgba(15,15,15,0.06)]',
  high: 'bg-[rgba(214,164,164,0.18)] text-[#8a5c5c] ring-1 ring-[rgba(214,164,164,0.14)]',
  medium: 'bg-[rgba(245,241,237,1)] text-[var(--moran-soft)] ring-1 ring-[rgba(15,15,15,0.04)]',
  low: 'bg-[rgba(107,112,92,0.12)] text-[var(--moran-olive)] ring-1 ring-[rgba(107,112,92,0.08)]',
}

export const Badge = ({ tone = 'pending', children }) => (
  <span
    className={`inline-flex items-center rounded-[10px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${colorMap[tone] || colorMap.pending}`}
  >
    {children}
  </span>
)
