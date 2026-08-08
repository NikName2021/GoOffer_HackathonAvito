import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'

type Props = {
  name?: string
  year: number
  onDone: () => void
}

export function GiftIntro({ name, year, onDone }: Props) {
  const [phase, setPhase] = useState<'idle' | 'open' | 'done'>('idle')
  const who = name?.split(' ')[0] ?? 'Вы'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('open'), 400)
    const t2 = setTimeout(() => {
      setPhase('done')
      onDone()
    }, 2200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-[#00aaff] via-[#3b82f6] to-[#7c3aed] px-6 py-16 text-center text-white shadow-lg">
      <div
        className={`mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur transition-all duration-700 ${
          phase === 'open' || phase === 'done' ? 'scale-110 rotate-6' : 'scale-100 rotate-0'
        }`}
      >
        <Gift className="h-10 w-10" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-wider text-white/80">
        Авито · Итоги {year}
      </p>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{who}, ваш год готов</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-white/90">
        Собираем историю из просмотров, сделок и ачивок — листайте дальше.
      </p>
      <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-white/25">
        <div
          className="h-full rounded-full bg-white transition-all duration-[1800ms] ease-out"
          style={{ width: phase === 'idle' ? '8%' : '100%' }}
        />
      </div>
      <button
        type="button"
        onClick={onDone}
        className="mt-6 text-sm font-medium text-white/90 underline-offset-2 hover:underline"
      >
        Пропустить
      </button>
    </div>
  )
}