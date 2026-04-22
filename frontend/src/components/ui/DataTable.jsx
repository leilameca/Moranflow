export const DataTable = ({
  columns,
  data,
  onRowClick,
  selectedRowId,
  empty,
}) => {
  if (!data.length) {
    return empty
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        {data.map((row) => {
          const isSelected = selectedRowId === row.id
          const Wrapper = onRowClick ? 'button' : 'div'
          const firstColumn = columns[0]
          const remainingColumns = columns.slice(1)

          return (
            <Wrapper
              key={row.id}
              type={onRowClick ? 'button' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`table-row-card block w-full rounded-[18px] border border-[rgba(15,15,15,0.06)] p-4 text-left transition ${
                onRowClick ? 'cursor-pointer' : ''
              } ${
                isSelected
                  ? 'table-row-card-selected ring-1 ring-[rgba(214,164,164,0.16)]'
                  : 'hover:-translate-y-0.5'
              }`}
            >
              <div className="border-b border-[rgba(15,15,15,0.06)] pb-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                  {firstColumn.header}
                </p>
                <div className="text-sm text-[var(--moran-ink)]">
                  {firstColumn.render ? firstColumn.render(row) : row[firstColumn.key]}
                </div>
              </div>

              {remainingColumns.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {remainingColumns.map((column) => (
                    <div key={column.key} className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                        {column.header}
                      </p>
                      <div className="text-sm text-[var(--moran-ink)]">
                        {column.render ? column.render(row) : row[column.key]}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Wrapper>
          )
        })}
      </div>

      <div className="table-shell table-scroll hidden overflow-x-auto rounded-[18px] p-3 md:block">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const isSelected = selectedRowId === row.id

              return (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`table-row-card rounded-[18px] transition ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    isSelected
                      ? 'table-row-card-selected'
                      : onRowClick
                        ? 'hover:-translate-y-0.5 hover:bg-[rgba(15,15,15,0.04)]'
                        : ''
                  }`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="rounded-[18px] px-5 py-5 text-sm text-[var(--moran-ink)] first:pl-8"
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
