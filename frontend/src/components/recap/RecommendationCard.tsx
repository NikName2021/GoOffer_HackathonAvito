import { useState } from 'react'
import { ExternalLink, Sparkles } from 'lucide-react'
import type { Recommendation } from '@/types/recap.type'

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const [feedback, setFeedback] = useState<string | null>(null)

  function handleAction() {
    const cat = recommendation.category
    let msg = 'Следующий шаг в продукте Авито'

    if (recommendation.code === 'browse_top_category' && cat) {
      msg = `Продолжаем в «${cat}» — туда, где вы были активнее всего`
    } else if (recommendation.code === 'review_favorites') {
      msg = 'Открываем избранное — проверьте, что ещё актуально'
    } else if (recommendation.code === 'post_listing') {
      msg = 'К подаче объявления — закрепите результат года'
    } else if (recommendation.action_label) {
      msg = `${recommendation.action_label} — возврат в Авито`
    }

    setFeedback(msg)
    window.setTimeout(() => setFeedback(null), 2800)
  }

  return (
    <div className="relative flex min-h-[200px] flex-col rounded-2xl border border-[#d6ebff] bg-gradient-to-b from-[#f3faff] to-white p-5 shadow-sm">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-[#00aaff]">
        <Sparkles className="h-3.5 w-3.5" />
        Следующий шаг в продукте
      </div>
      <h3 className="mt-2 text-lg font-bold leading-snug text-[#1f1f1f]">
        {recommendation.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-[#6f7377]">
        {recommendation.description}
      </p>

      <button
        type="button"
        onClick={handleAction}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#00aaff] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0090dd] active:scale-[0.99]"
      >
        {recommendation.action_label}
        <ExternalLink className="h-4 w-4 opacity-90" />
      </button>

      {feedback && (
        <div
          role="status"
          className="absolute inset-x-3 bottom-3 rounded-xl border border-[#00aaff]/25 bg-white/95 px-3 py-2.5 text-center text-sm font-medium text-[#0077cc] shadow-md backdrop-blur"
        >
          {feedback}
        </div>
      )}
    </div>
  )
}