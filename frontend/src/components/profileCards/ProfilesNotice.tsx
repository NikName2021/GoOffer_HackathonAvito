interface ProfilesNoticeProps {
  actionLabel?: string
  onAction?: () => void
  text: string
}

export function ProfilesNotice({ actionLabel, onAction, text }: ProfilesNoticeProps) {
  return (
    <div className="col-span-full rounded-3xl border border-[#e7e9eb] bg-[#f7fcff] px-6 py-8 text-center">
      <p className="text-sm text-[#6f7377]">{text}</p>
      {actionLabel && onAction && (
        <button
          className="mt-3 text-sm font-semibold text-[#00aaff] hover:text-[#0099e6]"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
