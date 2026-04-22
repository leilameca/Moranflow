import { Search } from 'lucide-react'

export const TableToolbar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  summary,
}) => (
  <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap xl:flex-nowrap">
      <label className="relative min-w-0 flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--moran-soft)]"
        />
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-[16px] border border-[rgba(15,15,15,0.08)] bg-white px-10 py-3 text-sm text-[var(--moran-ink)] outline-none transition focus:border-[rgba(107,112,92,0.34)] focus:ring-4 focus:ring-[rgba(107,112,92,0.08)]"
        />
      </label>

      {filters.map((filter) => (
        <label key={filter.key} className="min-w-0 sm:min-w-[180px]">
          <select
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            aria-label={filter.label}
            className="w-full rounded-[16px] border border-[rgba(15,15,15,0.08)] bg-white px-4 py-3 text-sm text-[var(--moran-ink)] outline-none transition focus:border-[rgba(107,112,92,0.34)] focus:ring-4 focus:ring-[rgba(107,112,92,0.08)]"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>

    {summary ? (
      <div className="rounded-[16px] border border-[rgba(15,15,15,0.06)] bg-[rgba(245,241,237,0.88)] px-4 py-3 text-sm text-[var(--moran-soft)]">
        {summary}
      </div>
    ) : null}
  </div>
)
