export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
    <div className="space-y-4">
      <span className="editorial-kicker">{eyebrow}</span>
      <div className="space-y-2">
        <h1 className="font-display text-3xl leading-none text-[var(--moran-ink)] sm:text-4xl xl:text-5xl">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[var(--moran-soft)] sm:text-[15px]">
          {description}
        </p>
      </div>
    </div>

    {actions ? (
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start xl:justify-end">
        {actions}
      </div>
    ) : null}
  </div>
)
