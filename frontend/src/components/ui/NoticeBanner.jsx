import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

const toneMap = {
  success: {
    icon: CheckCircle2,
    className:
      'border-[rgba(107,112,92,0.18)] bg-[rgba(107,112,92,0.1)] text-[var(--moran-olive)]',
  },
  error: {
    icon: AlertCircle,
    className: 'border-[rgba(181,93,93,0.18)] bg-[#f7e6e6] text-[#8d3c3c]',
  },
  info: {
    icon: Info,
    className:
      'border-[rgba(15,15,15,0.08)] bg-[rgba(245,241,237,0.92)] text-[var(--moran-soft)]',
  },
}

export const NoticeBanner = ({ tone = 'info', children, className = '' }) => {
  const config = toneMap[tone] || toneMap.info
  const Icon = config.icon

  return (
    <div
      className={`flex items-start gap-3 rounded-[16px] border px-4 py-3 text-sm leading-6 ${config.className} ${className}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
