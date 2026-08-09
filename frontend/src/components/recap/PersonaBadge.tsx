import type { CSSProperties } from 'react'

// ✅ Добавляем комментарий для ESLint
// eslint-disable-next-line react-refresh/only-export-components
export const PERSONA_META: Record<
  string,
  { label: string; emoji: string; bg: string; text: string; border: string }
> = {
  seller: {
    label: 'Продавец года',
    emoji: '🏷️',
    bg: '#e8f6ff',
    text: '#0077cc',
    border: '#b3e0ff',
  },
  buyer: {
    label: 'Охотник за находками',
    emoji: '🛍️',
    bg: '#f3e8ff',
    text: '#7c3aed',
    border: '#e9d5ff',
  },
  mixed: {
    label: 'Универсал площадки',
    emoji: '⚡',
    bg: '#ecfdf5',
    text: '#047857',
    border: '#a7f3d0',
  },
  universal: {
    label: 'Универсал',
    emoji: '⚡',
    bg: '#ecfdf5',
    text: '#047857',
    border: '#a7f3d0',
  },
  explorer: {
    label: 'Исследователь',
    emoji: '🔍',
    bg: '#fff7ed',
    text: '#c2410c',
    border: '#fed7aa',
  },
  newbie: {
    label: 'Новичок',
    emoji: '🌱',
    bg: '#fefce8',
    text: '#a16207',
    border: '#fde68a',
  },
  veteran: {
    label: 'Ветеран',
    emoji: '🏆',
    bg: '#fef2f2',
    text: '#b91c1c',
    border: '#fecaca',
  },
}

type Props = {
  persona?: string
  profileType?: string
  size?: 'compact' | 'large'
  className?: string
}

export function PersonaBadge({
  persona,
  profileType,
  size = 'compact',
  className = '',
}: Props) {
  const key = (persona || profileType || '').toLowerCase()
  const meta = PERSONA_META[key] ?? {
    label: key || 'Участник',
    emoji: '✨',
    bg: '#f3f4f6',
    text: '#4b5563',
    border: '#e5e7eb',
  }

  const style: CSSProperties = {
    backgroundColor: meta.bg,
    color: meta.text,
    borderColor: meta.border,
  }

  const sizeCls =
    size === 'large'
      ? 'px-3.5 py-1.5 text-sm font-semibold'
      : 'px-2.5 py-1 text-xs font-semibold'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeCls} ${className}`}
      style={style}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  )
}