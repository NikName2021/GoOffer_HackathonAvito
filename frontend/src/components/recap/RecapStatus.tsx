import { LoaderCircle, RefreshCw, Sparkles } from 'lucide-react'

interface RecapStatusProps {
  error?: string
  onRetry?: () => void
}

export function RecapStatus({ error, onRetry }: RecapStatusProps) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center bg-[#f7f7f8] px-6 text-center">
      <span className={`grid size-16 place-items-center rounded-3xl ${error ? 'bg-[#ffebee] text-[#ff4053]' : 'bg-[#e8f6ff] text-[#00aaff]'}`}>
        {error ? <Sparkles aria-hidden="true" className="size-8" /> : <LoaderCircle aria-hidden="true" className="size-8 animate-spin" />}
      </span>
      <h2 className="mt-5 text-xl font-black text-[#1f1f1f]">{error ? 'Не получилось собрать итоги' : 'Собираем ваш год'}</h2>
      <p className="mt-2 max-w-sm text-sm leading-5 text-[#6f7377]">
        {error ?? 'Находим главные покупки, продажи, интересы и достижения.'}
      </p>
      {error && onRetry && (
        <button className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#00aaff] px-5 py-3 text-sm font-bold text-white hover:bg-[#0099e6]" onClick={onRetry} type="button">
          <RefreshCw aria-hidden="true" className="size-4" />
          Попробовать снова
        </button>
      )}
    </div>
  )
}
