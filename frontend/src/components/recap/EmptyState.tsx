import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  title: string
  description?: string
  icon?: ReactNode
  actionLabel?: string
  onAction?: () => void
  actionDisabled?: boolean
  secondaryHref?: string
  secondaryLabel?: string
  tone?: 'neutral' | 'soft' | 'warning'
}

const TONE = {
  neutral: 'border-[#e7e9eb] bg-white',
  soft: 'border-[#d6ebff] bg-[#f7fcff]',
  warning: 'border-amber-200 bg-amber-50',
} as const

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionDisabled,
  secondaryHref,
  secondaryLabel,
  tone = 'soft',
}: Props) {
  return (
    <div
      className={`mx-auto flex w-full max-w-md flex-col items-center rounded-3xl border px-6 py-10 text-center shadow-sm ${TONE[tone]}`}
    >
      {icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
          {icon}
        </div>
      )}
      <p className="text-lg font-bold text-[#1f1f1f]">{title}</p>
      {description && (
        <p className="mt-2 text-sm leading-6 text-[#6f7377]">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={actionDisabled}
          className="mt-6 rounded-xl bg-[#00aaff] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0090dd] disabled:opacity-60"
        >
          {actionLabel}
        </button>
      )}
      {secondaryHref && secondaryLabel && (
        <Link
          to={secondaryHref}
          className="mt-4 text-sm font-semibold text-[#00aaff] hover:underline"
        >
          {secondaryLabel}
        </Link>
      )}
    </div>
  )
}
