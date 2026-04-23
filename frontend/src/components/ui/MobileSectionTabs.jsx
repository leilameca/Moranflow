import { useRef } from 'react'

export const MobileSectionTabs = ({
  tabs,
  value,
  onChange,
  className = '',
}) => {
  const containerRef = useRef(null)

  const handleChange = (nextValue) => {
    if (nextValue === value) {
      return
    }

    onChange(nextValue)

    window.requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  return (
    <div ref={containerRef} className={`xl:hidden ${className}`}>
      <div className="table-scroll flex gap-2 overflow-x-auto rounded-[22px] border border-[rgba(15,15,15,0.08)] bg-[rgba(255,255,255,0.88)] p-1.5 shadow-[0_14px_34px_rgba(15,15,15,0.08)] backdrop-blur">
        {tabs.map((tab) => {
          const isActive = tab.value === value

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleChange(tab.value)}
              className={`min-h-[42px] shrink-0 whitespace-nowrap rounded-[16px] px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-[var(--moran-ink)] text-white shadow-[0_12px_24px_rgba(15,15,15,0.16)]'
                  : 'text-[var(--moran-soft)]'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
